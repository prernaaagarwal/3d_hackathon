-- PropIntel Initial Schema Migration
-- Run this in the Supabase Dashboard SQL Editor

-- 1. Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
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
  images TEXT[] DEFAULT '{}',
  has_3d_tour BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scene_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  world_api_job_id TEXT,
  world_id TEXT,
  quality TEXT DEFAULT 'standard' CHECK (quality IN ('standard', 'high')),
  photo_urls TEXT[] DEFAULT '{}',
  photo_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  error_message TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_property ON tours(property_id);
CREATE INDEX IF NOT EXISTS idx_tours_owner ON tours(owner_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Annotations table
CREATE TABLE IF NOT EXISTS annotations (
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

CREATE INDEX IF NOT EXISTS idx_annotations_tour ON annotations(tour_id);

-- 6. ROI Calculations table
CREATE TABLE IF NOT EXISTS roi_calculations (
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

CREATE INDEX IF NOT EXISTS idx_roi_user ON roi_calculations(user_id);

