# AgriFacts – Rakenduse dokumentatsioon

> Viimati uuendatud: 2026-03-17

---

## 1. Ülevaade

**AgriFacts** (domeen: `https://agrifacts.app`) on Wihuri Agri sisene veebirakendus põllumajandustehnika võrdlemiseks. Rakendus on mõeldud tootejuhtidele ja müügimeeskonnale, et võrrelda John Deere ja Krameri tooteid konkurentidega (Case IH, CLAAS, New Holland, Fendt jt).

**Tehnoloogiad:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lovable Cloud (Supabase).

**Domeen:** `https://agrifacts.app` (Lovable staging: `wihuriapp.lovable.app`)

---

## 2. Kasutajarollid ja ligipääs (RBAC)

Rakendus on **täielikult privaatne** – kõik lehed nõuavad autentimist.

| Roll | Õigused |
|------|---------|
| `user` | Vaatab võrdlustabeleid, müüte; laeb alla PDF-e |
| `product_manager` | Kõik `user` õigused + tehnika, müütide ja argumentide lisamine/muutmine/kustutamine; Admin ja Statistika lehtede vaatamine |
| `admin` | Kõik `product_manager` õigused + kasutajate haldus (kutsumine, rollide muutmine) |

Rollid hoitakse eraldi tabelis `user_roles` (mitte profiilitabelis). Rollide kontroll toimub andmebaasifunktsioonide `has_role()` ja `has_any_role()` kaudu (SECURITY DEFINER).

---

## 3. Autentimine ja kasutajahaldus

### 3.1 Sisselogimine
- Tee: `/auth`
- E-posti + parooli põhine sisselogimine
- Registreerumine (signUp) pole tavakasutajatele mõeldud – kasutajaid kutsub admin

### 3.2 Kasutaja kutsumine (invite)
- Admin lisab kasutaja läbi Admin → Kasutajad tabi
- Edge Function `invite-user` loob kasutaja Supabase Auth süsteemis, määrab rolli ja saadab e-kirja
- E-kirjas on otselink koos `token_hash` parameetriga, mis viib `https://agrifacts.app/password-reset`
- Kasutaja määrab parooli ja logib sisse

### 3.3 Parooli taastamine / määramine
- Tee: `/password-reset` (ka `/update-password`, `/password-recovery` aliased)
- Kasutab `supabase.auth.verifyOtp()` token_hash'iga
- `ProtectedRoute` ja `useAuth` tuvastavad taastamismärgi (type=recovery/invite/access_token) ja suunavad automaatselt parooli muutmise vormile

### 3.4 Aegunud kutselingid
- `/auth` lehel tuvastatakse aegunud lingid (otp_expired, access_denied) ja kuvatakse sõbralik teade eesti keeles

### 3.5 Inaktiivsuse logout
- 24 tunni pärast ilma tegevuseta logitakse kasutaja automaatselt välja (`useInactivityLogout`)

### 3.6 E-kirjad
- Saatja: `Wihuri Agri <noreply@agrifacts.app>`
- Saadetakse läbi Resend API (otsesed fetch päringud, mitte SDK)
- HTML-mallid Wihuri Agri brändivärviga (#367C2B)

---

## 4. Lehed ja funktsioonid

### 4.1 Võrdlus (`/` ja `/comparison`)
Peamine töövahend. Index leht renderdab Comparison komponendi.

**Režiimid:**
- **Auto režiim:** Valib seadmetüübi, brändi ja mudeli → näitab kõiki sama klassi konkurente
- **Manuaalne režiim:** Kasutaja valib vabalt mitu mudelit võrdlemiseks

**Funktsioonid:**
- Tehniliste andmete võrdlustabel (kõik spetsifikatsioonid kõrvuti)
- Konkurentsieeliste kuvamine (Problem → Solution → Benefit struktuur)
- TCO (Total Cost of Ownership) kokkuvõte
- ROI kalkulaator (olemasolev vs uus masin)
- PDF eksport (jsPDF) – genereerib professionaalse võrdlusraporti
- Inline-redigeerimine (product_manager/admin saab otse tabelis väärtusi muuta)

**Tegevuste logimine:**
- `COMPARISON_MADE` – logitakse, kui kasutaja vaatab võrdlust
- `PDF_GENERATED` – logitakse PDF allalaadimisel
- `ROI_CALCULATED` – logitakse ROI arvutamisel

### 4.2 Müüdid (`/myths`)
Levinumad väärarusaamad põllumajandustehnika kohta ja John Deere vastused.

**Kategooriad:**
- Ebakindlus ja ajastus
- Finantsid ja rahastus
- Masinad ja konkurents
- Turuhinnad ja sisendkulud
- Ilm ja saagitingimused
- Muud argumendid

Iga müüt koosneb: **Müüt** → **Tegelikkus** → **John Deere eelis**

### 4.3 Statistika (`/stats`)
Ainult product_manager ja admin rollidele.

**Perioodi valik:** "Käesolev kuu" (vaikimisi) / "Kogu aeg"

**Dashboard kaardid:**
- Täna alla laetud raportid (alati tänane)
- Kõige popim masin (perioodi põhine)
- Aktiivseim müügimees (alati tänane)

**Edetabel:**
- Punktisüsteem: PDF = 2p, Võrdlus = 1p
- Sorteeritav: punktid, PDF-id, võrdlused
- Viimane aktiivsus kuvatakse suhtelist ajaga

### 4.4 Admin (`/admin`)
Ainult product_manager ja admin rollidele.

**Tabid:**
1. **Masinad** – Tehnika lisamine, muutmine, kustutamine
   - Seadmetüübid: Kombainid, Traktorid, Palliprssid, Telelaadijad jne
   - Brändid: John Deere, Kramer (primary), Case IH, CLAAS, New Holland, Fendt (konkurendid)
   - Pilt ja pügalasüsteemi pilt
   - Põhispetsifikatsioonid (mootor, punkri maht, lõikuslaius jne)
   - Detailsed spetsifikatsioonid (JSONB, dünaamiline)
   
2. **Brošüürid** – PDF-brošüüride üleslaadimine ja AI-põhine andmete ekstraheerimine
   - Üleslaetud PDF → Edge Function `extract-brochure-specs` → AI analüüsib → Andmed ülevaatamiseks
   - Admin kinnitab enne andmete rakendamist
   - Ainult tühjad väljad täidetakse, olemasolevaid ei kirjutata üle
   
3. **Müüdid** – Müütide lisamine, muutmine, kustutamine

4. **Argumendid** – Konkurentsieeliste haldamine
   - Seotud konkurendi brändi ja seadmetüübiga
   - Struktuur: Problem → Solution → Benefit
   - Kategooriad: Tehnoloogia, Jõudlus, Kütusesääst, Automatiseerimine jne

5. **Kasutajad** (ainult admin) – Kasutajate kutsumine ja rollide haldamine
   - Staff users tabel
   - Kutsete saatmine ja uuesti saatmine
   - Rollide muutmine

---

## 5. Andmebaasi struktuur

### Tabelid

| Tabel | Kirjeldus |
|-------|-----------|
| `equipment` | Tehnika (mudelid, spetsifikatsioonid, hinnad) |
| `brands` | Brändid (is_primary eristab meie brände konkurentidest) |
| `equipment_types` | Seadmetüübid (name + name_et) |
| `power_classes` | Võimsusklassid (min_hp, max_hp) |
| `equipment_brochures` | Üleslaetud brošüürid + AI-ekstraheeritud andmed |
| `competitive_arguments` | Konkurentsieelised (seotud brändi ja seadmetüübiga) |
| `myths` | Müüdid (kategooria, müüt, tegelikkus, eelis) |
| `profiles` | Kasutajaprofiilid (id, full_name, email) |
| `user_roles` | Kasutajarollid (user_id, role enum) |
| `staff_users` | Töötajate register (kutsumine, aktiivsus) |
| `user_activity_logs` | Tegevuslogi (action_type, details JSON) |
| `spec_labels` | Kohandatud spetsifikatsiooni nimetused |
| `work_documentation` | Tööde dokumenteerimine |

### Enum: `app_role`
`user` | `product_manager` | `admin`

### Andmebaasifunktsioonid
- `has_role(user_id, role)` – Kontrollib, kas kasutajal on konkreetne roll (SECURITY DEFINER)
- `has_any_role(user_id, roles[])` – Kontrollib, kas kasutajal on üks rollidest
- `update_updated_at_column()` – Trigger-funktsioon updated_at uuendamiseks

### Storage Buckets
- `equipment-images` – Tehnika pildid (avalik)
- `equipment-brochures` – PDF-brošüürid (avalik)

---

## 6. Edge Functions (Backend)

| Funktsioon | Kirjeldus |
|------------|-----------|
| `invite-user` | Kasutaja kutsumine: loob auth kasutaja, määrab rolli, saadab e-kirja |
| `resend-invite` | Kutse uuesti saatmine |
| `create-first-admin` | Esimese admin-kasutaja loomine |
| `extract-brochure-specs` | PDF-brošüürist tehniliste andmete AI-ekstraheerimine |

Kõik Edge Functions nõuavad JWT-autentimist ja rollipõhist kontrolli.

---

## 7. Turvalisus (RLS)

- Kõik tabelid on RLS-iga kaitstud
- `staff_users` – ligipääs ainult autentitud kasutajatele
- `work_documentation` ja storage bucketid – kirjutamisõigus ainult admin/product_manager
- Edge Functions tagastavad üldiseid veateateid ("Operation failed"), et vältida info lekitamist
- Rollide kontroll toimub SECURITY DEFINER funktsioonide kaudu, et vältida RLS rekursiooni

---

## 8. Spetsifikatsioonide sünkroniseerimine

- Ühe masina juures tehtud muudatus (lisamine/kustutamine) rakendub automaatselt kõigile sama tüübi seadmetele
- Kustutatud näitajad salvestatakse `detailed_specs.__hidden_fields` massiivi
- Peidetud väljad filtreeritakse välja võrdlustabelitest, admin-vaatest ja brošüüride ekstraheerimisel

---

## 9. Tegevuslogi ja statistika

**Logitavad tegevused:**

| Action | Kirjeldus | Punktid |
|--------|-----------|---------|
| `USER_LOGIN` | Sisselogimine | – |
| `PDF_GENERATED` | PDF-raporti genereerimine | 2 |
| `COMPARISON_MADE` | Võrdluse vaatamine | 1 |
| `ROI_CALCULATED` | ROI kalkulaatori kasutamine | – |

Statistika värskendub automaatselt iga 30 sekundi järel.

---

## 10. Võtmekonfiguratioon

| Parameeter | Väärtus |
|-----------|---------|
| Domeen | `https://agrifacts.app` |
| Brändivärv | `#367C2B` (John Deere roheline) |
| Inaktiivsuse timeout | 24 tundi |
| Saatja e-post | `noreply@agrifacts.app` |
| E-kirja teenus | Resend API |
| Vaikimisi roll | `user` |

---

## 11. Frontend marsruutimine

| Tee | Komponent | Ligipääs |
|-----|-----------|----------|
| `/auth` | Auth | Avalik |
| `/password-reset` | ResetPassword | Avalik |
| `/update-password` | ResetPassword | Avalik |
| `/password-recovery` | ResetPassword | Avalik |
| `/` | Comparison | Autentitud |
| `/comparison` | Comparison | Autentitud |
| `/myths` | Myths | Autentitud |
| `/admin` | Admin | product_manager, admin |
| `/stats` | Stats | product_manager, admin |
| `*` | NotFound | Avalik |

---

## 12. Muutuste ajalugu

| Kuupäev | Muudatus |
|---------|----------|
| 2026-03-17 | Dokumentatsiooni loomine |
