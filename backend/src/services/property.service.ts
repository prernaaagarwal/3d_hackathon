import { createUserClient } from '../config/supabase';
import { propertyModel } from '../models/property.model';
import { NotFoundError } from '../utils/errors';

export const propertyService = {
  async list(token: string, userId: string, page = 1, limit = 20) {
    const supabase = createUserClient(token);
    const offset = (page - 1) * limit;
    const { data, count } = await propertyModel.findAll(supabase, userId, limit, offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async getById(token: string, id: string) {
    const supabase = createUserClient(token);
    const property = await propertyModel.findById(supabase, id);
    if (!property) throw new NotFoundError('Property');
    return property;
  },

  async create(token: string, userId: string, data: {
    address: string;
    area: string;
    property_type: 'apartment' | 'villa' | 'townhouse' | 'commercial';
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    price_aed: number;
    annual_rent_aed?: number;
    service_charge_aed?: number;
    latitude?: number;
    longitude?: number;
    description?: string;
    images?: string[];
  }) {
    const supabase = createUserClient(token);
    return propertyModel.create(supabase, { ...data, owner_id: userId } as Parameters<typeof propertyModel.create>[1]);
  },

  async update(token: string, id: string, updates: Record<string, unknown>) {
    const supabase = createUserClient(token);
    return propertyModel.update(supabase, id, updates);
  },

  async delete(token: string, id: string) {
    const supabase = createUserClient(token);
    return propertyModel.delete(supabase, id);
  },
};

