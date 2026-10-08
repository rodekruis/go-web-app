import { toPng } from 'html-to-image';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import {
    type NrwCapturedImage,
    type NrwScreenCaptureHandler,
} from '#views/CountryProfileNationalRiskWatch/contexts/NrwScreenCaptureContext';

const screenCapturePixelRatio = 2;

export function captureElement(element: HTMLElement): Promise<NrwCapturedImage> {
    const { width, height } = element.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
        throw new Error('Element to capture has no size');
    }

    return toPng(element, {
        cacheBust: true,
        pixelRatio: screenCapturePixelRatio,
    }).then((dataUrl) => ({ dataUrl, aspectRatio: width / height }));
}

// The Mapbox controls (zoom buttons, attribution) are excluded from the capture.
function captureNrwMap(map: MapboxMap): NrwScreenCaptureHandler {
    return () => {
        const container = map.getContainer();
        const controls = container.querySelector('.mapboxgl-control-container');

        const { width, height } = container.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
            throw new Error('Map container has no size');
        }

        return toPng(container, {
            cacheBust: true,
            pixelRatio: screenCapturePixelRatio,
            filter: (node) => node !== controls,
        }).then((dataUrl) => ({ dataUrl, aspectRatio: width / height }));
    };
}

export default captureNrwMap;
