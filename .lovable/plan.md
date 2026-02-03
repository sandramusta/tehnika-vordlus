
# Võrdlustabeli esimese mudeli tulba ühtlustamine

## Probleem
Võrdlustabelis on esimese masina (John Deere) tulba taustavärv ebaühtlane:
- Ülemine osa (päis, tehnilised näitajad, hinnad ja kulud) on **valge**
- Alumine osa (alates MOOTOR sektsioonist) on **rohekas** (`bg-primary/5`)

## Lahendus
Lisada esimesele mudelile (selectedModelId) rohekas taustavärv kogu tulba ulatuses - nii päises kui ka kõikides andmeridades.

## Muudatused failis `MultiModelComparison.tsx`

### 1. Päise read (brand nimi ja mudeli nimi)
Lisada esimese mudeli lahtritesse `bg-primary/5`:
```tsx
// Model Names Row - line ~240
{selectedModels.map((model, index) => {
  const isFirstModel = index === 0;
  return (
    <th 
      key={model.id} 
      className={cn(...)}
      style={{ backgroundColor: isFirstModel ? 'rgb(34 197 94 / 0.05)' : 'white' }}
    >
```

### 2. Piltide rida
Sama loogika piltide reale:
```tsx
// Model Images Row - line ~264
style={{ backgroundColor: isFirstModel ? 'rgb(34 197 94 / 0.05)' : 'white' }}
```

### 3. Spec read (renderSpecRow funktsioon)
Lisada `bg-primary/5` esimese mudeli lahtritele:
```tsx
<td
  key={model.id}
  className={cn(
    "p-3 text-center text-sm font-medium",
    index === 0 && "bg-primary/5"
  )}
>
```

### 4. Hinnad ja kulud sektsiooni päis
Muuta et esimese mudeli tulbas säiliks rohekas taust.

### 5. TCO rida
Lisada sama loogika TCO reale:
```tsx
className={cn(
  "p-3 text-center text-sm font-semibold",
  index === 0 && "bg-primary/5"
)}
```

## Tulemus
Pärast muudatusi on esimese mudeli tulp ühtlaselt rohekas kogu tabeli ulatuses - päisest kuni viimase detailse spetsifikatsiooni reani.
