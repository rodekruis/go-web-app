import {
    RequestContext,
    useLazyRequest,
    useRequest,
} from '@togglecorp/toggle-request';

import type { paths as nrwApiPaths } from '#generated/nrwTypes';
import type { paths as riskApiPaths } from '#generated/riskTypes';
import type { paths as translationApiPaths } from '#generated/translationTypes';
import type { paths as goApiPaths } from '#generated/types';

// import type { paths as translationApiPaths } from '#translationTypes';
import type {
    ApiBody,
    ApiResponse,
    ApiUrlQuery,
    CustomLazyRequestOptions,
    CustomLazyRequestReturn,
    CustomRequestOptions,
    CustomRequestReturn,
    ExternalRequestOptions,
    ExternalRequestReturn,
    VALID_METHOD,
} from './overrideTypes';

export type GoApiResponse<URL extends keyof goApiPaths, METHOD extends 'GET' | 'POST' | 'PUT' | 'PATCH' = 'GET'> = ApiResponse<goApiPaths, URL, METHOD>;
export type GoApiUrlQuery<URL extends keyof goApiPaths, METHOD extends 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'> = ApiUrlQuery<goApiPaths, URL, METHOD>
export type GoApiBody<URL extends keyof goApiPaths, METHOD extends 'POST' | 'PUT' | 'PATCH'> = ApiBody<goApiPaths, URL, METHOD>

/** @knipignore This will be used in the future. */
export type NrwApiResponse<URL extends keyof nrwApiPaths, METHOD extends 'GET' | 'POST' | 'PUT' = 'GET'> = ApiResponse<nrwApiPaths, URL, METHOD>;

export type RiskApiResponse<URL extends keyof riskApiPaths, METHOD extends 'GET' | 'POST' | 'PUT' | 'PATCH' = 'GET'> = ApiResponse<riskApiPaths, URL, METHOD>;

export type ListResponseItem<RESPONSE extends {
    results?: Array<unknown>
} | undefined> = NonNullable<NonNullable<RESPONSE>['results']>[number];

/*
const useTranslationRequest = useRequest as <
    PATH extends keyof translationApiPaths,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomRequestOptions<translationApiPaths, PATH, METHOD> & {
        apiType: 'translation'
    }
) => CustomRequestReturn<translationApiPaths, PATH, METHOD>;
*/

// FIXME: identify a way to do this without a cast
const useTranslationLazyRequest = useLazyRequest as <
    PATH extends keyof translationApiPaths,
    CONTEXT = unknown,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomLazyRequestOptions<translationApiPaths, PATH, METHOD, CONTEXT> & { apiType: 'translation' }
) => CustomLazyRequestReturn<translationApiPaths, PATH, METHOD, CONTEXT>;

// FIXME: identify a way to do this without a cast
const useGoRequest = useRequest as <
    PATH extends keyof goApiPaths,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomRequestOptions<goApiPaths, PATH, METHOD>
) => CustomRequestReturn<goApiPaths, PATH, METHOD>;

// FIXME: identify a way to do this without a cast
const useGoLazyRequest = useLazyRequest as <
    PATH extends keyof goApiPaths,
    CONTEXT = unknown,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomLazyRequestOptions<goApiPaths, PATH, METHOD, CONTEXT>
) => CustomLazyRequestReturn<goApiPaths, PATH, METHOD, CONTEXT>;

// FIXME: identify a way to do this without a cast
/** @knipignore This will be used in the future. */
export const useNrwRequest = useRequest as <
    PATH extends keyof nrwApiPaths,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomRequestOptions<nrwApiPaths, PATH, METHOD> & { apiType: 'nrw' }
) => CustomRequestReturn<nrwApiPaths, PATH, METHOD>;

// FIXME: identify a way to do this without a cast
/** @knipignore This will be used in the future. */
export const useNrwLazyRequest = useLazyRequest as <
    PATH extends keyof nrwApiPaths,
    CONTEXT = unknown,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomLazyRequestOptions<nrwApiPaths, PATH, METHOD, CONTEXT> & { apiType: 'nrw' }
) => CustomLazyRequestReturn<nrwApiPaths, PATH, METHOD, CONTEXT>;

// FIXME: identify a way to do this without a cast
const useRiskRequest = useRequest as <
    PATH extends keyof riskApiPaths,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomRequestOptions<riskApiPaths, PATH, METHOD> & { apiType: 'risk' },
) => CustomRequestReturn<riskApiPaths, PATH, METHOD>;

// FIXME: identify a way to do this without a cast
const useRiskLazyRequest = useLazyRequest as <
    PATH extends keyof riskApiPaths,
    CONTEXT = unknown,
    METHOD extends VALID_METHOD | undefined = 'GET',
>(
    requestOptions: CustomLazyRequestOptions<riskApiPaths, PATH, METHOD, CONTEXT> & { apiType: 'risk' }
) => CustomLazyRequestReturn<riskApiPaths, PATH, METHOD, CONTEXT>;

const useExternalRequest = useRequest as <RESPONSE>(
    requestOptions: ExternalRequestOptions<RESPONSE>,
) => ExternalRequestReturn<RESPONSE>;

export {
    RequestContext,
    useExternalRequest,
    useGoLazyRequest as useLazyRequest,
    useGoRequest as useRequest,
    useRiskLazyRequest,
    useRiskRequest,
    useTranslationLazyRequest,
    // useTranslationRequest,
};
