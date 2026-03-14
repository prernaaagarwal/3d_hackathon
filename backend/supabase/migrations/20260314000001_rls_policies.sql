-- PropIntel RLS Policies Migration
-- Run this AFTER the initial schema migration

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

