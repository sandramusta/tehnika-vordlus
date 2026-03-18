

## Otsinguväli mudelivaliku popoverisse

### Muudatus

**`src/components/comparison/ModelMultiSelect.tsx`**
- Lisa `searchQuery` state (`useState("")`)
- Lisa popoveri sisu ülaossa `Input` väli luubi ikooniga ja placeholder "Otsi mudelit..."
- Filtreeri olemasolev `modelsByBrand` grupeeritud nimekiri `searchQuery` järgi (case-insensitive, otsib nii `model_name` kui `brand.name` seast)
- Rippmenüü jääb täpselt samaks — kõik brändid ja mudelid on näha, aga otsing piirab kuvatavaid tulemusi
- Tühjenda `searchQuery` popoveri sulgemisel (`onOpenChange` callback)
- Kui filtreerimine ei anna tulemusi, kuva "Mudeleid ei leitud"

### Üks fail muudetakse
`src/components/comparison/ModelMultiSelect.tsx`

