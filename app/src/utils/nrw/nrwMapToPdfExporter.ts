import html2canvas from 'html2canvas';
import JsPDF from 'jspdf';

import {
    EVENTS_PANEL_ELEMENT_ID,
    LEGEND_PANEL_ELEMENT_ID,
    MAP_CONTAINER_ELEMENT_ID,
} from '#utils/nrw/nrwConstants';

interface CapturedElement {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

async function captureElement(elementId: string): Promise<CapturedElement | null> {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`[MapboxPdfExport] Element with id "${elementId}" not found`);
        return null;
    }

    const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
    });

    return {
        canvas,
        width: canvas.width,
        height: canvas.height,
    };
}

// Grab the Mapbox WebGL canvas straight from the DOM by its container id
function captureMapCanvas(containerId: string): CapturedElement | null {
    const container = document.getElementById(containerId);
    const canvas = container?.querySelector('canvas') ?? null;
    if (!canvas) {
        console.error(`[MapboxPdfExport] Map canvas not found in "${containerId}"`);
        return null;
    }

    return {
        canvas,
        width: canvas.width,
        height: canvas.height,
    };
}

// Convert a captured element to a valid PNG data URL, or null if it fails
function toPngDataUrl(element: CapturedElement | null, label: string): string | null {
    if (!element || element.width <= 0 || element.height <= 0) {
        return null;
    }

    try {
        const dataUrl = element.canvas.toDataURL('image/png');
        if (!dataUrl.startsWith('data:image/png')) {
            console.error(`[MapboxPdfExport] ${label} PNG conversion produced invalid data`);
            return null;
        }
        return dataUrl;
    } catch (error) {
        console.error(`[MapboxPdfExport] Failed to convert ${label} to PNG:`, error);
        return null;
    }
}

// Captures the Mapbox map and other tagged elements, and exports them in a pdf.
// Always saves a PDF (blank if the map cannot be captured) rather than throwing.
export default async function exportNrwDataMapToPdf(
    filenameSections: string[] = [],
): Promise<void> {
    const filename = `nrw-mapbox-map-${filenameSections.join('-')}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Set PDF size and page properties
    const pdf = new JsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    const mapElement = captureMapCanvas(MAP_CONTAINER_ELEMENT_ID);
    const mapImageData = toPngDataUrl(mapElement, 'Map canvas');

    // Grab optional elements by DOM id.
    const [legendResult, eventsResult] = await Promise.allSettled([
        captureElement(LEGEND_PANEL_ELEMENT_ID),
        captureElement(EVENTS_PANEL_ELEMENT_ID),
    ]);

    const legendPanel = legendResult.status === 'fulfilled' ? legendResult.value : null;
    const eventsPanel = eventsResult.status === 'fulfilled' ? eventsResult.value : null;

    if (mapImageData && mapElement) {
        // Set up the first page: map and legend panel.
        // This is debug design and will be covered by a design item later
        const legendImageData = toPngDataUrl(legendPanel, 'Legend canvas');
        const legendSpacing = legendImageData ? 5 : 0;
        let legendWidth = 0;
        let legendHeight = 0;

        if (legendImageData && legendPanel) {
            const legendAspectRatio = legendPanel.width / legendPanel.height;
            legendWidth = contentWidth;
            legendHeight = legendWidth / legendAspectRatio;
        }

        const mapAspectRatio = mapElement.width / mapElement.height;
        let mapWidth = contentWidth;
        let mapHeight = mapWidth / mapAspectRatio;

        const availableMapHeight = contentHeight - legendHeight - legendSpacing;
        if (mapHeight > availableMapHeight) {
            mapHeight = availableMapHeight;
            mapWidth = mapHeight * mapAspectRatio;
        }

        const mapX = margin + (contentWidth - mapWidth) / 2;
        const mapY = margin;

        pdf.addImage(mapImageData, 'PNG', mapX, mapY, mapWidth, mapHeight);

        if (legendImageData && legendWidth > 0 && legendHeight > 0) {
            const legendX = margin + (contentWidth - legendWidth) / 2;
            const legendY = mapY + mapHeight + legendSpacing;
            pdf.addImage(legendImageData, 'PNG', legendX, legendY, legendWidth, legendHeight);
        }
    }

    // Second page: events panel.
    const eventsImageData = toPngDataUrl(eventsPanel, 'Events panel canvas');
    if (eventsImageData && eventsPanel) {
        pdf.addPage();
        const panelAspectRatio = eventsPanel.width / eventsPanel.height;
        let panelWidth = contentWidth;
        let panelHeight = panelWidth / panelAspectRatio;

        if (panelHeight > contentHeight) {
            panelHeight = contentHeight;
            panelWidth = panelHeight * panelAspectRatio;
        }

        pdf.addImage(eventsImageData, 'PNG', margin, margin, panelWidth, panelHeight);
    }

    pdf.save(filename);
}
