

## Probleem

E-posti turvaskännerid (nt Microsoft Safe Links, mida kasutatakse @wihuriagri.com domeenis) avavad automaatselt kutse e-kirjas olevad lingid enne, kui kasutaja neid klõpsab. See tarbib ära ühekordse tokeni ja kasutajale kuvatakse "link aegunud" viga.

Auth logid kinnitavad seda: `"One-time token not found"` vead ilmnevad kohe pärast kutse saatmist, mis tähendab, et skänner jõudis linki avada enne kasutajat.

## Lahendus

Muuta e-kirja link nii, et see suunab kasutaja vaheleheküljele, kus ta peab **nuppu vajutama** enne tokeni verifitseerimist. Skänner avab lehe, aga ei vajuta nuppu — token jääb puutumata.

### Muudatused

**1. Uuenda `ResetPassword.tsx` lehte**
- Ära tee `verifyOtp` kohe automaatselt lehe laadimisel
- Kuva esmalt "Kinnita ja loo parool" nupp
- Alles pärast nupu vajutamist kutsu `verifyOtp`
- Kui token on kehtetu, kuva selge veateade

**2. Edge funktsioonid jäävad samaks**
- `invite-user` ja `resend-invite` genereerivad endiselt `token_hash` lingi
- Link suunab endiselt `/reset?token_hash=...&type=recovery` lehele
- Muutub ainult see, mis juhtub lehel — token ei tarbi end automaatselt

### Voog pärast muudatust

```text
E-kiri → Skänner avab /reset?token_hash=X → Leht kuvab nupu → Skänner ei vajuta → Token säilib
E-kiri → Kasutaja avab /reset?token_hash=X → Leht kuvab nupu → Kasutaja vajutab → verifyOtp → Parool → Sisse logitud
```

### Mõjutatud failid
- `src/pages/ResetPassword.tsx` — lisada vahesamm nupuga enne tokeni verifitseerimist

