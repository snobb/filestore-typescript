import * as js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        // Global Environment
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2025,
            },
        },
        // Default Application Rules
        rules: {
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        },
    },
    {
        // Declaration File Override
        files: ['**/*.d.ts'],
        rules: {
            '@typescript-eslint/consistent-type-definitions': 'off',
        },
    },
    // Prettier (Must be last)
    prettier,
];
