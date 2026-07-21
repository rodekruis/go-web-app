import { useSearchParams } from 'react-router-dom';

/**
 * Returns true when the current URL requests a "chromeless" render — no
 * global Navbar/Footer (see RootLayout), and no parent-layout chrome such
 * as Page headings/breadcrumbs or NavigationTabLists (see e.g. Country,
 * CountryProfile) — via the `chromeless=true` query parameter.
 *
 * Intended for embeddable views, e.g. viewing National Risk Watch at
 * /countries/:countryId/profile/national-risk-watch?chromeless=true
 */
export default function useIsChromeless() {
    const [searchParams] = useSearchParams();
    return searchParams.get('chromeless') === 'true';
}
