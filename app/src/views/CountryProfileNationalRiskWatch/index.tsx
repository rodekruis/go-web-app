import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwMap from '#components/domain/NrwMap';

import i18n from './i18n.json';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    return (
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
}

Component.displayName = 'CountryProfileNationalRiskWatch';
