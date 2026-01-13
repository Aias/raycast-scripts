# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of Raycast productivity scripts for macOS, implementing various utilities for clipboard operations, file processing, web scraping, and AI-powered tools. Each script follows Raycast's script format with a shell wrapper that launches the actual implementation.

## Project Structure

This is a Bun workspace with the following structure:

```
raycast-scripts/
├── packages/                   # TypeScript/JavaScript packages
│   ├── audio-transcriber/      # Audio transcription and summarization
│   ├── clipboard-to-markdown/  # Markdown conversion utility
│   ├── clipboard-to-pdf/       # PDF generation from clipboard
│   ├── clipboard-to-print/     # Print clipboard content
│   └── slack-to-markdown/      # Slack transcript formatter
├── scripts/                    # Non-TypeScript scripts
│   ├── common.sh               # Shared shell utilities
│   └── python/                 # Python scripts
│       ├── directory-concat/   # Concatenate directory contents
│       └── extract-tweet-media/# Extract media from tweets
└── *.sh                        # Raycast launcher scripts (at root)
```

## Common Development Commands

### Workspace-level Commands (run from root)

```bash
bun install            # Install all dependencies for all packages
bun run lint           # Lint all TypeScript/JavaScript code
bun run lint:fix       # Fix linting issues across workspace
bun run format         # Format all code with Prettier
bun run format:check   # Check formatting across workspace
bun run typecheck      # TypeScript type checking for all packages
bun run check          # Run all checks (format, typecheck, lint)
```

### Package-specific Commands

```bash
# Run a specific package's script
cd packages/<package-name>
bun run start          # Run the main script
bun run dev            # Run with watch mode (if available)

# Or from root:
bun run --filter <package-name> start
```

### Python Projects

```bash
cd scripts/python/<project-name>
uv run python <script>.py   # Run Python scripts with dependencies
```

## Architecture Patterns

### Raycast Script Pattern

Each script consists of:

1. **Shell wrapper** (`.sh`) - Contains Raycast metadata and launches the implementation
2. **Implementation directory** - Contains the actual script logic
3. **Dependencies** - Managed via `package.json` (TypeScript) or `pyproject.toml` (Python)

Scripts can use **dropdown arguments** to consolidate multiple modes into a single entry point:

```bash
# @raycast.argument1 { "type": "dropdown", "placeholder": "Mode", "data": [{"title": "Option A", "value": "a"}, {"title": "Option B", "value": "b"}] }
```

Examples using this pattern:

- `transcribe-audio.sh` - Dropdown for "Full Pipeline" vs "Transcribe Only"
- `process-transcript.sh` - Dropdown for "Clean" vs "Summarize"

### Technology Stack

- **Bun Workspace** - Monorepo for all TypeScript/JavaScript packages
- **Python 3.13+** - Using `uv` package manager with `pyproject.toml`
- **TypeScript** - Bun runtime, targeting ES modules, shared configs
- **Shell scripts** - Bash/Zsh for Raycast integration

### Code Standards

- TypeScript projects use strict mode with ESLint and Prettier
- Python projects follow standard formatting conventions
- All scripts are self-contained with minimal external dependencies

## Adding New Scripts

### For TypeScript/JavaScript Projects

1. Create a new package in `packages/` directory
2. Add a `package.json` with proper name and dependencies
3. Create `tsconfig.json` extending the base config:
   ```json
   {
   	"extends": "../../tsconfig.base.json",
   	"compilerOptions": {
   		"outDir": "./dist",
   		"rootDir": "./src"
   	},
   	"include": ["src/**/*"],
   	"exclude": ["node_modules", "dist"]
   }
   ```
4. Create a Raycast-compatible `.sh` wrapper at the root

### For Python Projects

1. Create a new directory in `scripts/python/`
2. Add `pyproject.toml` for dependencies
3. Create a Raycast-compatible `.sh` wrapper at the root

### For Shell-only Scripts

1. Create a new directory in `scripts/shell/`
2. Create a Raycast-compatible `.sh` wrapper at the root

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

### TypeScript/Bun/Node.js Standards

For all TypeScript and JavaScript projects using ESLint:

- **Always use the latest versions** of ESLint, TypeScript, and Prettier
- **Use ESLint v9+** with the new flat config format (`eslint.config.ts`)
- **Follow the conventions from `@slack-to-markdown/` and `@audio-transcriber/`** as baseline:
  - ESLint flat config with TypeScript support
  - Prettier with tabs (not spaces), single quotes, trailing commas
  - Strict TypeScript configuration
  - Consistent script naming in package.json: `lint`, `lint:check`, `format`, `format:check`, `typecheck`, `check`
  - `.prettierignore` for excluding generated files
  - Type imports should use `import type` syntax
