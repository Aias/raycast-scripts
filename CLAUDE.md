# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of Raycast productivity scripts for macOS, implementing various utilities for clipboard operations, file processing, web scraping, and AI-powered tools. Each script follows Raycast's script format with a shell wrapper that launches the actual implementation.

## Project Structure

Scripts are organized by functionality:
- **audio-transcriber/** - Audio transcription and summarization (TypeScript/Bun)
- **clipboard-*/** - Various clipboard utilities (Markdown conversion, PDF generation, printing)
- **crawler/** - Web crawling with AI extraction (Python)
- **directory-concat/** - Concatenate directory contents (Python)
- **extract-tweet-media/** - Extract media from tweets (Python)
- **finder-to-ghostty/** - Open files in Ghostty terminal (Shell)
- **flatten-opml/, sort-opml/** - OPML file processing (Python)
- **read-later-to-html/** - Convert read-later items to HTML (TypeScript)

## Common Development Commands

### TypeScript/Bun Projects (e.g., audio-transcriber)
```bash
bun run start          # Run the main script
bun run dev            # Run with watch mode
bun run lint           # Run ESLint
bun run lint:fix       # Fix linting issues
bun run format         # Format code with Prettier
bun run format:check   # Check formatting
bun run typecheck      # TypeScript type checking
bun run check          # Run all checks (typecheck, lint, format)
```

### TypeScript/Yarn Projects (e.g., clipboard-to-markdown)
```bash
yarn build    # Compile TypeScript
yarn start    # Run compiled JavaScript
```

### Python Projects
```bash
uv run python <script>.py   # Run Python scripts with dependencies
```

## Architecture Patterns

### Raycast Script Pattern
Each script consists of:
1. **Shell wrapper** (`.sh`) - Contains Raycast metadata and launches the implementation
2. **Implementation directory** - Contains the actual script logic
3. **Dependencies** - Managed via `package.json` (TypeScript) or `pyproject.toml` (Python)

### Technology Stack
- **Python 3.13+** - Using `uv` package manager with `pyproject.toml`
- **TypeScript** - Either Bun or Yarn, targeting ES modules
- **Shell scripts** - Bash/Zsh for Raycast integration

### Code Standards
- TypeScript projects use strict mode with ESLint and Prettier
- Python projects follow standard formatting conventions
- All scripts are self-contained with minimal external dependencies

## Adding New Scripts

1. Create a new directory for your script
2. Add implementation in Python or TypeScript
3. Create a Raycast-compatible `.sh` wrapper with proper metadata:
   ```bash
   #!/usr/bin/env bash
   # Required parameters:
   # @raycast.schemaVersion 1
   # @raycast.title Script Title
   # @raycast.mode fullOutput
   # @raycast.packageName Scripts
   ```
4. Follow existing patterns for dependency management and code structure

## Important Notes

- Many scripts depend on external APIs or local system state that may not be available in testing environments
- Scripts are designed for personal productivity use on macOS with Raycast installed
- The repository follows conventions documented in `AGENTS.md`

## Code Quality Requirements

When working on any script in this repository:
- **Always run linting, formatting, and type checking** before completing any task
- **Run type checking regularly** when making changes to TypeScript projects
- For TypeScript/Bun projects: Run `bun run check` or individually run `bun run typecheck`, `bun run lint`, and `bun run format:check`
- For TypeScript/Yarn projects: If no type checking script exists in package.json, either add one or run `tsc --noEmit` manually
- For Python projects: Follow standard formatting conventions