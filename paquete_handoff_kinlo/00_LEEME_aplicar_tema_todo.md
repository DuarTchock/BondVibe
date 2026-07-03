# Kinlo · Aplicar el tema "Clean" a TODO el proyecto (prompt maestro para Claude Code)

## Cómo usar (3 pasos)
1. Guarda este archivo en la **raíz del repo** (junto a los otros que ya pusiste: `01_tokens_tema_clean.md`, `02_iconos_notion.md`, `03_feature_community_matching.md`, `04_mapeo_nombres.md`).
2. En Claude Code, pega el **PROMPT** de abajo — o simplemente escribe: `Lee 00_LEEME_aplicar_tema_todo.md y síguelo al pie de la letra.`
3. Ve aprobando fase por fase (te pedirá OK en cada una).

> Requiere que en la raíz estén también `01_tokens_tema_clean.md` (tokens) e `02_iconos_notion.md` (íconos). Referencia visual: `Kinlo Design System.dc.html` y la columna "DESPUÉS" de `Kinlo Profile Rediseño (Diff).dc.html`.

---

## PROMPT (pégalo en Claude Code)
```
CONTEXTO
La app Kinlo (Expo/React Native) se está renderizando con un tema oscuro (fondo negro, bordes
rosa neón, glow). Quiero migrar TODA la app —todas las pantallas, sin excepción— al tema "Clean"
(claro) definido en:
- Kinlo Design System.dc.html   (fuente de verdad visual)
- 03_feature_community_matching.md §7 (resumen del sistema)
- 01_tokens_tema_clean.md          (tokens + reglas)
- 02_iconos_notion.md      (íconos)

OBJETIVO
Que cada pantalla se vea como la columna "DESPUÉS" de Kinlo Profile Rediseño (Diff).dc.html:
fondo claro #F1F0F4, tarjetas blancas con sombra suave, gradiente de marca en acentos, tipografía
Space Grotesk + Plus Jakarta Sans, íconos estilo Notion (trazo 1.75). NO cambies contenido ni lógica,
solo el tema/estilos.

TRABAJA POR FASES Y DETENTE A QUE YO REVISE CADA UNA

FASE 1 — Centralizar tokens (fundamento)
- Crea/edita theme-tokens.js con los valores del §2 de 01_tokens_tema_clean.md.
- Define el tema "clean" y ponlo como tema POR DEFECTO y ÚNICO activo en ThemeContext.
- Si existe un tema oscuro/aurora, NO lo apliques por defecto (déjalo inactivo).
- Asegura que las fuentes Space Grotesk y Plus Jakarta Sans estén cargadas.
- Entregable: el diff de theme-tokens.js + ThemeContext. Espera mi OK.

FASE 2 — Auditoría de hardcodeados (antes de tocar pantallas)
- Lista TODOS los archivos con color/estilo hardcodeado. Corre y pégame la salida:
  grep -rniE "#([0-9a-f]{6}|[0-9a-f]{3})" src/ | grep -viE "theme-tokens|colors\."
  grep -rniE "#(FF3E9A|0E1117|05070C|160F22|171B26|3DDCFF|F0573D|2A2520)" src/
  grep -rniE "shadowColor|elevation|borderWidth: ?2|lucide-react-native" src/
- Dame un inventario: archivo -> qué hay que cambiar. Espera mi OK.

FASE 3 — Componentes base (una vez, se propaga a todo)
- Refactoriza los primitivos para que lean SOLO tokens: Screen/Container, Card, Button (primario=
  gradiente de marca; secundario blanco), ListRow, Chip, Badge (incl. PRO), Toggle, SegmentedControl,
  Input/Search, TabBar, StatusBar, Avatar, SectionHeader (eyebrow mono).
- Crea el <Icon> central (lucide, strokeWidth 1.75, absoluteStrokeWidth, color por token) y refactoriza
  CategoryIcon para delegar en él. Ver 02_iconos_notion.md.
- Elimina bordes neón de 2px, el "underline"/glow rosa de las tarjetas y las sombras rosa; usa la
  sombra neutra suave del token (0 1px 3px rgba(0,0,0,0.06)) y flotante para tab bar/FAB.

FASE 4 — Barrido de TODAS las pantallas (ninguna queda fuera)
Aplica los primitivos y tokens a cada pantalla/ruta del proyecto, incluyendo como mínimo:
- Auth/onboarding, Home/Inicio, Explore/Descubre, Feed, My Events/Eventos, Event detail,
  Notifications, Create, Get around/Rentas (marketplace + detalle + checkout), Chat/Vibes,
  Memberships/planes, Profile y sus subpáginas (editar, pagos/Stripe, safety center, appearance),
  Host dashboard/analytics, y TODO Community Matching (A1-E4: opt-in, consentimiento, perfil,
  looking-for, check-in QR, bloqueado, grid, perfil, match, paywall, host controls, analytics,
  visibilidad, upsell y checkouts Pro/Plus, éxito).
- Regla: 0 fondos oscuros como fondo global, 0 rosa neón como borde suelto, 0 hex fuera de tokens.
- Superficies oscuras permitidas SOLO puntualmente (QR scanner, paywall, banner Pro) usando colors.dark.
- Botón "Connect Spotify": único que conserva verde (verde de marca de Spotify).

FASE 5 — Verificación
- Corre de nuevo los grep de la Fase 2: no debe quedar hex hardcodeado fuera de theme-tokens.js.
- Recórrete cada pantalla y compárala con "DESPUÉS" del Diff y con el Design System.
- Dame una lista de pantallas revisadas con captura o nota de estado.

REGLAS DURAS
- No toques lógica, navegación ni datos: solo estilos/tema.
- Todo color/tipografía/sombra/ícono sale de tokens o primitivos, nunca hardcodeado.
- Si dudas de un valor, úsalo desde el Design System, no inventes.
- Haz commits pequeños por fase para poder revisar.

Empieza por la FASE 1 y muéstrame el plan de archivos antes de editar.
```
