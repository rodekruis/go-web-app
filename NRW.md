# National Risk Watch

A system that forecasts Early Warning alerts, disseminates notifications, and visualizes exposure information to support decision making, following the country advisory. It has:

- A front-end, which is being developed in (a fork of) this repo. It can be rendered as standalone, or embedded within the IFRC GO navigation structure.
- And `data pipelines` (producing forecasts) and `back-end services` (ingesting and processing forecast data via API and publishing this - alongside seed data - via APIs) which are developed in a [separate repo](https://github.com/rodekruis/IBF/blob/main).

## Getting started

### GitHub SSH

To be able to checkout and update the submodules in this repository you'll need to connect to GitHub via SSH. This is configured/determined by the contents of `.gitmodules` where the URLs for the different submodules are set to be `url = git@github.com:IFRCGo/go-api.git`. GitHub URLs that start with `git@` clone and pull over SSH.

GitHub provides [documentation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) on how to do this.

The broad steps are:

1. generate an SSH public/private key pair with a passphrase (commandline)
2. configure your local ssh-agent to manage these keys (commandline)
3. add the public key to GitHub (browser)
4. test the SSH connection (commandline)

### Start

1. Launch the [NRW backend services](https://github.com/rodekruis/IBF/blob/main/services) and populate the DB. See [README](https://github.com/rodekruis/IBF/blob/main/README.md)
2. Generate TypeScript types for talking to the various backends:
3. Checkout all submodules: `git submodule update --init --recursive`
4. In `app/` run `pnpm initialize:type`
5. In the root of the repository run `pnpm generate:type`, this should exit successfully.
6. Copy [`sample.env`](./app/sample.env), rename it to `.env` and set any needed values there.
7. **NOTE**: You can set `APP_NRW_STANDALONE` to `false` or `true` for respectively _embedded_ or _standalone_ version. If the former, then set up and run the `go-api` submodule service first. See [go-api README](./go-api/README.md).
8. The FontAwesome API token must be available when installing dependencies: `FONTAWESOME_API_KEY=XXXX pnpm install`.
9. Launch with `pnpm start` and visit `http://localhost:3000`.
10. In embedded version: go to Country > Country Profile > National Risk Watch. Standalone version is directly accessible at `http://localhost:3000`.

## CI/CD setup

The CI workflow needs the environment variable `FONTAWESOME_API_KEY`.
