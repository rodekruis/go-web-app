# NRW Component

This is the shared NRW map component.

The "Nrw..." prefix naming of the files and components is to help tell the new changes apart from existing GO components. More general components will be derived from these after working more with the TC team.

## Basic Architecture

- The `Nrw` component is the main parent for all NRW mapping components. It creates the NRW components and the callbacks needed to communicate between them. It holds the state for the selected event. Data loading and other state management logic is handled by hooks.

### Hooks

- The `useNrwDataLoader` hook is the shared object used for loading/caching shared data and the state of that data.
- The `useNrwMapSearchParams` hook parses and updates the url search params that are used for deeplinking map states. This is read once on page load. After that, it only writes to the search params to keep the state up-to-date.

### Components

- `MapboxDataMap` is the map component for NRW. It displays data from the `useNrwDataLoader` hook via the layer functions it registers with that hook.
- `NrwEventsPanel` and `NrwLayerPanel` are the UI interaction layers.
- `NrwLegendPanel` displays map legend information

## Running Locally

The NRW frontend can be launched either from this project, or from the [standalone NRW project in the IBF repo](https://github.com/rodekruis/IBF/blob/main/portal/nrw-standalone/README.md). For launching from this repo, see the setup steps below:

1. Launch the [IBF back-end services](https://github.com/rodekruis/IBF/blob/main/services/docker-compose.yml) and populate the DB. See the readme [README](https://github.com/rodekruis/IBF/blob/main/README.md) for those steps.
2. Copy `sample.env`, rename it to `.env` and set any needed values there. If there were changes since your last run, be sure to update your `.env` file as well. Another dev can provide these values, or see the NLRC [BitWarden page](https://bitwarden.com/).
3. The FontAwesome API token must be set in your environment before running `pnpm install`. From `/go-web-app/app`, set it with `export $(grep '^FONTAWESOME_API_KEY=' .env | xargs)`.
4. Set up this repo to run, following the readme in the base directory.
5. Launch with `pnpm start` from `/go-web-app/app`.
6. Navigate to `localhost:3000/nrw?c=<valid ISO_A3 country code>`, such as http://localhost:3000/nrw?c=mwi

## Base Map

The base map is provided through [MapBox](https://www.mapbox.com/). You can modify the existing map or create a map there. For the NLRC MapBox account credentials, see BitWarden. The map 'style' url is set in `nrwConstants.ts`.

The `.env` var must be set to match the API key of either the NLRC or IFRC Mapbox account (Mapbox > API Keys). For Go, production will use the IFRC Mapbox API key. The NRW base map is set to public, so it can be accessed with either the NLRC or IFRC Mapbox API keys.

## Testing

- Unit testing is to be added for the helper files. See task [43473](https://dev.azure.com/redcrossnl/National%20Risk%20Watch/_workitems/edit/43473)
- End-to-end testing for IBF backend integration will be carried out in the [IBF repo](https://github.com/rodekruis/IBF).
