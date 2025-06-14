# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm start` - Start development server on port 8000 with hot reload
- `npm run build` - Build the library (TypeScript compilation + Vite build)
- `npm run build:package` - Full package build including API docs generation

### Testing

- `npm test` - Run Playwright end-to-end tests
- `npm run test:debug` - Run tests in debug mode with PWDEBUG=1
- `npm run test:ci` - Run tests in CI mode (builds first then serves)

### Code Quality

- `npm run check` - Run all checks (types, formatting, linting, styles)
- `npm run check:types` - TypeScript type checking only
- `npm run check:lint` - ESLint only
- `npm run check:stylelint` - CSS linting only
- `npm run fix:format` - Auto-fix Prettier formatting
- `npm run fix:lint` - Auto-fix ESLint issues

## Architecture Overview

### Web Component Structure

This is a **web component library** built with vanilla TypeScript. The main export is `GChessBoardElement` which registers as `<g-chess-board>` custom element.

### Key Architectural Patterns

**Component Hierarchy:**

- `GChessBoardElement` (main web component) contains:
  - `Board` (manages the 8x8 grid and piece positioning)
  - `BoardSquare` (individual square with piece rendering)
  - `BoardState` (manages interaction state - drag, click, keyboard)
  - `Coordinates` (optional rank/file labels)
  - `Arrows` (optional move indicators)

**State Management:**

- Position state via `Position` type (maps squares to pieces)
- Board state via `BoardState` class (tracks current user interaction)
- FEN string support for standard chess notation
- Event-driven architecture for move interactions

**Styling System:**

- CSS custom properties for theming
- Inline SVG pieces (embedded in CSS)
- PostCSS for build-time processing
- Shadow DOM for encapsulation

### Move Interaction Flow

1. User initiates move → `movestart` event fired
2. Caller can set valid targets via `setTargets()`
3. User completes move → `moveend` event (preventable)
4. Animation completes → `movefinished` event
5. Caller updates position state

### Key Utilities

- `utils/chess.ts` - Core chess logic (FEN parsing, position diffing, square calculations)
- `utils/munkres.ts` - Hungarian algorithm for optimal piece animations
- `utils/dom.ts` - DOM helper utilities
- `utils/typing.ts` - TypeScript utility types

### Build System

- **Vite** for bundling with ES modules output
- **TypeScript** with strict mode enabled
- **vite-plugin-dts** for .d.ts generation
- **vite-plugin-checker** for build-time type checking
- **Bundle size limit**: 150KB (brotli compressed)

### Testing Strategy

- **Playwright** for end-to-end testing
- Tests cover all interaction modes: click, drag, keyboard
- Tests use actual browser automation (not unit tests)
- Test files in `/tests/` directory

## Development Notes

### Adding New Features

- Follow the existing component pattern in `src/components/`
- Update `GChessBoardElement.ts` to wire new components
- Add corresponding Playwright tests
- Update API documentation via `npm run build:api`

### Styling Changes

- Modify `src/style.css` for core styles
- Use CSS custom properties for customizable aspects
- Test with different themes/configurations

### Chess Logic Changes

- Core chess utilities are in `utils/chess.ts`
- Position diffing algorithm is critical for animations
- FEN parsing must remain compliant with chess standards
