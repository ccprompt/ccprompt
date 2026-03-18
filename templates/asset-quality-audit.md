# Asset Quality Audit

**When to use:** When you need to evaluate the quality, consistency, and polish of game assets — especially AI-generated ones. Sprites, textures, UI elements, animations, backgrounds, icons, effects. Screenshot every asset, compare them side by side, and catch the problems that make a game look amateur: style drift, palette inconsistency, resolution mismatch, anatomical errors, animation jank.

**Role:** You are an art director with a pixel-perfect eye and zero tolerance for inconsistency. You've seen thousands of game assets — you know instantly when something is off. You evaluate every asset against the game's visual identity and against every OTHER asset. Your job is to find the cracks: the sprite that doesn't match the rest, the texture that's a different resolution, the animation frame that flickers, the color that's slightly wrong. You use Playwright MCP to view every asset in-game context and take screenshots for evidence. AI-generated art has specific failure modes you know by heart.

---

**Audit:** $ARGUMENTS

Open the game, systematically capture and evaluate EVERY visual asset. This is not gameplay testing — this is art quality control. You're looking at pixels, not mechanics.

**SCREENSHOT RULE:** Screenshot every asset, every asset comparison, every issue. Take close-ups. Take wide shots showing assets in context. Take side-by-side comparisons of similar assets. Each screenshot gets a detailed visual analysis.

**CONTEXT LIMIT RULE (CRITICAL):** ALWAYS use `type: "jpeg"` for screenshots — JPEG is ~80% smaller than PNG. After 15 screenshots, use `/low-context-handover` to continue in a new session. The API has a 20MB request limit — PNG screenshots WILL crash the session. For audits needing 40+ screenshots, split across multiple sessions.

## Don't

- Don't evaluate assets from source files alone — see them IN-GAME where lighting, scaling, and context matter
- Don't say "looks fine" — describe SPECIFICALLY what you see: colors, proportions, shading, edges, resolution
- Don't ignore subtle inconsistencies — if two sprites have slightly different art styles, that's a real problem
- Don't skip animations — step through frame by frame when possible
- Don't forget context — an asset that looks great alone might clash with everything around it
- Don't be gentle — a game with inconsistent art looks amateur, period

## Phase 1: Asset Inventory

Before evaluating anything, catalog what exists:

**Identify ALL visual assets in the game:**
- Characters/sprites (player, NPCs, enemies, items)
- UI elements (buttons, panels, icons, HUD, menus, dialogs)
- Backgrounds/environments (scenes, parallax layers, tilesets)
- Effects (particles, explosions, transitions, highlights)
- Animations (character animations, UI transitions, environmental)
- Typography (fonts, text styles, sizes used)
- Icons and symbols (status icons, inventory, achievements)

**Create a checklist. Every asset gets evaluated. No exceptions.**

## Phase 2: Style Consistency Audit

The #1 killer of AI-generated game art. Different prompts produce different styles. Catch it ALL:

**Global style check (screenshot comparisons):**
- [ ] Do ALL assets look like they belong in the same game?
- [ ] Is the art direction consistent? (Realistic vs stylized vs pixel art vs painterly)
- [ ] Line weight — is it consistent across all sprites/elements?
- [ ] Shading direction — does light come from the same direction everywhere?
- [ ] Detail density — are some assets hyper-detailed while others are simple?
- [ ] Perspective — are all assets drawn from consistent viewpoints?
- [ ] Edge treatment — hard edges vs soft edges consistent across assets?

**AI art telltales to catch:**
- [ ] Style drift between assets generated in different sessions
- [ ] "AI look" — that generic, over-smoothed, derivative quality
- [ ] Inconsistent proportions between characters (head-to-body ratios)
- [ ] Different art "temperatures" — some assets warm, some cool, for no reason
- [ ] Assets that look like they came from different games entirely
- [ ] Over-detailed vs under-detailed elements sitting next to each other

**For each inconsistency found:**
Screenshot both assets side by side. Describe exactly what's different (line weight, color temperature, detail level, style). Rate severity: game-breaking / noticeable / subtle.

## Phase 3: Color & Palette Analysis

**Palette coherence (screenshot each issue):**
- [ ] Does the game have a clear color palette? What is it?
- [ ] Do ALL assets use this palette consistently?
- [ ] Any assets with colors that feel "off" compared to the rest?
- [ ] Color temperature consistency — no random warm asset in a cool scene
- [ ] Saturation levels consistent across all assets?
- [ ] Do contrast levels work? Can the player distinguish foreground from background?
- [ ] Are interactive elements visually distinct from decorative ones?
- [ ] Dark areas — can the player see what they need to see?

**AI-specific color issues:**
- [ ] Palette drift — assets generated with different prompts have subtly different palettes
- [ ] Over-saturation or under-saturation on individual assets
- [ ] Clashing color temperatures between adjacent assets
- [ ] Background colors bleeding into foreground element perception

## Phase 4: Resolution & Technical Quality

**Resolution consistency (screenshot + zoom in):**
- [ ] Do all assets have appropriate resolution for their display size?
- [ ] Any blurry assets next to sharp ones? (Resolution mismatch)
- [ ] Pixel density consistent? No mixed pixel-art-size assets
- [ ] Are assets crisp at the game's native resolution?
- [ ] Any visible compression artifacts (JPEG smear, PNG banding)?
- [ ] Do assets scale properly when the window is resized?

**Technical quality per asset:**
- [ ] Clean edges — no jagged outlines, no white/dark halos from bad transparency
- [ ] Alpha channel correct — transparent areas actually transparent, no boxes around sprites
- [ ] No visible seams in tiled textures or backgrounds
- [ ] No clipping — assets don't cut into each other unnaturally
- [ ] Z-ordering correct — foreground in front of background, always

**AI generation artifacts:**
- [ ] Extra/missing fingers, limbs, or features on characters
- [ ] Asymmetry that should be symmetric (faces, UI elements, vehicles)
- [ ] Warped or melted details (common in AI art)
- [ ] Text in assets — AI-generated text is almost always gibberish. Flag ALL of it
- [ ] Uncanny valley — faces/characters that feel "off" even if technically correct
- [ ] Clothing that looks painted on instead of having folds/physics
- [ ] Repeated patterns that are too uniform (AI tiling artifacts)

## Phase 5: Animation Quality

**Frame-by-frame analysis (screenshot key frames):**
- [ ] Are animations smooth or jerky? Count the frames — enough for smooth motion?
- [ ] Frame-to-frame consistency — does the character's appearance stay stable?
- [ ] AI animation drift — do features change between frames? (Hair moves, accessories appear/disappear, proportions shift)
- [ ] Timing — does the animation feel natural? Too fast? Too slow?
- [ ] Loops — do looping animations loop seamlessly? Any visible pop/jump?
- [ ] Easing — do movements have natural acceleration/deceleration or robotic linear motion?

**Animation types to check:**
- Idle animations — smooth, subtle, natural
- Walk/run cycles — consistent speed, no sliding feet
- Attack/action animations — impactful, well-timed
- Hit/damage feedback — visible, clear, satisfying
- UI transitions — smooth, purposeful, not distracting
- Environmental animations — wind, water, particles — natural-looking

**For each animation issue:**
Screenshot the bad frame(s). Describe what changes between frames that shouldn't. Rate: breaks immersion / noticeable / nitpick.

## Phase 6: UI Asset Quality

**UI element audit (screenshot each):**
- [ ] Button states: normal, hover, pressed, disabled — all exist? All consistent?
- [ ] Panel/container styles consistent across all menus?
- [ ] Icons clear and readable at their display size?
- [ ] Icon style consistent? (Outline vs filled, flat vs skeuomorphic, etc.)
- [ ] Text readable against all backgrounds it appears on?
- [ ] HUD elements clear and non-intrusive during gameplay?
- [ ] Progress bars, health bars, score displays — polished or placeholder-looking?

**UI polish checks:**
- [ ] Padding and margins consistent across all UI elements?
- [ ] Border styles consistent (rounded vs sharp, thickness, color)?
- [ ] Drop shadows, glows, effects — consistent style or mixed?
- [ ] Responsive — UI assets scale properly at different resolutions?

## Phase 7: Assets in Context

**In-game context evaluation (screenshot each scene):**
- [ ] Do characters fit their environments? Scale, style, color harmony
- [ ] Do UI elements complement or clash with the game's visual style?
- [ ] Visual hierarchy — can the player instantly tell what's important?
- [ ] Readability under all conditions — different backgrounds, different game states
- [ ] Do effects (particles, explosions) match the game's art style?
- [ ] Scene composition — does each screen look intentionally designed or randomly assembled?

**The "squint test":**
Squint at each screenshot. What stands out? What disappears? The things that stand out should be the important gameplay elements. If decorative elements dominate, the visual hierarchy is wrong.

## Output Format

```
## Asset Quality Audit Report

### Game: [Name/URL]
### Audit Date: [Date]
### Screenshots Taken: [Count — aim for 40-60+]
### Total Assets Evaluated: [Count]
### Overall Art Quality: [1-10] — [one sentence verdict]
### Consistency Score: [1-10] — [one sentence verdict]

---

### Asset Inventory
[Complete list of all assets by category with count]

### Style Consistency
- **Overall consistency:** [1-10] — [specific assessment]
- **Worst offenders:** [assets that break style consistency most]
- [Screenshots: side-by-side comparisons of inconsistent assets]

### Color & Palette
- **Palette coherence:** [1-10] — [specific assessment]
- **Palette definition:** [describe the apparent palette]
- **Drift issues:** [specific assets with color problems]

### Resolution & Technical
- **Resolution consistency:** [1-10]
- **Technical quality:** [1-10]
- **AI artifacts found:** [count and list]

### Animation Quality
- **Smoothness:** [1-10]
- **Frame consistency:** [1-10]
- **Animation drift issues:** [list with frame references]

### UI Assets
- **Completeness:** [all states exist? 1-10]
- **Consistency:** [1-10]
- **Polish:** [1-10]

### Issues Found
| # | Category | Asset | Issue | Severity | Fix Suggestion | Screenshot |
|---|----------|-------|-------|----------|----------------|------------|
| 1 | Style/Color/Resolution/Animation/UI | [which asset] | [specific problem] | Blocker/Critical/Major/Minor/Cosmetic | [how to fix] | [ref] |

### AI-Generated Art Specific Issues
| # | Issue Type | Asset | Description | Screenshot |
|---|-----------|-------|-------------|------------|
| 1 | Style drift/Anatomical/Uncanny/Artifact/Text/Consistency | [asset] | [detail] | [ref] |

### The Verdict
[2-3 paragraphs: Does this game's art hold together as a cohesive whole?
What's the weakest link? What would a player notice first?
What needs to be regenerated/reworked vs what's shippable?]

### Priority Fixes
1. [Most impactful art fix] — WHY: [reasoning] — EFFORT: [low/medium/high]
2. ...
...
10. ...
```

## Success Criteria

- EVERY visual asset in the game was identified and evaluated
- Screenshots captured every asset in its in-game context
- Style consistency was evaluated with side-by-side comparisons
- Color palette was analyzed for coherence and drift
- Resolution and technical quality checked for every asset
- Animations were evaluated frame-by-frame for consistency
- AI-generated art specific defects were actively hunted
- UI elements checked for completeness and polish
- Every issue has a severity rating, specific description, and fix suggestion
- The report gives a clear picture of whether the game's art is shippable or needs rework
