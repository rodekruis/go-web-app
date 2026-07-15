/**
 * Enums from the IBF backend.
 * To update:
 * Ask an LLM to do the following prompt. You must run it from within the IBF repo.
 * You can then copy the output into the other repo manually, or make a commit from this repo.
 * LLM instructions:
 * - Do not edit this top header comment unless an error is seen in it.
 * - Look at the source enums listed below and update this page based on that.
 * - Also include relevant comments from the source Enums in this file.
 * - Do not copy over enums lists (in the comments) as not used by the frontend (FE).
 *
 * Source Enums:
 * - services/api-service/src/shared-enums.ts
 */

export enum EPSG {
  WGS84 = 'EPSG:4326',
  WebMercator = 'EPSG:3857',
}

export enum ForecastSource {
  glofas = 'glofas',
  ecmwf = 'ECMWF',
  gefs = 'GEFS',
}

export enum HazardType {
  floods = 'floods',
  drought = 'drought',
  tropicalCyclone = 'tropicalCyclone',
}

export enum LayerName {
  // --- generic (cross-hazard) ---
  population = 'population',
  populationExposed = 'populationExposed',
  redCrossBranches = 'redCrossBranches',
  clinics = 'clinics',

  // --- floods-specific ---
  floodDepth = 'floodDepth',
  glofasStations = 'glofasStations',

  // --- tropical cyclone-specific ---
  windSpeed = 'windSpeed',
}

export enum LayerType {
  raster = 'raster',
  shape = 'shape',
  point = 'point',
  vectorTile = 'vectorTile',
}

// Allowed classification levels for alertClass
// (derived from severityClass and probabilityClass according to ALERT_CLASS_MATRIX)
// NOTE: do not change order, as this is used functionally
export enum AlertClass {
  low = 'low',
  medium = 'medium',
  high = 'high',
}
