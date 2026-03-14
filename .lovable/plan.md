

## Probleem

Kutse e-kirjad lähevad rämpsposti kausta, sest:
1. **Resend otse-saatmine** — praegu saadetakse e-kirjad otse Resend API kaudu, ilma korraliku e-posti infrastruktuurita (puudub DKIM/SPF/DMARC seadistus Lovable Cloud tasandil)
2. **Domeeni `agrifacts.app` autentimiskirjed** ei pruugi olla täielikud — Resendi domeen on küll verifitseeritud, kuid see ei tähenda automaatselt, et kõik SPF/DKIM/DMARC kirjed on korrektsed

## Lahendus

Seadistame Lovable Cloud'i sisseehitatud e-posti infrastruktuuri, mis tagab:
- Korraliku domeeni verifitseerimise (SPF, DKIM, DMARC)
- E-kirjade järjekorra ja automaatsed korduskatsed
- Professionaalse kujunduse React Email mallidega

### Sammud

1. **E-posti domeeni seadistamine** — Seadistame `agrifacts.app` domeeni Lovable Cloud'i e-posti süsteemis (DNS kirjete lisamine)
2. **E-posti infrastruktuuri loomine** — Andmebaasi tabelid, järjekord ja töötleja
3. **Auth e-kirja mallide loomine** — Kujundatud React Email mallid (kutse, parooli taastamine jne) Wihuri Agri brändivärvidega (#367C2B roheline)
4. **Edge-funktsioonide uuendamine** — `invite-user`, `resend-invite` ja `create-first-admin` funktsioonid hakkavad kasutama uut e-posti süsteemi Resendi asemel
5. **Edge-funktsioonide deploy** — Kõik muudetud funktsioonid deployitakse

### Tehniline detail

- Praegune Resend API otsekasutus asendatakse Lovable Cloud'i e-posti süsteemiga
- E-kirjad läbivad pgmq järjekorra (automaatsed korduskatsed, rate-limit käsitlus)
- Mallid luuakse React Email komponentidena professionaalse kujundusega
- Resend API võtit enam otse edge-funktsioonides ei kasutata

