 import { useState, useCallback, useEffect } from "react";
 import { getCategoryOrderForType } from "@/lib/pdfSpecsHelpers";
 import { useQueryClient } from "@tanstack/react-query";
 import { Layout } from "@/components/layout/Layout";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import {
   useEquipment,
   useBrands,
   usePowerClasses,
   useEquipmentTypes,
   useCompetitiveArguments,
   useCreateEquipment,
   useUpdateEquipment,
   useDeleteEquipment,
   useCreateArgument,
   useUpdateArgument,
   useDeleteArgument,
   useMyths,
   useCreateMyth,
   useUpdateMyth,
   useDeleteMyth,
 } from "@/hooks/useEquipmentData";
 import { Plus, Trash2, Tractor, MessageSquare, Pencil, MessageSquareWarning, Wallet, Wrench, CloudSun, TrendingDown, Users, ChevronRight, Clock, HelpCircle } from "lucide-react";
 import { StaffUsersManagement } from "@/components/admin/StaffUsersManagement";
 import { useToast } from "@/hooks/use-toast";
 import { Badge } from "@/components/ui/badge";
 import type { Equipment, CompetitiveArgument, Myth } from "@/types/equipment";
 import { BrochureUpload, type ExtractedData } from "@/components/admin/BrochureUpload";
 import { BrochureDataReview } from "@/components/admin/BrochureDataReview";
 import { EquipmentList } from "@/components/admin/EquipmentList";
 import { EquipmentForm } from "@/components/admin/EquipmentForm";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuthContext } from "@/contexts/AuthContext";
 import { getBrandTextColor } from "@/lib/brandColors";
 import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useTranslation } from "react-i18next";
import { getTranslation } from "@/lib/i18nHelpers";
 
const MYTH_CATEGORIES = [
   { value: "uncertainty", label: "Ebakindlus ja ajastus", icon: Clock },
   { value: "finance", label: "Finantsid ja rahastus", icon: Wallet },
   { value: "machines", label: "Masinad ja konkurents", icon: Wrench },
   { value: "costs", label: "Turuhinnad ja sisendkulud", icon: TrendingDown },
   { value: "weather", label: "Ilm ja saagitingimused", icon: CloudSun },
   { value: "other", label: "Muud argumendid", icon: HelpCircle },
];

// Argument category translations
const ARGUMENT_CATEGORIES: Record<string, string> = {
  technology: "Tehnoloogia",
  performance: "Jõudlus",
  fuel: "Kütusesääst",
  efficiency: "Tõhusus",
  automation: "Automatiseerimine",
  precision: "Täppispõllumajandus",
  comfort: "Mugavus",
  service: "Teenindus",
  value: "Väärtus",
  general: "Üldine",
};

function getCategoryLabel(category: string): string {
  return ARGUMENT_CATEGORIES[category] || category;
}

const SUPPORTED_LANGS = ["et","en","de","fi","sv","da","no","pl","lv","lt"] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];
 
 export default function Admin() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canManageUsers } = useAuthContext();
  const flags = useFeatureFlags();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [argumentDialogOpen, setArgumentDialogOpen] = useState(false);
  const [mythDialogOpen, setMythDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingArgument, setEditingArgument] = useState<CompetitiveArgument | null>(null);
  const [editingMyth, setEditingMyth] = useState<Myth | null>(null);
  const [brochureDialogOpen, setBrochureDialogOpen] = useState(false);
  const [brochureEquipment, setBrochureEquipment] = useState<Equipment | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [pendingBrochureUrl, setPendingBrochureUrl] = useState<string>("");
  const [pendingBrochureFilename, setPendingBrochureFilename] = useState<string>("");
  const [isSavingBrochureData, setIsSavingBrochureData] = useState(false);
  const [argumentTypeFilter, setArgumentTypeFilter] = useState<string>("all");
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [openArgBrands, setOpenArgBrands] = useState<Set<string>>(new Set());
  const [mythLang, setMythLang] = useState<SupportedLang>("et");
  const [argLang, setArgLang] = useState<SupportedLang>("et");
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
 
   const { data: equipment = [] } = useEquipment();
   const { data: brands = [] } = useBrands();
   const { data: powerClasses = [] } = usePowerClasses();
   const { data: types = [] } = useEquipmentTypes();
   const { data: args = [] } = useCompetitiveArguments();
   const { data: myths = [] } = useMyths();
 
   const createEquipment = useCreateEquipment();
   const updateEquipment = useUpdateEquipment();
   const deleteEquipment = useDeleteEquipment();
   const createArgument = useCreateArgument();
   const updateArgument = useUpdateArgument();
   const deleteArgument = useDeleteArgument();
   const createMyth = useCreateMyth();
   const updateMyth = useUpdateMyth();
   const deleteMyth = useDeleteMyth();
 
  // Reset language tab when dialogs open/close
  useEffect(() => { setMythLang("et"); }, [mythDialogOpen]);
  useEffect(() => { setArgLang("et"); }, [argumentDialogOpen]);

  const combineType = types.find((t) => t.name === "combine");
  const defaultTypeId = combineType?.id || types[0]?.id || "";
   // Equipment form submit handler
   const handleEquipmentFormSubmit = useCallback(
     async (formData: FormData, imageUrl: string, threshingImageUrl: string, detailedSpecs: Record<string, unknown>) => {
       const parseNum = (key: string) => {
         const val = formData.get(key);
         if (!val || val === "") return null;
         const num = Number(val);
         return isNaN(num) ? null : num;
       };
 
       const equipmentData = {
         equipment_type_id: formData.get("equipment_type_id") as string,
         brand_id: formData.get("brand_id") as string,
         power_class_id: (formData.get("power_class_id") as string) || null,
         model_name: formData.get("model_name") as string,
         engine_power_hp: parseNum("engine_power_hp"),
         grain_tank_liters: parseNum("grain_tank_liters"),
         header_width_m: parseNum("header_width_m"),
         weight_kg: parseNum("weight_kg"),
         fuel_consumption_lh: parseNum("fuel_consumption_lh"),
         price_eur: parseNum("price_eur"),
         annual_maintenance_eur: parseNum("annual_maintenance_eur"),
         expected_lifespan_years: parseNum("expected_lifespan_years") || 10,
         notes: (formData.get("notes") as string) || null,
         data_source_url: (formData.get("data_source_url") as string) || null,
         image_url: imageUrl || null,
         threshing_system_image_url: threshingImageUrl || null,
         fuel_tank_liters: parseNum("fuel_tank_liters"),
         cleaning_area_m2: parseNum("cleaning_area_m2"),
         rotor_diameter_mm: parseNum("rotor_diameter_mm"),
         throughput_tons_h: parseNum("throughput_tons_h"),
         engine_displacement_liters: parseNum("engine_displacement_liters"),
         engine_cylinders: parseNum("engine_cylinders"),
         max_torque_nm: parseNum("max_torque_nm"),
         feeder_width_mm: parseNum("feeder_width_mm"),
         rasp_bar_count: parseNum("rasp_bar_count"),
         threshing_drum_diameter_mm: parseNum("threshing_drum_diameter_mm"),
         threshing_drum_width_mm: parseNum("threshing_drum_width_mm"),
         threshing_area_m2: parseNum("threshing_area_m2"),
         rotor_length_mm: parseNum("rotor_length_mm"),
         separator_area_m2: parseNum("separator_area_m2"),
         straw_walker_count: parseNum("straw_walker_count"),
         straw_walker_area_m2: parseNum("straw_walker_area_m2"),
         sieve_area_m2: parseNum("sieve_area_m2"),
         unloading_rate_ls: parseNum("unloading_rate_ls"),
         auger_reach_m: parseNum("auger_reach_m"),
         chopper_width_mm: parseNum("chopper_width_mm"),
         max_slope_percent: parseNum("max_slope_percent"),
         transport_width_mm: parseNum("transport_width_mm"),
         transport_height_mm: parseNum("transport_height_mm"),
         transport_length_mm: parseNum("transport_length_mm"),
         header_width_min_m: parseNum("header_width_min_m"),
         header_width_max_m: parseNum("header_width_max_m"),
         lift_height_m: parseNum("lift_height_m"),
         lift_reach_m: parseNum("lift_reach_m"),
         max_lift_capacity_kg: parseNum("max_lift_capacity_kg"),
         hydraulic_pump_lpm: parseNum("hydraulic_pump_lpm"),
         detailed_specs: Object.keys(detailedSpecs).length > 0 ? detailedSpecs : (editingEquipment?.detailed_specs || {}),
       };
 
      setIsSavingEquipment(true);
        try {
          if (editingEquipment) {
            await updateEquipment.mutateAsync({ id: editingEquipment.id, ...equipmentData });
            toast({ title: t("admin.equipmentUpdated") });
          } else {
            await createEquipment.mutateAsync({ ...equipmentData, features: [] });
            toast({ title: t("admin.equipmentAdded") });
          }
          setEquipmentDialogOpen(false);
          setEditingEquipment(null);
       } catch (error) {
         console.error("Equipment save error:", error);
         toast({
           title: "Viga",
           description: error instanceof Error ? error.message : (editingEquipment ? t("admin.equipmentUpdateFailed") : t("admin.equipmentAddFailed")),
           variant: "destructive",
         });
       } finally {
         setIsSavingEquipment(false);
       }
     },
    [editingEquipment, updateEquipment, createEquipment, toast]
   );
 
   const handleArgumentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
 
     // Collect translations from all language-specific form fields
     const argTranslations: Record<string, Record<string, string>> = {};
     ["et","en","de","fi","sv","da","no","pl","lv","lt"].forEach((l) => {
       const title = formData.get(`argument_title_${l}`) as string || "";
       const prob = formData.get(`problem_text_${l}`) as string || "";
       const sol = formData.get(`solution_text_${l}`) as string || "";
       const ben = formData.get(`benefit_text_${l}`) as string || "";
       if (title || sol) argTranslations[l] = { argument_title: title, problem_text: prob, solution_text: sol, benefit_text: ben };
     });
 
     const argumentData = {
      competitor_brand_id: formData.get("competitor_brand_id") as string,
      equipment_type_id: formData.get("equipment_type_id") as string || defaultTypeId,
       argument_title: formData.get("argument_title_et") as string || "",
       argument_description: formData.get("solution_text_et") as string || "",
       category: formData.get("category") as string,
       sort_order: editingArgument?.sort_order ?? 0,
       problem_text: (formData.get("problem_text_et") as string) || null,
       solution_text: (formData.get("solution_text_et") as string) || null,
       benefit_text: (formData.get("benefit_text_et") as string) || null,
       icon_name: formData.get("icon_name") as string || "Lightbulb",
       translations: argTranslations,
     };
 
     try {
       if (editingArgument) {
         await updateArgument.mutateAsync({ id: editingArgument.id, ...argumentData });
         toast({ title: t("admin.argumentUpdated") });
       } else {
         await createArgument.mutateAsync(argumentData);
         toast({ title: t("admin.argumentAdded") });
       }
        setArgumentDialogOpen(false);
        setEditingArgument(null);
     } catch (error) {
       toast({
         title: "Viga",
         description: editingArgument ? t("admin.argumentUpdateFailed") : t("admin.argumentAddFailed"),
         variant: "destructive",
       });
     }
   };
 
   const openEditEquipment = (item: Equipment) => {
     setEditingEquipment(item);
     setEquipmentDialogOpen(true);
   };
 
   const openEditArgument = (arg: CompetitiveArgument) => {
     setEditingArgument(arg);
     setArgumentDialogOpen(true);
   };
 
   const openEditMyth = (myth: Myth) => {
     setEditingMyth(myth);
     setMythDialogOpen(true);
   };
 
  const closeEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setEditingEquipment(null);
  };

  const closeArgumentDialog = () => {
    setArgumentDialogOpen(false);
    setEditingArgument(null);
  };

  const closeMythDialog = () => {
    setMythDialogOpen(false);
    setEditingMyth(null);
  };
 
   const openBrochureDialog = (item: Equipment) => {
     setBrochureEquipment(item);
     setExtractedData(null);
     setBrochureDialogOpen(true);
   };
 
  const closeBrochureDialog = () => {
    setBrochureDialogOpen(false);
    setBrochureEquipment(null);
    setExtractedData(null);
    setPendingBrochureUrl("");
    setPendingBrochureFilename("");
  };
 
  const handleExtractionComplete = (data: ExtractedData, brochureUrl: string, originalFilename: string) => {
    setExtractedData(data);
    setPendingBrochureUrl(brochureUrl);
    setPendingBrochureFilename(originalFilename);
  };
 
    const handleConfirmBrochureData = async (data: ExtractedData) => {
      if (!brochureEquipment) return;

      setIsSavingBrochureData(true);
      try {
        // Integer columns in the equipment table - values must be rounded
        const integerColumns = new Set([
          "engine_power_hp", "grain_tank_liters", "weight_kg", "price_eur",
          "annual_maintenance_eur", "expected_lifespan_years", "fuel_tank_liters",
          "rotor_diameter_mm", "engine_cylinders", "max_torque_nm", "feeder_width_mm",
          "rasp_bar_count", "threshing_drum_diameter_mm", "threshing_drum_width_mm",
          "rotor_length_mm", "straw_walker_count", "chopper_width_mm", "max_slope_percent",
          "transport_width_mm", "transport_height_mm", "transport_length_mm",
          "max_lift_capacity_kg", "hydraulic_pump_lpm", "unloading_rate_ls",
        ]);

        const columnUpdates: Record<string, unknown> = {};
        if (data.equipment_columns) {
          Object.entries(data.equipment_columns).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== "") {
              if (integerColumns.has(key) && typeof value === "number") {
                columnUpdates[key] = Math.round(value);
              } else {
                columnUpdates[key] = value;
              }
            }
          });
        }

        const existingSpecs = (brochureEquipment.detailed_specs as Record<string, unknown>) || {};
        const mergedSpecs = { ...existingSpecs };
        
        if (data.detailed_specs) {
          Object.entries(data.detailed_specs).forEach(([category, fields]) => {
            if (typeof fields === "object" && fields !== null) {
              const existingCategory = (mergedSpecs[category] as Record<string, unknown>) || {};
              const updatedCategory = { ...existingCategory };
              
              Object.entries(fields as Record<string, unknown>).forEach(([field, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                  updatedCategory[field] = value;
                }
              });
              
              mergedSpecs[category] = updatedCategory;
            }
          });
        }

        // Also map equipment_columns into detailed_specs categories
        // so all technical data appears in the DetailedSpecsEditor table
        const columnToSpecMap: Record<string, { category: string; field: string }> = {
          engine_power_hp: { category: "mootor", field: "võimsus_hj" },
          engine_displacement_liters: { category: "mootor", field: "töömaht_l" },
          engine_cylinders: { category: "mootor", field: "silindrid" },
          max_torque_nm: { category: "mootor", field: "max_pöördemoment_nm" },
          fuel_tank_liters: { category: "mootor", field: "kütusepaak_l" },
          grain_tank_liters: { category: "terapunker", field: "maht_l" },
          unloading_rate_ls: { category: "terapunker", field: "tühjenduskiirus_ls" },
          auger_reach_m: { category: "terapunker", field: "tigu_ulatus_m" },
          rotor_diameter_mm: { category: "peksusüsteem", field: "rootori_läbimõõt_mm" },
          rotor_length_mm: { category: "peksusüsteem", field: "rootori_pikkus_mm" },
          feeder_width_mm: { category: "kaldtransportöör_etteanne", field: "etteande_laius_mm" },
          threshing_drum_diameter_mm: { category: "peksusüsteem", field: "trumli_läbimõõt_mm" },
          threshing_drum_width_mm: { category: "peksusüsteem", field: "trumli_laius_mm" },
          threshing_area_m2: { category: "peksusüsteem", field: "peksupindala_m2" },
          separator_area_m2: { category: "peksusüsteem", field: "separeerimispind_m2" },
          straw_walker_count: { category: "peksusüsteem", field: "õlekõndijad" },
          straw_walker_area_m2: { category: "peksusüsteem", field: "õlekõndija_pind_m2" },
          cleaning_area_m2: { category: "puhastussüsteem", field: "puhastuspind_m2" },
          sieve_area_m2: { category: "puhastussüsteem", field: "sõelapind_m2" },
          chopper_width_mm: { category: "koristusjääkide_käitlemine", field: "heksli_laius_mm" },
          rasp_bar_count: { category: "peksusüsteem", field: "raspi_latid" },
          transport_width_mm: { category: "mõõtmed", field: "transpordi_laius_mm" },
          transport_height_mm: { category: "mõõtmed", field: "transpordi_kõrgus_mm" },
          transport_length_mm: { category: "mõõtmed", field: "transpordi_pikkus_mm" },
          weight_kg: { category: "mõõtmed", field: "kaal_kg" },
          max_slope_percent: { category: "nõlvakusüsteem", field: "max_kalle_pct" },
          header_width_min_m: { category: "heedrid", field: "min_laius_m" },
          header_width_max_m: { category: "heedrid", field: "max_laius_m" },
          throughput_tons_h: { category: "mootor", field: "läbilaskevõime_th" },
          // Telehandler
          lift_height_m: { category: "tõsteomadused", field: "tõstekõrgus_m" },
          lift_reach_m: { category: "tõsteomadused", field: "tõste_kaugus_m" },
          max_lift_capacity_kg: { category: "tõsteomadused", field: "max_tõstevõime_kg" },
          hydraulic_pump_lpm: { category: "hüdraulika", field: "pump_lpm" },
        };

        if (data.equipment_columns) {
          Object.entries(data.equipment_columns).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== "") {
              const mapping = columnToSpecMap[key];
              if (mapping) {
                const cat = (mergedSpecs[mapping.category] as Record<string, unknown>) || {};
                cat[mapping.field] = value;
                mergedSpecs[mapping.category] = cat;
              }
            }
          });
        }

        // Filter mergedSpecs to only keep categories allowed for this equipment type
        const equipmentTypeName = brochureEquipment.equipment_type?.name || "combine";
        const allowedCats = new Set(getCategoryOrderForType(equipmentTypeName));
        const filteredSpecs: Record<string, unknown> = {};
        for (const [catKey, catVal] of Object.entries(mergedSpecs)) {
          if (allowedCats.has(catKey)) {
            filteredSpecs[catKey] = catVal;
          }
        }

       const { error } = await supabase
         .from("equipment")
         .update({
           ...columnUpdates,
           detailed_specs: filteredSpecs as unknown as Record<string, never>,
         })
         .eq("id", brochureEquipment.id);
 
       if (error) throw error;
 
       // Create brochure record only on confirmation
       if (pendingBrochureUrl) {
         await supabase
           .from("equipment_brochures")
           .insert({
             equipment_id: brochureEquipment.id,
             brochure_url: pendingBrochureUrl,
             original_filename: pendingBrochureFilename,
             extraction_status: "completed",
             extracted_data: data as unknown as Record<string, never>,
             applied_at: new Date().toISOString(),
           });
       }
 
       toast({
         title: t("admin.dataSaved"),
         description: t("admin.dataUpdated", { model: brochureEquipment.model_name }),
       });
 
        closeBrochureDialog();
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
     } catch (error) {
       console.error("Failed to save brochure data:", error);
       toast({
         title: "Viga",
         description: t("admin.dataSaveFailed"),
         variant: "destructive",
       });
     } finally {
       setIsSavingBrochureData(false);
     }
   };
 
   const handleMythSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);

     // Build translations object from all language fields
     const translations: Record<string, Record<string, string>> = {};
     SUPPORTED_LANGS.forEach((l) => {
       const myth = formData.get(`myth_${l}`) as string || "";
       const reality = formData.get(`reality_${l}`) as string || "";
       const advantage = formData.get(`advantage_${l}`) as string || "";
       if (myth || reality || advantage) translations[l] = { myth, reality, advantage };
     });

     const mythData = {
       category: formData.get("category") as string,
       myth: formData.get("myth_et") as string || "",
       reality: formData.get("reality_et") as string || "",
       advantage: formData.get("advantage_et") as string || "",
       sort_order: Number(formData.get("sort_order")) || 0,
       translations,
     };
 
     try {
       if (editingMyth) {
         await updateMyth.mutateAsync({ id: editingMyth.id, ...mythData });
         toast({ title: t("admin.mythUpdated") });
       } else {
         await createMyth.mutateAsync(mythData);
         toast({ title: t("admin.mythAdded") });
       }
       closeMythDialog();
     } catch (error) {
       toast({
         title: "Viga",
         description: editingMyth ? t("admin.mythUpdateFailed") : t("admin.mythAddFailed"),
         variant: "destructive",
       });
     }
   };
 
   const mythsByCategory = MYTH_CATEGORIES.map(cat => ({
     ...cat,
     myths: myths.filter(m => m.category === cat.value),
   }));
 
   const competitorBrands = brands.filter((b) => !b.is_primary);
 
   return (
     <Layout>
       <div className="space-y-8">
          <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
            <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
            <p className="mt-2 text-primary-foreground/80">
              {t("admin.description")}
            </p>
          </div>
 
         <Tabs defaultValue="equipment" className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="w-auto">
                <TabsTrigger value="equipment" className="gap-2">
                  <Tractor className="h-4 w-4" />
                  {t("admin.tabEquipment")}
                </TabsTrigger>
                {flags.enableArguments && (
                  <TabsTrigger value="arguments" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t("admin.tabArguments")}
                  </TabsTrigger>
                )}
                {flags.enableMyths && (
                  <TabsTrigger value="myths" className="gap-2">
                    <MessageSquareWarning className="h-4 w-4" />
                    {t("admin.tabMyths")}
                  </TabsTrigger>
                )}
              </TabsList>
              {canManageUsers && (
                <TabsList className="w-auto bg-primary/10">
                  <TabsTrigger
                    value="users"
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Users className="h-4 w-4" />
                    {t("admin.tabUsers")}
                  </TabsTrigger>
                </TabsList>
              )}
            </div>
 
           {/* Equipment Tab */}
           <TabsContent value="equipment" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">{t("admin.equipmentList")}</h2>
               <Dialog open={equipmentDialogOpen} onOpenChange={(open) => {
                 if (!open) closeEquipmentDialog();
                 else setEquipmentDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingEquipment(null)}>
                     <Plus className="h-4 w-4" />
                     {t("admin.addEquipment")}
                   </Button>
                 </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingEquipment ? t("admin.editEquipment") : t("admin.newEquipment")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
                      <EquipmentForm
                        equipment={editingEquipment}
                        brands={brands}
                        powerClasses={powerClasses}
                        types={types}
                        allEquipment={equipment}
                        onSubmit={handleEquipmentFormSubmit}
                        isSubmitting={isSavingEquipment}
                      />
                    </div>
                  </DialogContent>
               </Dialog>
             </div>
 
             <EquipmentList
               equipment={equipment}
               brands={brands}
               types={types}
               onEdit={openEditEquipment}
               onBrochure={flags.enableBrochureUpload ? openBrochureDialog : undefined}
               onDelete={(id) => deleteEquipment.mutate(id)}
             />
           </TabsContent>
 
           {/* Arguments Tab */}
           {flags.enableArguments && <TabsContent value="arguments" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">{t("admin.competitiveAdvantages")}</h2>
               <Dialog open={argumentDialogOpen} onOpenChange={(open) => {
                 if (!open) closeArgumentDialog();
                 else setArgumentDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingArgument(null)}>
                     <Plus className="h-4 w-4" />
                     {t("admin.addArgument")}
                   </Button>
                 </DialogTrigger>
                  <DialogContent key={editingArgument?.id ?? "new-arg"} onCloseAutoFocus={(e) => e.preventDefault()}>
                   <DialogHeader>
                     <DialogTitle>
                       {editingArgument ? t("admin.editArgument") : t("admin.newArgument")}
                     </DialogTitle>
                   </DialogHeader>
                    <form onSubmit={handleArgumentSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.equipmentType")}</Label>
                          <Select name="equipment_type_id" required defaultValue={editingArgument?.equipment_type_id || defaultTypeId}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.selectEquipmentType")} />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {getTranslation(type.name_translations, lang, type.name_et)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.competitor")}</Label>
                          <Select name="competitor_brand_id" required defaultValue={editingArgument?.competitor_brand_id}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.selectCompetitor")} />
                            </SelectTrigger>
                            <SelectContent>
                              {competitorBrands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("admin.category")}</Label>
                          <Select name="category" defaultValue={editingArgument?.category || "technology"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">{t("advantage.category.technology")}</SelectItem>
                              <SelectItem value="performance">{t("advantage.category.performance")}</SelectItem>
                              <SelectItem value="fuel">{t("advantage.category.fuel")}</SelectItem>
                              <SelectItem value="efficiency">{t("advantage.category.efficiency")}</SelectItem>
                              <SelectItem value="automation">{t("advantage.category.automation")}</SelectItem>
                              <SelectItem value="precision">{t("advantage.category.precision")}</SelectItem>
                              <SelectItem value="comfort">{t("advantage.category.comfort")}</SelectItem>
                              <SelectItem value="service">{t("advantage.category.service")}</SelectItem>
                              <SelectItem value="value">{t("advantage.category.value")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("admin.iconName")}</Label>
                          <Select name="icon_name" defaultValue={editingArgument?.icon_name || "Lightbulb"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lightbulb">{t("iconLabel.Lightbulb")}</SelectItem>
                              <SelectItem value="Fuel">{t("iconLabel.Fuel")}</SelectItem>
                              <SelectItem value="Zap">{t("iconLabel.Zap")}</SelectItem>
                              <SelectItem value="Wrench">{t("iconLabel.Wrench")}</SelectItem>
                              <SelectItem value="TrendingUp">{t("iconLabel.TrendingUp")}</SelectItem>
                              <SelectItem value="Shield">{t("iconLabel.Shield")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Language tabs for translatable fields */}
                      <div className="flex gap-1 flex-wrap border-b pb-2">
                        {SUPPORTED_LANGS.map((l) => (
                          <button key={l} type="button" onClick={() => setArgLang(l)}
                            className={`px-2 py-1 text-xs rounded uppercase font-mono ${argLang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                      {SUPPORTED_LANGS.map((l) => (
                        <div key={l} style={{ display: argLang === l ? "block" : "none" }} className="space-y-3">
                          <div className="space-y-2">
                            <Label>{t("admin.titleField")} ({l.toUpperCase()})</Label>
                            <Input name={`argument_title_${l}`} required={l === "et"}
                              placeholder={l === "et" ? "nt. ActiveYield automaatika" : ""}
                              defaultValue={l === "et" ? (editingArgument?.argument_title || "") : (editingArgument?.translations?.[l]?.argument_title || "")} />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.problemField")} ({l.toUpperCase()})</Label>
                            <Textarea name={`problem_text_${l}`} rows={2}
                              placeholder={l === "et" ? "Kirjelda kliendi probleem" : ""}
                              defaultValue={l === "et" ? (editingArgument?.problem_text || "") : (editingArgument?.translations?.[l]?.problem_text || "")} />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.jdSolution")} ({l.toUpperCase()})</Label>
                            <Textarea name={`solution_text_${l}`} rows={3} required={l === "et"}
                              placeholder={l === "et" ? "Kirjelda John Deere tehnoloogia lahendust" : ""}
                              defaultValue={l === "et" ? (editingArgument?.solution_text || editingArgument?.argument_description || "") : (editingArgument?.translations?.[l]?.solution_text || "")} />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("admin.customerBenefit")} ({l.toUpperCase()})</Label>
                            <Input name={`benefit_text_${l}`}
                              placeholder={l === "et" ? "nt '+3€/ha sääst'" : ""}
                              defaultValue={l === "et" ? (editingArgument?.benefit_text || "") : (editingArgument?.translations?.[l]?.benefit_text || "")} />
                          </div>
                        </div>
                      ))}
 
                     <Button type="submit" className="w-full" disabled={createArgument.isPending || updateArgument.isPending}>
                       {createArgument.isPending || updateArgument.isPending ? t("admin.saving") : t("common.save")}
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
              </div>

              {/* Equipment type filter */}
              <div className="flex items-center gap-4">
                <Label className="text-sm text-muted-foreground">{t("admin.filterByType")}</Label>
                <Select value={argumentTypeFilter} onValueChange={setArgumentTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Kõik tüübid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("admin.allTypes")}</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {getTranslation(type.name_translations, lang, type.name_et)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {args.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {t("admin.argsEmpty")}
                </div>
              ) : (
                <div className="space-y-8">
                  {types
                    .filter((type) => argumentTypeFilter === "all" || type.id === argumentTypeFilter)
                    .map((type) => {
                      const typeArgs = args.filter((arg) => arg.equipment_type_id === type.id);
                      if (typeArgs.length === 0) return null;

                      return (
                        <div key={type.id} className="space-y-4">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <Tractor className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">{getTranslation(type.name_translations, lang, type.name_et)}</h3>
                            <Badge variant="outline" className="ml-auto">{t("admin.argCount", { count: typeArgs.length })}</Badge>
                          </div>

                          {/* Group by competitor brand within each type - collapsible */}
                          {competitorBrands.map((brand) => {
                            const brandArgs = typeArgs.filter((arg) => arg.competitor_brand_id === brand.id);
                            if (brandArgs.length === 0) return null;
                            const brandKey = `${type.id}-${brand.id}`;
                            const isBrandOpen = openArgBrands.has(brandKey);

                            return (
                              <div key={brand.id} className="space-y-2 pl-4 border-l-2 border-muted">
                                <button
                                  className="flex w-full items-center gap-2 text-left hover:bg-accent/30 rounded-md p-2 transition-colors"
                                  onClick={() => setOpenArgBrands((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(brandKey)) next.delete(brandKey);
                                    else next.add(brandKey);
                                    return next;
                                  })}
                                >
                                  <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isBrandOpen ? "rotate-90" : ""}`} />
                                  <h4 className="font-medium">vs <span className={getBrandTextColor(brand.name)}>{brand.name}</span></h4>
                                  <Badge variant="secondary" className="text-xs">{brandArgs.length}</Badge>
                                </button>

                                {isBrandOpen && (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-2">
                                  {brandArgs.map((arg) => (
                                    <div key={arg.id} className="rounded-lg border border-border bg-card p-4 relative group">
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEditArgument(arg)}>
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteArgument.mutate(arg.id)}>
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                      <Badge variant="secondary" className="text-xs mb-2">{getCategoryLabel(arg.category)}</Badge>
                                      <h4 className="font-semibold mb-2">{arg.argument_title}</h4>
                                      {arg.problem_text && (
                                        <p className="text-xs text-destructive mb-1">
                                          <span className="font-medium">{t("admin.argProblem")}</span> {arg.problem_text}
                                        </p>
                                      )}
                                      <p className="text-sm text-muted-foreground mb-1">
                                        <span className="font-medium text-primary">{t("admin.argSolution")}</span> {arg.solution_text || arg.argument_description}
                                      </p>
                                      {arg.benefit_text && (
                                        <p className="text-sm font-medium text-success">
                                          <span>{t("admin.argBenefit")}</span> {arg.benefit_text}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                </div>
              )}
           </TabsContent>}

           {/* Myths Tab */}
           {flags.enableMyths && <TabsContent value="myths" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">{t("admin.mythsManagement")}</h2>
               <Dialog open={mythDialogOpen} onOpenChange={(open) => {
                 if (!open) closeMythDialog();
                 else setMythDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingMyth(null)}>
                     <Plus className="h-4 w-4" />
                     {t("admin.addMyth")}
                   </Button>
                 </DialogTrigger>
                 <DialogContent key={editingMyth?.id ?? "new-myth"} onCloseAutoFocus={(e) => e.preventDefault()}>
                   <DialogHeader>
                     <DialogTitle>
                       {editingMyth ? t("admin.editMyth") : t("admin.newMyth")}
                     </DialogTitle>
                   </DialogHeader>
                   <form onSubmit={handleMythSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>{t("admin.category")}</Label>
                         <Select name="category" required defaultValue={editingMyth?.category}>
                           <SelectTrigger>
                             <SelectValue placeholder={t("admin.selectCategory")} />
                           </SelectTrigger>
                           <SelectContent>
                             {MYTH_CATEGORIES.map((cat) => (
                               <SelectItem key={cat.value} value={cat.value}>
                                 {t(`myths.category.${cat.value}`)}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="sort_order">{t("admin.sortOrder")}</Label>
                         <Input name="sort_order" type="number" defaultValue={editingMyth?.sort_order ?? 0} />
                       </div>
                     </div>
 
                     {/* Language tabs */}
                     <div className="flex gap-1 flex-wrap border-b pb-2">
                       {SUPPORTED_LANGS.map((l) => (
                         <button key={l} type="button" onClick={() => setMythLang(l)}
                           className={`px-2 py-1 text-xs rounded uppercase font-mono ${mythLang === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                           {l}
                         </button>
                       ))}
                     </div>
                     {SUPPORTED_LANGS.map((l) => (
                       <div key={l} style={{ display: mythLang === l ? "block" : "none" }} className="space-y-4">
                         <div className="space-y-2">
                           <Label>{t("admin.mythField")} ({l.toUpperCase()})</Label>
                           <Textarea name={`myth_${l}`} rows={2} required={l === "et"}
                             defaultValue={l === "et" ? (editingMyth?.myth || "") : (editingMyth?.translations?.[l]?.myth || "")}
                             placeholder={l === "et" ? "Kirjelda levinud müüti..." : ""} />
                         </div>
                         <div className="space-y-2">
                           <Label>{t("admin.realityField")} ({l.toUpperCase()})</Label>
                           <Textarea name={`reality_${l}`} rows={2} required={l === "et"}
                             defaultValue={l === "et" ? (editingMyth?.reality || "") : (editingMyth?.translations?.[l]?.reality || "")}
                             placeholder={l === "et" ? "Kirjelda tegelikku olukorda..." : ""} />
                         </div>
                         <div className="space-y-2">
                           <Label>{t("admin.jdAdvantage")} ({l.toUpperCase()})</Label>
                           <Textarea name={`advantage_${l}`} rows={2} required={l === "et"}
                             defaultValue={l === "et" ? (editingMyth?.advantage || "") : (editingMyth?.translations?.[l]?.advantage || "")}
                             placeholder={l === "et" ? "Kirjelda John Deere eelist..." : ""} />
                         </div>
                       </div>
                     ))}
 
                     <Button type="submit" className="w-full" disabled={createMyth.isPending || updateMyth.isPending}>
                       {createMyth.isPending || updateMyth.isPending ? t("admin.saving") : t("common.save")}
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
             </div>
 
             {myths.length === 0 ? (
               <div className="text-center text-muted-foreground py-8">
                 {t("admin.mythsEmpty")}
               </div>
             ) : (
               <div className="space-y-6">
                 {mythsByCategory.map((cat) => {
                   if (cat.myths.length === 0) return null;
                   const Icon = cat.icon;
                   
                   return (
                     <div key={cat.value} className="space-y-3">
                       <div className="flex items-center gap-2">
                         <Icon className="h-5 w-5 text-primary" />
                         <h3 className="font-semibold text-lg">{t(`myths.category.${cat.value}`)}</h3>
                         <Badge variant="secondary" className="ml-auto">{cat.myths.length}</Badge>
                       </div>
                       
                       <div className="grid gap-4 md:grid-cols-2">
                         {cat.myths.map((myth) => (
                           <div key={myth.id} className="rounded-lg border border-border bg-card p-4 relative group">
                             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                               <Button variant="ghost" size="icon" onClick={() => openEditMyth(myth)}>
                                 <Pencil className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => deleteMyth.mutate(myth.id)}>
                                 <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                             </div>
                             <div className="space-y-2">
                               <div>
                                 <span className="text-xs font-medium text-destructive">{t("admin.mythLabel")}</span>
                                 <p className="text-sm font-semibold">{myth.myth}</p>
                               </div>
                               <div>
                                 <span className="text-xs font-medium text-primary">{t("admin.realityLabel")}</span>
                                 <p className="text-sm text-muted-foreground">{myth.reality}</p>
                               </div>
                               <div>
                                 <span className="text-xs font-medium text-success">{t("admin.jdAdvantageLabel")}</span>
                                 <p className="text-sm">{myth.advantage}</p>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </TabsContent>}

           {/* Users Tab */}
           {canManageUsers && (
             <TabsContent value="users">
               <StaffUsersManagement />
             </TabsContent>
           )}
         </Tabs>
 
         {/* Brochure Upload Dialog */}
         <Dialog open={brochureDialogOpen} onOpenChange={(open) => {
           if (!open) closeBrochureDialog();
         }}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
             <DialogHeader>
               <DialogTitle>
                 {t("admin.uploadBrochure")}: {brochureEquipment?.model_name}
               </DialogTitle>
             </DialogHeader>
             {brochureEquipment && !extractedData && (
               <BrochureUpload
                 equipment={brochureEquipment}
                 onExtractionComplete={handleExtractionComplete}
               />
             )}
             {extractedData && (
               <BrochureDataReview
                 equipment={brochureEquipment!}
                 extractedData={extractedData}
                 onConfirm={handleConfirmBrochureData}
                 onCancel={() => setExtractedData(null)}
                 isLoading={isSavingBrochureData}
               />
             )}
           </DialogContent>
         </Dialog>
       </div>
     </Layout>
   );
 }