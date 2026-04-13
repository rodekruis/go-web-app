# IBF map component

This component will be the shared NRW map component.

The "Ibf..." prefix naming of the files and components is to help tell the new changes apart from existing GO components. More general components will be derived from these after working more with the TC team.

The "Ol..." prefix stands for OpenLayers (the mapping front library used), and this naming is also subject to change (once we work with the TC team more).

## Basic Architecture

- The `IbfMap component` is the main container for all the NRW mapping components.
- The `useIbfDataLoader` hook is the shared object used for loading/caching all data. This joins the UI logic of loading/selecting data between the UI components and the data map component.
- `OlDataMap` is the NRW map component. It handles admin area rendering/selection, and can have any data layer added to it.
- `OlGlobalMap` is a general global view component that can be used for global map interaction.
- `IbfControlPanel` and `IbfLayerPanel` are the UI interaction layers.

## Testing

- Unit testing will be added once we get to the stage of generalized components.
- End-to-end testing for IBF backend integration will be carried out in the [IBF repo](https://github.com/rodekruis/IBF).