import { SupabaseClient } from '@supabase/supabase-js';
import { Tour } from '../types/models.types';

export const tourModel = {
  async findByProperty(supabase: SupabaseClient, propertyId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Tour[];
  },

  async findById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Tour;
  },

  async findByOwner(supabase: SupabaseClient, ownerId: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*, properties(address, area)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async create(supabase: SupabaseClient, tour: Pick<Tour, 'property_id' | 'owner_id' | 'quality' | 'photo_count'>) {
    const { data, error } = await supabase
      .from('tours')
      .insert({ ...tour, status: 'queued' as const })
      .select()
      .single();

    if (error) throw error;
    return data as Tour;
  },

  async updateStatus(supabase: SupabaseClient, id: string, updates: Partial<Tour>) {
    const { data, error } = await supabase
      .from('tours')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Tour;
  },

  async findPublicById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('tours')
      .select('*, properties(address, area, images), annotations(*)')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error) throw error;
    return data;
  },
};

