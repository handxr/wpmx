# wpmx

A minimal, fast typing test for the terminal. Built with [Bun](https://bun.sh), [React](https://react.dev), and [Ink](https://github.com/vadimdemedes/ink).

## Features

- **15s, 30s, or 60s** timed sessions
- **Live WPM** counter as you type
- **Character-level feedback** — correct chars in green, errors in red
- **Personal best** tracking with local history
- **Vim-style navigation** — `h`/`l` to pick duration

## Quick start

Run it instantly without installing:

```bash
npx wpmx
```

or with Bun:

```bash
bunx wpmx
```

## Install globally

```bash
npm install -g wpmx
```

Then run it anywhere:

```bash
wpmx
```

## Development

```bash
git clone https://github.com/handxr/wpmx.git
cd wpmx
bun install
bun run src/index.tsx
```

## Keybindings

| Key | Action |
|-----|--------|
| `h` / `l` or `←` / `→` | Select duration |
| `Enter` | Start game |
| `Tab` | Restart |
| `Esc` | Back to menu |
| `q` | Quit |

## How it works

Type the words as fast as you can. Errors are highlighted per-character so you can see exactly what you missed. Your WPM and accuracy are calculated at the end.

Results are saved locally at `~/.wpmx/history.json`.

## License

MIT
