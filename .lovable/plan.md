

# Igakuine statistikasusteem perioodi valikuga

## Ulevaade
Lisa "Statistika ja edetabel" lehele perioodi valik ("Kaesolev kuu" / "Kogu aeg"), kus vaikimisi kuvatakse ainult jooksva kuu andmeid. Andmebaasi muudatusi pole vaja -- `created_at` timestamp on juba olemas.

## Muudatused

### 1. Hook: `src/hooks/useActivityStats.ts`
- Lisa `period` parameeter molemale hookile (`useLeaderboard` ja `useDashboardStats`)
- Tyyp: `"current_month" | "all_time"` (vaikimisi `"current_month"`)
- Kui `period === "current_month"`, lisa `.gte("created_at", monthStart.toISOString())` filter koikidele paringutele
- Kui `period === "all_time"`, ara filtreeri kuupaeva jargi
- Uuenda `queryKey` sisaldama perioodi vaartust, et React Query teaks andmeid uuesti laadida perioodi vahetusel
- Dashboard stats kaardid ("Tana alla laetud raportid", "Aktiivseim muugimees") jaavad alati tanase paeva pohiseks, kuid "Koige popim masin" kaardi paringule lisatakse samuti perioodi filter

### 2. Leht: `src/pages/Stats.tsx`
- Lisa `period` state: `useState<"current_month" | "all_time">("current_month")`
- Lisa hero sektsiooni alla perioodi valik -- kaks nuppu/toggle:
  - "Kaesolev kuu" (vaikimisi aktiivne)
  - "Kogu aeg"
- Edasta `period` molemale hookile: `useLeaderboard(period)` ja `useDashboardStats(period)`
- Kuva hero sektsioonis ka jooksva kuu nimi (nt "Veebruar 2026"), kui valitud on "Kaesolev kuu"

## Tehniline detail

Kuu alguse arvutamine hookis:
```typescript
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);
```

Paring naide filtriga:
```typescript
let query = (supabase as any)
  .from("user_activity_logs")
  .select("user_id, action_type, created_at")
  .in("action_type", [...]);

if (period === "current_month") {
  query = query.gte("created_at", monthStart.toISOString());
}
```

## Muudetavad failid
1. `src/hooks/useActivityStats.ts` -- perioodi filter paringutesse
2. `src/pages/Stats.tsx` -- perioodi valik UI ja state
