# GitHub Copilot Instructions - National Risk Watch (NRW)

## Project Overview

NRW is a web application for visualizing and analyzing disaster risk data, built on top of the IFRC Go platform. This repo contains code for the whole Go platform, but this branch focuses on NRW development only.
We control the backend for NRW and generally run it locally during development, so we have direct access to the service and data for debugging.


## How to handle importing changes from the prototype branch

If the prompt is asking to import changes to this branch, follow the instructions in this section and the next. In that case, the user will also give a relative path to the prototype branch.

There are two directories which are each a different branch of the same repo: this branch and the prototype branch.

This branch is the new main branch for quality code we want to check in for our MVP.
The prototype branch was used to develop features before they are brought into this branch.

For these import changes, first follow the code in the prototype branch to see how the system is currently working. Then, make changes in this branch based on that. Follow the file and folder structure in this branch. Follow the functionality in the prototype branch where appropriate.

Never change code in the prototype branch. This is just for our prototype.

When making changes in the new branch, update the llm instructions there as needed to reflect new structural changes or features.

### Structural changes between this branch and the prototype branch

This is a guide for future LLM changes so that future prompts know where files or logic has moved to minimize token spend. Update it as needed. Only add larger changes here that reduce token spend if listed. If a file or function is only brought over in part, that is normal and do not mention it.

Changes:

- NRW map data orchestration: the prototype branch has it in the map container `app/src/components/Nrw/index.tsx` (NrwMapContainer). In this branch it lives in the view `app/src/views/CountryProfileNationalRiskWatch/index.tsx`.
- NRW components directory: the prototype branch keeps them under `app/src/components/Nrw/*`. In this branch they live under `app/src/components/domain/*` (e.g. `NrwMap`, `NrwNavbar`).
- Map component: the prototype branch `app/src/components/Nrw/MapboxDataMap/` → this branch `app/src/components/domain/NrwMap/`.
- `useNrwMapSearchParams` hook: the prototype branch `app/src/utils/nrw/hooks/useNrwMapSearchParams.ts` → this branch `app/src/hooks/useNrwMapSearchParams.ts`.
- NRW mode config flag: the prototype branch uses `nrwPortalMode` (`APP_NRW_PORTAL_MODE`); this branch uses `nrwStandalone` (`APP_NRW_STANDALONE`).

## Repository Overview

Directories that relate to NRW:

- `app/src/components/Nrw`: NRW components
- `app/src/utils/nrw`: NRW helper files

---

## General Conventions (all languages)

- Use full names, no abbreviations — let IDE auto-complete handle length
- Avoid `any` (TypeScript) everywhere
- Use type annotations everywhere
- Do not include "Enum" suffix for enum names (e.g., `HazardType`, not `HazardTypeEnum`)
- Follow existing code patterns — prioritize readability over cleverness
- Always include Azure DevOps reference `AB#XXXXX` in commit body
- Do not delete the following when making other changes. The user will delete them later.
  - console.log statements
  - Debug comments that are not resolved

## Repo notes

- Do not change the following files. We copy them over directly from another repo to share enum and class types:
  - `app/src/utils/nrw/shared-dtos.ts`
  - `app/src/utils/nrw/shared-enums.ts`
