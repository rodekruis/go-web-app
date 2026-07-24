import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Container,
    ListView,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    isTruthyString,
    unique,
} from '@togglecorp/fujs';

import NrwMap from '#components/domain/NrwMap';
import NrwNavbar from '#components/domain/NrwNavbar';
import Page from '#components/Page';
import { nrwStandalone } from '#config';
import useCountry from '#hooks/domain/useCountry';

import i18n from './i18n.json';
import styles from './styles.module.css';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const strings = useTranslation(i18n);

    const [searchParams] = useSearchParams();
    const allCountries = useCountry();

    const countryName = useMemo(
        () => {
            // ?countryCodeIso3=ETH,MWI or ?countryCodeIso3=ETH&countryCodeIso3=MWI
            const countryCodes = searchParams
                .getAll('countryCodeIso3')
                .flatMap((value) => value.split(','))
                .map((code) => code.trim().toUpperCase())
                .filter(isTruthyString);

            const uniqueCountryCodes = unique(countryCodes);

            // only show a country name when exactly one country is selected
            if (uniqueCountryCodes.length !== 1) {
                return undefined;
            }

            const [countryCode] = uniqueCountryCodes;
            const matchedCountry = allCountries?.find(
                (country) => country.iso3.toUpperCase() === countryCode,
            );

            return matchedCountry?.name;
        },
        [searchParams, allCountries],
    );

    const content = (
        <Container
            heading={nrwStandalone ? '' : strings.nationalRiskWatchHeading}
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
            <>
                <NrwNavbar countryName={countryName} />
                <Page
                    title={strings.nationalRiskWatchPageTitle}
                    className={styles.page}
                    mainSectionContainerClassName={styles.mainSectionContainer}
                    mainSectionClassName={styles.mainSection}
                >
                    {content}
                </Page>
            </>
        );
    }

    return content;
}

Component.displayName = 'CountryProfileNationalRiskWatch';
