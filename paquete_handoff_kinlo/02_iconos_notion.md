# Kinlo · Íconos estilo Notion — Handoff para Claude Code

> Colócalo en la **raíz del repo** de Kinlo. Objetivo: **unificar TODOS los íconos de la app** al estilo Notion (línea fina, redondeada, monocromática) y evitar que se sigan usando trazos gruesos o colores hardcodeados.
> Referencia visual: `Kinlo Design System.dc.html` → sección **03 · Iconografía**.

---

## 0. PROMPT para pegar en Claude Code
```
Lee 02_iconos_notion.md en la raíz. Vas a unificar TODOS los íconos de la app Kinlo
al estilo Notion siguiendo ese documento.

Qué hacer:
1. Crea un componente central <Icon> (§3) que envuelve lucide-react-native con los defaults
   Notion: strokeWidth 1.75, absoluteStrokeWidth, color desde el token de tema (nunca hardcodeado).
2. Reemplaza en TODA la app los usos directos de lucide-react-native por <Icon name="..." />.
   Elimina cualquier strokeWidth por-ícono (lo controla <Icon>).
3. Usa el mapa semántico nombre→lucide del §4 para no inventar íconos.
4. Respeta tamaños (§5) y color por token (§6). Hit target mínimo 44px.
5. No toques la lógica; solo la capa de presentación de íconos.

Antes de editar, dame la lista de archivos que usan íconos y el plan de reemplazo. Espera mi OK.
No modifiques flujos ni estilos fuera de los íconos.
```

## 1. La regla Notion (memorízala)
- **Trazo `strokeWidth={1.75}`** + `absoluteStrokeWidth` (el grosor no escala con el tamaño).
- **Puntas redondas**: lucide ya trae `linecap/linejoin: round` por defecto — no lo cambies.
- **Monocromático**: un solo color, tomado del **token de tema** (`colors.text`, `colors.textMuted`, `colors.brand`). **Nunca** un hex suelto.
- **Sin relleno** (`fill:none`) salvo una excepción: el corazón "Me interesa" activo (relleno con el color de marca).
- **Grid 24**, tamaños ópticos 18–24 (ver §5).

## 2. Antes / después
```
// ❌ Antes — grueso, color hardcodeado, inconsistente
import { Bell } from 'lucide-react-native';
<Bell size={22} color="#1a1d29" strokeWidth={2} />

// ✅ Después — estilo Notion, color por token, central
<Icon name="bell" size={22} />              // color = colors.text por defecto
<Icon name="bell" size={22} tone="muted" /> // colors.textMuted
```

## 3. Componente central `<Icon>` (créalo)
`components/Icon.tsx` (o `.js`):
```tsx
import React from 'react';
import * as Lucide from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext'; // ajusta la ruta a tu ThemeContext

// Mapa semántico → lucide (ver §4 para la lista completa)
const MAP = {
  discover: 'Compass', home: 'Home', events: 'Calendar', matching: 'Users',
  chat: 'MessageSquare', profile: 'User', search: 'Search', filter: 'SlidersHorizontal',
  back: 'ChevronLeft', forward: 'ChevronRight', add: 'Plus', close: 'X', check: 'Check',
  edit: 'Pencil', share: 'Share2', delete: 'Trash2', camera: 'Camera', bell: 'Bell',
  settings: 'Settings', more: 'MoreHorizontal', heart: 'Heart', star: 'Star',
  ai: 'Sparkles', community: 'UsersRound', verified: 'BadgeCheck', pro: 'Crown',
  payment: 'CreditCard', qr: 'QrCode', broadcast: 'Megaphone', analytics: 'TrendingUp',
  lock: 'Lock', privacy: 'ShieldCheck', view: 'Eye', hide: 'EyeOff', report: 'Flag',
  block: 'Ban', clock: 'Clock', location: 'MapPin', languages: 'Globe',
  profession: 'Briefcase', energy: 'Zap', category: 'Coffee', gift: 'Gift',
};

export function Icon({ name, size = 22, tone = 'default', color, strokeWidth = 1.75, ...rest }) {
  const { colors } = useTheme();
  const Cmp = Lucide[MAP[name] || name] || Lucide.Circle;
  const toneColor = color
    || (tone === 'muted' ? colors.textMuted
      : tone === 'brand' ? colors.brand
      : tone === 'inverse' ? '#FFFFFF'
      : colors.text);
  return <Cmp size={size} color={toneColor} strokeWidth={strokeWidth} absoluteStrokeWidth {...rest} />;
}
```
> Si ya tienes `CategoryIcon`, refactorízalo para que use `<Icon>` internamente (misma regla), no dupliques.
> El corazón activo: `<Icon name="heart" fill={colors.brand} color={colors.brand} />`.

## 4. Mapa semántico completo (nombre Kinlo → lucide)
Navegación: `discover→Compass` · `home→Home` · `events→Calendar` · `matching→Users` · `chat→MessageSquare` · `profile→User` · `search→Search` · `filter→SlidersHorizontal` · `back→ChevronLeft` · `forward→ChevronRight` · `add→Plus` · `close→X`
Acciones: `check→Check` · `edit→Pencil` · `share→Share2` · `delete→Trash2` · `camera→Camera` · `bell→Bell` · `settings→Settings` · `more→MoreHorizontal`
Social/matching: `heart→Heart` · `star→Star` · `ai→Sparkles` · `community→UsersRound` · `verified→BadgeCheck` · `pro→Crown`
Comercio: `payment→CreditCard` · `qr→QrCode` · `broadcast→Megaphone` · `analytics→TrendingUp` · `ticket→Ticket`
Privacidad/estado: `lock→Lock` · `privacy→ShieldCheck` · `view→Eye` · `hide→EyeOff` · `report→Flag` · `block→Ban` · `clock→Clock`
Perfil/atributos: `location→MapPin` · `languages→Globe` · `profession→Briefcase` · `energy→Zap`
Categorías (ejemplos): `category→Coffee` · `hiking→Mountain` · `music→Music` · `gift→Gift`
> ¿Falta un ícono? Elige el lucide más simple y minimal, y agrégalo al `MAP`. No mezcles otras librerías.

## 5. Tamaños
| Uso | size |
|-----|------|
| Inline en texto / metadatos | 14–16 |
| Botones, filas de lista, chips | 18–20 |
| Tab bar, headers, acciones principales | 22–24 |
| Tile de feature (dentro de cuadro pastel) | 20–26 |
- Hit target mínimo **44×44** (el ícono va centrado en un contenedor de ≥44).
- Excepción de peso: micro-checks dentro de badges ≤14px pueden ir a `strokeWidth 2.5–3` para legibilidad.

## 6. Color (siempre por token)
- Default `colors.text` (`#1a1d29`) · atenuado `colors.textMuted` (`#8a8f9c`) · activo/marca `colors.brand` (`#7C3AED`).
- Sobre fondos oscuros (QR, paywall): `#FFFFFF` o lila `#C792EA` (`tone="inverse"` o `color`).
- Semánticos por tipo de match cuando aplique: Friend `#1F8A6E` · Professional `#4F5BD5` · Romantic `#E91E8C`.
- **Prohibido** hex sueltos repartidos por las pantallas: todo sale del tema.

## 7. Migración — pasos
1. Crea `components/Icon.tsx` (§3) y expórtalo.
2. Busca usos de lucide en el repo: `grep -r "lucide-react-native" src/`.
3. Sustituye cada `<IconName ... />` por `<Icon name="..." />` según el §4; borra `strokeWidth`, `color` hardcodeado y `size` mágicos (usa la escala §5).
4. Refactoriza `CategoryIcon` para delegar en `<Icon>`.
5. QA visual contra `Kinlo Design System.dc.html` §03 y las pantallas del canvas.

## 8. Checklist
- [ ] `<Icon>` central con `strokeWidth 1.75` + `absoluteStrokeWidth` + color por token.
- [ ] 0 imports directos de `lucide-react-native` fuera de `Icon.tsx`.
- [ ] 0 `strokeWidth`/`color` hardcodeados en pantallas.
- [ ] `CategoryIcon` delega en `<Icon>`.
- [ ] Todos los íconos del §4 disponibles por nombre.
- [ ] Tamaños según §5, hit target ≥44.
- [ ] QA visual vs Design System §03.

---
_Fuente de verdad de estilo: `Kinlo Design System.dc.html`. Este documento es solo la guía de aplicación de íconos; el resto del sistema (color, tipografía, componentes) está en el §7 de `03_feature_community_matching.md`._
