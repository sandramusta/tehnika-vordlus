-- Create myths table for storing myth/reality/advantage content
CREATE TABLE public.myths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  myth TEXT NOT NULL,
  reality TEXT NOT NULL,
  advantage TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.myths ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read for myths"
ON public.myths
FOR SELECT
USING (true);

-- Create policy for full management access
CREATE POLICY "Allow all for myths"
ON public.myths
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_myths_updated_at
BEFORE UPDATE ON public.myths
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing myths data
INSERT INTO public.myths (category, myth, reality, advantage, sort_order) VALUES
-- Finance category
('finance', 'Uue masina ost on liiga suur risk ja kulukoormus.', 'Investeeringu edasilükkamine tõstab omahinda ja suurendab riski. Uue masina kuumakse võib olla väiksem kui vana masina remondivajadus. Vana masina rike hooajal võib maksta rohkem kui uue masina liising.', 'Wihuri Agri pakub paindlikke rendi- ja finantseerimisvõimalusi (sh komisjonimüük ja ringtehingud), mis aitavad rahavoogu vabastada. Strateegiline investeering tagab jätkusuutlikkuse ja suurema tulupotentsiaali.', 1),
('finance', 'Masina ost on emotsiooniost, mitte strateegiline investeering.', 'Masina ost on strateegiline investeering 5–10 aastaks. Iga edasi lükatud vajalik otsus vähendab võimalust tulevikus rohkem teenida. Riskide maandamine on otsene rahaline kasu.', 'John Deere''i masinatel on kõrge järelturu väärtus ja madal TCO (Total Cost of Ownership), mis teeb neist pikaajalise ja turvalise investeeringu.', 2),
-- Tech category
('tech', 'Vana masin on odavam ja töökindlam.', 'Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Purunemise risk suureneb iga aastaga. Odavam ostuhind ei ole võrdne madalama hektarihinnaga.', 'Uus masin maandab riske tänu garantiile ja ennetavale hooldusele (Expert Alerts). Wihuri teeninduse kiirus ja kvaliteet on reaalne konkurentsieelis, mis vähendab seisakuid.', 1),
('tech', 'Odav ostuhind tagab madala hektarihinna.', 'Odav ost võib maksma minna. Madal hektarihind sünnib kvaliteedist, töökindlusest ja madalast kogukulust (TCO).', 'John Deere''i masinate TCO võrdlus, järelteeninduse kõrge tase ja AMS (täppisviljeluse) eelised tõestavad, et kvaliteetne tehnika on pikas perspektiivis odavam.', 2),
('tech', 'Kiire töö on efektiivne töö.', 'Päris põllutöös pole vaja kihutada. Liigne kiirus suurendab kütusekulu, rehvide kulumist ja õnnetuste arvu.', 'John Deere''i täppisviljeluse lahendused (nt AutoTrac) tagavad optimaalse töövõtte ja kiiruse, mis säästab kütust ja tagab tööturvalisuse.', 3),
-- Weather category
('weather', 'Saagikõikumised ja ilm on kontrollimatud faktorid.', 'Vilja hinda ja ilma ei saa kontrollida, kuid sisendkulude kontroll on võimalik. Statistika näitab, et saagikõikumised on tegelikult väiksemad, kui emotsioonid lubavad.', 'John Deere Operations Center võimaldab mõõta ja analüüsida kütusekulu, töövõtteid ja tööaega. Täppisviljelus säästab 10–15% sisendeid.', 1),
('weather', 'Tulevik on ebakindel, seega ei tasu investeerida.', 'Tulevik on alati ebakindel, küsimus on riskide juhtimises. Iga ärajäetud investeering vähendab potentsiaalset kasumlikkust. Investeeringu edasilükkamine ei võimalda omahinna kontrolli alla saamist.', 'Täppisviljeluse andmed ja masinate efektiivsus aitavad kehval aastal olemasolevast maksimumi võtta ja omahinna kontrolli all hoida.', 2),
('weather', 'Kõike peab omama.', 'Noorem põlvkond eelistab teenuseid omamisele. Masin ei pea kuuluma sulle, et see sinu heaks töötaks.', 'Wihuri Agri rendi- ja teenusepakkumised vähendavad riske ja võimaldavad kasutada uusimat tehnikat ilma suure alginvesteeringuta.', 3),
-- Market category
('market', 'Konkurentide pakkumised on läbipaistvad.', 'Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Küsi müügikõnes konkureerivat pakkumist ja võimalusel ka hoolduskulusid.', 'John Deere''i TCO (kogukulu) võrdlus ja Wihuri teeninduse kõrge tase on läbipaistvad konkurentsieelised. Odav ostuhind ei ole võrdne madala hektarihinnaga.', 1),
('market', 'Viljahinna lukkulöömine on liiga riskantne.', 'Viljahinna lukkulöömine aasta alguses võimaldab hooaega paremini planeerida ja maandab riske.', 'Täppisviljeluse andmed annavad täpsema prognoosi saagikusest, mis aitab teha paremaid otsuseid vilja müügi osas.', 2);