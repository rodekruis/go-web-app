import { toPng } from 'html-to-image';
import JsPDF from 'jspdf';
import { type Map as MapboxMap } from 'mapbox-gl-v3';

import { type NrwEvent } from '#views/CountryProfileNationalRiskWatch/types';

interface NrwPdfText {
    title: string;
    generated: string;
    mapNote: string;
    pageLabel: string;
}

interface CapturedImage {
    dataUrl: string;
    aspectRatio: number;
}

const frameWidthPx = 1757;
const marginPx = 40;
const headerHeightPx = 30; // 20px title line + 10px padding above the divider
const contentTopPx = 88;
const mapColumnWidthPx = 1191;
const mapHeightPx = 1073;
const columnGapPx = 18;
const footerTopPx = mapHeightPx + 11;
const titleFontPx = 18;
const captionFontPx = 12;

const textPrimary = '#323232';
const textSecondary = '#6f6f6f';
const divider = '#c6c6c6';

async function captureElement(
    element: HTMLElement,
    filter?: (node: HTMLElement) => boolean,
): Promise<CapturedImage> {
    const { width, height } = element.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
        throw new Error('Element to capture has no size');
    }

    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2, filter });
    return { dataUrl, aspectRatio: width / height };
}

function captureMap(map: MapboxMap): Promise<CapturedImage> {
    const container = map.getContainer();
    const controls = container.querySelector('.mapboxgl-control-container');
    return captureElement(container, (node) => node !== controls);
}

function getDisplayArea(aspectRatio: number, maxWidth: number, maxHeight: number) {
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
        return `national-risk-watch-${date}.pdf`;
    }
    return `national-risk-watch-${selectedEvent.countryCodeIso3}-event${selectedEvent.eventId}-${date}.pdf`;
}

export default async function exportNrwToPdf(
    map: MapboxMap,
    eventsElement: HTMLElement | null | undefined,
    selectedEvent: NrwEvent | undefined,
    text: NrwPdfText,
): Promise<void> {
    const [mapImage, eventsImage] = await Promise.all([
        captureMap(map),
        eventsElement ? captureElement(eventsElement) : undefined,
    ]);

    const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    // jsPDF font sizes are always in px, (which is inch-based).
    // Keep settings in px for design consistency, but convert to px for export.
    function pxToPt(value: number): number {
        const pointsPerInch = 72;
        const mmPerInch = 25.4;
        const mm = px(value);
        const inches = mm / mmPerInch;
        return inches * pointsPerInch;
    }

    const pageWidth = pdf.internal.pageSize.getWidth();
    const px = (value: number) => (value * pageWidth) / frameWidthPx;
    const margin = px(marginPx);
    const rightEdge = pageWidth - margin;

    // Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(pxToPt(titleFontPx));
    pdf.setTextColor(textPrimary);
    pdf.text(text.title.toUpperCase(), margin, margin, { baseline: 'top' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(pxToPt(captionFontPx));
    pdf.setTextColor(textSecondary);
    pdf.text(text.generated, rightEdge, margin, { align: 'right', baseline: 'top' });

    pdf.setDrawColor(divider);
    pdf.setLineWidth(px(1));
    const dividerY = margin + px(headerHeightPx);
    pdf.line(margin, dividerY, rightEdge, dividerY);

    // Main content
    const contentTop = px(contentTopPx);
    const mapColumnWidth = px(mapColumnWidthPx);
    const mapHeight = px(mapHeightPx);
    const mapSize = getDisplayArea(mapImage.aspectRatio, mapColumnWidth, mapHeight);
    pdf.addImage(mapImage.dataUrl, 'PNG', margin, contentTop, mapSize.width, mapSize.height);

    if (eventsImage) {
        const eventsX = margin + mapColumnWidth + px(columnGapPx);
        const eventsColumnWidth = rightEdge - eventsX;
        const eventsSize = getDisplayArea(eventsImage.aspectRatio, eventsColumnWidth, mapHeight);
        pdf.addImage(eventsImage.dataUrl, 'PNG', eventsX, contentTop, eventsSize.width, eventsSize.height);
    }

    // Footer
    const footerY = contentTop + px(footerTopPx);
    pdf.text(text.mapNote, margin + mapColumnWidth, footerY, { align: 'right', baseline: 'top' });
    pdf.text(text.pageLabel, rightEdge, footerY, { align: 'right', baseline: 'top' });

    pdf.save(getFileName(selectedEvent));
}
