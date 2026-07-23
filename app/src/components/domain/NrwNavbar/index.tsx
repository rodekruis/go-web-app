import {
    MenuLineIcon,
    ShieldUserFillIcon,
} from '@ifrc-go/icons';
import {
    Heading,
    ListView,
    PageContainer,
} from '@ifrc-go/ui';
import { useTranslation } from '@ifrc-go/ui/hooks';
import {
    _cs,
    isTruthyString,
} from '@togglecorp/fujs';

import i18n from './i18n.json';
import styles from './styles.module.css';

interface Props {
    className?: string;
    countryName?: string;
}

function NrwNavbar(props: Props) {
    const {
        className,
        countryName,
    } = props;

    const strings = useTranslation(i18n);

    const headerLabel = [
        strings.nrwNavbarTitle,
        countryName,
    ].filter(isTruthyString).join(' | ');

    return (
        <nav className={_cs(styles.navbar, className)}>
            <PageContainer
                className={styles.pageContainer}
                contentClassName={styles.content}
            >
                <ListView
                    withWrap
                    withSpaceBetweenContents
                >
                    <div className={styles.brand}>
                        <MenuLineIcon className={styles.icon} />
                        <Heading
                            level={3}
                            className={styles.heading}
                        >
                            {headerLabel}
                        </Heading>
                    </div>
                    <ShieldUserFillIcon className={styles.iconUser} />
                </ListView>
            </PageContainer>
        </nav>
    );
}

export default NrwNavbar;
