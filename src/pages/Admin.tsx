 import { useState, useCallback } from "react";
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
 import { Plus, Trash2, Tractor, MessageSquare, Pencil, MessageSquareWarning, Wallet, Wrench, CloudSun, TrendingUp, Users, ChevronRight } from "lucide-react";
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
 
 const MYTH_CATEGORIES = [
   { value: "finance", label: "Finantsid ja investeeringud", icon: Wallet },
   { value: "tech", label: "Tehnika ja töökindlus", icon: Wrench },
   { value: "weather", label: "Ilm, saagikus ja juhtimine", icon: CloudSun },
   { value: "market", label: "Turg ja konkurents", icon: TrendingUp },
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
 
 export default function Admin() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { canManageUsers } = useAuthContext();
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
            toast({ title: "Tehnika uuendatud!" });
          } else {
            await createEquipment.mutateAsync({ ...equipmentData, features: [] });
            toast({ title: "Tehnika lisatud!" });
          }
          setEquipmentDialogOpen(false);
          setEditingEquipment(null);
       } catch (error) {
         console.error("Equipment save error:", error);
         toast({
           title: "Viga",
           description: error instanceof Error ? error.message : (editingEquipment ? "Tehnika uuendamine ebaõnnestus" : "Tehnika lisamine ebaõnnestus"),
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
 
     const problemText = formData.get("problem_text") as string;
     const solutionText = formData.get("solution_text") as string;
     const benefitText = formData.get("benefit_text") as string;
 
     const argumentData = {
      competitor_brand_id: formData.get("competitor_brand_id") as string,
      equipment_type_id: formData.get("equipment_type_id") as string || defaultTypeId,
       argument_title: formData.get("argument_title") as string,
       argument_description: solutionText || "",
       category: formData.get("category") as string,
       sort_order: editingArgument?.sort_order ?? 0,
       problem_text: problemText || null,
       solution_text: solutionText || null,
       benefit_text: benefitText || null,
       icon_name: formData.get("icon_name") as string || "Lightbulb",
     };
 
     try {
       if (editingArgument) {
         await updateArgument.mutateAsync({ id: editingArgument.id, ...argumentData });
         toast({ title: "Argument uuendatud!" });
       } else {
         await createArgument.mutateAsync(argumentData);
         toast({ title: "Argument lisatud!" });
       }
       setArgumentDialogOpen(false);
       setEditingArgument(null);
     } catch (error) {
       toast({
         title: "Viga",
         description: editingArgument ? "Argumendi uuendamine ebaõnnestus" : "Argumendi lisamine ebaõnnestus",
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
 
       const { error } = await supabase
         .from("equipment")
         .update({
           ...columnUpdates,
           detailed_specs: mergedSpecs as unknown as Record<string, never>,
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
         title: "Andmed salvestatud!",
         description: `${brochureEquipment.model_name} tehnilised andmed on uuendatud.`,
       });
 
        closeBrochureDialog();
        queryClient.invalidateQueries({ queryKey: ["equipment"] });
     } catch (error) {
       console.error("Failed to save brochure data:", error);
       toast({
         title: "Viga",
         description: "Andmete salvestamine ebaõnnestus",
         variant: "destructive",
       });
     } finally {
       setIsSavingBrochureData(false);
     }
   };
 
   const handleMythSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
 
     const mythData = {
       category: formData.get("category") as string,
       myth: formData.get("myth") as string,
       reality: formData.get("reality") as string,
       advantage: formData.get("advantage") as string,
       sort_order: Number(formData.get("sort_order")) || 0,
     };
 
     try {
       if (editingMyth) {
         await updateMyth.mutateAsync({ id: editingMyth.id, ...mythData });
         toast({ title: "Müüt uuendatud!" });
       } else {
         await createMyth.mutateAsync(mythData);
         toast({ title: "Müüt lisatud!" });
       }
       closeMythDialog();
     } catch (error) {
       toast({
         title: "Viga",
         description: editingMyth ? "Müüdi uuendamine ebaõnnestus" : "Müüdi lisamine ebaõnnestus",
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
            <h1 className="text-3xl font-bold">Administreerimine</h1>
            <p className="mt-2 text-primary-foreground/80">
              Halda tehnikaid, konkurentsieeliseid ja müüte.
            </p>
          </div>
 
         <Tabs defaultValue="equipment" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <TabsList className="w-auto">
                <TabsTrigger value="equipment" className="gap-2">
                  <Tractor className="h-4 w-4" />
                  Tehnika
                </TabsTrigger>
                <TabsTrigger value="arguments" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Argumendid
                </TabsTrigger>
              </TabsList>
              <TabsList className="w-auto">
                <TabsTrigger value="myths" className="gap-2">
                  <MessageSquareWarning className="h-4 w-4" />
                  Müüdid
                </TabsTrigger>
                {canManageUsers && (
                  <TabsTrigger 
                    value="users" 
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Users className="h-4 w-4" />
                    Kasutajad
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
 
           {/* Equipment Tab */}
           <TabsContent value="equipment" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">Tehnika nimekiri</h2>
               <Dialog open={equipmentDialogOpen} onOpenChange={(open) => {
                 if (!open) closeEquipmentDialog();
                 else setEquipmentDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingEquipment(null)}>
                     <Plus className="h-4 w-4" />
                     Lisa tehnika
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                   <DialogHeader>
                     <DialogTitle>
                       {editingEquipment ? "Muuda tehnikat" : "Lisa uus tehnika"}
                     </DialogTitle>
                   </DialogHeader>
                   <EquipmentForm
                     equipment={editingEquipment}
                     brands={brands}
                     powerClasses={powerClasses}
                     types={types}
                     allEquipment={equipment}
                     onSubmit={handleEquipmentFormSubmit}
                     isSubmitting={isSavingEquipment}
                   />
                 </DialogContent>
               </Dialog>
             </div>
 
             <EquipmentList
               equipment={equipment}
               brands={brands}
               types={types}
               onEdit={openEditEquipment}
               onBrochure={openBrochureDialog}
               onDelete={(id) => deleteEquipment.mutate(id)}
             />
           </TabsContent>
 
           {/* Arguments Tab */}
           <TabsContent value="arguments" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">Konkurentsieelised</h2>
               <Dialog open={argumentDialogOpen} onOpenChange={(open) => {
                 if (!open) closeArgumentDialog();
                 else setArgumentDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingArgument(null)}>
                     <Plus className="h-4 w-4" />
                     Lisa argument
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>
                       {editingArgument ? "Muuda argumenti" : "Lisa uus argument"}
                     </DialogTitle>
                   </DialogHeader>
                    <form onSubmit={handleArgumentSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tehnika tüüp</Label>
                          <Select name="equipment_type_id" required defaultValue={editingArgument?.equipment_type_id || defaultTypeId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vali tehnika tüüp" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name_et}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Konkurent</Label>
                          <Select name="competitor_brand_id" required defaultValue={editingArgument?.competitor_brand_id}>
                            <SelectTrigger>
                              <SelectValue placeholder="Vali konkurent" />
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
                          <Label>Kategooria</Label>
                          <Select name="category" defaultValue={editingArgument?.category || "technology"}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Tehnoloogia</SelectItem>
                              <SelectItem value="performance">Jõudlus</SelectItem>
                              <SelectItem value="fuel">Kütusesääst</SelectItem>
                              <SelectItem value="efficiency">Tõhusus</SelectItem>
                              <SelectItem value="automation">Automatiseerimine</SelectItem>
                              <SelectItem value="precision">Täppispõllumajandus</SelectItem>
                              <SelectItem value="comfort">Mugavus</SelectItem>
                              <SelectItem value="service">Teenindus</SelectItem>
                              <SelectItem value="value">Väärtus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="argument_title">Pealkiri</Label>
                          <Input name="argument_title" required placeholder="nt. ActiveYield automaatika" defaultValue={editingArgument?.argument_title} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="icon_name">Ikooni nimi</Label>
                        <Select name="icon_name" defaultValue={editingArgument?.icon_name || "Lightbulb"}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lightbulb">Lambipirn (Tehnoloogia)</SelectItem>
                            <SelectItem value="Fuel">Kütus</SelectItem>
                            <SelectItem value="Zap">Välk (Jõudlus)</SelectItem>
                            <SelectItem value="Wrench">Mutrivõti (Hooldus)</SelectItem>
                            <SelectItem value="TrendingUp">Trend üles (Kasum)</SelectItem>
                            <SelectItem value="Shield">Kilp (Kvaliteet)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="problem_text">Probleem</Label>
                       <Textarea name="problem_text" placeholder="Kirjelda kliendi probleem" rows={2} defaultValue={editingArgument?.problem_text || ""} />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="solution_text">John Deere lahendus</Label>
                       <Textarea name="solution_text" required placeholder="Kirjelda John Deere tehnoloogia lahendust" rows={3} defaultValue={editingArgument?.solution_text || editingArgument?.argument_description || ""} />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="benefit_text">Kasu kliendile</Label>
                       <Input name="benefit_text" placeholder="nt '+3€/ha sääst'" defaultValue={editingArgument?.benefit_text || ""} />
                     </div>
 
                     <Button type="submit" className="w-full" disabled={createArgument.isPending || updateArgument.isPending}>
                       {createArgument.isPending || updateArgument.isPending ? "Salvestan..." : "Salvesta"}
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
              </div>

              {/* Equipment type filter */}
              <div className="flex items-center gap-4">
                <Label className="text-sm text-muted-foreground">Filtreeri tehnika tüübi järgi:</Label>
                <Select value={argumentTypeFilter} onValueChange={setArgumentTypeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Kõik tüübid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kõik tüübid</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name_et}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {args.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Argumente pole veel lisatud
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
                            <h3 className="font-semibold text-lg">{type.name_et}</h3>
                            <Badge variant="outline" className="ml-auto">{typeArgs.length} argumenti</Badge>
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
                                          <span className="font-medium">Probleem:</span> {arg.problem_text}
                                        </p>
                                      )}
                                      <p className="text-sm text-muted-foreground mb-1">
                                        <span className="font-medium text-primary">Lahendus:</span> {arg.solution_text || arg.argument_description}
                                      </p>
                                      {arg.benefit_text && (
                                        <p className="text-sm font-medium text-success">
                                          <span>Kasu:</span> {arg.benefit_text}
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
           </TabsContent>
 
           {/* Myths Tab */}
           <TabsContent value="myths" className="space-y-4">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold">Müütide haldamine</h2>
               <Dialog open={mythDialogOpen} onOpenChange={(open) => {
                 if (!open) closeMythDialog();
                 else setMythDialogOpen(true);
               }}>
                 <DialogTrigger asChild>
                   <Button className="gap-2" onClick={() => setEditingMyth(null)}>
                     <Plus className="h-4 w-4" />
                     Lisa müüt
                   </Button>
                 </DialogTrigger>
                 <DialogContent>
                   <DialogHeader>
                     <DialogTitle>
                       {editingMyth ? "Muuda müüti" : "Lisa uus müüt"}
                     </DialogTitle>
                   </DialogHeader>
                   <form onSubmit={handleMythSubmit} className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label>Kategooria</Label>
                         <Select name="category" required defaultValue={editingMyth?.category}>
                           <SelectTrigger>
                             <SelectValue placeholder="Vali kategooria" />
                           </SelectTrigger>
                           <SelectContent>
                             {MYTH_CATEGORIES.map((cat) => (
                               <SelectItem key={cat.value} value={cat.value}>
                                 {cat.label}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="sort_order">Järjekord</Label>
                         <Input name="sort_order" type="number" defaultValue={editingMyth?.sort_order ?? 0} />
                       </div>
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="myth">Müüt</Label>
                       <Textarea name="myth" required placeholder="Kirjelda levinud müüti..." rows={2} defaultValue={editingMyth?.myth || ""} />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="reality">Tegelikkus</Label>
                       <Textarea name="reality" required placeholder="Kirjelda tegelikku olukorda..." rows={2} defaultValue={editingMyth?.reality || ""} />
                     </div>
 
                     <div className="space-y-2">
                       <Label htmlFor="advantage">John Deere eelis</Label>
                       <Textarea name="advantage" required placeholder="Kirjelda John Deere eelist..." rows={2} defaultValue={editingMyth?.advantage || ""} />
                     </div>
 
                     <Button type="submit" className="w-full" disabled={createMyth.isPending || updateMyth.isPending}>
                       {createMyth.isPending || updateMyth.isPending ? "Salvestan..." : "Salvesta"}
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
             </div>
 
             {myths.length === 0 ? (
               <div className="text-center text-muted-foreground py-8">
                 Müüte pole veel lisatud
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
                         <h3 className="font-semibold text-lg">{cat.label}</h3>
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
                                 <span className="text-xs font-medium text-destructive">MÜÜT:</span>
                                 <p className="text-sm">{myth.myth}</p>
                               </div>
                               <div>
                                 <span className="text-xs font-medium text-primary">TEGELIKKUS:</span>
                                 <p className="text-sm text-muted-foreground">{myth.reality}</p>
                               </div>
                               <div>
                                 <span className="text-xs font-medium text-success">JOHN DEERE EELIS:</span>
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
           </TabsContent>
 
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
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>
                 Laadi üles brošüür: {brochureEquipment?.model_name}
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