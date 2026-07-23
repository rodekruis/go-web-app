import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMap from '#components/domain/NrwMap';
import Page from '#components/Page';
import { nrwStandalone } from '#config';

import i18n from './i18n.json';
import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    const content = (
        <Container
            heading={strings.nationalRiskWatchHeading}
        >
            <ListView
                layout="grid"
                withSidebar
            >

                <NrwMap />
            </ListView>
        </Container>
    );

    if (nrwStandalone) {
        return (
            <Page
                title={strings.nationalRiskWatchPageTitle}
                className={styles.page}
                mainSectionContainerClassName={styles.mainSectionContainer}
                mainSectionClassName={styles.mainSection}
            >
                {content}
            </Page>
        );
    }

    return content;
}

Component.displayName = 'CountryProfileNationalRiskWatch';
