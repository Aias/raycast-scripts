import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
	js.configs.recommended,
	tseslint.configs.recommended,
	{
		files: ['**/*.ts'],
		ignores: ['eslint.config.ts'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.json', './packages/*/tsconfig.json'],
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				URL: 'readonly',
			},
		},
		plugins: {
			prettier,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
				},
			],
			'no-console': 'off',
		},
	},
	{
		files: ['**/*.js'],
		languageOptions: {
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				URL: 'readonly',
			},
		},
		plugins: {
			prettier,
		},
		rules: {
			...prettierConfig.rules,
			'prettier/prettier': 'error',
			'no-console': 'off',
		},
	},
	globalIgnores([
		'node_modules/',
		'dist/',
		'*.d.ts',
		'.git/',
		'coverage/',
		'scripts/python/',
		'*.pyc',
		'__pycache__/',
		'bun.lockb',
		'*.lock',
		'.yarn/',
	]),
]);
