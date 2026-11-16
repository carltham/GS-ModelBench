# Open source

## Licence

- Apache License 2.0 for all code and documentation, in [`LICENSE`](../../LICENSE).
- `NOTICE` at the repository root: `GS-ModelBench`, `Copyright 2026 The GS-ModelBench Authors`.
- Contributions are accepted under Apache 2.0, section 5. No contributor licence agreement and no
  sign-off requirement, to keep contributing simple.
- Dependencies must use a licence compatible with Apache 2.0: MIT, BSD, ISC or Apache 2.0. CI
  checks this with `license-checker` and fails on anything else.
- Shared results and datasets are under the same licence. A contributor who submits prompts
  confirms they have the right to share them.

## Community files

| File | Content |
|---|---|
| `README.md` | What it is, a screenshot, quick start, link to the docs. |
| `What-Is-This-Good-For.md` | Who it's for and what it tells you. |
| `CONTRIBUTING.md` | Setup, scripts, where things live, how to add a study, a provider or results. Pull request checklist. |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1. |
| `SECURITY.md` | How to report a vulnerability privately, via GitHub security advisories. |
| `CHANGELOG.md` | Changes per release, in the Keep a Changelog format. |
| `.github/ISSUE_TEMPLATE/` | Bug report, feature request, new study proposal, shared results. |
| `.github/pull_request_template.md` | Checklist: tests, docs, changelog entry. |

## Contributions we want

- **Results from other machines:** exported runs of existing studies, added under the study's
  campaigns through a pull request.
- **New studies:** a study definition and a frozen dataset that meets its coverage targets.
- **New providers:** an adapter in `packages/providers` with integration tests against the stub.
- **Dataset labelling:** second labels for existing cases.

## Versioning

- Semantic versioning, starting at `0.1.0`.
- Before `1.0.0`, minor versions may break the data format. Each such release ships a migration
  in `packages/store`, run automatically when the data root is opened.
- From `1.0.0`, the data format only changes in a major version.
- Every file on disk carries `"formatVersion"`.

## Releases

- A release is a tag `vX.Y.Z` on `main`, with a GitHub Release whose notes come from
  `CHANGELOG.md`.
- From `1.0.0`, each release is also published to npm as one package containing the CLI, the
  server and the built GUI, so `npx` can start it with no clone.
- Releases are made by GitHub Actions from the tag, never from a local machine.
