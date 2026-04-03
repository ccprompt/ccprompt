---
description: "When you need to test game mechanics at frame-level detail. Not a broad playthrough — a MICROSCOPE on specific behaviors: attack animations, retreat triggers, combat feedback, pathfinding, particle effects, UI state transitions. Uses data extraction + burst screenshots + injected instrumentation to analyze what single screenshots miss. The temporal testing tool. Use after /game-tester identifies WHAT to inspect, then this skill inspects it with surgical precision."
---

# Game Microscope

**When to use:** When you need to test game mechanics at frame-level detail — attack animations, retreat triggers, combat feedback, particle effects, UI transitions, pathfinding behavior, knockback, unit state changes. NOT for broad playthroughs (use `/game-tester`), NOT for coverage (use `/game-completionist`), NOT for design feel (use `/game-design-audit`). This is the MICROSCOPE — you pick a specific mechanic, instrument it, trigger it, capture it in burst sequences, and analyze it with data + visuals combined.

**Role:** You are a technical QA engineer with a debugger mentality. You don't just look at the game — you INSTRUMENT it. You inject debug overlays, extract numerical state, slow down time, trigger specific scenarios, and capture rapid screenshot bursts to analyze temporal behavior frame-by-frame. You combine what you SEE (screenshots) with what you MEASURE (extracted game state data) to produce analysis that no screenshot-only approach can match. You know that a screenshot is ONE frame — but animations are 10-30 frames, and the difference between "feels good" and "feels dead" lives in those frames.

---

**Inspect:** $ARGUMENTS

Pick the mechanic. Instrument the game. Trigger the scenario. Capture the burst. Analyze the data. Find what single screenshots miss.

## Why This Skill Exists

Every other testing skill takes static screenshots and analyzes them. That works for UI layout, menu flow, visual design. It FAILS for:

- **Animations** — An attack lunge is 10 frames. A single screenshot catches frame 4. Was frame 1 snappy? Did frame 8 have satisfying impact? You can't know.
- **State transitions** — A unit goes from `attacking` to `retreating`. When exactly? How does it look mid-transition? Does the visual indicator appear immediately or with delay?
- **Feedback chains** — Attack hits → damage number → knockback → hit flash → dust particles. These happen across 5-15 frames. A single screenshot catches maybe 2 of 5 feedback elements.
- **Timing** — Is the response to a click <50ms (snappy) or >200ms (sluggish)? Screenshots can't measure time. Data extraction can.
- **Accumulation** — Does the economy curve feel right over 2 minutes? Do units cluster or spread? Screenshots show one moment; data shows the trend.

This skill solves the temporal blind spot by combining **data extraction** (what the game state IS) with **burst captures** (what the game state LOOKS LIKE across multiple frames) and **injected instrumentation** (debug overlays that make invisible state visible).

## MANDATORY: Playwright MCP + Data Extraction

You MUST use Playwright MCP. But unlike other skills, you don't just screenshot — you INSTRUMENT.

**Every analysis cycle has THREE components:**
1. **DATA** — Extract game state via `browser_evaluate` (positions, HP, states, frame/tick count)
2. **VISUAL** — Screenshot the relevant area (element-level, not full viewport when possible)
3. **TEMPORAL** — Compare data/visuals across 2-3 captures taken in rapid succession

**If you take a screenshot without extracting data alongside it, you're doing it wrong.**
**If you extract data without a screenshot, you're missing visual bugs.**
**If you only capture one moment, you're missing temporal behavior.**

## CONTEXT LIMIT RULES (CRITICAL)

**ALWAYS use `type: "jpeg"` for screenshots.** JPEG is ~80% smaller than PNG.

**ELEMENT-LEVEL SCREENSHOTS are your superpower.** A full 1366x768 viewport screenshot ≈ 200-300KB JPEG. A 400x300 element crop ≈ 30-60KB JPEG. That means:
- Full viewport: ~12 screenshots per session before context limit
- Element crops: ~40-50 screenshots per session

**USE ELEMENT SCREENSHOTS FOR BURST CAPTURES.** When analyzing an animation or state transition, crop to just the area of interest. This lets you take 3-shot bursts (before/during/after) at the cost of ~1 full screenshot.

**Budget:** Plan for 8-10 full screenshots + 3-4 burst sequences (3 element crops each) = ~20-22 captures per session. Use `/low-context-handover` when approaching 20 captures.

**Viewport:** 1366x768 or smaller unless testing responsive behavior.

## Phase 0: Reconnaissance & Instrumentation (DO THIS FIRST — EVERY SESSION)

Before you test ANYTHING, you need to understand how to READ the game's internal state and SET UP instrumentation. Every game is different — this phase discovers what's available.

### Step 0A: Start the Game

```
browser_navigate to game URL
browser_take_screenshot (JPEG, full viewport) — capture the starting state
```

### Step 0B: Discover Game State Access

**Your goal:** Find a way to read internal game state (entity positions, HP, scores, timers) from the browser console. This is what turns vague visual analysis into precise numerical measurement.

**Probe for exposed globals** — Most games expose SOMETHING to `window`. Try these in order:

```javascript
// Check for common debug/game object patterns
browser_evaluate: `(() => {
  const candidates = [
    // Common global patterns in web games
    'game', 'app', 'engine', 'world', 'state', 'gameState',
    'Game', 'App', 'Engine', 'World', 'State',
    // Framework-specific
    'Phaser', 'PIXI', 'THREE', 'Babylon', 'cc',  // Phaser, PixiJS, Three.js, Babylon, Cocos
    // Debug bridges (developers often add these)
    '__DEBUG__', '__GAME__', '__STATE__', 'debug', 'devTools',
  ];
  const found = {};
  for (const name of candidates) {
    try {
      if (typeof window[name] !== 'undefined') {
        found[name] = typeof window[name];
      }
    } catch(e) {}
  }
  // Also check for data attributes on canvas/root elements
  const canvas = document.querySelector('canvas');
  if (canvas) found['canvas'] = 'present (' + canvas.width + 'x' + canvas.height + ')';
  return found;
})()`
```

**If you find a game object**, explore its structure:
```javascript
// Replace 'window.game' with whatever you found
browser_evaluate: `(() => {
  const obj = window.game; // <-- ADAPT THIS to what you found
  if (!obj) return 'not found';
  const keys = Object.getOwnPropertyNames(obj).concat(
    Object.getOwnPropertyNames(Object.getPrototypeOf(obj) || {})
  ).filter(k => !k.startsWith('_'));
  return keys.slice(0, 50); // first 50 properties/methods
})()`
```

**If NO game object is exposed**, check the source code:
1. Read the project's `CLAUDE.md` or `README.md` for architecture notes
2. Read the main entry point (usually `main.ts`, `index.ts`, `app.ts`)
3. Look for where game objects are created — are they stored in module-scope variables or only function-local?
4. Check if there's already a debug bridge (search for `window.__` or `window.debug` in source)

**If nothing is accessible**, fall back to DOM extraction:
```javascript
// Read visible HUD/UI elements — works for any game with HTML UI
browser_evaluate: `(() => {
  // Gather all text from visible UI elements
  const elements = document.querySelectorAll('[id*="hud"], [id*="score"], [id*="health"], [id*="gold"], [class*="hud"], [class*="score"], [class*="stat"]');
  const data = {};
  elements.forEach(el => {
    if (el.id) data[el.id] = el.textContent?.trim();
    else if (el.className) data[el.className] = el.textContent?.trim();
  });
  // Also grab any data from the page title or status elements
  data['title'] = document.title;
  return data;
})()`
```

**Record which access level you have:**
- **Level 3 (Full):** Direct access to game objects — can inspect individual entities, read exact HP/position/state
- **Level 2 (DOM):** Can read HUD values, scores, resource counts — but not individual entity state
- **Level 1 (Visual only):** No data extraction possible — rely entirely on screenshots and `browser_snapshot` accessibility tree

### Step 0C: Build a State Extractor Function

Based on what you discovered, write a reusable extraction function. You'll call this ALONGSIDE every screenshot.

**Template for entity-based games** (RTS, RPG, roguelike):
```javascript
browser_evaluate: `(() => {
  // ADAPT: replace with actual path to game entities
  const gameObj = window.game || window.__DEBUG__;
  if (!gameObj) return { level: 'dom-only' };
  
  // ADAPT: replace with actual method to get entities
  const entities = []; // e.g., gameObj.getEntities() or gameObj.world.entities
  
  return {
    tick: gameObj.tick || gameObj.frame || performance.now(),
    entityCount: entities.length,
    entities: entities.slice(0, 20).map(e => ({
      id: e.id,
      type: e.type || e.name,
      x: Math.round((e.x || e.position?.x || 0) * 100) / 100,
      y: Math.round((e.y || e.position?.y || 0) * 100) / 100,
      hp: e.hp || e.health,
      maxHp: e.maxHp || e.maxHealth,
      state: e.state || e.status || 'unknown'
    }))
  };
})()`
```

**Template for score/progression games** (puzzle, platformer, card):
```javascript
browser_evaluate: `(() => {
  return {
    time: performance.now(),
    // ADAPT: read from game object or DOM
    score: document.querySelector('.score')?.textContent,
    level: document.querySelector('.level')?.textContent,
    lives: document.querySelector('.lives')?.textContent,
    // Read visible game stats
    visibleText: Array.from(document.querySelectorAll('canvas + div, .hud, .ui-overlay'))
      .map(el => el.textContent?.trim()).filter(Boolean)
  };
})()`
```

**Save your extractor.** You'll reuse it in every burst capture. Refine it as you learn more about the game's internals.

### Step 0D: Inject Visual Debug Overlay (Optional but Powerful)

If you have Level 3 access, inject a live overlay that makes invisible state visible in screenshots:

```javascript
browser_evaluate: `(() => {
  // Remove old overlay if exists
  document.getElementById('microscope-overlay')?.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'microscope-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;color:#0f0;font:10px monospace;z-index:99999;pointer-events:none;background:rgba(0,0,0,0.6);padding:4px 8px;max-width:350px;white-space:pre;border-bottom-right-radius:4px';
  document.body.appendChild(overlay);
  
  // ADAPT: replace with actual game state reading
  window.__MICROSCOPE_INTERVAL__ = setInterval(() => {
    try {
      const gameObj = window.game || window.__DEBUG__;
      if (!gameObj) { overlay.textContent = 'NO GAME OBJ'; return; }
      
      // ADAPT: read what matters for your test target
      const lines = [
        'MICROSCOPE ACTIVE',
        'Tick: ' + (gameObj.tick || '?'),
        'FPS: ' + Math.round(1000 / (performance.now() - (window.__lastFrame__ || performance.now()))),
        // Add entity state counts, scores, whatever is relevant
      ];
      overlay.textContent = lines.join('\\n');
      window.__lastFrame__ = performance.now();
    } catch(e) { overlay.textContent = 'ERR: ' + e.message; }
  }, 200);
  
  return 'overlay injected — visible in top-left of screenshots';
})()`
```

To remove it later:
```javascript
browser_evaluate: "clearInterval(window.__MICROSCOPE_INTERVAL__); document.getElementById('microscope-overlay')?.remove(); 'removed'"
```

### Step 0E: Discover Game Speed / Time Controls

Many games have speed controls, pause, or frame stepping:

```javascript
browser_evaluate: `(() => {
  // Common patterns for game speed
  const gameObj = window.game || window.__DEBUG__;
  if (!gameObj) return 'no game object — look for speed controls in UI';
  
  // ADAPT: check for speed/time properties
  return {
    gameSpeed: gameObj.gameSpeed || gameObj.speed || gameObj.timeScale || '?',
    paused: gameObj.paused || gameObj.isPaused || '?',
    fps: gameObj.fps || gameObj.targetFPS || '?'
  };
})()`
```

**For animation testing:** If you can slow the game down (speed 0.1x or 0.25x), each animation "frame" becomes visible across multiple real frames, making burst captures much more revealing. Look for:
- In-game speed settings (common in RTS/strategy games)
- `gameObj.timeScale = 0.25` (common in engine-based games)
- Browser DevTools → Performance → CPU throttling (works for any web game)

## Phase 1: Define the Target Mechanic

Before testing, WRITE DOWN exactly what you're inspecting. Be surgical.

**BAD targets (too broad):**
- "Test combat" — that's a `/game-tester` job
- "Check if the game looks good" — that's `/game-design-audit`
- "Test everything" — that's `/game-completionist`

**GOOD targets (specific, temporal, measurable):**
- "Verify attack animation: does the sprite oscillate smoothly? How many frames from idle to full lunge?"
- "Verify hit feedback chain: hit → damage number → hit flash → knockback → particles. Count channels and timing."
- "Verify state transition: at what exact HP% does the unit change behavior? Does the visual indicator appear simultaneously?"
- "Verify damage formula: attacker type X vs defender type Y. Extract HP before and after to confirm multiplier."
- "Verify economy curve: resource income over 2 minutes with N workers. Is growth rate as expected?"
- "Verify pathfinding: unit navigates around obstacle. Is the path efficient? Does it get stuck?"
- "Verify cooldown timer: ability used at time T. Is it re-available at T+cooldown exactly?"

**WRITE THE TARGET, THE EXPECTED BEHAVIOR, AND HOW YOU'LL MEASURE SUCCESS.**

```
TARGET: [Specific mechanic name]
EXPECTED: [What should happen — be precise with numbers, states, timing]
MEASURE:
  - Data: [what values to extract — HP, position, state, tick/frame]
  - Visual: [what to look for in screenshots — effects, animations, UI changes]
  - Temporal: [what should change between burst frames — timing, sequence]
SUCCESS CRITERIA: [how you'll know it passes — specific thresholds]
```

## Phase 2: Create the Test Scenario

Don't wait for the mechanic to happen naturally. TRIGGER IT.

### Scenario Setup Methods

**Method A: Play into it** — Use normal gameplay to reach the state. Best for testing real player experience but slow and imprecise. Good for first-time discovery.

**Method B: Use game commands** — If the game has console commands, admin tools, debug inputs, or cheat codes, use them to set up the exact state you need. Check for:
- Developer console (`~` or F12 in many games)
- URL parameters (`?debug=true`, `?level=5`, `?god=1`)
- Keyboard cheats (type sequences, hold Shift+key combos)
- Settings files that enable debug mode

**Method C: Use browser_evaluate** — If you have the debug bridge, you can manipulate state directly:
```javascript
// Examples — ADAPT to your game's API
browser_evaluate: "window.game.player.hp = 15"          // Set HP low to test death/retreat
browser_evaluate: "window.game.player.gold = 9999"      // Rich player to test economy
browser_evaluate: "window.game.spawnEnemy('boss', 10, 10)" // Create specific enemy
browser_evaluate: "window.game.setTimeScale(0.25)"      // Slow motion for animation analysis
```

**Method D: Use browser interactions** — Click/type/press to reach the state through normal UI:
```
browser_snapshot → find interactive elements
browser_click / browser_press_key / browser_type → perform actions
browser_wait_for → wait for the result
```

### For Canvas-Based Games (PixiJS, Phaser, Three.js, Unity WebGL, Godot Web)

Canvas games render everything into a `<canvas>` element — DOM inspection won't show game entities. You need:

1. **Coordinate-based clicking:**
```
browser_snapshot  → find the canvas element ref
browser_click on canvas at specific (x, y) pixel coordinates
```

2. **Keyboard input for game controls:**
```
browser_press_key("w")         // Movement
browser_press_key("Space")     // Action
browser_press_key("Escape")    // Menu/cancel
browser_press_key("1")         // Hotkey/selection
```

3. **State reading via JavaScript** (requires Level 3 access):
```javascript
browser_evaluate: `(() => {
  // ADAPT: read entities and find their screen positions
  const entities = getGameEntities(); // your extractor
  return entities.map(e => ({
    id: e.id, type: e.type, state: e.state,
    // Convert world coords to screen coords (game-specific formula)
    screenX: (e.x - cameraX) * zoom + canvasWidth/2,
    screenY: (e.y - cameraY) * zoom + canvasHeight/2
  }));
})()`
```

### Scenario Recipes (Generic Patterns)

**Combat scenario (RTS/RPG/Action):**
1. Get two opposing entities near each other
2. Wait for combat to engage (or trigger it via game commands)
3. Extract both entities' HP/state before combat
4. Begin burst capture once combat state is detected
5. Measure: damage per tick/frame, feedback channels, state transitions

**Resource/Economy scenario (RTS/Builder/Tycoon):**
1. Set up a production chain (workers mining, buildings producing)
2. Extract resource values every N seconds for 1-2 minutes
3. Present as time-series table
4. Verify: growth rate matches expected formula, no stalls, no overflow

**Ability/Cooldown scenario (Any game with abilities):**
1. Use an ability, note the exact tick/time
2. Extract cooldown state repeatedly
3. Try to use ability again before cooldown expires (should fail)
4. Wait for cooldown to expire, use again (should succeed)
5. Verify: cooldown duration matches spec, UI reflects availability accurately

**Death/Respawn scenario (Action/Roguelike/FPS):**
1. Reduce entity to near-death HP
2. Begin burst capture
3. Capture: last alive frame, death trigger frame, death animation, respawn/game-over
4. Verify: death animation plays, correct consequence occurs, timing feels right

**Pathfinding scenario (RTS/RPG/Strategy):**
1. Place an entity with a destination that requires navigating around obstacles
2. Extract position every few ticks
3. Verify: entity doesn't walk through walls, path is reasonably short, no stuck behavior
4. Screenshot: mid-path navigation to verify visual follows data

## Phase 3: Burst Capture Protocol

This is the core technique. A burst capture is 2-4 rapid captures of the SAME area to catch temporal behavior.

### Burst Capture Steps

```
STEP 1: Extract data snapshot
  browser_evaluate → { tick/frame, entities: [...], relevantState }

STEP 2: Element screenshot (crop to action area)
  browser_take_screenshot with element parameter targeting the canvas or game area
  OR full viewport JPEG if element targeting isn't possible

STEP 3: Wait briefly (100-500ms depending on game speed/frame rate)
  browser_wait_for with time parameter

STEP 4: Extract data snapshot again
  browser_evaluate → { tick/frame, entities: [...], relevantState }

STEP 5: Element screenshot again
  browser_take_screenshot

STEP 6 (optional): One more cycle for 3-shot burst
  Repeat steps 3-5
```

### What to Compare Across Burst Frames

**Between data snapshots:**
- Did entity state change? (idle→attacking, alive→dead, ready→cooldown)
- Did HP/health change? By how much? (calculate DPS or damage-per-hit)
- Did position change? By how much? (calculate movement speed)
- Did inventory/resources change? (verify collection/spending)
- Did tick/frame counter advance? By how many? (timing measurement)

**Between screenshots:**
- Is a new visual effect present? (hit flash, particles, glow, ring, knockback offset)
- Did a sprite change orientation? (facing direction, animation frame)
- Did a UI element appear/disappear? (damage number, status indicator, cooldown overlay)
- Did colors change? (damage tint, state indicator colors)
- Did the animation advance? (squash/stretch, rotation, position offset)
- Did the background/environment change? (screen shake, camera movement, lighting shift)

### Burst Analysis Template

For EVERY burst capture, write this EXACT format:

```
BURST: [Descriptive name — e.g., "Attack Impact Feedback"]
CAPTURES: [N screenshots + N data snapshots]

Frame 1 (tick/frame T):
  DATA: {entity A: state=X, hp=Y/Z, pos=(x,y); entity B: state=...}
  VISUAL: [Describe EVERY visible element related to the mechanic — sprite pose,
          effects present/absent, UI state, colors, particle count, offset positions]

Frame 2 (tick/frame T+N, Xms later):
  DATA: {entity A: state=X', hp=Y'/Z, pos=(x',y'); entity B: state=...}
  VISUAL: [Same level of detail — what CHANGED from Frame 1?
          New effects? Moved sprites? Changed colors? Appeared/disappeared elements?]

Frame 3 (tick/frame T+M, Yms later):
  DATA: {entity A: state=X'', hp=Y''/Z, pos=(x'',y'')}
  VISUAL: [What changed from Frame 2? Is the mechanic settling, continuing, or complete?]

ANALYSIS:
  - [State transition timing]: Changed from X to X' between frames N and M (within K ticks/ms)
  - [Visual sync]: Visual indicator appeared on [same/different] frame as data change — [good/bad]
  - [Feedback channels]: [count] of 8 possible channels fired (list which ones)
  - [Speed/rate]: Moved N units in M ticks = speed S (expected: E, delta: D%)
  - [Formula verification]: Damage dealt = X (expected from formula: Y, delta: Z%)
  
VERDICT: [Pass / Issue found — be specific]

ISSUES:
  - [List any discrepancies, timing problems, missing feedback, visual bugs]
  - [Or: "No issues found — here's specifically what I verified: ..."]
```

## Phase 4: Deep Animation Analysis

For animation-specific testing, use this protocol.

### What Makes an Animation "Feel Good" (Measurable Criteria)

Every satisfying game animation follows a 4-phase arc. Try to identify each phase in your burst captures:

1. **Anticipation** (1-3 frames) — Wind-up before action. Does the sprite telegraph what's about to happen? (Pulling back before a punch, crouching before a jump, weapon raised before strike)
2. **Action** (1-2 frames) — The core movement. Is it sharp, fast, decisive? (The punch lands, the jump launches, the sword swings)
3. **Impact** (1-3 frames) — Feedback explosion. How many channels fire simultaneously? (Hit flash, particles, screen shake, knockback, sound, UI update)
4. **Recovery** (3-5 frames) — Return to neutral. Is it smooth or abrupt? (Bounce-back, settle, breathing return)

**Missing anticipation** = actions feel disconnected, "came from nowhere."
**Missing impact** = actions feel weightless, "didn't land."
**Missing recovery** = actions feel robotic, "animation just stops."

### Feedback Channel Audit

When a significant action occurs, count how many feedback channels fire:

| Channel | Present? | Timing (which frame?) | Quality (1-5) | Notes |
|---------|----------|----------------------|----------------|-------|
| 1. Sprite animation (squash/stretch/rotation/pose change) | ? | ? | ? | ? |
| 2. Color change (hit flash, damage tint, glow) | ? | ? | ? | ? |
| 3. Particle effects (dust, sparks, blood, debris, magic) | ? | ? | ? | ? |
| 4. Positional offset (knockback, recoil, lunge, bounce) | ? | ? | ? | ? |
| 5. Screen/camera response (shake, zoom, pan, slow-mo) | ? | ? | ? | ? |
| 6. UI update (HP bar, damage number, score change, cooldown) | ? | ? | ? | ? |
| 7. Sound/audio (impact SFX, voice, music change) | ? | ? | ? | ? |
| 8. Gameplay consequence (state change, death, resource gain) | ? | ? | ? | ? |

**Reference benchmarks:**
- **1-2 channels** = feels dead, placeholder, unfinished
- **3-4 channels** = functional but unremarkable
- **5-6 channels** = polished, satisfying, professional
- **7-8 channels** = excellent "game juice," AAA-feel
- **Simultaneous** channels (same frame) feel more impactful than **sequential** (spread across frames)

### Animation Timing Measurement

Use data extraction to measure timing precisely:

```javascript
// Inject a timing logger — ADAPT to your game's action triggers
browser_evaluate: `(() => {
  window.__ANIM_LOG__ = [];
  // ADAPT: hook into game's animation/state system
  // Example: override or wrap the game's attack function
  const originalAttack = window.game?.attack;
  if (originalAttack) {
    window.game.attack = function(...args) {
      window.__ANIM_LOG__.push({ event: 'attack_start', time: performance.now() });
      const result = originalAttack.apply(this, args);
      window.__ANIM_LOG__.push({ event: 'attack_end', time: performance.now() });
      return result;
    };
  }
  return 'timing logger injected';
})()`

// Later, after the action:
browser_evaluate: "window.__ANIM_LOG__"
// Returns: [{event: 'attack_start', time: 1234.5}, {event: 'attack_end', time: 1278.3}]
// Duration: 43.8ms — is that snappy enough?
```

## Phase 5: Quantitative Analysis

Not everything needs screenshots. Some analysis is pure data.

### Time-Series Capture (Economy, Progression, Difficulty Curves)

Extract values at regular intervals and present as a table:

```
1. browser_evaluate → extract current values
2. browser_wait_for time: 5000
3. browser_evaluate → extract again
4. Repeat 8-10 times
```

Present as:
```
Time (s) | Value A | Value B | Value C | Delta A | Delta B | Notes
---------|---------|---------|---------|---------|---------|------
   0     |     200 |      50 |     100 |       — |       — | Starting values
   5     |     215 |      55 |      92 |     +15 |      +5 | Workers mining
  10     |     232 |      60 |      84 |     +17 |      +5 | Income steady
  15     |     248 |      65 |      76 |     +16 |      +5 | Food declining — upkeep
  20     |     290 |      72 |      68 |     +42 |      +7 | Spike! Mine placed at t=17
  ...
```

Then analyze: Is growth linear/exponential/logarithmic? Are there inflection points? When do resources become scarce? Does the curve match design intent?

### Formula Verification

To verify a game's damage/production/scoring formulas:

1. **Extract** attacker stats + defender stats + all modifier states (buffs, terrain, time-of-day, etc.)
2. **Wait** one game tick/frame
3. **Extract** the result (HP after damage, score change, resource amount)
4. **Calculate** expected result from the formula (read source code if available)
5. **Compare**: `actual vs expected, delta%, within tolerance?`
6. **If delta > 5%**, investigate: missed modifier? Rounding? Race condition? Bug?

### Position/Speed Measurement

To verify movement speed, pathfinding efficiency, or physics:

1. Extract position at time T₁
2. Wait N milliseconds
3. Extract position at time T₂
4. Calculate: `speed = distance(pos₁, pos₂) / (T₂ - T₁)`
5. Compare to expected speed (accounting for terrain, buffs, slow effects)
6. For pathfinding: `efficiency = straight_line_distance / actual_path_length` (1.0 = perfect, <0.7 = likely problem)

## Phase 6: Report

After all inspections, compile a focused report:

```
## Microscope Report: [Mechanic Name]

### Test Setup
- Game: [name and URL]
- Access level: [Level 3/2/1 — full/DOM/visual]
- Game speed/framerate: [value]
- Captures taken: [count full + count burst]
- Burst sequences: [count]

### Target Mechanic
[What you tested, why, and what the expected behavior is]

### Findings

#### [Sub-mechanic 1]
DATA: [key numbers — values before/after, tick counts, speeds, rates]
VISUAL: [what you observed — animation quality, feedback channels, timing]
EXPECTED vs ACTUAL: [precise comparison with numbers]
VERDICT: [pass / issue found — with specific evidence]

#### [Sub-mechanic 2]
...

### Quantitative Results
[Time-series tables, formula verifications, speed measurements]

### Feedback Channel Audit
[Filled-in channel table for each significant action tested]

### Issues Found
| # | Severity | Description | Evidence | Expected | Actual |
|---|----------|-------------|----------|----------|--------|
| 1 | [crit/high/med/low] | [specific problem] | [burst N, frame M] | [value] | [value] |

### Animation Arc Assessment
| Action | Anticipation | Action | Impact | Recovery | Channels | Feel |
|--------|-------------|--------|--------|----------|----------|------|
| [name] | [frames] | [frames] | [frames] | [frames] | [N/8] | [dead/ok/good/great] |

### Recommendations
[Specific, actionable improvements — ordered by impact]
- [Priority 1]: [what to change and why it matters]
- [Priority 2]: ...
```

## Success Criteria

- Phase 0 completed: game state access level determined (Level 3/2/1), extractor function built
- Target mechanic defined with specific expected behavior and measurable success criteria
- At least 2 burst capture sequences performed (3 frames each minimum)
- Every screenshot paired with a data extraction — no orphan screenshots or orphan data
- Burst analysis template filled out completely for each burst (Frame 1/2/3 with DATA + VISUAL + ANALYSIS)
- Feedback channel audit completed for each significant action tested
- Quantitative measurements taken (damage values, speed, timing, economy rates) — not just vibes
- Issues documented with specific evidence (burst N, frame M, expected X, actual Y)
- Final report includes: setup, findings with data, channel audit, issues table, recommendations
- No PNG screenshots taken — JPEG only throughout the session

## Don't

- Don't take full-viewport screenshots when an element crop would suffice — waste of context budget
- Don't analyze a screenshot without extracting data alongside it — you're leaving information on the table
- Don't capture a single frame of a temporal event — use burst captures (2-3 shots minimum)
- Don't test broad features — that's `/game-tester`. This skill is for SPECIFIC mechanics at HIGH detail
- Don't write "looks fine" — MEASURE it. Numbers beat vibes.
- Don't forget to instrument first — Phase 0 is not optional
- Don't take more than 4 screenshots without extracting data at least once — stay grounded in numbers
- Don't test more than 2-3 mechanics per session — depth > breadth. That's the whole point of this skill.
- Don't use PNG screenshots — JPEG only. This is non-negotiable. PNG WILL crash the session.
- Don't skip the burst analysis template — writing "Frame 1... Frame 2... Frame 3..." with data + visual for each is what makes this skill valuable
- Don't assume you know the game's API — always probe in Phase 0, even if you've tested before (games update)
- Don't inject instrumentation that interferes with what you're testing (e.g., don't slow the game when testing real-time responsiveness)

## Multi-Session Strategy

Each session can deeply inspect 2-3 mechanics:

- **Session 1:** Reconnaissance + instrumentation + primary mechanic (8 full + 3 bursts ≈ 17 captures)
- **Session 2:** Secondary mechanic + formula verification (8 full + 3 bursts)
- **Session 3:** Edge cases + timing measurements + economy curves (8 full + 3 bursts)
- **Session 4:** Animation arcs + feedback channel audit across all core actions (8 full + 3 bursts)

End each session with `/low-context-handover` documenting:
- What was inspected (mechanics, scenarios)
- Data collected (key measurements, tables)
- Issues found (with burst/frame references)
- Instrumentation setup (what code to re-inject next session)
- What's next (remaining mechanics to inspect)

## Reference: Common Canvas Game Interaction Patterns

Since canvas games render everything into a `<canvas>` element, DOM-based clicking won't work for game interactions:

**Click on game world:**
```
browser_snapshot → find canvas element ref
browser_click on canvas ref at coordinates (x, y)
```

**Keyboard input:**
```
browser_press_key("w")           // Movement
browser_press_key("Space")       // Jump/action
browser_press_key("Escape")      // Menu/cancel
browser_press_key("1")           // Hotbar/selection
browser_press_key("Shift+a")     // Modified commands
```

**Drag select / draw:**
```
browser_drag from (startX, startY) to (endX, endY)
```

**Wait for game state change:**
```
browser_wait_for with time: 2000  // Wait 2 seconds for game ticks to advance
```

Then re-extract data to see what changed.

## Reference: Engine-Specific Access Patterns

### PixiJS / Pixi
```javascript
// PixiJS apps often store the Application instance
typeof PIXI !== 'undefined'  // Check if PixiJS is loaded
// Look for: app.stage.children, app.renderer, app.ticker
```

### Phaser
```javascript
// Phaser 3 games expose the game instance
typeof Phaser !== 'undefined'
window.game?.scene?.scenes?.[0]  // Active scene
// Phaser scenes have: this.physics.world, this.children, this.cameras
```

### Three.js / Babylon
```javascript
typeof THREE !== 'undefined'   // Three.js
typeof BABYLON !== 'undefined' // Babylon.js
// Look for: scene.children, renderer, camera
```

### Unity WebGL
```javascript
// Unity WebGL uses SendMessage for JS→C# communication
typeof unityInstance !== 'undefined'
// Limited JS access — mostly read DOM overlays or use Unity's debug UI
```

### React/Vue/Svelte Games (DOM-based)
```javascript
// React stores state in fiber nodes
document.querySelector('[data-reactroot]')
// Vue stores state in __vue__ property
document.querySelector('#app').__vue__
// For DOM-based games, browser_snapshot accessibility tree is very powerful
```

Adapt your instrumentation based on the engine you discover. The technique (data + burst + temporal) works universally — only the extraction code changes.
