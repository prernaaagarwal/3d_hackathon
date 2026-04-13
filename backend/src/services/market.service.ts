import { supabaseAdmin } from '../config/supabase';

/**
 * Market data service — uses admin client since market routes are public.
 */
export const marketService = {
  /**
   * Get aggregated area statistics (average yield, avg price/sqft, property count)
   */
  async getAreaStats(area?: string) {
    let query = supabaseAdmin
      .from('properties')
      .select('area, price_aed, sqft, annual_rent_aed, property_type');

    if (area) {
      query = query.eq('area', area);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Aggregate by area
    const areaMap = new Map<string, {
      totalPrice: number;
      totalSqft: number;
      totalRent: number;
      rentCount: number;
      count: number;
    }>();

    for (const p of data) {
      const existing = areaMap.get(p.area) || {
        totalPrice: 0, totalSqft: 0, totalRent: 0, rentCount: 0, count: 0,
      };
      existing.totalPrice += Number(p.price_aed);
      existing.totalSqft += Number(p.sqft);
      existing.count++;
      if (p.annual_rent_aed) {
        existing.totalRent += Number(p.annual_rent_aed);
        existing.rentCount++;
      }
      areaMap.set(p.area, existing);
    }

    return Array.from(areaMap.entries()).map(([areaName, stats]) => ({
      area: areaName,
      property_count: stats.count,
      avg_price_per_sqft: Math.round(stats.totalPrice / stats.totalSqft),
      avg_price: Math.round(stats.totalPrice / stats.count),
      avg_gross_yield: stats.rentCount > 0
        ? Math.round(((stats.totalRent / stats.rentCount) / (stats.totalPrice / stats.count)) * 10000) / 100
        : null,
    }));
  },

  /**
   * Get properties in an area for market browsing (public data)
   */
  async getProperties(filters: {
    area?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    minBedrooms?: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('properties')
      .select('id, address, area, property_type, bedrooms, bathrooms, sqft, price_aed, annual_rent_aed, images, has_3d_tour, latitude, longitude, tours(id, status, is_public)', { count: 'exact' });

    if (filters.area) query = query.eq('area', filters.area);
    if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
    if (filters.minPrice) query = query.gte('price_aed', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price_aed', filters.maxPrice);
    if (filters.minBedrooms) query = query.gte('bedrooms', filters.minBedrooms);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Flatten tour_id onto each property (pick the first completed public tour)
    const enriched = (data ?? []).map((p: Record<string, unknown>) => {
      const tours = (p.tours as Array<{ id: string; status: string; is_public: boolean }>) ?? [];
      const publicTour = tours.find((t) => t.status === 'complete' && t.is_public);
      const { tours: _tours, ...rest } = p;
      return { ...rest, tour_id: publicTour?.id ?? null };
    });

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  },

  /**
   * Get list of all available areas
   */
  async getAreas() {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('area')
      .order('area');

    if (error) throw error;

    const uniqueAreas = [...new Set((data ?? []).map((p) => p.area))];
    return uniqueAreas;
  },
};

