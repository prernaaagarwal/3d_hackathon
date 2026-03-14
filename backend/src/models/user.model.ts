import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types/models.types';

export const userModel = {
  async findById(supabase: SupabaseClient, id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async update(supabase: SupabaseClient, id: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};

