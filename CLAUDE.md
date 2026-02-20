# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run**: `bun run src/index.tsx`
- **Run (hot reload)**: `bun --hot src/index.tsx`
- **Install deps**: `bun install`
- **Test**: `bun test` (uses `bun:test`, not jest/vitest)
- **Type check**: `bunx tsc --noEmit`

Always use Bun, never Node.js, npm, or npx.

## Architecture

wpmx is a terminal typing test built with React + [Ink](https://github.com/vadimdemedes/ink) (React renderer for CLIs).

**Screen flow**: Menu → Game → Results → (restart or menu)

- `src/app.tsx` — Screen state machine. Manages which screen is shown and passes callbacks between them.
- `src/hooks/useGame.ts` — Core game engine. All typing logic lives here: character input, word validation, backspace, scoring (WPM/accuracy). Returns state + handlers consumed by Game component.
- `src/components/Game.tsx` — Renders game UI and pipes keyboard input to useGame hooks. Handles character-by-character color feedback.
- `src/lib/storage.ts` — Persists history and settings to `~/.wpmx/`. Uses `Bun.write` for saves, `node:fs` for reads.
- `src/data/words.json` — Word list (~380 common English words).

**Key game logic** (`useGame.ts`):
- `handleChar` → records typed character in `charInputs[wordIndex]`
- `handleSpace` → validates current word (exact match), marks correct/incorrect, advances to next word
- `handleBackspace` → deletes last char, or returns to previous word if at start
- `getResults` → calculates WPM and accuracy from `charInputs` vs target words

**Scoring**: WPM = `(correctChars / 5) / (time / 60)`. Accuracy counts individual correct characters, not whole words.
