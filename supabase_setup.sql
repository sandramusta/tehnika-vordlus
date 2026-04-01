-- ============================================================
-- TEHNIKA VÕRDLUS - Täielik Supabase seadistuse SQL skript
-- Kopeeri see Supabase SQL Editorisse ja käivita korraga
-- ============================================================

-- ============================================================
-- 1. ABIFUNKTSIOON: updated_at automaatne uuendamine
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ============================================================
-- 2. ENUM TÜÜP: kasutajarollid
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'product_manager', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 3. TABELID (sõltuvuse järjekorras)
-- ============================================================

-- Seadmete tüübid (kombainid, traktorid jne)
CREATE TABLE IF NOT EXISTS public.equipment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_et TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Brändid
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Võimsusklassid
CREATE TABLE IF NOT EXISTS public.power_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seadmed (põhitabel)
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  power_class_id UUID REFERENCES public.power_classes(id),
  model_name TEXT NOT NULL,
  engine_power_hp INTEGER,
  grain_tank_liters INTEGER,
  header_width_m NUMERIC(4,2),
  header_width_min_m NUMERIC,
  header_width_max_m NUMERIC,
  weight_kg INTEGER,
  fuel_consumption_lh NUMERIC(4,1),
  fuel_tank_liters INTEGER,
  price_eur INTEGER,
  annual_maintenance_eur INTEGER,
  expected_lifespan_years INTEGER DEFAULT 10,
  features JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  data_source_url TEXT,
  image_url TEXT,
  threshing_system_image_url TEXT,
  -- Kombain-spetsiifilised väljad
  cleaning_area_m2 DECIMAL(4,2),
  rotor_diameter_mm INTEGER,
  rotor_length_mm INTEGER,
  throughput_tons_h DECIMAL(5,1),
  engine_displacement_liters DECIMAL(4,1),
  engine_cylinders INTEGER,
  max_torque_nm INTEGER,
  feeder_width_mm INTEGER,
  rasp_bar_count INTEGER,
  threshing_drum_diameter_mm INTEGER,
  threshing_drum_width_mm INTEGER,
  threshing_area_m2 NUMERIC,
  separator_area_m2 NUMERIC,
  straw_walker_count INTEGER,
  straw_walker_area_m2 NUMERIC,
  sieve_area_m2 NUMERIC,
  unloading_rate_ls NUMERIC,
  auger_reach_m NUMERIC,
  chopper_width_mm INTEGER,
  max_slope_percent INTEGER,
  transport_width_mm INTEGER,
  transport_height_mm INTEGER,
  transport_length_mm INTEGER,
  detailed_specs JSONB DEFAULT '{}'::jsonb,
  -- Teleskooplaaduri-spetsiifilised väljad
  lift_height_m NUMERIC,
  lift_reach_m NUMERIC,
  max_lift_capacity_kg INTEGER,
  hydraulic_pump_lpm INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Konkurentsivõrdluse argumendid
CREATE TABLE IF NOT EXISTS public.competitive_arguments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id) ON DELETE CASCADE,
  argument_title TEXT NOT NULL,
  argument_description TEXT NOT NULL,
  problem_text TEXT,
  solution_text TEXT,
  benefit_text TEXT,
  icon_name TEXT DEFAULT 'Lightbulb',
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Töödokumentatsioon
CREATE TABLE IF NOT EXISTS public.work_documentation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_type TEXT NOT NULL,
  hours_worked NUMERIC(6,2),
  area_hectares NUMERIC(8,2),
  fuel_used_liters NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Müüdid (myth/reality/advantage)
CREATE TABLE IF NOT EXISTS public.myths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  myth TEXT NOT NULL,
  reality TEXT NOT NULL,
  advantage TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seadmete brošüürid
CREATE TABLE IF NOT EXISTS public.equipment_brochures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  brochure_url TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  extracted_data JSONB DEFAULT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  extraction_error TEXT DEFAULT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Töötajad
CREATE TABLE IF NOT EXISTS public.staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kasutajaprofiilid (seotud auth.users-iga)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kasutajarollid (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Kasutajate tegevuslogi
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parooli seadistamise tokenid
CREATE TABLE IF NOT EXISTS public.password_setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spetsifikatsiooni kohandatavad sildid
CREATE TABLE IF NOT EXISTS public.spec_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spec_key TEXT NOT NULL,
  custom_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);


-- ============================================================
-- 4. TURBE FUNKTSIOONID (rolliõiguste kontroll)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;


-- ============================================================
-- 5. TRIGGERID (updated_at automaatne uuendamine)
-- ============================================================

DROP TRIGGER IF EXISTS update_equipment_updated_at ON public.equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_myths_updated_at ON public.myths;
CREATE TRIGGER update_myths_updated_at
  BEFORE UPDATE ON public.myths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_brochures_updated_at ON public.equipment_brochures;
CREATE TRIGGER update_equipment_brochures_updated_at
  BEFORE UPDATE ON public.equipment_brochures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_spec_labels_updated_at ON public.spec_labels;
CREATE TRIGGER update_spec_labels_updated_at
  BEFORE UPDATE ON public.spec_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- 6. INDEKSID (kiireks otsinguks)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_equipment_brochures_equipment_id ON public.equipment_brochures(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_brochures_status ON public.equipment_brochures(extraction_status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.user_activity_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_token ON public.password_setup_tokens (token);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_user_id ON public.password_setup_tokens (user_id);


-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) - Luba tabelitel
-- ============================================================

ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.myths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_setup_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_labels ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 8. RLS POLIITIKAD
-- ============================================================

-- equipment_types: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read equipment_types"
  ON public.equipment_types FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage equipment_types"
  ON public.equipment_types FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- brands: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read brands"
  ON public.brands FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage brands"
  ON public.brands FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- power_classes: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read power_classes"
  ON public.power_classes FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage power_classes"
  ON public.power_classes FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- equipment: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read equipment"
  ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage equipment"
  ON public.equipment FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- competitive_arguments: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read competitive_arguments"
  ON public.competitive_arguments FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage competitive_arguments"
  ON public.competitive_arguments FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- work_documentation: ainult PM+admin saab lugeda ja hallata
CREATE POLICY "Product managers can read work_documentation"
  ON public.work_documentation FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));
CREATE POLICY "Product managers and admins can manage work_documentation"
  ON public.work_documentation FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- myths: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read myths"
  ON public.myths FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage myths"
  ON public.myths FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- equipment_brochures: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read equipment_brochures"
  ON public.equipment_brochures FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage equipment_brochures"
  ON public.equipment_brochures FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));

-- staff_users: ainult autenditud kasutajad saavad lugeda, admin haldab
CREATE POLICY "Authenticated users can read staff_users"
  ON public.staff_users FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage staff_users"
  ON public.staff_users FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles: autenditud kasutajad näevad kõiki profiile, ise saab muuta
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- user_roles: kasutaja näeb oma rolle, admin haldab kõiki
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- user_activity_logs: kasutaja lisab ise, PM+admin loeb, admin kustutab
CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers and admins can read all activity logs"
  ON public.user_activity_logs FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));
CREATE POLICY "Admins can delete activity logs"
  ON public.user_activity_logs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- spec_labels: kõik saavad lugeda, PM+admin haldab
CREATE POLICY "Anyone can read spec_labels"
  ON public.spec_labels FOR SELECT USING (true);
CREATE POLICY "Product managers and admins can manage spec_labels"
  ON public.spec_labels FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[]));


-- ============================================================
-- 9. STORAGE BUCKETS (pildid ja brošüürid)
-- ============================================================

-- Seadmete pildid
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Brošüürid
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-brochures', 'equipment-brochures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: avalik lugemine
CREATE POLICY "Equipment images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-images');

CREATE POLICY "Brochures are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-brochures');

-- Storage RLS: PM+admin saab lisada/muuta/kustutada pilte
CREATE POLICY "Product managers can upload equipment images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment-images' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );
CREATE POLICY "Product managers can update equipment images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'equipment-images' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );
CREATE POLICY "Product managers can delete equipment images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'equipment-images' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );

-- Storage RLS: PM+admin saab lisada/muuta/kustutada brošüüre
CREATE POLICY "Product managers can upload brochures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'equipment-brochures' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );
CREATE POLICY "Product managers can update brochures"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'equipment-brochures' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );
CREATE POLICY "Product managers can delete brochures"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'equipment-brochures' AND
    public.has_any_role(auth.uid(), ARRAY['product_manager', 'admin']::app_role[])
  );


-- ============================================================
-- 10. ALGANDMED (seed data)
-- ============================================================

-- Seadmete tüübid
INSERT INTO public.equipment_types (name, name_et) VALUES
  ('combine', 'Kombain'),
  ('tractor', 'Traktor'),
  ('sprayer', 'Pritsija'),
  ('seeder', 'Külvik')
ON CONFLICT (name) DO NOTHING;

-- Brändid
INSERT INTO public.brands (name, is_primary) VALUES
  ('John Deere', true),
  ('Claas', false),
  ('Case IH', false),
  ('New Holland', false),
  ('Kramer', false),
  ('Manitou', false),
  ('JCB', false),
  ('Merlo', false),
  ('Weidemann', false),
  ('Claas Scorpion', false),
  ('Krone', false),
  ('Fendt', false)
ON CONFLICT (name) DO NOTHING;

-- Võimsusklassid
INSERT INTO public.power_classes (name, min_hp, max_hp) VALUES
  ('Väike (kuni 250 hj)', 0, 250),
  ('Keskmine (250-400 hj)', 250, 400),
  ('Suur (400-550 hj)', 400, 550),
  ('Ülisuur (550+ hj)', 550, 1000)
ON CONFLICT DO NOTHING;

-- Müüdid
INSERT INTO public.myths (category, myth, reality, advantage, sort_order) VALUES
('finance', 'Uue masina ost on liiga suur risk ja kulukoormus.', 'Investeeringu edasilükkamine tõstab omahinda ja suurendab riski. Uue masina kuumakse võib olla väiksem kui vana masina remondivajadus. Vana masina rike hooajal võib maksta rohkem kui uue masina liising.', 'Wihuri Agri pakub paindlikke rendi- ja finantseerimisvõimalusi (sh komisjonimüük ja ringtehingud), mis aitavad rahavoogu vabastada. Strateegiline investeering tagab jätkusuutlikkuse ja suurema tulupotentsiaali.', 1),
('finance', 'Masina ost on emotsiooniost, mitte strateegiline investeering.', 'Masina ost on strateegiline investeering 5–10 aastaks. Iga edasi lükatud vajalik otsus vähendab võimalust tulevikus rohkem teenida. Riskide maandamine on otsene rahaline kasu.', 'John Deere''i masinatel on kõrge järelturu väärtus ja madal TCO (Total Cost of Ownership), mis teeb neist pikaajalise ja turvalise investeeringu.', 2),
('tech', 'Vana masin on odavam ja töökindlam.', 'Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Purunemise risk suureneb iga aastaga. Odavam ostuhind ei ole võrdne madalama hektarihinnaga.', 'Uus masin maandab riske tänu garantiile ja ennetavale hooldusele (Expert Alerts). Wihuri teeninduse kiirus ja kvaliteet on reaalne konkurentsieelis, mis vähendab seisakuid.', 1),
('tech', 'Odav ostuhind tagab madala hektarihinna.', 'Odav ost võib maksma minna. Madal hektarihind sünnib kvaliteedist, töökindlusest ja madalast kogukulust (TCO).', 'John Deere''i masinate TCO võrdlus, järelteeninduse kõrge tase ja AMS (täppisviljeluse) eelised tõestavad, et kvaliteetne tehnika on pikas perspektiivis odavam.', 2),
('tech', 'Kiire töö on efektiivne töö.', 'Päris põllutöös pole vaja kihutada. Liigne kiirus suurendab kütusekulu, rehvide kulumist ja õnnetuste arvu.', 'John Deere''i täppisviljeluse lahendused (nt AutoTrac) tagavad optimaalse töövõtte ja kiiruse, mis säästab kütust ja tagab tööturvalisuse.', 3),
('weather', 'Saagikõikumised ja ilm on kontrollimatud faktorid.', 'Vilja hinda ja ilma ei saa kontrollida, kuid sisendkulude kontroll on võimalik. Statistika näitab, et saagikõikumised on tegelikult väiksemad, kui emotsioonid lubavad.', 'John Deere Operations Center võimaldab mõõta ja analüüsida kütusekulu, töövõtteid ja tööaega. Täppisviljelus säästab 10–15% sisendeid.', 1),
('weather', 'Tulevik on ebakindel, seega ei tasu investeerida.', 'Tulevik on alati ebakindel, küsimus on riskide juhtimises. Iga ärajäetud investeering vähendab potentsiaalset kasumlikkust. Investeeringu edasilükkamine ei võimalda omahinna kontrolli alla saamist.', 'Täppisviljeluse andmed ja masinate efektiivsus aitavad kehval aastal olemasolevast maksimumi võtta ja omahinna kontrolli all hoida.', 2),
('weather', 'Kõike peab omama.', 'Noorem põlvkond eelistab teenuseid omamisele. Masin ei pea kuuluma sulle, et see sinu heaks töötaks.', 'Wihuri Agri rendi- ja teenusepakkumised vähendavad riske ja võimaldavad kasutada uusimat tehnikat ilma suure alginvesteeringuta.', 3),
('market', 'Konkurentide pakkumised on läbipaistvad.', 'Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Küsi müügikõnes konkureerivat pakkumist ja võimalusel ka hoolduskulusid.', 'John Deere''i TCO (kogukulu) võrdlus ja Wihuri teeninduse kõrge tase on läbipaistvad konkurentsieelised. Odav ostuhind ei ole võrdne madala hektarihinnaga.', 1),
('market', 'Viljahinna lukkulöömine on liiga riskantne.', 'Viljahinna lukkulöömine aasta alguses võimaldab hooaega paremini planeerida ja maandab riske.', 'Täppisviljeluse andmed annavad täpsema prognoosi saagikusest, mis aitab teha paremaid otsuseid vilja müügi osas.', 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- VALMIS! Skeem on loodud.
-- ============================================================
-- JÄRGMISED SAMMUD:
-- 1. Uuenda .env fail uue projekti andmetega (vt allpool)
-- 2. Ekspordi andmed vanast andmebaasist (equipment, competitive_arguments jne)
-- 3. Deploi Edge Functions: supabase functions deploy --all
-- ============================================================
