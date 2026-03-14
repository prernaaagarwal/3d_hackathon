import { SupabaseClient } from '@supabase/supabase-js';
import { Property } from '../types/models.types';

export const propertyModel = {
  async findAll(supabase: SupabaseClient, ownerId: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data as Property[], count: count ?? 0 };
  },

  async findById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Property;
  },

  async create(supabase: SupabaseClient, property: Omit<Property, 'id' | 'created_at' | 'updated_at' | 'has_3d_tour'>) {
    const { data, error } = await supabase
      .from('properties')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },

  async update(supabase: SupabaseClient, id: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Property;
  },

  async delete(supabase: SupabaseClient, id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async findByArea(supabase: SupabaseClient, area: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('area', area)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data as Property[], count: count ?? 0 };
  },
};

