import { toPng } from 'html-to-image';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

const screenCapturePixelRatio = 2;

// Render an off-screen clone of the html element and capture that as an image
// This prevents issues like the browser window being too narrow to show the whole element
export function captureElementClone(element: HTMLElement) {
    const { width } = element.getBoundingClientRect();
    if (width <= 0) {
        throw new Error('Element to capture has no size');
    }

    // Create an off-screen host container for the cloned element
    // Assure it is fully off-screen with no click interaction
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = `-${width * 2}px`;
    host.style.width = `${width}px`;
    host.style.pointerEvents = 'none';
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('inert', '');

    const clone = element.cloneNode(true) as HTMLElement;
    host.appendChild(clone);
    document.body.appendChild(host);

    const { height } = clone.getBoundingClientRect();
    if (height <= 0) {
        host.remove();
        throw new Error('Element to capture has no size');
    }

    return toPng(clone, {
        cacheBust: true,
        pixelRatio: screenCapturePixelRatio,
    })
        .then((dataUrl) => ({ dataUrl, aspectRatio: width / height }))
        .finally(() => host.remove());
}

// Capture handler to fetch a filtered view of the NRW map,
// with an exclusion list of elements to ignore
function captureNrwMap(
    map: MapboxMap,
    wrapper: HTMLElement,
    excludedElements: (HTMLElement | null)[],
) {
    return () => {
        const mapboxControls = map.getContainer().querySelector('.mapboxgl-control-container');
        const excluded = new Set<Node | null>([mapboxControls, ...excludedElements]);

        const { width, height } = wrapper.getBoundingClientRect();
        if (width <= 0 || height <= 0) {
            throw new Error('Map container has no size');
        }

        return toPng(wrapper, {
            cacheBust: true,
            pixelRatio: screenCapturePixelRatio,
            filter: (node) => !excluded.has(node),
        }).then((dataUrl) => ({ dataUrl, aspectRatio: width / height }));
    };
}

export default captureNrwMap;
