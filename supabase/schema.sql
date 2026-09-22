-- ====================================================================
-- SANJAYA: Privacy-First AI Home Safety & Visitor Awareness Platform
-- Database Schema for Supabase (PostgreSQL)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Trusted People Table
CREATE TABLE IF NOT EXISTS public.trusted_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  photo_url TEXT,
  face_reference TEXT, -- Vector embedding reference or local feature descriptor id
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Idempotent column additions in case table was previously created
ALTER TABLE public.trusted_people ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.trusted_people ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.trusted_people ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL;

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_trusted_people_updated_at ON public.trusted_people;
CREATE TRIGGER trigger_trusted_people_updated_at
  BEFORE UPDATE ON public.trusted_people
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Cameras Table
CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  stream_url TEXT,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'disabled')),
  is_simulation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 4. Detections Table
CREATE TABLE IF NOT EXISTS public.detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camera_id UUID NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_type TEXT NOT NULL CHECK (person_type IN ('known', 'unknown')),
  person_name TEXT,
  confidence NUMERIC(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  zone TEXT NOT NULL,
  snapshot_url TEXT,
  detected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  priority INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. Incidents Table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('unknown_detection', 'sos_activated', 'manual_alarm')),
  status TEXT NOT NULL CHECK (status IN ('active', 'escalated', 'cancelled', 'resolved')) DEFAULT 'active',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('security', 'system', 'emergency')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  face_recognition_enabled BOOLEAN DEFAULT true,
  detection_history_days INT DEFAULT 30,
  location_sharing_sos BOOLEAN DEFAULT true,
  camera_access_enabled BOOLEAN DEFAULT true,
  sos_countdown_seconds INT DEFAULT 30,
  alert_audio_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indices for performance and filtering
CREATE INDEX IF NOT EXISTS idx_detections_user_detected ON public.detections (user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_camera ON public.detections (camera_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_started ON public.incidents (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_trusted_people_user ON public.trusted_people (user_id);
CREATE INDEX IF NOT EXISTS idx_cameras_user ON public.cameras (user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON public.emergency_contacts (user_id, priority ASC);

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Homeowner'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Supabase Realtime Publication for live UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.detections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;
