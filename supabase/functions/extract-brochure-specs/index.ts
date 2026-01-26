import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the equipment schema fields that can be extracted from brochures
const EXTRACTABLE_FIELDS = {
  // Standard equipment table columns
  equipment_columns: [
    { key: "engine_power_hp", label: "Mootori võimsus (hj)", type: "number" },
    { key: "engine_displacement_liters", label: "Mootori töömaht (l)", type: "number" },
    { key: "engine_cylinders", label: "Silindrite arv", type: "number" },
    { key: "max_torque_nm", label: "Max pöördemoment (Nm)", type: "number" },
    { key: "fuel_tank_liters", label: "Kütusepaagi maht (l)", type: "number" },
    { key: "grain_tank_liters", label: "Viljabunkri maht (l)", type: "number" },
    { key: "unloading_rate_ls", label: "Tühjenduskiirus (l/s)", type: "number" },
    { key: "auger_reach_m", label: "Tigu ulatus (m)", type: "number" },
    { key: "cleaning_area_m2", label: "Puhastusala (m²)", type: "number" },
    { key: "sieve_area_m2", label: "Sõelapind (m²)", type: "number" },
    { key: "rotor_diameter_mm", label: "Rootori läbimõõt (mm)", type: "number" },
    { key: "rotor_length_mm", label: "Rootori pikkus (mm)", type: "number" },
    { key: "separator_area_m2", label: "Separaatori pind (m²)", type: "number" },
    { key: "feeder_width_mm", label: "Etteande laius (mm)", type: "number" },
    { key: "threshing_drum_diameter_mm", label: "Pekstrulli läbimõõt (mm)", type: "number" },
    { key: "threshing_drum_width_mm", label: "Pekstrulli laius (mm)", type: "number" },
    { key: "threshing_area_m2", label: "Pekspind (m²)", type: "number" },
    { key: "weight_kg", label: "Kaal (kg)", type: "number" },
    { key: "transport_width_mm", label: "Transpordi laius (mm)", type: "number" },
    { key: "transport_height_mm", label: "Transpordi kõrgus (mm)", type: "number" },
    { key: "header_width_min_m", label: "Heedri laius min (m)", type: "number" },
    { key: "header_width_max_m", label: "Heedri laius max (m)", type: "number" },
    { key: "max_slope_percent", label: "Max nõlv (%)", type: "number" },
    { key: "throughput_tons_h", label: "Läbilaskevõime (t/h)", type: "number" },
    { key: "straw_walker_count", label: "Õlgkõndijate arv", type: "number" },
    { key: "straw_walker_area_m2", label: "Õlgkõndijate pind (m²)", type: "number" },
    { key: "chopper_width_mm", label: "Hekseldi laius (mm)", type: "number" },
    { key: "rasp_bar_count", label: "Raspi latide arv", type: "number" },
  ],
  // Detailed specs JSONB categories with their fields
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
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brochure_id, pdf_content, model_name } = await req.json();

    if (!brochure_id || !pdf_content || !model_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: brochure_id, pdf_content, model_name' }),
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

    // Build the extraction prompt with exact schema
    const schemaDescription = buildSchemaDescription();
    
    const systemPrompt = `Sa oled struktureeritud andmete ekstraheerija. Sinu ülesanne on analüüsida PDF-brošüüri sisu ja ekstraheerida AINULT need tehnilised näitajad, mis vastavad etteantud skeemile.

REEGLID:
1. Ekstraheeri AINULT väärtused, mis on PDF-is selgelt kirjas
2. Ära tee ümberarvutusi ega oletusi
3. Säilita täpsed ühikud ja väärtused nagu PDF-is
4. Kui väärtust ei leidu, jäta väli tühjaks (null)
5. Ära lisa uusi näitajaid, mida skeemis pole
6. Vastus peab olema kehtiv JSON objekt

MUDELI NIMI: ${model_name}

EKSTRAHEERITAVATE VÄLJADE SKEEM:
${schemaDescription}

Vasta AINULT kehtiva JSON objektiga, mis vastab täpselt skeemile. Ära lisa selgitusi ega kommentaare.`;

    console.log('Calling AI gateway to extract specs for:', model_name);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analüüsi järgnevat brošüüri sisu ja ekstraheeri tehnilised andmed mudeli "${model_name}" kohta:\n\n${pdf_content}` }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI gateway error:', errorData);
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

    // Parse the JSON response
    let extractedData;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse extracted data as JSON' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the brochure record with extracted data
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabase
      .from('equipment_brochures')
      .update({
        extracted_data: extractedData,
        extraction_status: 'completed',
      })
      .eq('id', brochure_id);

    if (updateError) {
      console.error('Failed to update brochure record:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save extracted data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted specs for:', model_name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        schema: EXTRACTABLE_FIELDS 
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

function buildSchemaDescription(): string {
  let description = '{\n  "equipment_columns": {\n';
  
  // Equipment columns
  const columnDescriptions = EXTRACTABLE_FIELDS.equipment_columns.map(
    field => `    "${field.key}": ${field.type === 'number' ? 'number | null' : 'string | null'} // ${field.label}`
  );
  description += columnDescriptions.join(',\n');
  description += '\n  },\n  "detailed_specs": {\n';
  
  // Detailed specs categories
  const categoryDescriptions = Object.entries(EXTRACTABLE_FIELDS.detailed_specs_categories).map(
    ([catKey, category]) => {
      const fieldDescs = category.fields.map(
        field => `      "${field.key}": ${field.type === 'number' ? 'number | null' : field.type === 'boolean' ? 'boolean | null' : 'string | null'} // ${field.label}`
      );
      return `    "${catKey}": { // ${category.label}\n${fieldDescs.join(',\n')}\n    }`;
    }
  );
  description += categoryDescriptions.join(',\n');
  description += '\n  }\n}';
  
  return description;
}
