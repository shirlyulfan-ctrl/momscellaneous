-- Create enum for languages
CREATE TYPE public.language_preference AS ENUM ('en', 'es');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_provider BOOLEAN DEFAULT false,
  language_preference language_preference DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_profiles table
CREATE TABLE public.provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  location TEXT,
  neighborhood TEXT,
  hourly_rate DECIMAL(10,2),
  task_rate DECIMAL(10,2),
  services TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT false,
  available BOOLEAN DEFAULT true,
  child_friendly BOOLEAN DEFAULT false,
  can_bring_child BOOLEAN DEFAULT false,
  terms_and_conditions TEXT,
  years_experience INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_media table for photos and videos
CREATE TABLE public.provider_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_media ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Provider profiles policies
CREATE POLICY "Anyone can view provider profiles" ON public.provider_profiles FOR SELECT USING (true);
CREATE POLICY "Providers can update own profile" ON public.provider_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Providers can insert own profile" ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can delete own profile" ON public.provider_profiles FOR DELETE USING (auth.uid() = user_id);

-- Provider media policies
CREATE POLICY "Anyone can view provider media" ON public.provider_media FOR SELECT USING (true);
CREATE POLICY "Providers can manage own media" ON public.provider_media FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Providers can update own media" ON public.provider_media FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Providers can delete own media" ON public.provider_media FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.provider_profiles WHERE id = provider_id AND user_id = auth.uid()));

-- Create storage bucket for provider media
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-media', 'provider-media', true);

-- Storage policies
CREATE POLICY "Anyone can view provider media files" ON storage.objects FOR SELECT USING (bucket_id = 'provider-media');
CREATE POLICY "Authenticated users can upload provider media" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'provider-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own provider media" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own provider media" ON storage.objects FOR DELETE 
  USING (bucket_id = 'provider-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();