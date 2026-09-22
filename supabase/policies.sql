-- ====================================================================
-- SANJAYA: Row Level Security (RLS) Policies
-- Ensures privacy-first architecture where users can ONLY access their own data
-- ====================================================================

-- 1. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Trusted People Policies
DROP POLICY IF EXISTS "Users can view own trusted people" ON public.trusted_people;
CREATE POLICY "Users can view own trusted people"
  ON public.trusted_people FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trusted people" ON public.trusted_people;
CREATE POLICY "Users can insert own trusted people"
  ON public.trusted_people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trusted people" ON public.trusted_people;
CREATE POLICY "Users can update own trusted people"
  ON public.trusted_people FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trusted people" ON public.trusted_people;
CREATE POLICY "Users can delete own trusted people"
  ON public.trusted_people FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Cameras Policies
CREATE POLICY "Users can view own cameras"
  ON public.cameras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cameras"
  ON public.cameras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cameras"
  ON public.cameras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cameras"
  ON public.cameras FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Detections Policies
CREATE POLICY "Users can view own detections"
  ON public.detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections"
  ON public.detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Emergency Contacts Policies
CREATE POLICY "Users can view own emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts"
  ON public.emergency_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
  ON public.emergency_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
  ON public.emergency_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Incidents Policies
CREATE POLICY "Users can view own incidents"
  ON public.incidents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incidents"
  ON public.incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents"
  ON public.incidents FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Notifications Policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. User Settings Policies
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- 10. Storage Bucket & Policies for Trusted People Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('trusted_people', 'trusted_people', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own trusted photos" ON storage.objects;
CREATE POLICY "Users can upload own trusted photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trusted_people' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view trusted photos" ON storage.objects;
CREATE POLICY "Users can view trusted photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trusted_people');

DROP POLICY IF EXISTS "Users can update own trusted photos" ON storage.objects;
CREATE POLICY "Users can update own trusted photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'trusted_people' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own trusted photos" ON storage.objects;
CREATE POLICY "Users can delete own trusted photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trusted_people' AND (storage.foldername(name))[1] = auth.uid()::text);
