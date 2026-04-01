const fs = require('fs');
const filePath = 'C:/Users/sandr/OneDrive/Desktop/tehnika-vordlus/src/components/admin/EquipmentForm.tsx';
let data = fs.readFileSync(filePath, 'utf8');

// 1. Add useTranslation import
data = data.replace(
  'import { cn } from "@/lib/utils";\r\n',
  'import { cn } from "@/lib/utils";\r\nimport { useTranslation } from "react-i18next";\r\nimport { getTranslation } from "@/lib/i18nHelpers";\r\n'
);

// 2. Add t, i18n inside function body after the useState lines
data = data.replace(
  '   // Track selected type for dynamic field display and smart filtering\r\n',
  '  const { t, i18n } = useTranslation();\r\n  const lang = i18n.language;\r\n\r\n   // Track selected type for dynamic field display and smart filtering\r\n'
);

// 3. Replace hardcoded labels
function rep(from, to) {
  if (!data.includes(from)) { console.warn('NOT FOUND:', JSON.stringify(from.slice(0,80))); return; }
  data = data.replace(from, to);
  console.log('OK:', JSON.stringify(from.slice(0,60)));
}

rep('<Label htmlFor="equipment_type_id">Tehnika tüüp *</Label>', '<Label htmlFor="equipment_type_id">{t("equipmentForm.equipmentType")}</Label>');
rep('<SelectValue placeholder="Vali tüüp" />', '<SelectValue placeholder={t("equipmentForm.selectType")} />');
// In type select, use getTranslation for type names
rep(
  '               {types.map((type) => (\r\n                 <SelectItem key={type.id} value={type.id}>\r\n                   {type.name_et}\r\n                 </SelectItem>\r\n               ))}',
  '               {types.map((type) => (\r\n                 <SelectItem key={type.id} value={type.id}>\r\n                   {getTranslation(type.name_translations, lang, type.name_et)}\r\n                 </SelectItem>\r\n               ))}'
);
rep('<Label htmlFor="brand_id">Bränd *</Label>', '<Label htmlFor="brand_id">{t("equipmentForm.brand")}</Label>');
rep('<SelectValue placeholder={selectedTypeId ? "Vali bränd" : "Vali esmalt tüüp"} />', '<SelectValue placeholder={selectedTypeId ? t("equipmentForm.selectBrand") : t("equipmentForm.selectTypeFirst")} />');
rep('<Label htmlFor="model_name">Mudeli nimi *</Label>', '<Label htmlFor="model_name">{t("equipmentForm.modelName")}</Label>');
rep('<Label htmlFor="power_class_id">Jõuklass</Label>', '<Label htmlFor="power_class_id">{t("equipmentForm.powerClass")}</Label>');
rep('<SelectValue placeholder="Vali jõuklass" />', '<SelectValue placeholder={t("equipmentForm.selectPowerClass")} />');

// Images
rep('          label="Toote pilt"', '          label={t("equipmentForm.productImage")}');
rep('            label="Peksusüsteemi pilt"', '            label={t("equipmentForm.threshingImage")}');

// Data source
rep('<Label htmlFor="data_source_url">Andmete allikas (URL)</Label>', '<Label htmlFor="data_source_url">{t("equipmentForm.dataSource")}</Label>');

// Notes
rep('<Label htmlFor="notes">Märkused</Label>', '<Label htmlFor="notes">{t("equipmentForm.notes")}</Label>');
rep('           placeholder="Lisamärkused..."', '           placeholder={t("equipmentForm.notesPlaceholder")}');

// Submit button
rep('{isSubmitting ? "Salvestan..." : "Salvesta"}', '{isSubmitting ? t("admin.saving") : t("common.save")}');

fs.writeFileSync(filePath, data);
console.log('\nEquipmentForm.tsx patched! Length:', data.length);
