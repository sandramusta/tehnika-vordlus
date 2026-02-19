import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Type-specific field schemas for brochure extraction
// Synced with equipmentTypeFields.ts (equipment_columns) and pdfSpecsHelpers.ts (detailed_specs)
const EQUIPMENT_TYPE_SCHEMAS: Record<string, {
  equipment_columns: Array<{ key: string; label: string; type: string }>;
  detailed_specs_categories: Record<string, { label: string; fields: Array<{ key: string; label: string; type: string }> }>;
}> = {
  // ====================== COMBINE ======================
  combine: {
    equipment_columns: [
      // COMMON_FIELDS (excl. economic)
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      // Bunker ja heedrid
      { key: "grain_tank_liters", label: "Bunker (l)", type: "number" },
      { key: "header_width_m", label: "Heedri laius (m)", type: "number" },
      { key: "header_width_min_m", label: "Heedri min laius (m)", type: "number" },
      { key: "header_width_max_m", label: "Heedri max laius (m)", type: "number" },
      // Mootor ja küttesüsteem
      { key: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number" },
      { key: "engine_displacement_liters", label: "Mootori töömaht (L)", type: "number" },
      { key: "engine_cylinders", label: "Silindrite arv", type: "number" },
      { key: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number" },
      // Peksusüsteem
      { key: "rotor_diameter_mm", label: "Rootori läbimõõt (mm)", type: "number" },
      { key: "rotor_length_mm", label: "Rootori pikkus (mm)", type: "number" },
      { key: "feeder_width_mm", label: "Etteande laius (mm)", type: "number" },
      { key: "rasp_bar_count", label: "Raspi latid", type: "number" },
      { key: "threshing_drum_diameter_mm", label: "Trumli läbimõõt (mm)", type: "number" },
      { key: "threshing_drum_width_mm", label: "Trumli laius (mm)", type: "number" },
      { key: "threshing_area_m2", label: "Peksupindala (m²)", type: "number" },
      // Separeerimine ja puhastus
      { key: "separator_area_m2", label: "Separeerimispind (m²)", type: "number" },
      { key: "straw_walker_count", label: "Õlekõndijaid", type: "number" },
      { key: "straw_walker_area_m2", label: "Õlekõndija pind (m²)", type: "number" },
      { key: "cleaning_area_m2", label: "Puhasti pindala (m²)", type: "number" },
      { key: "sieve_area_m2", label: "Sõelapind (m²)", type: "number" },
      // Terapunker ja tühjendamine
      { key: "unloading_rate_ls", label: "Tühjenduskiirus (l/s)", type: "number" },
      { key: "auger_reach_m", label: "Tigu ulatus (m)", type: "number" },
      // Heksel ja transport
      { key: "chopper_width_mm", label: "Heksli laius (mm)", type: "number" },
      { key: "max_slope_percent", label: "Max kalle (%)", type: "number" },
      { key: "transport_width_mm", label: "Transpordi laius (mm)", type: "number" },
      { key: "transport_height_mm", label: "Transpordi kõrgus (mm)", type: "number" },
      { key: "transport_length_mm", label: "Transpordi pikkus (mm)", type: "number" },
      // Jõudlus
      { key: "throughput_tons_h", label: "Läbilaskevõime (t/h)", type: "number" },
    ],
    detailed_specs_categories: {
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "mark_ja_mudel", label: "Mark ja mudel", type: "string" },
          { key: "heitgaasinorm", label: "Heitgaasinorm", type: "string" },
          { key: "silindrid", label: "Silindrid", type: "number" },
          { key: "töömahu_liitrid", label: "Töömaht (l)", type: "number" },
          { key: "võimsus_kW_hj", label: "Võimsus (kW/hj)", type: "string" },
          { key: "max_pöördemoment_Nm", label: "Max pöördemoment (Nm)", type: "number" },
          { key: "kütusepaagi_maht_l", label: "Kütusepaagi maht (l)", type: "number" },
          { key: "adblue_paagi_maht_l", label: "AdBlue paagi maht (l)", type: "number" },
          { key: "jahutussüsteem", label: "Jahutussüsteem", type: "string" },
        ]
      },
      kaldtransportöör_etteanne: {
        label: "KALDTRANSPORTÖÖR / ETTEANNE",
        fields: [
          { key: "sisestuslaius_mm", label: "Sisestuslaius (mm)", type: "number" },
          { key: "etteande_kett", label: "Etteande kett", type: "string" },
          { key: "raspi_latid", label: "Raspi latid", type: "string" },
          { key: "kivikaitse", label: "Kivikaitse", type: "string" },
        ]
      },
      peksusüsteem: {
        label: "PEKS JA SEPAREERIMINE",
        fields: [
          { key: "süsteemi_tüüp", label: "Süsteemi tüüp", type: "string" },
          { key: "rootorite_arv", label: "Rootorite arv", type: "number" },
          { key: "rootori_läbimõõt_mm", label: "Rootori läbimõõt (mm)", type: "number" },
          { key: "rootori_pikkus_mm", label: "Rootori pikkus (mm)", type: "number" },
          { key: "separeerimispind_m2", label: "Separeerimispind (m²)", type: "number" },
          { key: "rootori_kiiruse_reguleerimine", label: "Rootori kiiruse reguleerimine", type: "string" },
        ]
      },
      puhastussüsteem: {
        label: "PUHASTUSSÜSTEEM",
        fields: [
          { key: "puhastussüsteemi_tüüp", label: "Puhastussüsteemi tüüp", type: "string" },
          { key: "sõelapind_m2", label: "Sõelapind (m²)", type: "number" },
          { key: "ventilaatori_tüüp", label: "Ventilaatori tüüp", type: "string" },
          { key: "aktiivne_sõelavõre", label: "Aktiivne sõelavõre", type: "boolean" },
        ]
      },
      terapunker: {
        label: "TERAPUNKER",
        fields: [
          { key: "maht_standardne_l", label: "Maht standardne (l)", type: "number" },
          { key: "maht_laiendusega_l", label: "Maht laiendusega (l)", type: "number" },
          { key: "tühjenduskiirus_l_s", label: "Tühjenduskiirus (l/s)", type: "number" },
          { key: "tigupikkus_m", label: "Tigupikkus (m)", type: "number" },
          { key: "tigupööramise_nurk", label: "Tigupööramise nurk", type: "string" },
          { key: "kokkuvolditav", label: "Kokkuvolditav", type: "boolean" },
        ]
      },
      koristusjääkide_käitlemine: {
        label: "KORISTUSJÄÄKIDE KÄITLEMINE",
        fields: [
          { key: "hekseldi_tüüp", label: "Hekseldi tüüp", type: "string" },
          { key: "laotuslaius_m", label: "Laotuslaius (m)", type: "number" },
        ]
      },
      nõlvakusüsteem: {
        label: "NÕLVAKUSÜSTEEM",
        fields: [
          { key: "süsteemi_nimi", label: "Süsteemi nimi", type: "string" },
          { key: "küljenurk_kraadi", label: "Küljenurk (°)", type: "number" },
          { key: "pikinurk_kraadi", label: "Pikinurk (°)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_baasmasin_kg", label: "Kaal baasmasin (kg)", type: "number" },
          { key: "transpordi_laius_mm", label: "Transpordi laius (mm)", type: "number" },
          { key: "transpordi_kõrgus_mm", label: "Transpordi kõrgus (mm)", type: "number" },
        ]
      },
      heedrid: {
        label: "HEEDRID",
        fields: [
          { key: "teraviljaheedri_laius_min_m", label: "Teraviljaheedri laius min (m)", type: "number" },
          { key: "teraviljaheedri_laius_max_m", label: "Teraviljaheedri laius max (m)", type: "number" },
        ]
      },
      kabiin: {
        label: "KABIIN",
        fields: [
          { key: "kabiini_tüüp", label: "Kabiini tüüp", type: "string" },
          { key: "istme_tüüp", label: "Istme tüüp", type: "string" },
          { key: "vaateväli", label: "Vaateväli", type: "string" },
        ]
      },
      veosüsteem: {
        label: "VEOSÜSTEEM",
        fields: [
          { key: "vedamise_tüüp", label: "Vedamise tüüp", type: "string" },
          { key: "kiiruse_vahemik_km_h", label: "Kiiruse vahemik (km/h)", type: "string" },
        ]
      },
      tehnoloogia: {
        label: "INTEGREERITUD TEHNOLOOGIA",
        fields: [
          { key: "starfire_positsioneerimine", label: "StarFire positsioneerimine", type: "boolean" },
          { key: "autotrac_juhtimine", label: "AutoTrac juhtimine", type: "boolean" },
          { key: "active_yield", label: "Active Yield", type: "boolean" },
          { key: "harvest_doc", label: "Harvest Doc", type: "boolean" },
        ]
      },
    }
  },

  // ====================== TELEHANDLER ======================
  telehandler: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "lift_height_m", label: "Tõstekõrgus (m)", type: "number" },
      { key: "lift_reach_m", label: "Tõste kaugus (m)", type: "number" },
      { key: "max_lift_capacity_kg", label: "Max tõstevõime (kg)", type: "number" },
      { key: "hydraulic_pump_lpm", label: "Hüdraulikapump (l/min)", type: "number" },
      { key: "transport_width_mm", label: "Laius (mm)", type: "number" },
      { key: "transport_height_mm", label: "Kõrgus (mm)", type: "number" },
      { key: "transport_length_mm", label: "Pikkus (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      tõsteomadused: {
        label: "TÕSTEOMADUSED",
        fields: [
          { key: "tõstekõrgus_m", label: "Tõstekõrgus (m)", type: "number" },
          { key: "tõste_kaugus_m", label: "Tõste kaugus (m)", type: "number" },
          { key: "max_tõstevõime_kg", label: "Max tõstevõime (kg)", type: "number" },
        ]
      },
      hüdraulika: {
        label: "HÜDRAULIKA",
        fields: [
          { key: "hüdraulikapumba_võimsus_lpm", label: "Hüdraulikapumba võimsus (l/min)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "laius_mm", label: "Laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
        ]
      },
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "võimsus_hj", label: "Võimsus (hj)", type: "number" },
          { key: "kütusekulu_lh", label: "Kütusekulu (l/h)", type: "number" },
          { key: "kütusepaagi_maht_l", label: "Kütusepaagi maht (l)", type: "number" },
        ]
      },
    }
  },

  // ====================== TRACTOR ======================
  tractor: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Max võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Tühimass (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "engine_displacement_liters", label: "Kubatuur (L)", type: "number" },
      { key: "engine_cylinders", label: "Silindrite arv", type: "number" },
      { key: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number" },
      { key: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number" },
    ],
    detailed_specs_categories: {
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "max_võimsus_hj_kw", label: "Max võimsus (ECE-R120), hj (kW)", type: "string" },
          { key: "max_võimsus_ipm_hj_kw", label: "Max võimsus IPM-iga, hj (kW)", type: "string" },
          { key: "pöördemomendi_varu_pct", label: "Pöördemomendi varu (%)", type: "number" },
          { key: "max_pöördemoment_Nm", label: "Maksimaalne pöördemoment (Nm)", type: "number" },
          { key: "silindrid", label: "Silindrid", type: "number" },
          { key: "kubatuur_l", label: "Kubatuur (l)", type: "number" },
        ]
      },
      käigukast: {
        label: "KÄIGUKAST",
        fields: [
          { key: "tüüp", label: "Käigukasti tüüp (valikud: PowrQuad™ Plus, AutoQuad™ Plus, AutoQuad™ Plus EcoShift, CommandQuad™ Plus, CommandQuad™ Plus EcoShift, AutoPowr™, e23, eAutoPowr™, e18, e21)", type: "string" },
        ]
      },
      hüdrosüsteem: {
        label: "HÜDROSÜSTEEM",
        fields: [
          { key: "hüdrojaoturid", label: "Hüdrojaoturid", type: "string" },
          { key: "vooluhulk_lpm", label: "Vooluhulk mootori nimipööretel (l/min)", type: "number" },
        ]
      },
      tagumine_rippsüsteem: {
        label: "TAGUMINE RIPPSÜSTEEM",
        fields: [
          { key: "max_tõstevõime_konksudel_kg", label: "Max tõstevõime aisa konksudel (kg)", type: "number" },
          { key: "tõstevõime_oecd_610_kg", label: "Tõstevõime kogu tõsteulatuses OECD 610 mm (kg)", type: "number" },
        ]
      },
      eesmine_rippsüsteem: {
        label: "EESMINE RIPPSÜSTEEM",
        fields: [
          { key: "max_tõstevõime_konksudel_kg", label: "Max tõstevõime aisa konksudel (kg)", type: "number" },
          { key: "tõstevõime_oecd_610_kg", label: "Tõstevõime kogu tõsteulatuses OECD 610 mm (kg)", type: "number" },
        ]
      },
      kabiin: {
        label: "KABIIN",
        fields: [
          { key: "vedrustus", label: "Vedrustus", type: "string" },
          { key: "kabiini_ruumala_m3", label: "Kabiini ruumala (m³)", type: "number" },
        ]
      },
      mahud: {
        label: "MAHUD",
        fields: [
          { key: "kütusepaak_l", label: "Kütusepaak (standard/lisavarustus) (l)", type: "string" },
          { key: "def_l", label: "DEF (l)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "teljevahe_mm", label: "Teljevahe (mm)", type: "number" },
          { key: "kliirens_mm", label: "Kliirens (mm)", type: "number" },
        ]
      },
      massid: {
        label: "MASSID",
        fields: [
          { key: "tühimass_kg", label: "Tühimass (kg)", type: "number" },
          { key: "max_lubatud_täismass_kg", label: "Maksimaalne lubatud täismass (kg)", type: "number" },
        ]
      },
    }
  },

  // ====================== FORAGE HARVESTER ======================
  forage_harvester: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number" },
      { key: "engine_displacement_liters", label: "Mootori töömaht (L)", type: "number" },
      { key: "engine_cylinders", label: "Silindrite arv", type: "number" },
      { key: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number" },
      { key: "header_width_m", label: "Heedri laius (m)", type: "number" },
      { key: "header_width_min_m", label: "Min laius (m)", type: "number" },
      { key: "header_width_max_m", label: "Max laius (m)", type: "number" },
      { key: "throughput_tons_h", label: "Läbilaskevõime (t/h)", type: "number" },
      { key: "chopper_width_mm", label: "Heksli laius (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "võimsus_hj", label: "Võimsus (hj)", type: "number" },
          { key: "töömaht_l", label: "Töömaht (l)", type: "number" },
          { key: "silindrid", label: "Silindrid", type: "number" },
          { key: "kütusepaagi_maht_l", label: "Kütusepaagi maht (l)", type: "number" },
        ]
      },
      lõikur: {
        label: "LÕIKUR",
        fields: [
          { key: "lõikelaius_m", label: "Lõikelaius (m)", type: "number" },
          { key: "nugade_arv", label: "Nugade arv", type: "number" },
          { key: "lõikekiirus_min", label: "Lõikekiirus (1/min)", type: "number" },
        ]
      },
      tõstuk: {
        label: "TÕSTUK",
        fields: [
          { key: "väljutuskõrgus_m", label: "Väljutuskõrgus (m)", type: "number" },
          { key: "väljutuskaugus_m", label: "Väljutuskaugus (m)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
          { key: "laius_mm", label: "Laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
        ]
      },
    }
  },

  // ====================== WHEEL LOADER ======================
  wheel_loader: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "lift_height_m", label: "Kallutuskõrgus (m)", type: "number" },
      { key: "max_lift_capacity_kg", label: "Kandevõime (kg)", type: "number" },
      { key: "hydraulic_pump_lpm", label: "Hüdraulikapump (l/min)", type: "number" },
      { key: "transport_width_mm", label: "Laius (mm)", type: "number" },
      { key: "transport_height_mm", label: "Kõrgus (mm)", type: "number" },
      { key: "transport_length_mm", label: "Pikkus (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      tõsteomadused: {
        label: "TÕSTEOMADUSED",
        fields: [
          { key: "tõstekõrgus_m", label: "Tõstekõrgus (m)", type: "number" },
          { key: "max_tõstevõime_kg", label: "Max tõstevõime (kg)", type: "number" },
          { key: "kopalaius_mm", label: "Kopa laius (mm)", type: "number" },
          { key: "kopamaht_m3", label: "Kopa maht (m³)", type: "number" },
        ]
      },
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "võimsus_hj", label: "Võimsus (hj)", type: "number" },
          { key: "kütusepaagi_maht_l", label: "Kütusepaagi maht (l)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
          { key: "laius_mm", label: "Laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
        ]
      },
    }
  },

  // ====================== SELF-PROPELLED SPRAYER ======================
  self_propelled_sprayer: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "fuel_tank_liters", label: "Kütusepaak (L)", type: "number" },
      { key: "grain_tank_liters", label: "Pritsimispaak (L)", type: "number" },
      { key: "header_width_m", label: "Töölaius (m)", type: "number" },
      { key: "transport_width_mm", label: "Transpordi laius (mm)", type: "number" },
      { key: "transport_height_mm", label: "Transpordi kõrgus (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      paak: {
        label: "PAAK",
        fields: [
          { key: "paagi_maht_l", label: "Paagi maht (l)", type: "number" },
          { key: "puhastvee_paak_l", label: "Puhta vee paak (l)", type: "number" },
        ]
      },
      poomid: {
        label: "POOMID",
        fields: [
          { key: "poomi_laius_m", label: "Poomi laius (m)", type: "number" },
          { key: "poomi_kõrguse_vahemik_mm", label: "Poomi kõrguse vahemik (mm)", type: "string" },
        ]
      },
      mootor: {
        label: "MOOTOR",
        fields: [
          { key: "võimsus_hj", label: "Võimsus (hj)", type: "number" },
          { key: "kütusepaagi_maht_l", label: "Kütusepaagi maht (l)", type: "number" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
          { key: "laius_mm", label: "Transpordi laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
        ]
      },
    }
  },

  // ====================== TRAILED SPRAYER ======================
  trailed_sprayer: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Võimsus (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)", type: "number" },
      { key: "grain_tank_liters", label: "Pritsimispaak (L)", type: "number" },
      { key: "header_width_m", label: "Töölaius (m)", type: "number" },
      { key: "transport_width_mm", label: "Transpordi laius (mm)", type: "number" },
      { key: "transport_length_mm", label: "Transpordi pikkus (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      paak: {
        label: "PAAK",
        fields: [
          { key: "paagi_maht_l", label: "Paagi maht (l)", type: "number" },
          { key: "puhastvee_paak_l", label: "Puhta vee paak (l)", type: "number" },
        ]
      },
      poomid: {
        label: "POOMID",
        fields: [
          { key: "poomi_laius_m", label: "Poomi laius (m)", type: "number" },
          { key: "poomi_kõrguse_vahemik_mm", label: "Poomi kõrguse vahemik (mm)", type: "string" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
          { key: "laius_mm", label: "Transpordi laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
        ]
      },
    }
  },

  // ====================== ROUND BALER ======================
  round_baler: {
    equipment_columns: [
      { key: "engine_power_hp", label: "Min võimsustarve (hj)", type: "number" },
      { key: "weight_kg", label: "Kaal (kg)", type: "number" },
      { key: "header_width_m", label: "Rulooni läbimõõt (m)", type: "number" },
      { key: "header_width_max_m", label: "Rulooni laius (m)", type: "number" },
      { key: "header_width_min_m", label: "Koguri laius (m)", type: "number" },
      { key: "transport_width_mm", label: "Laius (mm)", type: "number" },
      { key: "transport_height_mm", label: "Kõrgus (mm)", type: "number" },
      { key: "transport_length_mm", label: "Pikkus (mm)", type: "number" },
    ],
    detailed_specs_categories: {
      rulooni_mõõtmed: {
        label: "RULOONI MÕÕTMED",
        fields: [
          { key: "läbimõõt_m", label: "Läbimõõt (m)", type: "string" },
          { key: "laius_m", label: "Laius (m)", type: "string" },
        ]
      },
      kogur: {
        label: "KOGUR",
        fields: [
          { key: "laius_m", label: "Laius (m)", type: "string" },
          { key: "laius_m_din", label: "Laius (m DIN)", type: "string" },
          { key: "piilat", label: "Piilat", type: "string" },
          { key: "vaalusurverull", label: "Vaalusurverull", type: "string" },
          { key: "kopeerrattad", label: "Kopeerrattad", type: "string" },
        ]
      },
      rootorsöötmine: {
        label: "ROOTORSÖÖTMINE",
        fields: [
          { key: "tüüp_terade_arv", label: "Tüüp / terade arv", type: "string" },
          { key: "terade_komplekt", label: "Terade komplekt vastavalt terade jaotisele", type: "string" },
          { key: "ummistuste_eemaldamine", label: "Ummistuste eemaldamise süsteem", type: "string" },
        ]
      },
      rullikamber: {
        label: "RULLIKAMBER",
        fields: [
          { key: "rulli_moodustamine", label: "Rulli moodustamine", type: "string" },
          { key: "tiheduse_ja_läbimõõdu_seadistamine", label: "Tiheduse ja rulli läbimõõdu seadistamine", type: "string" },
        ]
      },
      võrksidumine: {
        label: "VÕRKSIDUMINE",
        fields: [
          { key: "võrgusüsteem", label: "Võrgusüsteem", type: "string" },
          { key: "mahutavus", label: "Mahutavus", type: "string" },
        ]
      },
      kilesse_mähkimine: {
        label: "KILESSE MÄHKIMINE",
        fields: [
          { key: "kilesse_mähkimine", label: "Kilesse mähkimine", type: "string" },
          { key: "mahutavus", label: "Mahutavus", type: "string" },
        ]
      },
      rulli_väljastamine: {
        label: "RULLI VÄLJASTAMINE",
        fields: [
          { key: "rulli_mahapanek", label: "Rulli mahapanek", type: "string" },
          { key: "rullipresside_automaatika", label: "Rullipresside automaatika", type: "string" },
        ]
      },
      jõuvõtuvõll: {
        label: "JÕUVÕTUVÕLL",
        fields: [
          { key: "jvv_turvalisus", label: "JVV turvalisus", type: "string" },
          { key: "pöörlemissagedus_ja_võimsus", label: "Jõuvõtuvõlli pöörlemissagedus ja võimsus", type: "string" },
        ]
      },
      mähkimissüsteem: {
        label: "MÄHKIMISSÜSTEEM",
        fields: [
          { key: "rulli_edastamine", label: "Rulli edastamine", type: "string" },
          { key: "kiletaja_hoovad", label: "Kiletaja hoovad", type: "string" },
          { key: "mahapanek_režiim", label: "Mahapanek režiim", type: "string" },
          { key: "kile_mahutavus", label: "Kile mahutavus", type: "string" },
        ]
      },
      mõõtmed: {
        label: "MÕÕTMED",
        fields: [
          { key: "kaal_kg", label: "Kaal (kg)", type: "number" },
          { key: "laius_mm", label: "Laius (mm)", type: "number" },
          { key: "kõrgus_mm", label: "Kõrgus (mm)", type: "number" },
          { key: "pikkus_mm", label: "Pikkus (mm)", type: "number" },
        ]
      },
      rehvid: {
        label: "REHVID",
        fields: [
          { key: "rehvide_suurus", label: "Rehvide suurus", type: "string" },
        ]
      },
      minimaalne_võimsustarve: {
        label: "MINIMAALNE VÕIMSUSTARVE",
        fields: [
          { key: "kw_hj", label: "kW/hj", type: "string" },
        ]
      },
      hooldus: {
        label: "HOOLDUS",
        fields: [
          { key: "keti_automaatne_määrimine", label: "Keti automaatne määrimine", type: "string" },
          { key: "automaatne_määrimissüsteem", label: "Automaatne määrimissüsteem", type: "string" },
          { key: "pikendatud_määrimisintervalliga_jvv", label: "Pikendatud määrimisintervalliga JVV", type: "string" },
        ]
      },
      isobus: {
        label: "ISOBUS",
        fields: [
          { key: "tüüp", label: "Tüüp", type: "string" },
        ]
      },
      ekraanid: {
        label: "EKRAANID",
        fields: [
          { key: "tüüp", label: "Tüüp", type: "string" },
        ]
      },
      kasutusotstarve: {
        label: "KASUTUSOTSTARVE",
        fields: [
          { key: "hein_silo_põhk", label: "Hein / Silo / Põhk", type: "string" },
          { key: "tööandmete_kogumine", label: "Tööandmete kogumine / Dokumenteerimine", type: "string" },
          { key: "automatiseeritus", label: "Automatiseeritus", type: "string" },
          { key: "niiskuse_andur", label: "Niiskuse andur", type: "string" },
          { key: "kaalusüsteem", label: "Kaalusüsteem", type: "string" },
        ]
      },
    }
  },
};

// Normalize equipment type name to match schema keys
function normalizeTypeName(name: string): string {
  const mapping: Record<string, string> = {
    "combine": "combine",
    "kombain": "combine",
    "telehandler": "telehandler",
    "teleskooplaadur": "telehandler",
    "tractor": "tractor",
    "traktor": "tractor",
    "forage harvester": "forage_harvester",
    "forage_harvester": "forage_harvester",
    "hekseldi": "forage_harvester",
    "wheel loader": "wheel_loader",
    "wheel_loader": "wheel_loader",
    "rataslaadur": "wheel_loader",
    "self-propelled sprayer": "self_propelled_sprayer",
    "self_propelled_sprayer": "self_propelled_sprayer",
    "iseliikuv taimekaitseprits": "self_propelled_sprayer",
    "trailed sprayer": "trailed_sprayer",
    "trailed_sprayer": "trailed_sprayer",
    "järelveetav taimekaitseprits": "trailed_sprayer",
    "round baler": "round_baler",
    "round_baler": "round_baler",
    "ruloonpress": "round_baler",
  };
  const normalized = name.toLowerCase().trim();
  return mapping[normalized] || "combine";
}

function getSchemaForType(equipmentType: string) {
  const key = normalizeTypeName(equipmentType);
  return EQUIPMENT_TYPE_SCHEMAS[key] || EQUIPMENT_TYPE_SCHEMAS["combine"];
}

// Validate extracted numeric values for sanity
function validateAndCleanData(data: Record<string, unknown>, schema: typeof EQUIPMENT_TYPE_SCHEMAS[string]): { cleaned: Record<string, unknown>; warnings: string[] } {
  const warnings: string[] = [];
  const cleaned = JSON.parse(JSON.stringify(data));

  const validationRules: Record<string, { min: number; max: number; label: string }> = {
    engine_power_hp: { min: 10, max: 2000, label: "Mootori võimsus" },
    fuel_consumption_lh: { min: 1, max: 200, label: "Kütusekulu" },
    lift_height_m: { min: 1, max: 30, label: "Tõstekõrgus" },
    lift_reach_m: { min: 1, max: 25, label: "Tõste kaugus" },
    max_lift_capacity_kg: { min: 100, max: 30000, label: "Max tõstevõime" },
    hydraulic_pump_lpm: { min: 10, max: 500, label: "Hüdraulikapump" },
    weight_kg: { min: 500, max: 100000, label: "Kaal" },
    transport_width_mm: { min: 1000, max: 6000, label: "Laius" },
    transport_height_mm: { min: 1000, max: 6000, label: "Kõrgus" },
    transport_length_mm: { min: 1000, max: 15000, label: "Pikkus" },
    fuel_tank_liters: { min: 10, max: 2000, label: "Kütusepaak" },
    grain_tank_liters: { min: 100, max: 20000, label: "Bunker" },
    rotor_diameter_mm: { min: 200, max: 2000, label: "Rootori läbimõõt" },
    rotor_length_mm: { min: 500, max: 5000, label: "Rootori pikkus" },
  };

  if (cleaned.equipment_columns && typeof cleaned.equipment_columns === 'object') {
    for (const [key, value] of Object.entries(cleaned.equipment_columns as Record<string, unknown>)) {
      if (value === null || value === undefined) continue;
      const numVal = Number(value);
      if (typeof value === 'number' || !isNaN(numVal)) {
        if (numVal < 0) {
          warnings.push(`${validationRules[key]?.label || key}: negatiivne väärtus (${numVal}) asendatud null-iga`);
          (cleaned.equipment_columns as Record<string, unknown>)[key] = null;
        } else if (validationRules[key]) {
          const rule = validationRules[key];
          if (numVal < rule.min || numVal > rule.max) {
            warnings.push(`${rule.label}: väärtus ${numVal} väljaspool oodatud vahemikku (${rule.min}-${rule.max}) — kontrollima!`);
          }
        }
      }
    }
  }

  return { cleaned, warnings };
}

// Convert kW to HP if engine_power_hp was given in kW
function applyUnitConversions(data: Record<string, unknown>): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(data));
  
  if (result.equipment_columns && typeof result.equipment_columns === 'object') {
    const cols = result.equipment_columns as Record<string, unknown>;
    
    if (typeof cols.engine_power_hp === 'number') {
      const val = cols.engine_power_hp as number;
      if (result.detailed_specs && typeof result.detailed_specs === 'object') {
        const specs = result.detailed_specs as Record<string, Record<string, unknown>>;
        const motorSpecs = specs.mootor || specs.MOOTOR;
        if (motorSpecs) {
          const powerStr = String(motorSpecs.võimsus_kW_hj || motorSpecs.võimsus_hj || '');
          const hjMatch = powerStr.match(/(\d+(?:[.,]\d+)?)\s*(?:hj|hp|PS)/i);
          if (hjMatch) {
            const hjVal = parseFloat(hjMatch[1].replace(',', '.'));
            if (hjVal > 0 && Math.abs(hjVal - val) > 5) {
              cols.engine_power_hp = Math.round(hjVal);
            }
          }
        }
      }
    }
  }
  
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brochure_id, pdf_content, model_name, equipment_type } = await req.json();

    if (!pdf_content || !model_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: pdf_content, model_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const schema = getSchemaForType(equipment_type || "combine");
    const schemaDescription = buildSchemaDescription(schema);
    
    const normalizedType = normalizeTypeName(equipment_type || "combine");
    console.log('Equipment type:', equipment_type, '-> normalized:', normalizedType);

    const systemPrompt = `Sa oled struktureeritud andmete ekstraheerija, kes on spetsialiseerunud põllumajandustehnika brošüüride analüüsimisele. Sinu ülesanne on analüüsida PDF-brošüüri sisu ja ekstraheerida AINULT konkreetse mudeli "${model_name}" tehnilised näitajad.

KRIITILINE: MITME MUDELI BROŠÜÜRIDE KÄSITLEMINE
Brošüürid sisaldavad sageli MITME mudeli andmeid koos (nt tabelid, kus veergudeks on erinevad mudelid). Sa PEAD:

1. MUDELITE TUVASTAMINE:
   - Skaneeri kogu dokument ja tuvasta KÕIK mainitud mudelid/mudelinimed
   - Otsi mudelite nimesid pealkirjadest, rasvases kirjas tekstist, tabelite veeru- ja reapäistest
   - Mudelid on tüüpiliselt nimetatud nagu: SCORPION 635, SCORPION 741, SCORPION 1033, S7 700, X9 1100 jne

2. MUDELIPÕHINE ANDMETE ERISTAMINE:
   - Ekstraheeri andmed AINULT mudeli "${model_name}" kohta
   - Kui andmed on tabelis, kus veerud = mudelid ja read = parameetrid, loe AINULT õige veeru väärtusi
   - Kui andmed on tekstis, otsi mudeli "${model_name}" nime lähedusest vastavaid väärtusi
   - Ära sega kokku erinevate mudelite andmeid!

3. ÜHIKUTE TEISENDAMINE:
   - Kui mootori võimsus on antud kW-des, teisenda hobujõududeks (1 kW = 1.36 hj) ja kirjuta engine_power_hp väljale HJ väärtus
   - Kui kaal on tonnides, teisenda kilogrammideks
   - Kui mõõtmed on meetrites aga skeem nõuab mm, teisenda millimeetriteks
   - Jäta "võimsus_kW_hj" väljale algne string kujul "XX kW / YY hj"

4. ANDMETE KVALITEET:
   - Ekstraheeri AINULT väärtused, mis on PDF-is selgelt kirjas konkreetse mudeli kohta
   - Ära tee oletusi ega kasuta teiste mudelite andmeid puuduvate väärtuste täitmiseks
   - Kui väärtust ei leidu konkreetselt mudeli "${model_name}" kohta, jäta väli null-iks
   - Negatiivsed väärtused on valed — jäta null
   - Kontrolli, et ühikud vastavad skeemile

5. VASTUSE FORMAAT:
   Vasta JSON objektiga, mis sisaldab kolm osa:
   a) "equipment_columns" — põhinäitajad vastavalt skeemile
   b) "detailed_specs" — detailsed kategooriad vastavalt skeemile
   c) "extraction_metadata" — metainfo:
      - "models_found": string[] — kõik brošüüris tuvastatud mudelite nimed
      - "target_model_found": boolean — kas sihtmudel "${model_name}" leiti brošüürist
      - "confidence": "high" | "medium" | "low" — kui kindel oled andmete õigsuses
      - "warnings": string[] — hoiatused (nt "Mootori võimsus teisendatud kW-st hj-ks", "Mudel leitud kuid andmed osaliselt puudu")

MUDELI NIMI: ${model_name}

EKSTRAHEERITAVATE VÄLJADE SKEEM:
${schemaDescription}

Vasta AINULT kehtiva JSON objektiga. Ära lisa selgitusi ega kommentaare väljaspool JSON-i.`;

    console.log('Calling AI gateway to extract specs for:', model_name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analüüsi järgnevat brošüüri sisu ja ekstraheeri AINULT mudeli "${model_name}" tehnilised andmed. Kui brošüüris on mitu mudelit, eralda hoolikalt just selle mudeli andmed.\n\n${pdf_content.substring(0, 80000)}` }
        ],
        temperature: 0.05,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI gateway error:', response.status, errorData);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Liiga palju päringuid. Proovi mõne minuti pärast uuesti.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI krediit on otsas. Lisa krediiti Lovable seadetes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: `AI extraction failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No content received from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData;
    try {
      extractedData = extractJsonFromResponse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content.substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse extracted data as JSON' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractionMetadata = extractedData.extraction_metadata || {
      models_found: [model_name],
      target_model_found: true,
      confidence: "medium",
      warnings: [],
    };

    extractedData = applyUnitConversions(extractedData);
    const { cleaned, warnings: validationWarnings } = validateAndCleanData(extractedData, schema);
    
    const allWarnings = [
      ...(extractionMetadata.warnings || []),
      ...validationWarnings,
    ];
    
    if (!extractionMetadata.target_model_found) {
      allWarnings.unshift(`Mudelit "${model_name}" ei leitud brošüürist otseselt. Andmed võivad olla ebatäpsed.`);
    }

    const finalData = {
      equipment_columns: (cleaned as Record<string, unknown>).equipment_columns || {},
      detailed_specs: (cleaned as Record<string, unknown>).detailed_specs || {},
    };

    console.log('Extraction metadata:', JSON.stringify(extractionMetadata));
    console.log('Models found in brochure:', extractionMetadata.models_found);
    console.log('Target model found:', extractionMetadata.target_model_found);
    console.log('Confidence:', extractionMetadata.confidence);
    if (allWarnings.length > 0) {
      console.log('Warnings:', allWarnings);
    }
    console.log('Successfully extracted specs for:', model_name);

    // Only update brochure record if brochure_id was provided
    if (brochure_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error: updateError } = await supabase
        .from('equipment_brochures')
        .update({
          extracted_data: {
            ...finalData,
            extraction_metadata: {
              ...extractionMetadata,
              warnings: allWarnings,
            },
          },
          extraction_status: 'completed',
        })
        .eq('id', brochure_id);

      if (updateError) {
        console.error('Failed to update brochure record:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: finalData,
        extraction_metadata: {
          ...extractionMetadata,
          warnings: allWarnings,
        },
        schema
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error extracting specs:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractJsonFromResponse(response: string): unknown {
  // Remove markdown code blocks
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find JSON boundaries
  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) {
    throw new Error('No JSON object found in response');
  }
  
  cleaned = cleaned.substring(jsonStart);

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    // Ignore, try repairs below
  }

  // Fix common issues: trailing commas, control characters
  cleaned = cleaned
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\r' || ch === '\t' ? ch : '');

  try {
    return JSON.parse(cleaned);
  } catch (_e) {
    // Ignore, try truncation repair
  }

  // Handle truncated JSON: close all open braces/brackets
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escape = false;
  
  for (const ch of cleaned) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braceCount++;
    if (ch === '}') braceCount--;
    if (ch === '[') bracketCount++;
    if (ch === ']') bracketCount--;
  }

  // Remove trailing incomplete key-value pairs (e.g. `"key": ` without value)
  cleaned = cleaned.replace(/,?\s*"[^"]*"\s*:\s*$/m, '');
  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*$/, '');

  // Close unclosed brackets/braces
  for (let i = 0; i < bracketCount; i++) cleaned += ']';
  for (let i = 0; i < braceCount; i++) cleaned += '}';

  try {
    return JSON.parse(cleaned);
  } catch (finalError) {
    throw new Error(`JSON repair failed: ${(finalError as Error).message}`);
  }
}

function buildSchemaDescription(schema: typeof EQUIPMENT_TYPE_SCHEMAS[string]): string {
  let description = '{\n  "equipment_columns": {\n';
  
  const columnDescriptions = schema.equipment_columns.map(
    field => `    "${field.key}": ${field.type === 'number' ? 'number | null' : 'string | null'} // ${field.label}`
  );
  description += columnDescriptions.join(',\n');
  description += '\n  },\n  "detailed_specs": {\n';
  
  const categoryDescriptions = Object.entries(schema.detailed_specs_categories).map(
    ([catKey, category]) => {
      const fieldDescs = category.fields.map(
        field => `      "${field.key}": ${field.type === 'number' ? 'number | null' : field.type === 'boolean' ? 'boolean | null' : 'string | null'} // ${field.label}`
      );
      return `    "${catKey}": { // ${category.label}\n${fieldDescs.join(',\n')}\n    }`;
    }
  );
  description += categoryDescriptions.join(',\n');
  description += '\n  },\n  "extraction_metadata": {\n';
  description += '    "models_found": string[], // kõik brošüüris tuvastatud mudelid\n';
  description += '    "target_model_found": boolean, // kas sihtmudel leiti\n';
  description += '    "confidence": "high" | "medium" | "low",\n';
  description += '    "warnings": string[] // hoiatused ja märkused\n';
  description += '  }\n}';
  
  return description;
}
