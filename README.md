# Tower of Hanoi

A beautiful, interactive Tower of Hanoi puzzle game built with vanilla JavaScript, HTML, and CSS, powered by Vite.

## Features

- **Progressive levels** — starts with 3 disks, each cleared level adds one more
- **Two interaction modes** — click to select & place, or drag disks between towers
- **Smooth animations** — disks animate their path when moved between towers
- **Undo & Reset** — undo your last move or reset the current level
- **Level selector** — jump to any unlocked level
- **Sound effects** — pickup, place, and invalid-move sounds via Web Audio API
- **Background music** — gentle lofi-style arpeggio melody, toggleable
- **Progress saving** — highest unlocked level persisted in localStorage
- **Responsive design** — works on desktop, tablet, and mobile

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How to Play

1. Click a tower to select its top disk.
2. Click another tower to move the selected disk there.
3. Larger disks cannot be placed on smaller ones.
4. Move all disks from tower **A** to tower **C** to win.

## Tech Stack

- **Vite** — build tool
- **Vanilla JavaScript** — no framework dependencies
- **CSS** — custom properties, Flexbox, animations
- **Web Audio API** — synthesized sound effects and BGM

## License

MIT
