import { toPng } from 'html-to-image';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

const screenCapturePixelRatio = 2;

const svgStyleProperties = [
    'fill',
    'fill-opacity',
    'stroke',
    'stroke-width',
    'stroke-dasharray',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-opacity',
    'opacity',
    'font-family',
    'font-size',
    'font-weight',
    'text-transform',
];

// html-to-image copies SVG children without their stylesheet styles, so inline them
function inlineSvgChildStyles(element: HTMLElement) {
    element.querySelectorAll<SVGElement>('svg *').forEach((svgChild) => {
        const computedStyle = window.getComputedStyle(svgChild);
        svgStyleProperties.forEach((property) => {
            svgChild.style.setProperty(property, computedStyle.getPropertyValue(property));
        });
    });
}

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

    inlineSvgChildStyles(clone);

    return toPng(clone, {
        cacheBust: true,
        pixelRatio: screenCapturePixelRatio,
    })
        .then((dataUrl) => ({ dataUrl, aspectRatio: width / height }))
        .finally(() => host.remove());
}

function loadImage(source: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load captured image'));
        image.src = source;
    });
}

// Capture handler to fetch a filtered view of the NRW map,
// with an exclusion list of elements to ignore
function captureNrwMap(
    map: MapboxMap,
    wrapper: HTMLElement,
    excludedElements: (HTMLElement | null)[],
) {
    return async () => {
        const mapCanvas = map.getCanvas();
        const mapboxControls = map.getContainer().querySelector('.mapboxgl-control-container');
        const excluded = new Set<Node | null>([mapCanvas, mapboxControls, ...excludedElements]);

        const wrapperRect = wrapper.getBoundingClientRect();
        const { width, height } = wrapperRect;
        if (width <= 0 || height <= 0) {
            throw new Error('Map container has no size');
        }

        // WebKit does not reliably render the WebGL canvas through html-to-image
        // (it is embedded as an image in an SVG foreignObject), so draw the map canvas
        // directly and only use html-to-image for the HTML overlay on top of it.
        const overlayDataUrl = await toPng(wrapper, {
            cacheBust: true,
            pixelRatio: screenCapturePixelRatio,
            filter: (node) => !excluded.has(node),
        });
        const overlayImage = await loadImage(overlayDataUrl);

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = Math.round(width * screenCapturePixelRatio);
        outputCanvas.height = Math.round(height * screenCapturePixelRatio);
        const context = outputCanvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D context not available');
        }
        context.scale(screenCapturePixelRatio, screenCapturePixelRatio);

        const mapCanvasRect = mapCanvas.getBoundingClientRect();
        context.drawImage(
            mapCanvas,
            mapCanvasRect.left - wrapperRect.left,
            mapCanvasRect.top - wrapperRect.top,
            mapCanvasRect.width,
            mapCanvasRect.height,
        );
        context.drawImage(overlayImage, 0, 0, width, height);

        return { dataUrl: outputCanvas.toDataURL('image/png'), aspectRatio: width / height };
    };
}

export default captureNrwMap;
