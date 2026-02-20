# wpmx Demo Video — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a ~18s animated terminal demo video of wpmx using Remotion, showing install → menu → gameplay → results.

**Architecture:** A standalone Remotion project inside `video/` with 4 sequential scenes composed using `<TransitionSeries>`. Each scene is a React component that simulates the terminal UI using frame-driven animations (no CSS transitions). A shared `<Terminal>` wrapper provides the macOS-style window chrome.

**Tech Stack:** Remotion 4.x, React 19, TypeScript, `@remotion/google-fonts` (JetBrains Mono), `@remotion/transitions` (fade transitions)

---

## Task 1: Scaffold Remotion Project

**Files:**
- Create: `video/` (entire Remotion project via CLI)

**Step 1: Create Remotion project**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
bunx create-video@latest video --template blank
```

Select TypeScript when prompted. This creates the Remotion project structure with `package.json`, `tsconfig.json`, `src/Root.tsx`, etc.

**Step 2: Install extra Remotion packages**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bun add @remotion/google-fonts @remotion/transitions
```

**Step 3: Verify the project runs**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bun run dev
```

Expected: Remotion Studio opens in browser at `localhost:3000` with the blank template.

**Step 4: Clean up template files**

Delete any example composition files that came with the blank template (keep only `src/Root.tsx` and `src/index.ts`).

**Step 5: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/
git commit -m "chore: scaffold Remotion video project"
```

---

## Task 2: Terminal Chrome Component

**Files:**
- Create: `video/src/components/Terminal.tsx`

**Step 1: Create the Terminal wrapper component**

This component renders a macOS-style terminal window with title bar dots and dark background. All scenes will be rendered inside this wrapper.

```tsx
// video/src/components/Terminal.tsx
import React from "react";
import { AbsoluteFill } from "remotion";

const BG_COLOR = "#1e1e2e";
const TITLE_BAR_COLOR = "#313244";
const DOT_RED = "#f38ba8";
const DOT_YELLOW = "#f9e2af";
const DOT_GREEN = "#a6e3a1";

type TerminalProps = {
  children: React.ReactNode;
  title?: string;
};

export const Terminal: React.FC<TerminalProps> = ({
  children,
  title = "Terminal",
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#181825",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 1000,
          height: 560,
          backgroundColor: BG_COLOR,
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: 40,
            backgroundColor: TITLE_BAR_COLOR,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: DOT_RED }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: DOT_YELLOW }} />
          <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: DOT_GREEN }} />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: "#6c7086",
              fontSize: 13,
              fontFamily: "sans-serif",
              marginRight: 62, // offset for dots
            }}
          >
            {title}
          </div>
        </div>
        {/* Content area */}
        <div
          style={{
            flex: 1,
            padding: 24,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/components/Terminal.tsx
git commit -m "feat(video): add Terminal chrome component"
```

---

## Task 3: Blinking Cursor Component

**Files:**
- Create: `video/src/components/Cursor.tsx`

**Step 1: Create the Cursor component**

```tsx
// video/src/components/Cursor.tsx
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

type CursorProps = {
  color?: string;
  symbol?: string;
};

const BLINK_FRAMES = 16;

export const Cursor: React.FC<CursorProps> = ({
  color = "#cdd6f4",
  symbol = "\u258C", // left half block
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame % BLINK_FRAMES,
    [0, BLINK_FRAMES / 2, BLINK_FRAMES],
    [1, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return <span style={{ color, opacity }}>{symbol}</span>;
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/components/Cursor.tsx
git commit -m "feat(video): add blinking Cursor component"
```

---

## Task 4: Typing Script Data

**Files:**
- Create: `video/src/data/typing-script.ts`

**Step 1: Create the pre-scripted typing sequence**

This defines exactly what happens in the gameplay scene — which words, at what frame each char is typed, and where errors occur. All timing is deterministic.

```ts
// video/src/data/typing-script.ts

// Words from the real wpmx word list
export const GAME_WORDS = [
  "the", "quick", "brown", "fox", "jump", "over",
  "lazy", "dog", "have", "some", "time", "left",
  "world", "make",
];

// Each event is a character typed (or backspace) at a specific frame offset
// Frame offsets are relative to the start of the gameplay scene
export type TypingEvent = {
  frame: number;
  type: "char" | "space" | "backspace";
  char?: string;
};

// ~80 WPM = ~6.67 chars/sec at 30fps ≈ 1 char every 4-5 frames
// We vary between 3-6 frames per char for natural feel
export const TYPING_EVENTS: TypingEvent[] = buildTypingEvents();

function buildTypingEvents(): TypingEvent[] {
  const events: TypingEvent[] = [];
  let frame = 15; // small delay before typing starts

  const wordsToType = GAME_WORDS;

  for (let w = 0; w < wordsToType.length; w++) {
    const word = wordsToType[w];

    // Intentional error on word "jump" (index 4): type "junp" then backspace twice and retype
    if (w === 4) {
      // Type "jun"
      for (let c = 0; c < 3; c++) {
        events.push({ frame, type: "char", char: word[c] });
        frame += 4 + Math.floor(Math.random() * 3); // 4-6 frames
      }
      // Type wrong char "n" instead of "p"
      events.push({ frame, type: "char", char: "n" });
      frame += 5;
      // Pause, then backspace twice
      frame += 8;
      events.push({ frame, type: "backspace" });
      frame += 4;
      events.push({ frame, type: "backspace" });
      frame += 4;
      // Retype "mp" correctly
      events.push({ frame, type: "char", char: "m" });
      frame += 4;
      events.push({ frame, type: "char", char: "p" });
      frame += 4;
      // Space
      events.push({ frame, type: "space" });
      frame += 3;
      continue;
    }

    // Normal word typing
    for (let c = 0; c < word.length; c++) {
      events.push({ frame, type: "char", char: word[c] });
      frame += 3 + Math.floor(Math.random() * 4); // 3-6 frames
    }
    // Space after word (except last)
    if (w < wordsToType.length - 1) {
      events.push({ frame, type: "space" });
      frame += 3;
    }
  }

  return events;
}

// Pre-compute so it's deterministic per build
// (Math.random is fine since it runs once at module load)
```

**Note:** The `Math.random()` calls run once at module load time, so each render pass uses the same events. If we need strict determinism across builds, we can replace with a seeded PRNG, but for a demo video this is fine.

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/data/typing-script.ts
git commit -m "feat(video): add pre-scripted typing sequence data"
```

---

## Task 5: Font Setup

**Files:**
- Modify: `video/src/Root.tsx`

**Step 1: Load JetBrains Mono font**

At the top of `Root.tsx` (or a shared file imported by Root), load JetBrains Mono:

```tsx
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: monoFont } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
```

Export `monoFont` so all scene components can import it.

If JetBrains Mono is not available in `@remotion/google-fonts`, fall back to `FiraMono` or `SourceCodePro`. Check the package exports first:

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
ls node_modules/@remotion/google-fonts/ | grep -i jet
```

**Step 2: Verify**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/
git commit -m "feat(video): load JetBrains Mono font"
```

---

## Task 6: Install Scene

**Files:**
- Create: `video/src/scenes/InstallScene.tsx`

**Step 1: Create the InstallScene component**

This scene shows `$ npx wpmx` being typed in a terminal prompt. Uses frame-based typewriter effect (no CSS transitions). Duration: 90 frames (3s at 30fps).

```tsx
// video/src/scenes/InstallScene.tsx
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Terminal } from "../components/Terminal";
import { Cursor } from "../components/Cursor";
import { monoFont } from "../Root";

const COMMAND = "npx wpmx";
const CHAR_DELAY = 4; // frames per character (~133ms at 30fps)
const PROMPT = "$ ";

export const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Start typing after 10 frames
  const typingFrame = Math.max(0, frame - 10);
  const charsTyped = Math.min(
    COMMAND.length,
    Math.floor(typingFrame / CHAR_DELAY)
  );
  const typedText = COMMAND.slice(0, charsTyped);
  const doneTyping = charsTyped >= COMMAND.length;

  return (
    <Terminal>
      <div
        style={{
          fontFamily: monoFont,
          fontSize: 22,
          color: "#cdd6f4",
          lineHeight: 1.6,
        }}
      >
        <span style={{ color: "#a6e3a1" }}>{PROMPT}</span>
        <span>{typedText}</span>
        {!doneTyping && <Cursor />}
        {doneTyping && (
          <div style={{ color: "#6c7086", marginTop: 8 }}>
            Loading wpmx...
          </div>
        )}
      </div>
    </Terminal>
  );
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/scenes/InstallScene.tsx
git commit -m "feat(video): add InstallScene with typewriter effect"
```

---

## Task 7: Menu Scene

**Files:**
- Create: `video/src/scenes/MenuScene.tsx`

**Step 1: Create the MenuScene component**

Shows the wpmx menu with title and duration selector. Animates cursor moving from 30s to 15s. Duration: 60 frames (2s at 30fps).

```tsx
// video/src/scenes/MenuScene.tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Terminal } from "../components/Terminal";
import { monoFont } from "../Root";

const DURATIONS = ["15s", "30s", "60s"];
const SWITCH_FRAME = 25; // Frame where selection moves from 30s → 15s

export const MenuScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Start selected on 30s (index 1), switch to 15s (index 0) at SWITCH_FRAME
  const selectedIndex = frame < SWITCH_FRAME ? 1 : 0;

  return (
    <Terminal>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          fontFamily: monoFont,
          gap: 24,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#f9e2af", // yellow
          }}
        >
          wpmx
        </div>

        {/* Duration selector */}
        <div style={{ display: "flex", gap: 24, fontSize: 20 }}>
          {DURATIONS.map((d, i) => (
            <span
              key={d}
              style={{
                color: i === selectedIndex ? "#cdd6f4" : "#6c7086",
                fontWeight: i === selectedIndex ? 700 : 400,
                textDecoration: i === selectedIndex ? "underline" : "none",
              }}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Hint */}
        <div style={{ color: "#6c7086", fontSize: 14 }}>
          h / l or ← / → to choose, Enter to start
        </div>
      </div>
    </Terminal>
  );
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/scenes/MenuScene.tsx
git commit -m "feat(video): add MenuScene with duration selector"
```

---

## Task 8: Game Scene

**Files:**
- Create: `video/src/scenes/GameScene.tsx`

**Step 1: Create the GameScene component**

The core scene — simulates typing with character-level color feedback. Reads from the pre-scripted typing events. Duration: 300 frames (10s at 30fps).

```tsx
// video/src/scenes/GameScene.tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Terminal } from "../components/Terminal";
import { monoFont } from "../Root";
import { GAME_WORDS, TYPING_EVENTS, TypingEvent } from "../data/typing-script";

const GREEN = "#a6e3a1";
const RED = "#f38ba8";
const DIM = "#6c7086";
const WHITE = "#cdd6f4";
const YELLOW = "#f9e2af";

type WordState = {
  typed: string[];      // characters typed for this word
  submitted: boolean;   // whether space was pressed after this word
};

function computeStateAtFrame(frame: number): {
  words: WordState[];
  currentWordIndex: number;
} {
  const words: WordState[] = GAME_WORDS.map(() => ({
    typed: [],
    submitted: false,
  }));
  let currentWordIndex = 0;

  for (const event of TYPING_EVENTS) {
    if (event.frame > frame) break;

    if (event.type === "char" && event.char) {
      words[currentWordIndex].typed.push(event.char);
    } else if (event.type === "space") {
      words[currentWordIndex].submitted = true;
      currentWordIndex++;
    } else if (event.type === "backspace") {
      if (words[currentWordIndex].typed.length > 0) {
        words[currentWordIndex].typed.pop();
      }
    }
  }

  return { words, currentWordIndex };
}

export const GameScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { words, currentWordIndex } = computeStateAtFrame(frame);

  // Timer: starts at 15, counts down over 300 frames (10s)
  const timeLeft = Math.max(0, Math.ceil(15 - (frame / fps)));

  // Live WPM: count correct chars in submitted words
  const elapsed = frame / fps;
  let correctChars = 0;
  for (let w = 0; w < currentWordIndex; w++) {
    const target = GAME_WORDS[w];
    const typed = words[w].typed.join("");
    if (typed === target) {
      correctChars += target.length + 1; // +1 for space
    } else {
      for (let c = 0; c < target.length; c++) {
        if (words[w].typed[c] === target[c]) correctChars++;
      }
    }
  }
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;

  return (
    <Terminal>
      <div style={{ fontFamily: monoFont, color: WHITE }}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
            fontSize: 20,
            fontWeight: 700,
            color: YELLOW,
          }}
        >
          <span>{timeLeft}s</span>
          <span>{wpm} wpm</span>
        </div>

        {/* Words */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 22, lineHeight: 1.8 }}>
          {GAME_WORDS.map((word, wi) => {
            const wordState = words[wi];
            const isCurrent = wi === currentWordIndex;
            const isPast = wi < currentWordIndex;
            const isFuture = wi > currentWordIndex;

            return (
              <span key={wi}>
                {word.split("").map((targetChar, ci) => {
                  let color = DIM;
                  let fontWeight: number = 400;
                  let textDecoration = "none";

                  if (isFuture) {
                    color = DIM;
                  } else if (isCurrent) {
                    const typedChar = wordState.typed[ci];
                    if (ci < wordState.typed.length) {
                      color = typedChar === targetChar ? GREEN : RED;
                    } else if (ci === wordState.typed.length) {
                      // cursor position
                      color = WHITE;
                      fontWeight = 700;
                      textDecoration = "underline";
                    } else {
                      color = DIM;
                    }
                  } else if (isPast) {
                    const typedChar = wordState.typed[ci];
                    color = typedChar === targetChar ? GREEN : RED;
                  }

                  return (
                    <span
                      key={ci}
                      style={{ color, fontWeight, textDecoration }}
                    >
                      {targetChar}
                    </span>
                  );
                })}
                {/* Extra chars beyond word length (errors) */}
                {(isCurrent || isPast) &&
                  wordState.typed.slice(word.length).map((extraChar, ei) => (
                    <span
                      key={`extra-${ei}`}
                      style={{
                        color: RED,
                        textDecoration: isPast ? "line-through" : "none",
                      }}
                    >
                      {extraChar}
                    </span>
                  ))}
              </span>
            );
          })}
        </div>
      </div>
    </Terminal>
  );
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Preview in Remotion Studio**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bun run dev
```

Navigate to the GameScene in the studio to verify the typing animation looks natural.

**Step 4: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/scenes/GameScene.tsx
git commit -m "feat(video): add GameScene with typing simulation"
```

---

## Task 9: Results Scene

**Files:**
- Create: `video/src/scenes/ResultsScene.tsx`

**Step 1: Create the ResultsScene component**

Shows the final score with a fade-in for the "new personal best!" message. Duration: 90 frames (3s at 30fps).

```tsx
// video/src/scenes/ResultsScene.tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { Terminal } from "../components/Terminal";
import { monoFont } from "../Root";

const YELLOW = "#f9e2af";
const WHITE = "#cdd6f4";
const GREEN_BRIGHT = "#a6e3a1";
const DIM = "#6c7086";

export const ResultsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // WPM number animates in with spring
  const wpmSpring = spring({ frame, fps, config: { damping: 200 } });
  const displayWpm = Math.round(interpolate(wpmSpring, [0, 1], [0, 87]));

  // "new personal best!" fades in after 15 frames
  const pbOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accuracy fades in after 25 frames
  const accOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Terminal>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          fontFamily: monoFont,
          gap: 12,
        }}
      >
        {/* Title */}
        <div style={{ fontSize: 28, fontWeight: 700, color: YELLOW, marginBottom: 16 }}>
          wpmx
        </div>

        {/* WPM */}
        <div style={{ fontSize: 48, fontWeight: 700, color: WHITE }}>
          {displayWpm} wpm
        </div>

        {/* Personal best */}
        <div style={{ fontSize: 18, fontWeight: 700, color: GREEN_BRIGHT, opacity: pbOpacity }}>
          new personal best!
        </div>

        {/* Accuracy */}
        <div style={{ fontSize: 20, color: WHITE, opacity: accOpacity }}>
          96.2% accuracy
        </div>

        {/* Duration */}
        <div style={{ fontSize: 16, color: DIM, opacity: accOpacity }}>
          15s
        </div>

        {/* Hints */}
        <div style={{ fontSize: 14, color: DIM, marginTop: 24, opacity: accOpacity }}>
          Tab → restart &nbsp;&nbsp; Esc → menu &nbsp;&nbsp; q → quit
        </div>
      </div>
    </Terminal>
  );
};
```

**Step 2: Verify it compiles**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx tsc --noEmit
```

**Step 3: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/scenes/ResultsScene.tsx
git commit -m "feat(video): add ResultsScene with animated score"
```

---

## Task 10: Main Composition + Root

**Files:**
- Create: `video/src/WpmxDemo.tsx`
- Modify: `video/src/Root.tsx`

**Step 1: Create the main composition component**

Uses `<TransitionSeries>` to sequence all 4 scenes with fade transitions between them.

```tsx
// video/src/WpmxDemo.tsx
import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { InstallScene } from "./scenes/InstallScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ResultsScene } from "./scenes/ResultsScene";

const FADE_DURATION = 10; // frames

export const WpmxDemo: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <InstallScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <MenuScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={300}>
        <GameScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: FADE_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={90}>
        <ResultsScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

// Total: 90 + 60 + 300 + 90 - (3 * 10) = 510 frames = 17s at 30fps
```

**Step 2: Update Root.tsx with the composition**

```tsx
// video/src/Root.tsx
import { Composition } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { WpmxDemo } from "./WpmxDemo";

export const { fontFamily: monoFont } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WpmxDemo"
      component={WpmxDemo}
      durationInFrames={510}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
```

**Step 3: Preview the full composition**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bun run dev
```

Watch the full 17s video in Remotion Studio. Check:
- Transitions are smooth
- Typing looks natural
- Colors match expectations
- Timer/WPM update correctly

**Step 4: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/src/WpmxDemo.tsx video/src/Root.tsx
git commit -m "feat(video): compose all scenes into WpmxDemo"
```

---

## Task 11: Render Final Video

**Files:**
- Output: `video/out/wpmx-demo.mp4`

**Step 1: Render MP4**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx remotion render WpmxDemo out/wpmx-demo.mp4
```

Expected: MP4 file at `video/out/wpmx-demo.mp4`, ~17s, 1280x720, 30fps.

**Step 2: Verify output**

```bash
open /Users/juanhander/Desktop/Projects/Other/typesprint/video/out/wpmx-demo.mp4
```

Watch it through. Check for any visual glitches or timing issues.

**Step 3: Render GIF (for README)**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint/video
bunx remotion render WpmxDemo out/wpmx-demo.gif --image-format=png --codec=gif
```

Note: GIF will be large. Consider reducing to 15fps or smaller resolution for README:

```bash
bunx remotion render WpmxDemo out/wpmx-demo.gif --image-format=png --codec=gif --scale=0.5
```

**Step 4: Add out/ to .gitignore**

Add `video/out/` to the project's `.gitignore`.

**Step 5: Commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/.gitignore .gitignore
git commit -m "chore: add video render output to gitignore"
```

---

## Task 12: Polish & Iterate

**Files:**
- Modify: Any scene files as needed

**Step 1: Review the rendered video and fix issues**

Common things to fix:
- Typing speed feels too fast or slow → adjust `CHAR_DELAY` in typing-script.ts
- Colors don't look right → adjust color constants
- Transition timing → adjust `FADE_DURATION` in WpmxDemo.tsx
- Scene durations → adjust `durationInFrames` values

**Step 2: Re-render and verify**

Repeat Task 11 steps after any changes.

**Step 3: Final commit**

```bash
cd /Users/juanhander/Desktop/Projects/Other/typesprint
git add video/
git commit -m "feat(video): finalize wpmx demo video"
```
