 import { useState, useEffect, useMemo } from "react";
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
 import { ImageUpload } from "./ImageUpload";
 import { DetailedSpecsEditor } from "./DetailedSpecsEditor";
 import { EquipmentBrochuresList } from "./EquipmentBrochuresList";
 import { getFieldsForEquipmentType, type FieldGroup, type FieldConfig } from "@/lib/equipmentTypeFields";
 import type { Equipment, Brand, PowerClass, EquipmentType } from "@/types/equipment";
 import { cn } from "@/lib/utils";
 
 interface EquipmentFormProps {
   equipment?: Equipment | null;
   brands: Brand[];
   powerClasses: PowerClass[];
   types: EquipmentType[];
   allEquipment: Equipment[]; // For smart filtering
   onSubmit: (data: FormData, imageUrl: string, threshingImageUrl: string, detailedSpecs: Record<string, unknown>) => void;
   isSubmitting: boolean;
 }
 
 export function EquipmentForm({
   equipment,
   brands,
   powerClasses,
   types,
   allEquipment,
   onSubmit,
   isSubmitting,
 }: EquipmentFormProps) {
   // Track selected type for dynamic field display and smart filtering
   const [selectedTypeId, setSelectedTypeId] = useState<string>(equipment?.equipment_type_id || "");
   const [selectedBrandId, setSelectedBrandId] = useState<string>(equipment?.brand_id || "");
   const [imageUrl, setImageUrl] = useState<string>(equipment?.image_url || "");
   const [threshingImageUrl, setThreshingImageUrl] = useState<string>(equipment?.threshing_system_image_url || "");
   const [detailedSpecs, setDetailedSpecs] = useState<Record<string, unknown>>(
     (equipment?.detailed_specs as Record<string, unknown>) || {}
   );
 
   // Reset brand when type changes (only for new equipment)
   useEffect(() => {
     if (!equipment && selectedTypeId) {
       setSelectedBrandId("");
     }
   }, [selectedTypeId, equipment]);
 
   // Sync state when editing equipment changes
   useEffect(() => {
     if (equipment) {
       setSelectedTypeId(equipment.equipment_type_id);
       setSelectedBrandId(equipment.brand_id);
       setImageUrl(equipment.image_url || "");
       setThreshingImageUrl(equipment.threshing_system_image_url || "");
       setDetailedSpecs((equipment.detailed_specs as Record<string, unknown>) || {});
     } else {
       // Reset all when adding new
       setSelectedTypeId("");
       setSelectedBrandId("");
       setImageUrl("");
       setThreshingImageUrl("");
       setDetailedSpecs({});
     }
   }, [equipment]);
 
   // Get selected type object
   const selectedType = useMemo(() => {
     return types.find((t) => t.id === selectedTypeId);
   }, [types, selectedTypeId]);
 
   // Smart filtering: Get brands that have equipment of the selected type
   const filteredBrands = useMemo(() => {
     if (!selectedTypeId || equipment) {
       // When editing or no type selected, show all brands
       return brands;
     }
     
     // Get unique brand IDs that have equipment of this type
     const brandIdsWithType = new Set(
       allEquipment
         .filter((e) => e.equipment_type_id === selectedTypeId)
         .map((e) => e.brand_id)
     );
     
     // If no existing equipment of this type, show all brands
     if (brandIdsWithType.size === 0) {
       return brands;
     }
     
     return brands.filter((b) => brandIdsWithType.has(b.id));
   }, [brands, selectedTypeId, allEquipment, equipment]);
 
   // Get dynamic fields based on selected type
   const fieldGroups = useMemo(() => {
     if (!selectedType) return [];
    return getFieldsForEquipmentType(selectedType.name);
  }, [selectedType]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     onSubmit(formData, imageUrl, threshingImageUrl, detailedSpecs);
   };
 
   // Render field based on config
   const renderField = (field: FieldConfig) => {
     const value = equipment?.[field.name as keyof Equipment];
     
     return (
       <div key={field.name} className="space-y-2">
         <Label htmlFor={field.name}>{field.label}</Label>
         {field.type === "textarea" ? (
           <Textarea
             name={field.name}
             id={field.name}
             placeholder={field.placeholder}
             defaultValue={value != null ? String(value) : ""}
           />
         ) : (
           <Input
             name={field.name}
             id={field.name}
             type={field.type}
             step={field.step}
             placeholder={field.placeholder}
             defaultValue={value != null ? String(value) : ""}
           />
         )}
       </div>
     );
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-6">
       {/* Type and Brand selectors */}
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="equipment_type_id">Tehnika tüüp *</Label>
           <Select
             name="equipment_type_id"
             required
             value={selectedTypeId}
             onValueChange={setSelectedTypeId}
           >
             <SelectTrigger>
               <SelectValue placeholder="Vali tüüp" />
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
           <Label htmlFor="brand_id">Bränd *</Label>
           <Select
             name="brand_id"
             required
             value={selectedBrandId}
             onValueChange={setSelectedBrandId}
             disabled={!selectedTypeId}
           >
             <SelectTrigger className={cn(!selectedTypeId && "opacity-50 cursor-not-allowed")}>
               <SelectValue placeholder={selectedTypeId ? "Vali bränd" : "Vali esmalt tüüp"} />
             </SelectTrigger>
             <SelectContent>
               {filteredBrands.map((brand) => (
                 <SelectItem key={brand.id} value={brand.id}>
                   {brand.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       {/* Model name and power class */}
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="model_name">Mudeli nimi *</Label>
           <Input
             name="model_name"
             required
             placeholder="nt. S780"
             defaultValue={equipment?.model_name || ""}
           />
         </div>
          {selectedType?.name !== "telehandler" && (
            <div className="space-y-2">
              <Label htmlFor="power_class_id">Jõuklass</Label>
              <Select
                name="power_class_id"
                defaultValue={equipment?.power_class_id || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vali jõuklass" />
                </SelectTrigger>
                <SelectContent>
                  {powerClasses.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id}>
                      {pc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
       </div>
 
       {/* Dynamic fields based on equipment type */}
       {selectedType && fieldGroups.length > 0 && (
         <div className="space-y-6">
           {fieldGroups.map((group: FieldGroup) => (
             <div key={group.title} className="space-y-3">
               <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-1">
                 {group.title}
               </h4>
               <div className="grid grid-cols-3 gap-4">
                 {group.fields.map((field) => renderField(field))}
               </div>
             </div>
           ))}
         </div>
       )}
 
       {/* Images */}
       <div className="grid grid-cols-2 gap-4">
         <ImageUpload
           name="image_url"
           label="Toote pilt"
           currentImageUrl={imageUrl || undefined}
           onImageUploaded={setImageUrl}
           folder="equipment"
         />
          {selectedType?.name?.toLowerCase() === "combine" && (
            <ImageUpload
              name="threshing_system_image_url"
              label="Peksusüsteemi pilt"
              currentImageUrl={threshingImageUrl || undefined}
              onImageUploaded={setThreshingImageUrl}
              folder="threshing"
            />
          )}
       </div>
 
       {/* Data source URL */}
       <div className="space-y-2">
         <Label htmlFor="data_source_url">Andmete allikas (URL)</Label>
         <Input
           name="data_source_url"
           type="url"
           placeholder="https://..."
           defaultValue={equipment?.data_source_url || ""}
         />
       </div>
 
       {/* Notes */}
       <div className="space-y-2">
         <Label htmlFor="notes">Märkused</Label>
         <Textarea
           name="notes"
           placeholder="Lisamärkused..."
           defaultValue={equipment?.notes || ""}
         />
       </div>
 
        {/* Brochures - only for existing equipment */}
        {equipment && <EquipmentBrochuresList equipment={equipment} />}

        {/* Detailed specs editor - always show when type is selected */}
        {selectedType && (
          <DetailedSpecsEditor
            equipment={equipment}
            initialSpecs={detailedSpecs}
            onChange={setDetailedSpecs}
            equipmentTypeName={selectedType.name}
          />
        )}
 
       <Button type="submit" className="w-full" disabled={isSubmitting}>
         {isSubmitting ? "Salvestan..." : "Salvesta"}
       </Button>
     </form>
   );
 }