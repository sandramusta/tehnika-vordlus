
# Tehnika tüüpide uuendamine

## Ülevaade

Lisame 6 uut tehnika tüüpi ja eemaldame üldise "Taimekaitseprits" kategooria, asendades selle täpsemate tüüpidega.

## Muudatused

### 1. Andmebaasi muudatused

Lisatavad tüübid:

| name | name_et |
|------|---------|
| forage_harvester | Hekseldi |
| wheel_loader | Rataslaadur |
| telehandler | Teleskooplaadur |
| self_propelled_sprayer | Iseliikuv taimekaitseprits |
| trailed_sprayer | Järelveetav taimekaitseprits |
| round_baler | Ruloonpress |

Eemaldatav tüüp:
- "sprayer" (Taimekaitseprits) - hetkel ühtegi masinat ei ole sellele tüübile seotud

### 2. Koodi muudatused

**EquipmentFilters.tsx** - uuendame lubatud tüüpide nimekirja:

```text
Praegu:
allowedTypes = ["combine", "sprayer", "tractor"]

Uuendatud:
allowedTypes = [
  "combine", 
  "tractor", 
  "forage_harvester",
  "wheel_loader", 
  "telehandler",
  "self_propelled_sprayer", 
  "trailed_sprayer",
  "round_baler"
]
```

## Tehniline teostus

1. SQL migratsioon uute tüüpide lisamiseks ja vana eemaldamiseks
2. EquipmentFilters.tsx uuendamine uute tüüpidega

## Tulemus

Tehnika tüübi valikust kaob üldine "Taimekaitseprits" ja lisanduvad spetsiifilisemad kategooriad, mis võimaldavad täpsemat tehnika liigitamist.
