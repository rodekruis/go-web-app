import path from 'path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const cssPaths = [
    path.resolve(__dirname, './src/index.css'),
    path.resolve(__dirname, './node_modules/@ifrc-go/ui/dist/index.css'),
];

/** @type {import('stylelint').Config} */
const config = {
    extends: [
        'stylelint-config-recommended',
        'stylelint-config-concentric',
    ],
    plugins: [
        '@stylistic/stylelint-plugin',
        'stylelint-value-no-unknown-custom-properties',
    ],
    rules: {
        '@stylistic/indentation': 4,
        '@stylistic/no-eol-whitespace': true,
        '@stylistic/no-missing-end-of-source-newline': true,
        '@stylistic/no-empty-first-line': true,
        '@stylistic/named-grid-areas-alignment': true,
        '@stylistic/number-leading-zero': 'always',
        '@stylistic/unit-case': 'lower',
        '@stylistic/string-quotes': 'single',
        '@stylistic/max-empty-lines': 1,
        '@stylistic/declaration-colon-space-after': 'always',
        '@stylistic/declaration-bang-space-before': 'always',
        '@stylistic/declaration-bang-space-after': 'never',
        '@stylistic/declaration-block-trailing-semicolon': 'always',
        '@stylistic/value-list-comma-space-after': 'always-single-line',
        'csstools/value-no-unknown-custom-properties': [
            true,
            {
                importFrom: cssPaths,
            },
        ],
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
    },
};

export default config;
