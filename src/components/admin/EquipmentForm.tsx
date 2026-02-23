import { useState, useEffect, useMemo, useCallback } from "react";
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
import { COMMON_FIELDS, type FieldGroup, type FieldConfig } from "@/lib/equipmentTypeFields";
import { getColumnToSpecsMapping, getSpecsToColumnMapping } from "@/lib/fieldSyncMapping";
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

    // Controlled values for form fields that overlap with DetailedSpecs
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    // Get selected type object
    const selectedType = useMemo(() => {
      return types.find((t) => t.id === selectedTypeId);
    }, [types, selectedTypeId]);

    // Sync mappings based on selected type
    const columnToSpecs = useMemo(
      () => getColumnToSpecsMapping(selectedType?.name),
      [selectedType?.name]
    );
    const specsToColumn = useMemo(
      () => getSpecsToColumnMapping(selectedType?.name),
      [selectedType?.name]
    );

    // Get set of field names that have a JSONB counterpart (need to be controlled)
    const syncedFieldNames = useMemo(
      () => new Set(Object.keys(columnToSpecs)),
      [columnToSpecs]
    );

    // Initialize form values from equipment
    useEffect(() => {
      if (equipment) {
        const values: Record<string, string> = {};
        for (const group of COMMON_FIELDS) {
          for (const field of group.fields) {
            const val = equipment[field.name as keyof Equipment];
            values[field.name] = val != null ? String(val) : "";
          }
        }
        setFormValues(values);
      } else {
        setFormValues({});
      }
    }, [equipment]);

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

    // Handle form field change with sync to DetailedSpecs
    const handleFormFieldChange = useCallback(
      (fieldName: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));

        // Sync to detailed specs if mapping exists
        const loc = columnToSpecs[fieldName];
        if (loc) {
          const normalized = value.replace(/,/g, ".");
          const parsed = normalized === "" ? null : isNaN(Number(normalized)) ? normalized : Number(normalized);
          setDetailedSpecs((prev) => {
            const prevObj = (prev || {}) as Record<string, Record<string, unknown>>;
            return {
              ...prevObj,
              [loc.category]: {
                ...(prevObj[loc.category] || {}),
                [loc.field]: parsed,
              },
            };
          });
        }
      },
      [columnToSpecs]
    );

    // Handle DetailedSpecs change with sync to form fields
    const handleDetailedSpecsChange = useCallback(
      (updatedSpecs: Record<string, unknown>) => {
        setDetailedSpecs(updatedSpecs);

        // Check if any changed spec maps back to a form field
        const specsObj = updatedSpecs as Record<string, Record<string, unknown>>;
        const newFormValues: Record<string, string> = {};
        for (const [compositeKey, colName] of Object.entries(specsToColumn)) {
          const [cat, field] = compositeKey.split(".");
          const val = specsObj[cat]?.[field];
          if (val !== undefined) {
            newFormValues[colName] = val != null ? String(val) : "";
          }
        }
        if (Object.keys(newFormValues).length > 0) {
          setFormValues((prev) => ({ ...prev, ...newFormValues }));
        }
      },
      [specsToColumn]
    );

    // Smart filtering: Get brands that have equipment of the selected type
    const filteredBrands = useMemo(() => {
      if (!selectedTypeId) {
        return brands;
      }
      const brandIdsWithType = new Set(
        allEquipment
          .filter((e) => e.equipment_type_id === selectedTypeId)
          .map((e) => e.brand_id)
      );
      if (brandIdsWithType.size === 0) {
        return brands;
      }
      return brands.filter((b) => brandIdsWithType.has(b.id));
    }, [brands, selectedTypeId, allEquipment]);

    // Get dynamic fields based on selected type
    // Only show COMMON_FIELDS (Põhiandmed + Majandusandmed), not type-specific fields
    const fieldGroups = useMemo(() => {
      if (selectedType?.name === "round_baler") {
        // Hide engine_power_hp and fuel_consumption_lh for round balers
        const hiddenFields = new Set(["engine_power_hp", "fuel_consumption_lh"]);
        return COMMON_FIELDS.map(group => ({
          ...group,
          fields: group.fields.filter(f => !hiddenFields.has(f.name)),
        })).filter(group => group.fields.length > 0);
      }
      return COMMON_FIELDS;
    }, [selectedType?.name]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     const formData = new FormData(e.currentTarget);
     onSubmit(formData, imageUrl, threshingImageUrl, detailedSpecs);
   };
 
    // Render field based on config
    const renderField = (field: FieldConfig) => {
      const isSynced = syncedFieldNames.has(field.name);
      const controlledValue = formValues[field.name];
      const defaultVal = equipment?.[field.name as keyof Equipment];
      
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea
              name={field.name}
              id={field.name}
              placeholder={field.placeholder}
              defaultValue={defaultVal != null ? String(defaultVal) : ""}
            />
          ) : isSynced ? (
            <Input
              name={field.name}
              id={field.name}
              type={field.type}
              step={field.step}
              placeholder={field.placeholder}
              value={controlledValue ?? ""}
              onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
            />
          ) : (
            <Input
              name={field.name}
              id={field.name}
              type={field.type}
              step={field.step}
              placeholder={field.placeholder}
              defaultValue={defaultVal != null ? String(defaultVal) : ""}
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
          {selectedType?.name !== "telehandler" && selectedType?.name !== "round_baler" && selectedType?.name !== "self_propelled_sprayer" && selectedType?.name !== "trailed_sprayer" && (
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
 
        {/* Common fields (Põhiandmed + Majandusandmed) */}
        {fieldGroups.length > 0 && (
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
             onChange={handleDetailedSpecsChange}
             equipmentTypeName={selectedType.name}
           />
         )}
  
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Salvestan..." : "Salvesta"}
        </Button>
      </form>
    );
  }