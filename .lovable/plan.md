

## Probleem

Traktorite `engine_power_hp` veerus on andmed ebaühtlased — osadel mudelitel on seal ECE-R120 võimsus, osadel aga boost/IPM võimsus (`võimsus_hj`). Näited:

```text
Mudel              | ECE-R120 | engine_power_hp | võimsus_hj
Fendt 724 Vario    |  243     |  303            |  303  ← VALE
Fendt 728 Vario    |  283     |  303            |  303  ← VALE
JD 8R 340          |  340     |  374            |  374  ← VALE
JD 8RX 310         |  310     |  310            |  310  ← OK
```

Kuna võrdlus kasutab `engine_power_hp` veergu ±10 hj vahemikuga, satuvad valesse vahemikku mudelid, mille boost-võimsus on sarnane, kuigi ECE-R120 võimsus on hoopis teine.

## Lahendus

Muuta traktorite võrdlusloogikat nii, et see loeb võimsuse otse `detailed_specs.mootor.max_võimsus_hj_kw` väljast (ECE-R120 standard), mitte `engine_power_hp` veerust. Kuna see väli sisaldab formaadis teksti nagu "310 (228)", parsitakse sealt esimene number.

### Muudatused

**`src/hooks/useCompetitors.ts`**
- Lisa abifunktsioon `getTractorECEPower(equipment)`, mis loeb `detailed_specs.mootor.max_võimsus_hj_kw` väljast esimese numbrilise väärtuse (nt "310 (228)" → 310)
- Muuda traktorite haru `useMemo`-s: kui tüüp on traktor, kasuta `getTractorECEPower()` asemel `engine_power_hp` väärtust
- Uuenda ka `getCompetitorSummary()` kuvama ECE-R120 väärtust

