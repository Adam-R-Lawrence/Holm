const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'styles/**',
            'documents/**',
            'images/**'
        ]
    },
    js.configs.recommended,
    {
        files: ['javascript/**/*.js'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
        }
    },
    {
        files: ['javascript/app/**/*.js'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021
            }
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
        }
    },
    {
        files: ['tests/**/*.js', 'playwright.config.js'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2021
            }
        },
        rules: {
            'no-console': 'off'
        }
    }
];
