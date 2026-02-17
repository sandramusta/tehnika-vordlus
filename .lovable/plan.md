

## Probleem

Kutse-e-kirjas olev link on "recovery" tüüpi link, mis suunab kasutaja `/auth` lehele. Kuid rakenduses puudub parooli seadistamise leht (`/reset-password`), seega:

1. Kasutaja klikib lingil ja suunatakse `/auth` lehele
2. Taustapeal logitakse kasutaja hetkeks sisse (recovery token), kuid parooli pole seadistatud
3. Kasutaja proovib e-posti ja parooliga sisse logida, kuid parool puudub -- "vale kasutaja/parool"

## Lahendus

Loome parooli seadistamise lehe ja uuendame kutsete suunamise loogika.

### Muudatused

**1. Uus leht: `src/pages/ResetPassword.tsx`**

- Vorm uue parooli sisestamiseks (kaks paroolivälja: parool + kinnitus)
- Kontrollib URL-ist `type=recovery` tokenit
- Kutsub `supabase.auth.updateUser({ password })` parooli salvestamiseks
- Edukal salvestamisel suunab kasutaja `/auth` lehele koos teatega

**2. `src/App.tsx`** — Uue marsruudi lisamine

- Lisame `/reset-password` marsruudi, mis viitab uuele `ResetPassword` lehele
- See marsruut peab olema avalik (mitte ProtectedRoute taga)

**3. `supabase/functions/resend-invite/index.ts`** — Suunamise URL uuendamine

- Muudame `redirectTo` väärtuse: `/auth` asemel `/reset-password`
- See tagab, et kasutaja suunatakse parooli seadistamise lehele, mitte sisselogimise lehele

**4. `supabase/functions/create-first-admin/index.ts`** — Suunamise URL uuendamine

- Sama muudatus: `redirectTo` muudetakse `/reset-password` peale

### Voog parast muudatust

```text
1. Admin saadab kutse --> e-kiri saadetakse
2. Kasutaja klikib lingil --> suunatakse /reset-password lehele
3. Kasutaja sisestab uue parooli --> parool salvestatakse
4. Suunatakse /auth lehele --> kasutaja logib sisse e-posti ja parooliga
```

