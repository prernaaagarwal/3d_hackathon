/** Frontend types matching backend models */

export interface Property {
  id: string;
  owner_id: string;
  address: string;
  area: string;
  property_type: "apartment" | "villa" | "townhouse" | "commercial";
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
  status: "queued" | "processing" | "complete" | "failed";
  world_api_job_id: string | null;
  world_id: string | null;
  quality: "standard" | "high";
  photo_urls: string[];
  photo_count: number;
  processing_time_ms: number | null;
  error_message: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoiInput {
  purchase_price: number;
  annual_rent: number;
  service_charge?: number;
  has_mortgage?: boolean;
  down_payment_pct?: number;
  mortgage_rate_pct?: number;
  mortgage_term_years?: number;
  holding_period_years?: number;
  appreciation_rate_pct?: number;
  property_id?: string;
}

export interface RoiResult {
  gross_yield: number;
  net_yield: number;
  monthly_cashflow: number;
  irr_5yr: number;
  irr_10yr: number;
  annual_expenses: number;
  annual_mortgage_payment: number;
  cashflow_projection: {
    year: number;
    cashflow: number;
    propertyValue: number;
    equity: number;
  }[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "broker" | "admin";
  company_name: string | null;
  phone: string | null;
  subscription_tier: "free" | "investor" | "broker_pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

