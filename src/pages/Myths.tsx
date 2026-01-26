import { Layout } from "@/components/layout/Layout";
import { MythCategory } from "@/components/myths/MythCategory";
import { MythData } from "@/components/myths/MythCard";
import { Wallet, Wrench, CloudSun, TrendingUp } from "lucide-react";

// Category 1: Finantsid ja investeeringud
const financeMythsData: MythData[] = [
  {
    id: "finance-1",
    myth: "Uue masina ost on liiga suur risk ja kulukoormus.",
    reality: "Investeeringu edasilükkamine tõstab omahinda ja suurendab riski. Uue masina kuumakse võib olla väiksem kui vana masina remondivajadus. Vana masina rike hooajal võib maksta rohkem kui uue masina liising.",
    advantage: "Wihuri Agri pakub paindlikke rendi- ja finantseerimisvõimalusi (sh komisjonimüük ja ringtehingud), mis aitavad rahavoogu vabastada. Strateegiline investeering tagab jätkusuutlikkuse ja suurema tulupotentsiaali.",
  },
  {
    id: "finance-2",
    myth: "Masina ost on emotsiooniost, mitte strateegiline investeering.",
    reality: "Masina ost on strateegiline investeering 5–10 aastaks. Iga edasi lükatud vajalik otsus vähendab võimalust tulevikus rohkem teenida. Riskide maandamine on otsene rahaline kasu.",
    advantage: "John Deere'i masinatel on kõrge järelturu väärtus ja madal TCO (Total Cost of Ownership), mis teeb neist pikaajalise ja turvalise investeeringu.",
  },
];

// Category 2: Tehnika ja töökindlus
const techMythsData: MythData[] = [
  {
    id: "tech-1",
    myth: "Vana masin on odavam ja töökindlam.",
    reality: "Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Purunemise risk suureneb iga aastaga. Odavam ostuhind ei ole võrdne madalama hektarihinnaga.",
    advantage: "Uus masin maandab riske tänu garantiile ja ennetavale hooldusele (Expert Alerts). Wihuri teeninduse kiirus ja kvaliteet on reaalne konkurentsieelis, mis vähendab seisakuid.",
  },
  {
    id: "tech-2",
    myth: "Odav ostuhind tagab madala hektarihinna.",
    reality: "Odav ost võib maksma minna. Madal hektarihind sünnib kvaliteedist, töökindlusest ja madalast kogukulust (TCO).",
    advantage: "John Deere'i masinate TCO võrdlus, järelteeninduse kõrge tase ja AMS (täppisviljeluse) eelised tõestavad, et kvaliteetne tehnika on pikas perspektiivis odavam.",
  },
  {
    id: "tech-3",
    myth: "Kiire töö on efektiivne töö.",
    reality: "Päris põllutöös pole vaja kihutada. Liigne kiirus suurendab kütusekulu, rehvide kulumist ja õnnetuste arvu.",
    advantage: "John Deere'i täppisviljeluse lahendused (nt AutoTrac) tagavad optimaalse töövõtte ja kiiruse, mis säästab kütust ja tagab tööturvalisuse.",
  },
];

// Category 3: Ilm, saagikus ja juhtimine
const weatherMythsData: MythData[] = [
  {
    id: "weather-1",
    myth: "Saagikõikumised ja ilm on kontrollimatud faktorid.",
    reality: "Vilja hinda ja ilma ei saa kontrollida, kuid sisendkulude kontroll on võimalik. Statistika näitab, et saagikõikumised on tegelikult väiksemad, kui emotsioonid lubavad.",
    advantage: "John Deere Operations Center võimaldab mõõta ja analüüsida kütusekulu, töövõtteid ja tööaega. Täppisviljelus säästab 10–15% sisendeid.",
  },
  {
    id: "weather-2",
    myth: "Tulevik on ebakindel, seega ei tasu investeerida.",
    reality: "Tulevik on alati ebakindel, küsimus on riskide juhtimises. Iga ärajäetud investeering vähendab potentsiaalset kasumlikkust. Investeeringu edasilükkamine ei võimalda omahinna kontrolli alla saamist.",
    advantage: "Täppisviljeluse andmed ja masinate efektiivsus aitavad kehval aastal olemasolevast maksimumi võtta ja omahinna kontrolli all hoida.",
  },
  {
    id: "weather-3",
    myth: "Kõike peab omama.",
    reality: "Noorem põlvkond eelistab teenuseid omamisele. Masin ei pea kuuluma sulle, et see sinu heaks töötaks.",
    advantage: "Wihuri Agri rendi- ja teenusepakkumised vähendavad riske ja võimaldavad kasutada uusimat tehnikat ilma suure alginvesteeringuta.",
  },
];

// Category 4: Turg ja konkurents
const marketMythsData: MythData[] = [
  {
    id: "market-1",
    myth: "Konkurentide pakkumised on läbipaistvad.",
    reality: "Enamik vana masina kulusid (remont, seisakud) ei ole omanikule tegelikult teada. Küsi müügikõnes konkureerivat pakkumist ja võimalusel ka hoolduskulusid.",
    advantage: "John Deere'i TCO (kogukulu) võrdlus ja Wihuri teeninduse kõrge tase on läbipaistvad konkurentsieelised. Odav ostuhind ei ole võrdne madala hektarihinnaga.",
  },
  {
    id: "market-2",
    myth: "Viljahinna lukkulöömine on liiga riskantne.",
    reality: "Viljahinna lukkulöömine aasta alguses võimaldab hooaega paremini planeerida ja maandab riske.",
    advantage: "Täppisviljeluse andmed annavad täpsema prognoosi saagikusest, mis aitab teha paremaid otsuseid vilja müügi osas.",
  },
];

export default function Myths() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Müüdid ja tegelikkus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Levinumad väärarusaamad põllumajandustehnika kohta ja kuidas John Deere need ümber lükkab.
          </p>
        </div>

        {/* Myths by Category */}
        <div className="grid gap-8">
          <MythCategory
            title="Finantsid ja investeeringud"
            icon={Wallet}
            myths={financeMythsData}
            startIndex={1}
          />
          
          <MythCategory
            title="Tehnika ja töökindlus"
            icon={Wrench}
            myths={techMythsData}
            startIndex={3}
          />
          
          <MythCategory
            title="Ilm, saagikus ja juhtimine"
            icon={CloudSun}
            myths={weatherMythsData}
            startIndex={6}
          />
          
          <MythCategory
            title="Turg ja konkurents"
            icon={TrendingUp}
            myths={marketMythsData}
            startIndex={9}
          />
        </div>
      </div>
    </Layout>
  );
}
