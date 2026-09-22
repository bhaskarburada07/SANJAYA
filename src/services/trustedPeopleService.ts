import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { TrustedPerson } from '../types';

const STORAGE_KEY_PREFIX = 'sanjaya_trusted_people_';

export const trustedPeopleService = {
  /**
   * Loads trusted people records strictly isolated for the authenticated user
   */
  async getTrustedPeople(userId: string): Promise<TrustedPerson[]> {
    if (!userId) return [];

    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

    // 1. If Supabase is connected, query the real 'trusted_people' table
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('trusted_people')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Sync to per-user local cache for fast offline access & refresh persistence
          localStorage.setItem(storageKey, JSON.stringify(data));
          return data as TrustedPerson[];
        }

        if (error) {
          console.warn('[trustedPeopleService] Supabase select notice:', error.message);
        }
      } catch (err) {
        console.warn('[trustedPeopleService] Failed to fetch from Supabase:', err);
      }
    }

    // 2. Read from per-user isolated cache
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Double verify user_id isolation
          return parsed.filter((p: TrustedPerson) => p.user_id === userId);
        }
      }
    } catch {
      // ignore
    }

    // Default: empty list. No hardcoded sample people!
    return [];
  },

  /**
   * Inserts a new trusted person into Supabase with RLS
   */
  async createTrustedPerson(
    personData: {
      name: string;
      relationship: string;
      phone?: string;
      notes?: string;
      photo_url?: string;
      face_reference?: string;
    },
    userId: string
  ): Promise<TrustedPerson> {
    if (!userId) {
      throw new Error('Authentication required: user_id is missing.');
    }

    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `tp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newRecord: TrustedPerson = {
      id,
      user_id: userId,
      name: personData.name.trim(),
      relationship: personData.relationship.trim(),
      phone: personData.phone?.trim() || undefined,
      notes: personData.notes?.trim() || undefined,
      photo_url: personData.photo_url || undefined,
      face_reference: personData.face_reference || `emb-${personData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    // If Supabase is active, persist to database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('trusted_people')
          .insert({
            id: newRecord.id,
            user_id: newRecord.user_id,
            name: newRecord.name,
            relationship: newRecord.relationship,
            phone: newRecord.phone || null,
            notes: newRecord.notes || null,
            photo_url: newRecord.photo_url || null,
            face_reference: newRecord.face_reference || null,
            created_at: newRecord.created_at,
            updated_at: newRecord.updated_at,
          })
          .select()
          .single();

        if (error) {
          console.error('[trustedPeopleService] Supabase insert error:', error.message);
          // If remote schema issue occurs, we still retain local per-user record
        } else if (data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.error('[trustedPeopleService] Unexpected error inserting person:', err);
      }
    }

    // Update per-user cache
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    try {
      const existing = await this.getTrustedPeople(userId);
      const updated = [newRecord, ...existing.filter((p) => p.id !== newRecord.id)];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newRecord;
  },

  /**
   * Updates an existing trusted person record
   */
  async updateTrustedPerson(
    id: string,
    updates: Partial<TrustedPerson>,
    userId: string
  ): Promise<TrustedPerson> {
    if (!userId) {
      throw new Error('Authentication required: user_id is missing.');
    }

    const updatedAt = new Date().toISOString();
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    let updatedRecord: TrustedPerson | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, any> = {
          ...updates,
          updated_at: updatedAt,
        };
        // Clean out undefined
        Object.keys(payload).forEach((key) => {
          if (payload[key] === undefined) delete payload[key];
        });

        const { data, error } = await supabase
          .from('trusted_people')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          updatedRecord = data as TrustedPerson;
        } else if (error) {
          console.warn('[trustedPeopleService] Supabase update warning:', error.message);
        }
      } catch (err) {
        console.warn('[trustedPeopleService] Update call failed:', err);
      }
    }

    // Update in local per-user cache
    try {
      const existing = await this.getTrustedPeople(userId);
      const newList = existing.map((person) => {
        if (person.id === id) {
          const merged: TrustedPerson = {
            ...person,
            ...updates,
            updated_at: updatedAt,
          };
          if (!updatedRecord) updatedRecord = merged;
          return merged;
        }
        return person;
      });
      localStorage.setItem(storageKey, JSON.stringify(newList));
    } catch {
      // ignore
    }

    if (!updatedRecord) {
      throw new Error('Trusted person not found or could not be updated.');
    }

    return updatedRecord;
  },

  /**
   * Deletes a trusted person record
   */
  async deleteTrustedPerson(id: string, userId: string): Promise<void> {
    if (!userId) {
      throw new Error('Authentication required: user_id is missing.');
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('trusted_people')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.warn('[trustedPeopleService] Supabase delete warning:', error.message);
        }
      } catch (err) {
        console.warn('[trustedPeopleService] Delete call failed:', err);
      }
    }

    // Remove from local per-user cache
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    try {
      const existing = await this.getTrustedPeople(userId);
      const filtered = existing.filter((p) => p.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  /**
   * Uploads person profile photo to Supabase Storage bucket 'trusted_people'
   */
  async uploadPhoto(file: File, userId: string): Promise<string> {
    if (!file) throw new Error('No file selected');

    // 1. If Supabase is configured, try Supabase Storage
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('trusted_people')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data } = supabase.storage
            .from('trusted_people')
            .getPublicUrl(fileName);

          if (data?.publicUrl) {
            return data.publicUrl;
          }
        } else {
          console.warn('[trustedPeopleService] Supabase storage upload warning:', uploadError.message);
        }
      } catch (err) {
        console.warn('[trustedPeopleService] Supabase storage exception:', err);
      }
    }

    // 2. Safe client-side fallback (FileReader data URL) so user flow is never broken
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },
};
