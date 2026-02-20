# wpmx Demo Video Design

## Purpose
Product demo video for npm/GitHub README. Shows the tool in action to attract new users.

## Specs
- **Duration:** ~18s at 30fps (540 frames)
- **Resolution:** 1280x720 (16:9)
- **Output:** MP4 + GIF
- **Style:** Realistic dark terminal, monospace font (JetBrains Mono), same colors as the actual game
- **Tech:** Remotion (React-based video), separate `video/` directory

## Scene Breakdown

### Scene 1: Install (0-89 frames, ~3s)
- Terminal window chrome: dark background `#1e1e2e`, title bar with colored dots
- `$ npx wpmx` typed letter by letter (~150ms/char)
- Brief pause, then transition

### Scene 2: Menu (90-149 frames, ~2s)
- `wpmx` title in bold yellow, centered
- Duration selector: `15s  [30s]  60s`
- Cursor moves from 30s to 15s, then "Enter" pressed
- Hint text in dim color below

### Scene 3: Gameplay (150-449 frames, ~10s)
- Top bar: timer (yellow bold) left, live WPM (yellow bold) right
- ~12-15 common words from the real word list
- Simulated typing at ~80 WPM with variable timing (60-120ms/char)
- Color feedback: green (correct), red (error), bold white underline (cursor), dim (untyped/future)
- One intentional error with backspace correction around frame 250
- Timer counts down, WPM increases progressively

### Scene 4: Results (450-539 frames, ~3s)
- `wpmx` title in bold yellow
- `87 wpm` in bold white (large)
- `new personal best!` in bold green-bright (fade-in)
- `96.2% accuracy` in white
- `15s` in dim
- Navigation hints in dim

## File Structure
```
video/
  src/
    Root.tsx              — Composition definition
    WpmxDemo.tsx          — Main composition, sequences scenes
    scenes/
      InstallScene.tsx    — Terminal prompt + npx typewriter
      MenuScene.tsx       — Duration selector animation
      GameScene.tsx       — Core typing simulation
      ResultsScene.tsx    — Final score display
    components/
      Terminal.tsx         — Terminal window chrome (dots, title bar)
      Cursor.tsx           — Blinking cursor
    data/
      typing-script.ts    — Pre-scripted typing sequence with timings and errors
```

## Decisions
- Approach: Animated terminal simulation (not screen recording or hybrid)
- Separate Remotion project in `video/` to avoid polluting the main package
- Pre-scripted typing (deterministic) for consistent, reproducible output
- JetBrains Mono font to match typical developer terminal
