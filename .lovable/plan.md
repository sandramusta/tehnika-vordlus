

# Vahelehe nime muutmine: Haldus → Admin

## Ülevaade

Muuda navigatsiooni vahelehe nimi "Haldus" ümber nimeks "Admin" päise komponendis.

## Muudatus

### Fail: `src/components/layout/Header.tsx`

Muuda rida 8:

```typescript
// Praegu:
const navItems = [
  { href: "/", label: "Võrdlus", icon: BarChart3 },
  { href: "/myths", label: "Müüdid", icon: MessageSquareWarning },
  { href: "/admin", label: "Haldus", icon: Settings },
];

// Uuendatud:
const navItems = [
  { href: "/", label: "Võrdlus", icon: BarChart3 },
  { href: "/myths", label: "Müüdid", icon: MessageSquareWarning },
  { href: "/admin", label: "Admin", icon: Settings },
];
```

## Tulemus

Navigatsiooni vaheleht kuvatakse nüüd nimega "Admin" (varasema "Haldus" asemel).

