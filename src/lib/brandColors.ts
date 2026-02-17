 // Brand color utilities for all equipment manufacturers
 
 // Get text color class for brand name
 export function getBrandTextColor(brandName: string): string {
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
     // Telehandler brands
     case "Kramer":
       return "text-kramer";
     case "Manitou":
       return "text-manitou";
     case "JCB":
       return "text-jcb";
     case "Merlo":
       return "text-merlo";
     case "Weidemann":
       return "text-weidemann";
     case "Claas Scorpion":
       return "text-claas-scorpion";
     default:
       return "text-foreground";
   }
 }
 
 // Get background color class for brand (with appropriate text color)
 export function getBrandBgClass(brandName: string): string {
   switch (brandName) {
     case "John Deere":
       return "bg-primary text-white";
     case "Claas":
       return "brand-claas";
     case "Case IH":
       return "brand-case-ih";
     case "New Holland":
       return "brand-new-holland";
     case "Fendt":
       return "bg-fendt text-white";
     // Telehandler brands
     case "Kramer":
       return "brand-kramer";
     case "Manitou":
       return "brand-manitou";
     case "JCB":
       return "brand-jcb";
     case "Merlo":
       return "brand-merlo";
     case "Weidemann":
       return "brand-weidemann";
     case "Claas Scorpion":
       return "brand-claas-scorpion";
     default:
       return "bg-muted text-foreground";
   }
 }
 
 // Get HEX color for brand (useful for inline styles, charts, etc.)
 export function getBrandHexColor(brandName: string): string {
   switch (brandName) {
     case "John Deere":
       return "#367c2b";
     case "Claas":
       return "#ff4d4d";
     case "Case IH":
       return "#a50000";
     case "New Holland":
       return "#1e56a0";
     case "Fendt":
       return "#000000";
     // Telehandler brands
     case "Kramer":
      return "#42805E";
     case "Manitou":
       return "#D40000";
     case "JCB":
       return "#F9B101";
     case "Merlo":
       return "#609839";
     case "Weidemann":
       return "#A9423F";
     case "Claas Scorpion":
       return "#B3C517";
     default:
       return "#6b7280";
   }
 }
 
 // Determine if brand color is light (needs dark text)
 export function isBrandColorLight(brandName: string): boolean {
   return ["JCB", "Claas Scorpion"].includes(brandName);
 }
 
 // Get badge classes for "vs Brand" display
 export function getBrandBadgeClasses(brandName: string): string {
   const bgClass = getBrandBgClass(brandName);
   return `${bgClass} rounded-md px-2 py-0.5 text-xs font-medium`;
 }