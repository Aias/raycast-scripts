// @ts-check
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.js'],
		languageOptions: {
			parser: typescriptParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
			parserOptions: {
				project: ['./tsconfig.json', './packages/*/tsconfig.json'],
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': typescript,
			prettier: prettier,
		},
		rules: {
			...typescript.configs['recommended'].rules,
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
		ignores: [
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
		],
	},
];
