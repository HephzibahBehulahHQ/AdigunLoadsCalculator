# Public deployment

The owner explicitly authorized pushing, merging and public deployment on 6 November 2026. The public application is [AdigunPowerLab](https://hephzibahbehulahhq.github.io/AdigunPowerLab/). Current implementation and acceptance status remain in `PROJECT_STATUS.md`; this document records publication mechanics and receipts.

## Verified publication workflow

`.github/workflows/deploy.yml` publishes automatically after a successful **Validate PowerLab** push run on `main`. Pull-request runs, feature branches, failed validation and foreign repository artifacts cannot publish. The workflow checks the actual `ci.yml` workflow ID, successful completed run, source repository, current main SHA and the artifact's originating run/SHA before preparing Pages.

Publication downloads the immutable `AdigunPowerLab` artifact produced by that exact successful CI run. It does not rebuild or execute downloaded application content in the privileged workflow. The full lint, numerical, browser, update and offline gates therefore apply to the published bundle. Relative asset URLs preserve the existing `/AdigunPowerLab/` hosting path.

The existing `github-pages` environment, public domain and Pages concurrency group remain unchanged. Write permissions and the OIDC token are limited to the deployment job. Main and the validation result are checked again immediately before `actions/deploy-pages`; a superseded revision must wait for the newer main validation. This is a stale-head guard, not an atomic lock against unrelated main pushes during GitHub's publication operation.

**Manual retry:** run **Publish PowerLab to GitHub Pages** on `main`. It resolves a successful main-push validation for that exact current revision and uses the same artifact checks. Missing, expired or ambiguous artifacts stop publication; rerun the main validation to produce a new verified artifact, then retry. A manual run cannot waive CI or publish an old revision.

The workflow writes the selected source SHA, validation URL and artifact ID to its run summary. Record the successful Pages run and verify the public application before calling a new release deployed. Local workflow inspection alone does not establish successful GitHub execution.

References: [GitHub workflow-run events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run), [artifact download inputs](https://github.com/actions/download-artifact/blob/v4/action.yml), [Pages deployment action](https://github.com/actions/deploy-pages/tree/v4).

## Latest verified deployment receipt before this update

- Deployed source: `main` revision `f45d7369a7f4955e6c3d43b3ea5c03ded0c41821` (field usability, recovery and local BOT lifecycle work).
- Complete main validation: [42176699140](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42176699140), completed successfully.
- Pages workflow: [42176946887](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42176946887), completed successfully for the same main revision.
- These are observed historical receipts. The new automatic-publication continuation is tracked in [PR #5](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/5), whose release record contains its final candidate/main validation, deployment and live verification receipts. Source integration alone does not prove publication.

## Engine 1.1.0 continuation release history

- Published branch: `feat/verified-workflows`, commit `51736e6f17987e113f663662919f6318f37b8a84`.
- Integrated through [PR #2](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/pull/2).
- Deployed source: `main` commit `92d5c437f7b48f2f6ea65ae55c5aa3d2992aefa9`.
- Verified source tree: `d3c925aece07c5b56ae5011a338eb18abb93a5d0`, identical in the tested upload and merged main.
- Successful complete branch/PR validation: [42168975954](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168975954) and [42168980729](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42168980729).
- Successful Pages workflow: [42169441584](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169441584), built and deployed the exact main revision above.
- Successful post-merge validation: [42169342041](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42169342041).
- Pages source remains GitHub Actions on the existing public HTTPS domain. No new service, spending or custom domain was introduced.

The earlier approval-review block was resolved by the owner's explicit publication instruction before upload, merge or workflow dispatch. The release preserved remote history and used no force push. This documentation receipt follows deployment and does not change the application source or assets.

### Public verification

The live application displayed Engine 1.1.0. An analytical 2.3 kW load at 230 V and unity power factor produced 10 A and 18.4 kWh for eight hours. Setting duty to 50% changed energy to 9.2 kWh while current remained 10 A. The saved load survived the application's save/reload update flow.

A frozen report included the project reference, load and model-derived quantities. Its downloaded JSON had matching project/result revision 4 and the expected numerical values. An analytical bill using quantity 2.5, unit price €19.99, discount 10% and tax 19% returned €53.53. The downloaded one-page PDF was 62,653 bytes with a valid PDF signature/trailer; its reference and total were independently extracted and checked.

These checks ran through the supported cloud browser. A terminal-browser attempt could not reach the public URL (`ERR_EMPTY_RESPONSE`) and is not counted as a pass. No real customer information was used. File fingerprints and observed values are in `continuation-verification.json`; visual evidence is [the live billing screen](screenshots/public-continuation-release.jpg).

## Historical initial release

- Source: `main` commit `a33b1ed8f7479db6f1031dfef0addf806ede316f`.
- Successful Pages workflow: [42140197134](https://github.com/HephzibahBehulahHQ/AdigunPowerLab/actions/runs/42140197134).
- Pages source: GitHub Actions; default public HTTPS domain, no new paid service or custom domain.
- Live verification: the application opened publicly and T01 calculated 230 V / 23 Ω = 10 A and 2,300 W. The live browser showed the actual result and saved local workspace.
- Screenshot: `screenshots/public-launch-1793926727604.jpg`.
