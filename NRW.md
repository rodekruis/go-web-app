# National Risk Watch

The NRW frontend can be launched either from this project, or from the [standalone NRW project in the IBF repo](https://github.com/rodekruis/IBF/blob/main/portal/nrw-standalone/README.md). For launching from this repo, see the setup steps below:

1. Launch the [NRW backend services](https://github.com/rodekruis/IBF/blob/main/services) and populate the DB.
2. Copy [`sample.env`](./app/sample.env), rename it to `.env` and set any needed values there.
3. The FontAwesome API token must be available when installing dependencies: `FONTAWESOME_API_KEY=XXXX pnpm install`.
4. Launch with `pnpm start`.
5. Go to Country > Country Profile > National Risk Watch.

### CI/CD setup

The CI workflow needs the environment variable `FONTAWESOME_API_KEY`.
