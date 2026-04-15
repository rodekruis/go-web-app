import html2canvas from 'html2canvas';
import JsPDF from 'jspdf';
import type MapOl from 'ol/Map';

interface PrintElementIds {
    dataPanel: string;
    layerPanel: string;
    controlPanel: string;
    map: string;
}

const DEFAULT_ELEMENT_IDS: PrintElementIds = {
    dataPanel: 'nrw-data-panel',
    layerPanel: 'nrw-layer-panel',
    controlPanel: 'nrw-control-panel',
    map: 'nrw-map',
};

interface CapturedElement {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
}

async function captureElement(elementId: string): Promise<CapturedElement | null> {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id "${elementId}" not found`);
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

/**
 * Captures the OpenLayers map after waiting for render to complete.
 * This ensures all layers (including tiles) are fully rendered.
 */
async function captureOlMap(
    mapInstance: MapOl,
    mapElementId: string,
): Promise<CapturedElement | null> {
    const mapElement = document.getElementById(mapElementId);
    if (!mapElement) {
        console.error(`Map element with id "${mapElementId}" not found`);
        return null;
    }

    return new Promise((resolve) => {
        mapInstance.once('rendercomplete', () => {
            // Get the map's viewport which contains the canvas
            const mapCanvas = mapInstance.getViewport().querySelector('canvas');

            if (mapCanvas) {
                // Use the OpenLayers canvas directly - it's already rendered
                resolve({
                    canvas: mapCanvas as HTMLCanvasElement,
                    width: mapCanvas.width,
                    height: mapCanvas.height,
                });
            } else {
                // Fallback: capture the element with html2canvas
                html2canvas(mapElement, {
                    useCORS: true,
                    allowTaint: false,
                    ignoreElements: (element) => element.classList.contains('ol-control'),
                }).then((canvas) => {
                    resolve({
                        canvas,
                        width: canvas.width,
                        height: canvas.height,
                    });
                }).catch((error) => {
                    console.error('Error capturing map:', error);
                    resolve(null);
                });
            }
        });

        // Trigger a render to ensure 'rendercomplete' fires
        mapInstance.renderSync();
    });
}

/**
 * Captures the IBF map, data panel, and control panels and generates a PDF.
 * Layout: A4 portrait with data panel on top, map in the middle,
 * and control panel (left) + layers panel (right) at the bottom.
 * @param mapInstance - The OpenLayers map instance (required for proper map capture)
 * @param filename - The name of the PDF file to download (default: 'ibf-map-report.pdf')
 * @param elementIds - Custom element IDs to capture (optional)
 */
export async function printMapToPdf(
    mapInstance: MapOl,
    filename: string = 'ibf-map-report.pdf',
    elementIds: PrintElementIds = DEFAULT_ELEMENT_IDS,
): Promise<void> {
    try {
        // Capture panels in parallel, but map needs special handling
        const [dataPanel, layerPanel, controlPanel] = await Promise.all([
            captureElement(elementIds.dataPanel),
            captureElement(elementIds.layerPanel),
            captureElement(elementIds.controlPanel),
        ]);

        // Capture map using OpenLayers rendercomplete event
        const mapElement = await captureOlMap(mapInstance, elementIds.map);

        // Create PDF in portrait A4 orientation
        const pdf = new JsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm for A4
        const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm for A4
        const margin = 10;
        const contentWidth = pageWidth - 2 * margin;
        const gap = 5;

        // Layout configuration:
        // Page 1: Data panel at the top, map below
        // Page 2: Control panel (left) and Layer panel (right)

        let currentY = margin;

        // 1. Add data panel at the top (full width)
        if (dataPanel) {
            const dataPanelMaxHeight = 30;
            const aspectRatio = dataPanel.width / dataPanel.height;
            let scaledWidth = contentWidth;
            let scaledHeight = contentWidth / aspectRatio;

            if (scaledHeight > dataPanelMaxHeight) {
                scaledHeight = dataPanelMaxHeight;
                scaledWidth = dataPanelMaxHeight * aspectRatio;
            }

            pdf.addImage(
                dataPanel.canvas.toDataURL('image/png'),
                'PNG',
                margin,
                currentY,
                scaledWidth,
                scaledHeight,
            );
            currentY += scaledHeight + gap;
        }

        // Calculate available height for the map (full remaining space on page 1)
        const mapMaxHeight = pageHeight - currentY - margin;

        // 2. Add map (full width, uses remaining space on page 1)
        if (mapElement) {
            const aspectRatio = mapElement.width / mapElement.height;
            let scaledWidth = contentWidth;
            let scaledHeight = contentWidth / aspectRatio;

            if (scaledHeight > mapMaxHeight) {
                scaledHeight = mapMaxHeight;
                scaledWidth = mapMaxHeight * aspectRatio;
            }

            // Center the map horizontally if it's narrower than content width
            const mapX = margin + (contentWidth - scaledWidth) / 2;

            pdf.addImage(
                mapElement.canvas.toDataURL('image/png'),
                'PNG',
                mapX,
                currentY,
                scaledWidth,
                scaledHeight,
            );
        }

        // 3. Add second page for panels: Control panel (left) and Layer panel (right)
        pdf.addPage();
        const bottomPanelWidth = (contentWidth - gap) / 2;

        // Control panel on the left (full size)
        if (controlPanel) {
            const aspectRatio = controlPanel.width / controlPanel.height;
            const scaledWidth = bottomPanelWidth;
            const scaledHeight = bottomPanelWidth / aspectRatio;

            pdf.addImage(
                controlPanel.canvas.toDataURL('image/png'),
                'PNG',
                margin,
                margin,
                scaledWidth,
                scaledHeight,
            );
        }

        // Layer panel on the right (full size)
        if (layerPanel) {
            const aspectRatio = layerPanel.width / layerPanel.height;
            const scaledWidth = bottomPanelWidth;
            const scaledHeight = bottomPanelWidth / aspectRatio;

            const layerPanelX = margin + bottomPanelWidth + gap;

            pdf.addImage(
                layerPanel.canvas.toDataURL('image/png'),
                'PNG',
                layerPanelX,
                margin,
                scaledWidth,
                scaledHeight,
            );
        }

        // Download the PDF
        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

export default printMapToPdf;
