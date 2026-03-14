

# Resendiga e-posti parandamine

## Probleem
1. E-kirjad lähevad rämpsposti — tõenäoliselt puudulikud DNS kirjed (SPF, DKIM, DMARC) domeenile `agrifacts.app`
2. E-kirjad on visuaalselt lihtsad

## Lahendus Resendiga

### 1. DNS kirjete kontroll ja parandus
Resend dashboard näitab, millised DNS kirjed on vajalikud `agrifacts.app` domeenile:
- **SPF** kirje (TXT) — lubab Resendil saata e-kirju sinu domeeni nimel
- **DKIM** kirjed (TXT) — digitaalselt allkirjastab e-kirjad
- **DMARC** kirje (TXT) — ütleb e-posti serveritele, kuidas kontrollimata kirju käsitleda

Kontrolli Resend dashboard → Domains → `agrifacts.app` alt, kas kõik kirjed on rohelised.

### 2. Professionaalsed HTML mallid
Uuendan kõigi kolme Edge-funktsiooni (`invite-user`, `resend-invite`, `create-first-admin`) HTML malle:
- Wihuri Agri logo päises
- Brändivärvid (#367C2B roheline)
- Responsiivsed, professionaalsed mallid
- Footer kontaktandmete ja brändinguga
- Korrektsed meta-tagid ja preheader tekst (aitab ka rämpsposti filtreerimise vastu)

### 3. E-posti päised rämpsposti vältimiseks
Lisaks DNS-ile saab Resend API kaudu lisada:
- `List-Unsubscribe` päis
- `Reply-To` aadress
- Korrektsed `Content-Type` päised

### Sammud
1. Uuendan HTML mallid kõigis kolmes Edge-funktsioonis
2. Lisan e-posti päised (Reply-To, List-Unsubscribe)
3. Deployin uuendatud funktsioonid
4. Sina kontrollid Resend dashboardist DNS kirjete staatust

