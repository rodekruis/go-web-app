import JsPDF from 'jspdf';

import {
    type NrwCapturedImage,
} from '#views/CountryProfileNationalRiskWatch/contexts/NrwScreenCaptureContext';
import {
    type CountryCodeIso3,
    type NrwEvent,
} from '#views/CountryProfileNationalRiskWatch/types';

interface NrwPdfText {
    title: string;
    generated: string;
    mapNote: string;
    pageLabel: string;
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

const textPrimary = '#323232'; // go-ui-color-gray-90
const textSecondary = '#6f6f6f'; // go-ui-color-gray-70
const divider = '#c6c6c6'; // go-ui-color-gray-40

function getDisplayArea(aspectRatio: number, maxWidth: number, maxHeight: number) {
    let width = maxWidth;
    let height = width / aspectRatio;
    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }
    return { width, height };
}

function getFileName(
    selectedEvent: NrwEvent | undefined,
    countries: CountryCodeIso3[],
): string {
    const date = new Date().toISOString().slice(0, 10);
    if (selectedEvent) {
        return `national-risk-watch-${selectedEvent.countryCodeIso3}-event${selectedEvent.eventId}-${date}.pdf`;
    }
    if (countries.length === 1) {
        return `national-risk-watch-${countries[0]}-${date}.pdf`;
    }
    // Fallback to using a generic file name (For multi-country map exports)
    return `national-risk-watch-${date}.pdf`;
}

export default function exportNrwToPdf(
    mapImage: NrwCapturedImage,
    eventsImage: NrwCapturedImage | undefined,
    selectedEvent: NrwEvent | undefined,
    countries: CountryCodeIso3[],
    text: NrwPdfText,
): void {
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

    pdf.save(getFileName(selectedEvent, countries));
}
