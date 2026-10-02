import { type ReactNode } from 'react';
import {
    LanguageContext,
    type LanguageContextProps,
} from '@ifrc-go/ui/contexts';
import { noOp } from '@togglecorp/fujs';

// Serves the bundled strings of each component without provider warnings.
const languageContextValue: LanguageContextProps = {
    currentLanguage: 'en',
    setCurrentLanguage: noOp,
    languageNamespaceStatus: {},
    setLanguageNamespaceStatus: noOp,
    strings: {},
    setStrings: noOp,
    registerNamespace: noOp,
};

// Pass as the Testing Library `wrapper` option to render or renderHook.
function TestProviders(props: { children: ReactNode }) {
    const { children } = props;

    return (
        <LanguageContext.Provider value={languageContextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

export default TestProviders;
