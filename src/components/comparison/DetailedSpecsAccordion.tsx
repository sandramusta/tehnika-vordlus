import { Equipment } from "@/types/equipment";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface DetailedSpecsAccordionProps {
  equipment: Equipment;
}

// Category display names and order
const CATEGORY_ORDER = [
  "mootor",
  "kaldtransportöör_etteanne",
  "peksusüsteem",
  "puhastussüsteem",
  "terapunker",
  "koristusjääkide_käitlemine",
  "nõlvakusüsteem",
  "mõõtmed",
  "heedrid",
  "kabiin",
  "veosüsteem",
  "tehnoloogia",
] as const;

const CATEGORY_NAMES: Record<string, string> = {
  mootor: "MOOTOR",
  kaldtransportöör_etteanne: "KALDTRANSPORTÖÖR / ETTEANNE",
  peksusüsteem: "PEKS JA SEPAREERIMINE",
  puhastussüsteem: "PUHASTUSSÜSTEEM",
  terapunker: "TERAPUNKER",
  koristusjääkide_käitlemine: "KORISTUSJÄÄKIDE KÄITLEMINE",
  nõlvakusüsteem: "NÕLVAKUSÜSTEEM",
  mõõtmed: "MÕÕTMED",
  heedrid: "HEEDRID",
  kabiin: "KABIIN",
  veosüsteem: "VEOSÜSTEEM",
  tehnoloogia: "INTEGREERITUD TEHNOLOOGIA",
};

// Field display names for each category
const FIELD_NAMES: Record<string, Record<string, string>> = {
  mootor: {
    mark_ja_mudel: "Mark ja mudel",
    heitgaasinorm: "Heitgaasinorm",
    silindrid: "Silindrid",
    töömahu_liitrid: "Töömaht (l)",
    võimsus_kW_hj: "Võimsus (kW/hj)",
    max_pöördemoment_Nm: "Max pöördemoment (Nm)",
    kütusepaagi_maht_l: "Kütusepaagi maht (l)",
    adblue_paagi_maht_l: "AdBlue paagi maht (l)",
    jahutussüsteem: "Jahutussüsteem",
  },
  kaldtransportöör_etteanne: {
    sisestuslaius_mm: "Sisestuslaius (mm)",
    etteande_kett: "Etteande kett",
    raspi_latid: "Raspi latid",
    kivikaitse: "Kivikaitse",
  },
  peksusüsteem: {
    süsteemi_tüüp: "Süsteemi tüüp",
    rootorite_arv: "Rootorite arv",
    rootori_läbimõõt_mm: "Rootori läbimõõt (mm)",
    rootori_pikkus_mm: "Rootori pikkus (mm)",
    separeerimispind_m2: "Separeerimispind (m²)",
    rootori_kiiruse_reguleerimine: "Rootori kiiruse reguleerimine",
  },
  puhastussüsteem: {
    puhastussüsteemi_tüüp: "Puhastussüsteemi tüüp",
    sõelapind_m2: "Sõelapind (m²)",
    ventilaatori_tüüp: "Ventilaatori tüüp",
    aktiivne_sõelavõre: "Aktiivne sõelavõre",
  },
  terapunker: {
    maht_standardne_l: "Maht standardne (l)",
    maht_laiendusega_l: "Maht laiendusega (l)",
    tühjenduskiirus_l_s: "Tühjenduskiirus (l/s)",
    tigupikkus_m: "Tigupikkus (m)",
    tigupööramise_nurk: "Tigupööramise nurk",
    kokkuvolditav: "Kokkuvolditav",
  },
  koristusjääkide_käitlemine: {
    hekseldi_tüüp: "Hekseldi tüüp",
    laotuslaius_m: "Laotuslaius (m)",
  },
  nõlvakusüsteem: {
    süsteemi_nimi: "Süsteemi nimi",
    küljenurk_kraadi: "Küljenurk (°)",
    pikinurk_kraadi: "Pikinurk (°)",
  },
  mõõtmed: {
    kaal_baasmasin_kg: "Kaal baasmasin (kg)",
    transpordi_laius_mm: "Transpordi laius (mm)",
    transpordi_kõrgus_mm: "Transpordi kõrgus (mm)",
  },
  heedrid: {
    teraviljaheedri_laius_min_m: "Teraviljaheedri laius min (m)",
    teraviljaheedri_laius_max_m: "Teraviljaheedri laius max (m)",
  },
  kabiin: {
    kabiini_tüüp: "Kabiini tüüp",
    istme_tüüp: "Istme tüüp",
    vaateväli: "Vaateväli",
  },
  veosüsteem: {
    vedamise_tüüp: "Vedamise tüüp",
    kiiruse_vahemik_km_h: "Kiiruse vahemik (km/h)",
  },
  tehnoloogia: {
    starfire_positsioneerimine: "StarFire positsioneerimine",
    autotrac_juhtimine: "AutoTrac juhtimine",
    active_yield: "Active Yield",
    harvest_doc: "Harvest Doc",
  },
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "●" : "○";
  if (typeof value === "number") {
    return new Intl.NumberFormat("et-EE").format(value);
  }
  return String(value);
}

export function DetailedSpecsAccordion({ equipment }: DetailedSpecsAccordionProps) {
  const specs = equipment.detailed_specs;
  
  if (!specs || typeof specs !== "object") {
    return null;
  }

  // Get categories that exist in the data, ordered
  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => specs[cat] && typeof specs[cat] === "object"
  );

  if (availableCategories.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          {equipment.brand?.name} {equipment.model_name} — Tehnilised andmed
        </h3>
      </div>
      <Accordion type="multiple" className="w-full">
        {availableCategories.map((categoryKey) => {
          const categoryData = specs[categoryKey] as Record<string, unknown>;
          const categoryName = CATEGORY_NAMES[categoryKey] || categoryKey;
          const fieldNames = FIELD_NAMES[categoryKey] || {};

          return (
            <AccordionItem key={categoryKey} value={categoryKey} className="border-border">
              <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-primary hover:no-underline hover:bg-muted/20">
                {categoryName}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid gap-2">
                  {Object.entries(categoryData).map(([fieldKey, value]) => {
                    const fieldName = fieldNames[fieldKey] || fieldKey.replace(/_/g, " ");
                    return (
                      <div
                        key={fieldKey}
                        className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">{fieldName}</span>
                        <span className={cn(
                          "text-sm font-medium text-foreground",
                          typeof value === "boolean" && value && "text-primary"
                        )}>
                          {formatValue(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
