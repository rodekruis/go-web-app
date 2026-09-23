import { toPng } from 'html-to-image';
import JsPDF from 'jspdf';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

interface CapturedImage {
    dataUrl: string;
    aspectRatio: number;
}

// Reading the WebGL canvas is only reliable inside a render callback unless
// the map was created with preserveDrawingBuffer, which we avoid changing.
function captureMap(map: MapboxMap): Promise<CapturedImage> {
    return new Promise((resolve, reject) => {
        map.once('render', () => {
            try {
                const canvas = map.getCanvas();
                resolve({
                    dataUrl: canvas.toDataURL('image/png'),
                    aspectRatio: canvas.width / canvas.height,
                });
            } catch (error) {
                reject(error);
            }
        });
        map.triggerRepaint();
    });
}

async function captureElement(
    element: HTMLElement | null | undefined,
): Promise<CapturedImage | undefined> {
    if (!element) {
        return undefined;
    }

    const { width, height } = element.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
        return undefined;
    }

    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
    return { dataUrl, aspectRatio: width / height };
}

// Scale to fit inside a box while preserving aspect ratio.
function fitInto(aspectRatio: number, maxWidth: number, maxHeight: number) {
    let width = maxWidth;
    let height = width / aspectRatio;
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    return { width, height };
}

function getFileName(selectedEvent: NrwEvent | undefined): string {
    const date = new Date().toISOString().slice(0, 10);
    if (!selectedEvent) {
        return `national-risk-watch--${date}.pdf`;
    }
    return `national-risk-watch-${selectedEvent.countryCodeIso3}-event${selectedEvent.eventId}-${date}.pdf`;
}

export default async function exportNrwToPdf(
    map: MapboxMap,
    eventsElement: HTMLElement | null | undefined,
    selectedEvent: NrwEvent | undefined,
): Promise<void> {
    const [mapImage, eventsImage] = await Promise.all([
        captureMap(map),
        captureElement(eventsElement),
    ]);

    const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const margin = 10;
    const gap = 5;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentHeight = pageHeight - 2 * margin;
    const contentWidth = pageWidth - 2 * margin;

    // Roughly mirror the on-screen layout: map left, events sidebar right.
    const eventsColumnWidth = eventsImage ? contentWidth * 0.3 : 0;
    const mapColumnWidth = contentWidth - eventsColumnWidth - (eventsImage ? gap : 0);

    const mapSize = fitInto(mapImage.aspectRatio, mapColumnWidth, contentHeight);
    pdf.addImage(mapImage.dataUrl, 'PNG', margin, margin, mapSize.width, mapSize.height);

    if (eventsImage) {
        const eventsSize = fitInto(eventsImage.aspectRatio, eventsColumnWidth, contentHeight);
        const eventsX = margin + mapColumnWidth + gap;
        pdf.addImage(eventsImage.dataUrl, 'PNG', eventsX, margin, eventsSize.width, eventsSize.height);
    }

    pdf.save(getFileName(selectedEvent));
}
