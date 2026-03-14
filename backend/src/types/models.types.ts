/**
 * Database model types matching the Supabase schema (docs/DATABASE.md)
 */

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'broker' | 'admin';
  company_name: string | null;
  phone: string | null;
  subscription_tier: 'free' | 'investor' | 'broker_pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  address: string;
  area: string;
  property_type: 'apartment' | 'villa' | 'townhouse' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  price_aed: number;
  annual_rent_aed: number | null;
  service_charge_aed: number | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  images: string[];
  has_3d_tour: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  property_id: string;
  owner_id: string;
  scene_url: string | null;
  thumbnail_url: string | null;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  world_api_job_id: string | null;
  world_id: string | null;
  quality: 'standard' | 'high';
  photo_urls: string[];
  photo_count: number;
  processing_time_ms: number | null;
  error_message: string | null;
  is_public: boolean;
  share_password: string | null;
  created_at: string;
  updated_at: string;
}

export interface Annotation {
  id: string;
  tour_id: string;
  type: 'roi_hotspot' | 'view_value' | 'finish_quality' | 'location_context' | 'custom';
  title: string;
  description: string | null;
  x: number;
  y: number;
  z: number;
  icon: string;
  created_at: string;
}

export interface RoiCalculation {
  id: string;
  user_id: string;
  property_id: string | null;
  purchase_price: number;
  annual_rent: number;
  service_charge: number;
  has_mortgage: boolean;
  down_payment_pct: number | null;
  mortgage_rate_pct: number | null;
  mortgage_term_years: number | null;
  holding_period_years: number;
  appreciation_rate_pct: number;
  gross_yield: number | null;
  net_yield: number | null;
  monthly_cashflow: number | null;
  irr_5yr: number | null;
  irr_10yr: number | null;
  created_at: string;
}

