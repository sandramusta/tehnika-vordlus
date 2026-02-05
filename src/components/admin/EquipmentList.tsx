 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
 } from "@/components/ui/collapsible";
 import { ChevronRight, Pencil, FileText, Trash2 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import type { Equipment, Brand, EquipmentType } from "@/types/equipment";
 
 function getBrandTextColor(brandName: string): string {
   switch (brandName) {
     case "John Deere":
       return "text-john-deere";
     case "Claas":
       return "text-claas";
     case "Case IH":
       return "text-case-ih";
     case "New Holland":
       return "text-new-holland";
     case "Fendt":
       return "text-fendt";
     default:
       return "text-foreground";
   }
 }
 
 interface EquipmentListProps {
   equipment: Equipment[];
   brands: Brand[];
   types: EquipmentType[];
   onEdit: (item: Equipment) => void;
   onBrochure: (item: Equipment) => void;
   onDelete: (id: string) => void;
 }
 
 export function EquipmentList({
   equipment,
   brands,
   types,
   onEdit,
   onBrochure,
   onDelete,
 }: EquipmentListProps) {
   const [openTypes, setOpenTypes] = useState<Set<string>>(new Set());
   const [openBrands, setOpenBrands] = useState<Set<string>>(new Set());
 
   const toggleType = (typeId: string) => {
     setOpenTypes((prev) => {
       const next = new Set(prev);
       if (next.has(typeId)) {
         next.delete(typeId);
       } else {
         next.add(typeId);
       }
       return next;
     });
   };
 
   const toggleBrand = (key: string) => {
     setOpenBrands((prev) => {
       const next = new Set(prev);
       if (next.has(key)) {
         next.delete(key);
       } else {
         next.add(key);
       }
       return next;
     });
   };
 
   // Group equipment by type, then by brand
   const equipmentByType = types
     .map((type) => {
       const typeEquipment = equipment.filter((e) => e.equipment_type_id === type.id);
       if (typeEquipment.length === 0) return null;
 
       // Sort brands: John Deere first, then others
       const johnDeereBrand = brands.find((b) => b.name === "John Deere");
       const otherBrands = brands.filter((b) => b.name !== "John Deere");
       const sortedBrands = johnDeereBrand ? [johnDeereBrand, ...otherBrands] : otherBrands;
 
       const byBrand = sortedBrands
         .map((brand) => ({
           brand,
           items: typeEquipment.filter((e) => e.brand_id === brand.id),
         }))
         .filter((group) => group.items.length > 0);
 
       return {
         type,
         totalCount: typeEquipment.length,
         byBrand,
       };
     })
     .filter(Boolean) as {
       type: EquipmentType;
       totalCount: number;
       byBrand: { brand: Brand; items: Equipment[] }[];
     }[];
 
   if (equipmentByType.length === 0) {
     return (
       <div className="text-center text-muted-foreground py-8 border border-border rounded-lg">
         Tehnikaid pole veel lisatud
       </div>
     );
   }
 
   return (
     <div className="space-y-2">
       {equipmentByType.map(({ type, totalCount, byBrand }) => {
         const isTypeOpen = openTypes.has(type.id);
 
         return (
           <Collapsible
             key={type.id}
             open={isTypeOpen}
             onOpenChange={() => toggleType(type.id)}
           >
             <CollapsibleTrigger asChild>
               <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left hover:bg-accent/50 transition-colors">
                 <ChevronRight
                   className={cn(
                     "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                     isTypeOpen && "rotate-90"
                   )}
                 />
                 <span className="font-semibold text-lg flex-1">{type.name_et}</span>
                 <Badge variant="secondary">{totalCount} mudelit</Badge>
               </button>
             </CollapsibleTrigger>
             <CollapsibleContent>
               <div className="ml-4 mt-2 space-y-2 border-l-2 border-border pl-4">
                 {byBrand.map(({ brand, items }) => {
                   const brandKey = `${type.id}-${brand.id}`;
                   const isBrandOpen = openBrands.has(brandKey);
 
                   return (
                     <Collapsible
                       key={brandKey}
                       open={isBrandOpen}
                       onOpenChange={() => toggleBrand(brandKey)}
                     >
                       <CollapsibleTrigger asChild>
                         <button className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 text-left hover:bg-accent/50 transition-colors">
                           <ChevronRight
                             className={cn(
                               "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                               isBrandOpen && "rotate-90"
                             )}
                           />
                           <span className={cn("font-medium flex-1", getBrandTextColor(brand.name))}>
                             {brand.name}
                           </span>
                           <Badge variant={brand.is_primary ? "default" : "outline"} className="text-xs">
                             {items.length}
                           </Badge>
                         </button>
                       </CollapsibleTrigger>
                       <CollapsibleContent>
                         <div className="ml-4 mt-2 space-y-1 border-l border-border pl-3">
                           {items.map((item) => (
                             <div
                               key={item.id}
                               className="flex items-center gap-3 rounded-md bg-background border border-border p-3 hover:bg-accent/30 transition-colors group"
                             >
                               <div className="flex-1 min-w-0">
                                 <p className="font-medium truncate">{item.model_name}</p>
                                 <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                   {item.engine_power_hp && (
                                     <span>{item.engine_power_hp} hj</span>
                                   )}
                                   {item.price_eur && (
                                     <span>
                                       {new Intl.NumberFormat("et-EE", {
                                         style: "currency",
                                         currency: "EUR",
                                         maximumFractionDigits: 0,
                                       }).format(item.price_eur)}
                                     </span>
                                   )}
                                 </div>
                               </div>
                               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onEdit(item);
                                   }}
                                   title="Muuda"
                                 >
                                   <Pencil className="h-4 w-4" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onBrochure(item);
                                   }}
                                   title="Lae brošüür üles"
                                 >
                                   <FileText className="h-4 w-4 text-primary" />
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-8 w-8"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     onDelete(item.id);
                                   }}
                                   title="Kustuta"
                                 >
                                   <Trash2 className="h-4 w-4 text-destructive" />
                                 </Button>
                               </div>
                             </div>
                           ))}
                         </div>
                       </CollapsibleContent>
                     </Collapsible>
                   );
                 })}
               </div>
             </CollapsibleContent>
           </Collapsible>
         );
       })}
     </div>
   );
 }