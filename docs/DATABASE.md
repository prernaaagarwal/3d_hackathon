# DATABASE.md — Database Rules & Schema

## Dubai Property 3D World · Supabase (PostgreSQL)

---

## 1. General Rules

- **Always enable RLS** on every new table. No exceptions.
- **Always create migrations** for schema changes — never modify the database directly.
- **Use UUIDs** as primary keys (Supabase default).
- **Use `timestamptz`** for all timestamp columns (timezone-aware).
- **Use `snake_case`** for all table and column names.
- **Foreign keys** must reference existing tables with `ON DELETE` behavior defined.
- **Indexes** — add indexes on columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- **Never store secrets** in the database (API keys, passwords in plaintext).

---

## 2. Core Schema

### 2.1 profiles

Extends Supabase `auth.users` with application-specific data.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'broker', 'admin')),
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'investor', 'broker_pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2.2 properties

```sql
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,                    -- e.g. 'Dubai Marina', 'Downtown'
  property_type TEXT NOT NULL CHECK (property_type IN ('apartment', 'villa', 'townhouse', 'commercial')),
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  sqft NUMERIC NOT NULL,
  price_aed NUMERIC NOT NULL,
  annual_rent_aed NUMERIC,
  service_charge_aed NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  description TEXT,
  images TEXT[] DEFAULT '{}',           -- Array of Uploadcare CDN URLs
  has_3d_tour BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_type ON properties(property_type);
```

### 2.3 tours

```sql
CREATE TABLE tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scene_url TEXT,                        -- URL to .splat file
  thumbnail_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  world_api_job_id TEXT,                 -- World Labs operation_id for polling
  world_id TEXT,                         -- World Labs world_id (set on completion)
  quality TEXT DEFAULT 'standard' CHECK (quality IN ('standard', 'high')),
  photo_urls TEXT[] DEFAULT '{}',        -- Source image URLs used for 3D generation
  photo_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  error_message TEXT,                    -- Error details if generation fails
  is_public BOOLEAN DEFAULT FALSE,
  share_password TEXT,                   -- Optional password for private tours
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tours_property ON tours(property_id);
CREATE INDEX idx_tours_owner ON tours(owner_id);
CREATE INDEX idx_tours_status ON tours(status);
```

### 2.4 annotations

```sql
CREATE TABLE annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('roi_hotspot', 'view_value', 'finish_quality', 'location_context', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  x NUMERIC NOT NULL,
  y NUMERIC NOT NULL,
  z NUMERIC NOT NULL,
  icon TEXT DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annotations_tour ON annotations(tour_id);
```

### 2.5 roi_calculations

```sql
CREATE TABLE roi_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  purchase_price NUMERIC NOT NULL,
  annual_rent NUMERIC NOT NULL,
  service_charge NUMERIC DEFAULT 0,
  has_mortgage BOOLEAN DEFAULT FALSE,
  down_payment_pct NUMERIC,
  mortgage_rate_pct NUMERIC,
  mortgage_term_years INTEGER,
  holding_period_years INTEGER DEFAULT 5,
  appreciation_rate_pct NUMERIC DEFAULT 5,
  gross_yield NUMERIC,
  net_yield NUMERIC,
  monthly_cashflow NUMERIC,
  irr_5yr NUMERIC,
  irr_10yr NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roi_user ON roi_calculations(user_id);
```

---

## 3. Row Level Security (RLS) Policies

```sql
-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own properties" ON properties FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own properties" ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own properties" ON properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own properties" ON properties FOR DELETE USING (auth.uid() = owner_id);

-- tours
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage own tours" ON tours FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Public tours are viewable" ON tours FOR SELECT USING (is_public = true);

-- annotations
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tour owners can manage annotations" ON annotations FOR ALL
  USING (EXISTS (SELECT 1 FROM tours WHERE tours.id = annotations.tour_id AND tours.owner_id = auth.uid()));
CREATE POLICY "Public tour annotations are viewable" ON annotations FOR SELECT
  USING (EXISTS (SELECT 1 FROM tours WHERE tours.id = annotations.tour_id AND tours.is_public = true));

-- roi_calculations
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own calculations" ON roi_calculations FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Migration Rules

- Store migrations in `backend/supabase/migrations/` with timestamp prefix: `20260314000000_create_profiles.sql`
- Each migration must be idempotent where possible (use `IF NOT EXISTS`).
- Never drop columns in production without a two-step migration (deprecate → remove).
- Test migrations locally with `supabase db reset` before applying to staging/production.

