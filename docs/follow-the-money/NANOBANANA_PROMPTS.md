# Nanobanana Sprite Generation Prompts
## Follow The Money - Chibi Character Sprites

Use these prompts with nanobanana to generate custom chibi sprites for the game.

---

## Character 1: Medic Mario

**Prompt**:
```
chibi style cute character, medical student with red cap and stethoscope around neck,
wearing white coat with red cross badge, smiling friendly expression,
2:1 head to body ratio, simple clean design, transparent background PNG,
front facing view, full body, bright colors, kawaii anime style,
512x512 pixels
```

**Color Palette**:
- Hat: `#E60012` (Mario red)
- Coat: `#FFFFFF` (white)
- Skin: `#FFDBAC` (peachy)
- Stethoscope: `#4A4A4A` (dark gray)

---

## Character 2: Scholar Luigi

**Prompt**:
```
chibi style cute character, studious student with green cap and round glasses,
holding notebook and pen, wearing green vest over white shirt,
curious thoughtful expression, 2:1 head to body ratio,
simple clean design, transparent background PNG, front facing view,
full body, bright colors, kawaii anime style, 512x512 pixels
```

**Color Palette**:
- Hat/Vest: `#00A651` (Luigi green)
- Shirt: `#FFFFFF` (white)
- Glasses: `#FFD700` (gold frames)
- Notebook: `#4169E1` (royal blue)

---

## Character 3: Professor Peach

**Prompt**:
```
chibi style cute character, elegant professor with pink dress and graduation cap,
holding pointer stick and apple, wearing academic gown with pink trim,
confident wise expression, 2:1 head to body ratio, simple clean design,
transparent background PNG, front facing view, full body,
bright colors, kawaii anime style, 512x512 pixels
```

**Color Palette**:
- Dress: `#FF69B4` (hot pink)
- Cap: `#000000` (black graduation cap)
- Gown: `#6B46C1` (purple)
- Apple: `#DC143C` (crimson)

---

## Character 4: Scientist Toad

**Prompt**:
```
chibi style cute character, lab scientist with red spotted mushroom cap and goggles,
wearing white lab coat with beakers and test tubes, excited cheerful expression,
2:1 head to body ratio, simple clean design, transparent background PNG,
front facing view, full body, bright colors, kawaii anime style, 512x512 pixels
```

**Color Palette**:
- Cap: `#FF4444` with `#FFFFFF` spots (red mushroom)
- Lab Coat: `#FFFFFF` (white)
- Goggles: `#00CED1` (turquoise)
- Test tubes: `#32CD32` and `#FF6347` (green and red liquids)

---

## Game Elements

### Money Bag Sprite

**Prompt**:
```
kawaii golden money bag with dollar sign, shiny metallic texture,
sparkles and glow effect, cute smiling face on bag,
simple cartoon style, transparent background PNG, isometric view,
256x256 pixels, bright yellow gold color
```

**Color**: `#FFD700` (gold) with `#FFA500` (orange) shadows

---

### Shell Container (Closed)

**Prompt**:
```
3D game shell container closed, smooth purple shell with blue gradient,
glossy shiny surface, slight shadow underneath, isometric view,
simple clean design, transparent background PNG, 256x256 pixels,
modern minimalist style
```

**Color**: Purple to blue gradient `#8B5CF6` → `#3B82F6`

---

### Shell Container (Open)

**Prompt**:
```
3D game shell container open revealing inside, same purple-blue gradient,
showing interior hollow space, glossy shiny surface, slight shadow,
isometric view, simple clean design, transparent background PNG,
256x256 pixels, modern minimalist style
```

---

## Usage Instructions

1. **Visit nanobanana.com** (or your preferred AI image generator)
2. Copy each prompt exactly
3. Generate at 512x512 for characters, 256x256 for game elements
4. Download as PNG with transparent background
5. Save to `/public/sprites/follow-the-money/`

### File Naming Convention:
```
chibi-medic.png
chibi-scholar.png
chibi-professor.png
chibi-scientist.png
money-bag.png
shell-closed.png
shell-open.png
```

---

## Optional: Particle Effects

### Sparkle Particle
```
small golden star sparkle particle, glowing effect,
transparent background PNG, 64x64 pixels, simple design
```

### Confetti Particle
```
colorful confetti particle, red blue yellow green,
falling animation sprite, transparent background PNG,
64x64 pixels, simple shapes
```

---

## Alternative Tools

If nanobanana is unavailable, use:
- **DALL-E 3**: Same prompts work
- **Midjourney**: Add `--ar 1:1 --v 6` to prompts
- **Stable Diffusion**: Use with `chibi anime` LoRA
- **Leonardo.ai**: Anime preset with prompts

---

**Status**: Prompts ready for generation
**Next**: Generate sprites and save to sprites directory
**Integration**: Components will load from `/sprites/follow-the-money/`
