# NrwMapMapbox

Boundary between NRW map code that knows about Mapbox and code that does not.

## Rule

Everything inside this folder may import from `mapbox-gl-v3` or consume
`useContext(NrwMapContext)`. Nothing outside this folder may.

Exceptions:

- `NrwLngLat.ts` uses a MapBox type
- tests

## What belongs here

- Map instantiation and lifecycle
- `NrwMapContext` — hands the raw `mapbox-gl` `Map` instance to descendants
- Anything calling mapbox APIs: markers, layers, hover/click handlers,
  fit-bounds, screen capture
- Components that are naturally children of components that interact with Mapbox, e.g. `NrwMarker`

## What belongs outside

Components that deal with map concepts without touching mapbox: legends,
layer panels, breadcrumbs, and the top-level `NrwMap` component that wires
everything together.

When adding mapbox-specific code, put it here; when a component stops needing
mapbox, move it out.
