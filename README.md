# Carom

**Carom** is a top-down paddle duel for the browser. Two paddles face each other across a dark field while a ball ricochets between them, off the top and bottom walls, and off a pair of obstacles in the middle of the field. A player scores when the ball passes the far edge behind their opponent's paddle.

The defining mechanic is **spin**: the motion of a paddle at the moment it strikes a ball curves that ball's flight afterward. The obstacles turn the open field into a bank-shot puzzle.

## What is Carom?

Carom is a complete, playable game that runs entirely in a browser with no external dependencies. It features:

- **Real-time physics** with accurate ball simulation, spin mechanics, and collision detection
- **Two game modes**: Solo (play against an AI opponent) and Versus (local two-player)
- **AI opponent** with intelligent tracking and reaction timing
- **Synthesized audio** with distinct cues for different events
- **Responsive design** that fits any window size while maintaining a 16:9 logical field
- **Extensible debug interface** for testing and automation

The game is written in TypeScript and runs on Vite with no game engine or external asset files.

## Install

```bash
npm ci
```

Dependencies are already installed in the project. This project requires Node.js 18 or later.

## Development

```bash
npm run dev
```

Starts a development server with hot reload at `http://localhost:5173`.

## Production Build

```bash
npm run build
```

Produces a static site in `dist/` ready to deploy. Serve the `dist/` directory on any static file host.

```bash
npm run preview
```

Preview the production build locally.

## Controls

| Action | Keys |
| --- | --- |
| Player 1 Up | `W` or `Arrow Up` |
| Player 1 Down | `S` or `Arrow Down` |
| Player 2 Up | `Up Arrow` |
| Player 2 Down | `Down Arrow` |
| Confirm Menu | `Enter` or `Space` |
| Back / Pause | `Escape` |
| Pause (in-game) | `P` or `Escape` |
| Mute | `M` |
| Show Debug Info | `` ` `` (backtick) |

## Game Modes

### Solo

Play against an AI opponent. You control the left paddle; the AI controls the right. The AI tracks the ball's trajectory and predicts where it will arrive, moving to intercept with realistic reaction timing.

### Versus

Two-player game on one keyboard. Player 1 controls the left paddle (W/S), Player 2 controls the right paddle (Arrow Up/Down). Play a full match to 11 points.

## Game Mechanics

### Spin

Spin is the core mechanic. When your paddle strikes the ball, the motion of your paddle at contact adds spin to the ball. Spin causes the ball to curve through the air—the faster your paddle is moving when you hit, the more the ball will curve.

- Move your paddle **downward** while striking to add **positive spin** (curves downward)
- Move your paddle **upward** while striking to add **negative spin** (curves upward)
- Hit the ball with a **stationary paddle** to preserve whatever spin it already has

Spin decays over time, so fresh strikes rebuild it. Use spin to curve shots around your opponent or set up bank shots off the obstacles.

### Obstacles

Two fixed obstacles sit in the field. The ball bounces off them like walls, leaving speed and spin unchanged. Use the obstacles to:

- **Bank shots** around your opponent's defense
- **Change the ball's direction** mid-flight
- **Set up traps** where your opponent cannot reach

### Scoring

- First to **11 points** wins
- Must win by at least **2 points** (at 10-10, play continues until someone leads by 2)
- A point is scored when the ball passes the far edge of the field

## Testing and Debugging

```bash
npm test
```

Runs unit tests with coverage over the game's physics and state management.

### Debug Interface

The game exposes `window.__carom` for automation and testing. This interface allows you to:

- Drive the game off real-time and step it frame-by-frame
- Place entities (balls, obstacles) at specific coordinates
- Set game state (scores, paddles, AI settings)
- Read the complete game state as a snapshot

For details, see `specs/instrumentation.md`.

## Code Quality

The codebase passes:

```bash
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint linting
npm run format     # Prettier formatting
npm test          # Vitest unit tests with coverage
```

## Architecture

The game is built in layers:

- **Constants** (`src/constants.ts`): All gameplay numbers from the specification
- **Types** (`src/types.ts`): Game state and interface shapes
- **State** (`src/state.ts`): State initialization and transitions
- **Physics** (`src/physics.ts`): Ball simulation, collision detection, and scoring
- **AI** (`src/ai.ts`): AI opponent behavior
- **Audio** (`src/audio.ts`): Synthesized sound cues
- **Runtime** (`src/runtime.ts`): Frame loop, canvas fitting, input handling
- **Render** (`src/render.ts`): Canvas drawing for all screens
- **Menu** (`src/menu.ts`): Menu navigation and interaction
- **Debug** (`src/debug.ts`): The debug/automation surface
- **Main** (`src/main.ts`): Entry point and game loop

The game runs a 60 FPS frame loop that updates input, advances the simulation, and renders. Physics is render-independent, so the same game state produces the same results at any frame rate.

## License

Carom is open source.
