// Data types and structures used for the NRW map components

// A zoom/center pair describing the current map view
export interface MapViewParameters {
    zoom: number;
    center: {
        lon: number;
        lat: number;
    };
}
