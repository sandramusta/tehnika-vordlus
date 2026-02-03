

# PDF-failidele logo, ettevõtte nimi ja genereerija info lisamine

## Ülevaade

Uuendan kõiki PDF-ekspordi funktsioone, et lisada:
- **Ettevõtte logo** (Wihuri Agri)
- **Ettevõtte nimi**
- **Genereerija täisnimi ja e-mail**

Kuna sisselogimist veel pole, siis kõigepealt loon kasutajate tabeli ja lihtsa kasutajainfo valimise võimaluse.

---

## Tehniline arhitektuur

### 1. Uus andmebaasi tabel: `staff_users`

Loon uue tabeli ettevõtte töötajate jaoks:

| Veerg | Tüüp | Kirjeldus |
|-------|------|-----------|
| `id` | uuid | Primaarvõti |
| `full_name` | text | Täisnimi (nt "Mart Tamm") |
| `email` | text | E-posti aadress |
| `is_active` | boolean | Kas kasutaja on aktiivne |
| `created_at` | timestamp | Loomise aeg |

### 2. Admin-vaade: kasutajate haldamine

Lisa Admin lehele uus sektsioon "Kasutajad", kus saab:
- Lisada uue töötaja (nimi + e-mail)
- Muuta olemasolevat
- Kustutada kasutaja

### 3. Kasutaja valimine PDF genereerimisel

Enne PDF allalaadimist kuvatakse dialoog, kus kasutaja valib oma nime rippmenüüst. Valitud info salvestatakse ja kasutatakse PDF genereerimise ajal.

### 4. PDF päise uuendamine

Kõik 4 PDF-funktsiooni saavad uue päise struktuuri:

```text
+------------------------------------------+
| [LOGO]  WIHURI AGRI                      |
|         Tehnika võrdlusraport            |
|                                          |
| Kuupäev: 03.02.2026                      |
| Kategooria: Kombainid                    |
| Mudelid: John Deere S7-800, ...          |
|                                          |
| Koostaja: Mart Tamm                      |
| E-post: mart.tamm@wihuri.ee              |
+------------------------------------------+
```

---

## Muudetavad failid

| Fail | Muudatus |
|------|----------|
| **Andmebaas** | Uus tabel `staff_users` |
| `src/hooks/useEquipmentData.ts` | Lisa `useStaffUsers` hook |
| `src/pages/Admin.tsx` | Lisa kasutajate haldamise sektsioon |
| `src/components/comparison/ComparisonPDFExport.tsx` | Lisa kasutaja valik + uuenda PDF päist |
| `src/lib/pdfHelpers.ts` (uus fail) | Logo base64 string ja päise funktsioon |

---

## Detailne teostus

### Samm 1: Andmebaasi migratsioon

```sql
CREATE TABLE public.staff_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Avalik ligipääs (RLS pole vajalik, kuna sisselogimist pole)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on staff_users"
  ON public.staff_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Samm 2: Kasutajate hook (`useEquipmentData.ts`)

```typescript
export function useStaffUsers() {
  return useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: { full_name: string; email: string }) => {
      const { data, error } = await supabase
        .from("staff_users")
        .insert(user)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
    },
  });
}
```

### Samm 3: PDF ekspordi uuendamine

Loon uue abifunktsiooni `addPDFHeader`:

```typescript
function addPDFHeader(
  doc: jsPDF,
  pageWidth: number,
  options: {
    title: string;
    selectedModels?: Equipment[];
    equipmentType?: EquipmentType | null;
    generatorName: string;
    generatorEmail: string;
  }
) {
  // Lisa logo (base64 kujul)
  const logoBase64 = "..."; // Teisendatakse pildifailist
  doc.addImage(logoBase64, "PNG", 14, 8, 25, 25);
  
  // Ettevõtte nimi
  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("WIHURI AGRI", 45, 16);
  
  // Dokumendi pealkiri
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.title, 45, 24);
  
  // Kuupäev
  const date = new Date().toLocaleDateString("et-EE");
  doc.text(`Kuupäev: ${date}`, 14, 42);
  
  // Kategooria ja mudelid (kui on)
  if (options.equipmentType) {
    doc.text(`Kategooria: ${options.equipmentType.name_et}`, 14, 48);
  }
  
  // Genereerija info
  doc.setFontSize(9);
  doc.text(`Koostaja: ${options.generatorName}`, pageWidth - 14, 42, { align: "right" });
  doc.text(`E-post: ${options.generatorEmail}`, pageWidth - 14, 48, { align: "right" });
}
```

### Samm 4: Kasutaja valiku dialoog

Enne PDF allalaadimist avaneb dialoog:

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Vali dokumendi koostaja</DialogTitle>
    </DialogHeader>
    <Select value={selectedUser} onValueChange={setSelectedUser}>
      <SelectTrigger>
        <SelectValue placeholder="Vali oma nimi" />
      </SelectTrigger>
      <SelectContent>
        {staffUsers.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <DialogFooter>
      <Button onClick={handleGeneratePDF}>Genereeri PDF</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Kasutaja kogemus

1. **Admin lisab kasutajad**: Admin -> Kasutajad -> Lisa uus (nimi + e-mail)
2. **PDF genereerimine**: Kliki "Laadi alla PDF" -> Vali kasutaja -> Genereeri
3. **PDF tulemus**: Päises on logo, ettevõtte nimi, koostaja nimi ja e-mail

---

## Tulemus

| Enne | Pärast |
|------|--------|
| Lihtne päis ainult kuupäevaga | Professionaalne päis logo, ettevõtte nime ja koostaja infoga |
| Pole teada, kes dokumendi koostas | Selge jälgitavus: nimi + e-mail igal PDF-il |
| Ettevõtte identiteet puudub | Wihuri Agri bränd igal dokumendil |

