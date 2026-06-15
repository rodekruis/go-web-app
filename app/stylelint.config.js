import fs from 'fs';
import path from 'path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const uiCssPath = path.resolve(__dirname, './node_modules/@ifrc-go/ui/dist/index.css');

const cssPaths = [
    path.resolve(__dirname, './src/index.css'),
    ...(fs.existsSync(uiCssPath) ? [uiCssPath] : []),
    path.resolve(__dirname, './src/components/NrwMap/OlDataMap/styles.module.css'),
];

/** @type {import('stylelint').Config} */
const config = {
    extends: [
        'stylelint-config-recommended',
        'stylelint-config-concentric',
    ],
    plugins: [
        'stylelint-value-no-unknown-custom-properties',
    ],
    rules: {
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
