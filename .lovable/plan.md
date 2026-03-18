

## Probleem

Supabase `generateLink({ type: "recovery" })` kasutab OTP tokenit, mille vaikimisi kehtivusaeg on **1 tund** (3600 sekundit) — mitte 24 tundi. See on platvormi tasandi seadistus (`MAILER_OTP_EXP`), mida ei saa `generateLink` API kaudu üle kirjutada.

E-kirjas kuvatav "See link kehtib 24 tundi" on seega vale info.

## Lahendus

Kuna platvormi OTP kehtivusaega ei saa otse muuta, siis **loobume Supabase OTP tokenist** ja kasutame oma lahendust:

### Muudatused

**1. Uus andmebaasi tabel `password_setup_tokens`**
- `id` (uuid, PK)
- `user_id` (uuid, viide auth.users)
- `token` (text, unikaalne, krüpteeritud juhuslik string)
- `expires_at` (timestamptz, loomishetk + 24h)
- `used_at` (timestamptz, nullable)
- RLS: avalik lugemisõigus puudub, hallatakse ainult edge funktsioonide kaudu (service role)

**2. Uuenda Edge funktsioone (`invite-user`, `resend-invite`, `create-first-admin`)**
- Pärast kasutaja loomist genereeri krüpteeritud token ja salvesta `password_setup_tokens` tabelisse kehtivusajaga 24h
- E-kirja link osutab `/reset?setup_token=XXXXX` (mitte enam `token_hash`)
- Eemalda `generateLink` recovery kutse

**3. Uuenda `ResetPassword.tsx`**
- Tuvasta URL-ist `setup_token` parameeter
- Nupu vajutamisel kutsu uus edge funktsioon `verify-setup-token`, mis:
  - Kontrollib tokeni kehtivust (ei ole aegunud, ei ole kasutatud)
  - Märgib tokeni kasutatuks
  - Genereerib Supabase recovery lingi kohapeal ja tagastab sessiooni
- Pärast edukat verifitseerimist kuva paroolivormi
- Olemasolev `token_hash` voog jääb alles tagasiühilduvuse jaoks (nt juba saadetud linkid)

**4. Uus Edge funktsioon `verify-setup-token`**
- Võtab vastu `setup_token`
- Kontrollib `password_setup_tokens` tabelist kehtivust
- Kui kehtiv: genereerib `generateLink` recovery kohapeal (token on "värske" ja kehtib 1h, mis on piisav parooli sisestamiseks)
- Tagastab sessiooni andmed kliendile

### Mõjutatud failid
- Uus migratsioon: `password_setup_tokens` tabel
- `supabase/functions/invite-user/index.ts`
- `supabase/functions/resend-invite/index.ts`
- `supabase/functions/create-first-admin/index.ts`
- `supabase/functions/verify-setup-token/index.ts` (uus)
- `src/pages/ResetPassword.tsx`

### Voog pärast muudatust

```text
Kutse saatmine:
  Edge fn → Loo kasutaja → Genereeri 24h token → Salvesta DB → Saada e-kiri lingiga /reset?setup_token=X

Kasutaja avab lingi (ka 23h hiljem):
  /reset?setup_token=X → Kuva "Kinnita" nupp → Kasutaja klikib →
  → verify-setup-token fn kontrollib DB-st (kehtiv?) →
  → Genereerib "värske" recovery sessiooni →
  → Tagastab sessioon → Kuva paroolivorm → Salvesta parool
```

