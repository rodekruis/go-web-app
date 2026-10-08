import { toPng } from 'html-to-image';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import {
    type NrwCapturedImage,
    type NrwScreenshotHandler,
} from '#views/CountryProfileNationalRiskWatch/contexts/NrwScreenshotContext';

const screenshotPixelRatio = 2;

export function captureElementScreenshot(element: HTMLElement): Promise<NrwCapturedImage> {
    const { width, height } = element.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
        throw new Error('Element to capture has no size');
    }

    return toPng(element, {
        cacheBust: true,
        pixelRatio: screenshotPixelRatio,
    }).then((dataUrl) => ({ dataUrl, aspectRatio: width / height }));
}

// The Mapbox controls (zoom buttons, attribution) are excluded from the screenshot.
function captureNrwMapScreenshot(map: MapboxMap): NrwScreenshotHandler {
    return () => {
        const container = map.getContainer();
        const controls = container.querySelector('.mapboxgl-control-container');

        const { width, height } = container.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
            throw new Error('Map container has no size');
        }

        return toPng(container, {
            cacheBust: true,
            pixelRatio: screenshotPixelRatio,
            filter: (node) => node !== controls,
        }).then((dataUrl) => ({ dataUrl, aspectRatio: width / height }));
    };
}

export default captureNrwMapScreenshot;
