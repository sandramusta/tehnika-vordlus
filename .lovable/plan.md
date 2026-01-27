
# Konkurentide märgise sõnastuse parandus

## Probleem

Praegune märgis "Leitud 5 konkurenti vahemikus 417–517 hj" tekitab segadust, sest näitab kogu vahemikku (100 hj), mitte ±50 hj filtrit.

## Lahendus

Muudame sõnastuse selgemaks, näidates valitud mudeli võimsust ja ±50 hj vahemikku:

**Uus tekst:** `Leitud 5 konkurenti ±50 hj vahemikus (valitud: 467 hj)`

## Tehniline muudatus

**Fail:** `src/hooks/useCompetitors.ts`

Muudame `getCompetitorSummary` funktsiooni:

```typescript
export function getCompetitorSummary(
  selectedModel: Equipment | null,
  competitors: Equipment[]
): string | null {
  if (!selectedModel?.engine_power_hp || competitors.length === 0) return null;
  
  return `Leitud ${competitors.length} konkurenti ±${HP_RANGE} hj vahemikus (valitud: ${selectedModel.engine_power_hp} hj)`;
}
```

## Tulemus

Kasutajale on kohe selge, et:
- Valitud mudel on 467 hj
- Konkurendid on ±50 hj vahemikus sellest (ehk 417–517 hj)
