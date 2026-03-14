import { createUserClient } from '../config/supabase';
import { tourModel } from '../models/tour.model';
import { NotFoundError } from '../utils/errors';

export const tourService = {
  async getByProperty(token: string, propertyId: string) {
    const supabase = createUserClient(token);
    return tourModel.findByProperty(supabase, propertyId);
  },

  async getById(token: string, id: string) {
    const supabase = createUserClient(token);
    const tour = await tourModel.findById(supabase, id);
    if (!tour) throw new NotFoundError('Tour');
    return tour;
  },

  async listByOwner(token: string, ownerId: string) {
    const supabase = createUserClient(token);
    return tourModel.findByOwner(supabase, ownerId);
  },

  async create(token: string, data: {
    property_id: string;
    owner_id: string;
    quality?: 'standard' | 'high';
    photo_count: number;
  }) {
    const supabase = createUserClient(token);
    return tourModel.create(supabase, {
      property_id: data.property_id,
      owner_id: data.owner_id,
      quality: data.quality ?? 'standard',
      photo_count: data.photo_count,
    });
  },

  async updateStatus(token: string, id: string, updates: Record<string, unknown>) {
    const supabase = createUserClient(token);
    return tourModel.updateStatus(supabase, id, updates);
  },

  async togglePublic(token: string, id: string, isPublic: boolean) {
    const supabase = createUserClient(token);
    return tourModel.updateStatus(supabase, id, { is_public: isPublic });
  },

  async getPublicTour(id: string) {
    // Use admin client for public access — RLS policy allows public tours
    const { supabaseAdmin } = await import('../config/supabase');
    const tour = await tourModel.findPublicById(supabaseAdmin, id);
    if (!tour) throw new NotFoundError('Tour');
    return tour;
  },
};

