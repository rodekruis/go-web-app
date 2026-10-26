import { useTranslation } from '@ifrc-go/ui/hooks';

import NrwNoticeBanner from '#components/domain/NrwNoticeBanner';

import i18n from './i18n.json';

function NrwEventNotFoundBanner() {
    const strings = useTranslation(i18n);

    return (
        <NrwNoticeBanner message={strings.nrwEventNotFoundMessage} />
    );
}

export default NrwEventNotFoundBanner;
