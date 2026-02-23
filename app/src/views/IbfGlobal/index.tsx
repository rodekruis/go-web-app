import { Outlet } from 'react-router-dom';
import {
    Container,
    Description,
    Image,
    ListView,
    NavigationTabList,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import { resolveToComponent } from '@ifrc-go/ui/utils';

import perApproach from '#assets/content/per_approach_notext.svg';
import Link from '#components/Link';
import NavigationTab from '#components/NavigationTab';
import Page from '#components/Page';
import WikiLink from '#components/WikiLink';

import i18n from './i18n.json';

/** @knipignore */
// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    return (
        <Page
            title={strings.ibfTitle}
            heading={strings.ibfHeading}
            description={strings.ibfDescription}
        >
                IBF
        </Page>
    );
}

Component.displayName = 'IBF';
