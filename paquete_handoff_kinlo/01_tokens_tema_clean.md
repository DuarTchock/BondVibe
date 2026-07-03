# Kinlo · Aplicar el tema "Clean" a TODA la app (para Claude Code)

> Ponlo en la **raíz del repo**. Objetivo: la app hoy se ve con el tema **oscuro Aurora** (fondo negro, bordes rosa neón, glow). Queremos el tema **Clean** (claro, neutro, tarjetas blancas, gradiente de marca) — el que está en `Kinlo Design System.dc.html` y en el §7 de `03_feature_community_matching.md`.

## 0. Diagnóstico (por qué no se aplicó)
El tema no cambió porque probablemente:
- Los colores están **hardcodeados por pantalla/componente** (p.ej. `#FF3E9A`, fondos oscuros, `borderColor` neón, sombras rosa) en lugar de venir de un token central.
- Hay un **tema oscuro por defecto**; nunca se definió/activó un tema `clean`.
- No se usó el Design System como fuente de verdad.

La solución NO es tocar pantalla por pantalla a mano: es **centralizar tokens** y **activar Clean como tema por defecto**, luego reemplazar los valores hardcodeados por tokens.

## 1. PROMPT para pegar en Claude Code
```
La app Kinlo se está renderizando con un tema oscuro (fondo negro, bordes rosa neón, glow).
Quiero que TODA la app use el tema "Clean" (claro) definido en Kinlo Design System.dc.html y en
el §7 de 03_feature_community_matching.md. Usa 01_tokens_tema_clean.md como especificación.

Haz esto (deteniéndote a que yo revise cada paso):

1) Centraliza tokens: crea/edita el tema en theme-tokens.js (o ThemeContext) con los valores del §2
   de 01_tokens_tema_clean.md. Define "clean" y ponlo como tema POR DEFECTO y único activo.
   Si existe un tema oscuro/aurora, NO lo apliques por defecto.

2) Erradica colores hardcodeados: busca en todo el repo hex y estilos neón y reemplázalos por
   tokens. En especial:
   - fondos oscuros (#0E1117, #05070C, #160F22, #171B26, etc.) -> colors.bg / colors.surface
   - rosa neón #FF3E9A y bordes/`borderColor` de acento -> quítalos; el acento es el gradiente de marca
   - sombras/`shadowColor` rosa y "glow" -> sombra neutra suave (§2 elevación)
   Comando sugerido: grep -rniE "#(FF3E9A|0E1117|05070C|160F22|171B26|3DDCFF)" src/

3) Superficies: fondo de pantalla colors.bg (#F1F0F4), tarjetas colors.surface (#FFFFFF) con
   radio 16-22 y sombra suave 0 1px 3px rgba(0,0,0,0.06). Elimina los bordes de 2px y el
   "underline"/glow rosa de las tarjetas.

4) Tipografía: Space Grotesk para títulos/números/precios; Plus Jakarta Sans para cuerpo (§3).

5) Íconos estilo Notion: usa el <Icon> central (strokeWidth 1.75, color por token). Ver
   02_iconos_notion.md. Nada de íconos rosa hardcodeados.

6) Botón primario = gradiente de marca; NO uses verde salvo el botón de Spotify (su verde de marca).

No cambies el contenido ni la lógica; solo el tema/estilos. Antes de editar, dame el plan de
archivos (tokens + lista de archivos con hex hardcodeados) y espera mi OK.
```

## 2. Tokens del tema Clean (fuente de verdad)
Pega esto en `theme-tokens.js` (ajusta la forma a tu ThemeContext). **Clean es el tema por defecto.**
```js
export const clean = {
  // superficies
  bg:        '#F1F0F4',   // fondo de pantalla (antes: negro)
  surface:   '#FFFFFF',   // tarjetas
  sunken:    '#F7F5FB',   // campos / tiles de ícono alternos
  frame:     '#DDDAE4',   // marco device

  // texto
  text:      '#1a1d29',
  textSec:   '#5b6072',
  textMuted: '#8a8f9c',
  hairline:  '#EEEDF2',   // divisores (también #E7E5EE)

  // marca
  brand:     '#7C3AED',
  brandSoft: '#F1E9FE',   // superficie violeta (tiles de ícono)
  brandGradient: ['#7C3AED', '#C026D3', '#FF3E9A'], // 135deg, SOLO en CTAs/acentos

  // superficies oscuras puntuales (QR, paywall, banner Pro) — NO el fondo global
  dark:      '#160F22',
  lilac:     '#C792EA',

  // semánticos tipo de match
  friend:    '#1F8A6E', friendSoft:    '#E1F5EC',
  professional:'#4F5BD5', professionalSoft:'#E6EAFB',
  romantic:  '#E91E8C', romanticSoft:  '#FBE4F1',

  // feedback
  success:   '#1F8A6E',
  warn:      '#B45309', warnSoft: '#FBEFD6',
  danger:    '#c25b5b',

  // avatares pastel
  avatarPastels: ['#ECE6FB','#FBE4F1','#E6EAFB','#E1F5EC','#FBEDE4'],
};

export const radius   = { chip: 999, card: 18, cardLg: 22, button: 26, tile: 13 };
export const elevation = {
  card:     { color:'#000', opacity:0.06, radius:3, y:1 },  // 0 1px 3px rgba(0,0,0,.06)
  floating: { color:'#1e1432', opacity:0.14, radius:30, y:10 }, // tab bar, botón flotante
  brand:    { color:'#7C3AED', opacity:0.30, radius:22, y:10 }, // botón gradiente
};
export const font = {
  display: 'SpaceGrotesk-Bold',   // títulos, números, precios, badges
  body:    'PlusJakartaSans',      // cuerpo, listas, labels
};
```

## 3. Reglas rápidas (checklist visual)
- [ ] Fondo de la app **claro** `#F1F0F4` (no negro).
- [ ] Tarjetas **blancas** con sombra suave; **sin** borde neón ni "underline"/glow rosa.
- [ ] Acento = **gradiente de marca** morado→magenta. Rosa neón `#FF3E9A` solo vive **dentro** del gradiente, nunca como borde suelto.
- [ ] Números y títulos en **Space Grotesk**.
- [ ] Íconos **line/Notion** trazo **1.75**, color por token (no rosa hardcodeado).
- [ ] Botón primario gradiente; verde **solo** para "Connect Spotify".
- [ ] Chips/badges: superficie suave + texto de marca (ver Design System §04).
- [ ] Barra de estado y tab bar según Design System.

## 4. Cómo verificar
Compara contra la columna **"DESPUÉS"** de `Kinlo Profile Rediseño (Diff).dc.html` y contra `Kinlo Design System.dc.html`. Si una pantalla sigue oscura o con borde rosa, es que aún tiene hex hardcodeado: reemplázalo por token.

> Nota: si en el futuro quieres ofrecer modo oscuro, hazlo como un segundo tema que hereda estos tokens — pero el **default es Clean**.
