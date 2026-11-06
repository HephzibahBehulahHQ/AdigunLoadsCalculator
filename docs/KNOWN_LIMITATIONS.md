# Supported scope and external boundaries

This release implements a local electrical planning workspace. Use the acceptance matrix and recorded candidate checks to distinguish implemented functionality from untested real-world conditions.

## Engineering boundaries

- The electrical model supports entered DC, single-phase, line-to-line and balanced three-phase loads with declared nominal voltage and stiff-neutral/fundamental assumptions. Arbitrary meshed networks, floating neutrals, voltage-dependent load flow and electromagnetic transients are outside this solver.
- On-state current, design diversity, energy duty, explicit starts and chronological interval demand are distinct quantities. True PF alone does not determine displacement angle, reactive power or harmonics; those cases stay incomplete.
- Feeder-route drop/loss/current calculations use entered cable impedances, ampacity corrections and the supported radial model. Individual device/cable/source checks are independent. No licensed table, manufacturer selectivity curve, dynamic voltage/frequency response or regulatory approval is inferred.
- Source equipment represents entered planning records and served boundaries. It does not establish a second energized feed or safe parallel operation. Physical switching and hardware control are unavailable.
- Renewable and wind profiles are entered data. There is no live weather/resource feed. Battery ageing, detailed thermal behaviour and manufacturer-specific dynamic limits need supplied validated models. Entered island/transfer/black-start declarations are not physical test results.
- Flexible and EV scheduling use declared bounded heuristics and constraints, not a proof of global optimality. Deadline or capacity failures remain visible. Dated cross-scenario comparisons are bounded to 31 elapsed days; the separate calendar worker supports annual ranges.

## Data, language and reports

- Local storage is not a remote backup. Combined archives and reviewed restore are implemented; unvalidated raw import text and unsaved measurement text are not represented as saved datasets. Browser/device cleanup can remove local data.
- Individual project JSON, equipment JSON, measurement exports and bill drafts have different scopes; choose Workspace backup for a combined archive.
- User-entered customers, taxes, prices and source references remain user evidence. Reports and estimates do not constitute installation certification or a jurisdiction-specific statutory invoice certification.
- Four-language UI/report/technical catalogs and localized numeric inputs are implemented. Original user/source text is retained. Professional German/Yorùbá/Pidgin technical-language review and a full independent WCAG 2.2 AA audit remain unperformed; machine/browser checks are not substitutes.
- The local BOT provides deterministic help and reviewed commands. Connected generative AI, account-backed cloud sync, provider OCR/resource retrieval and physical telemetry/control need actual configured services and authorization. No credentials or fabricated live integrations are included.

## Verification boundaries

Unit/reference tests, browser workflows, PDF rendering, offline checks, clean-checkout recovery and measured performance are separate evidence categories. The release record identifies actual commands and revisions. No claim is made about every device, every installation, all possible input combinations, peak memory, penetration testing, hardware measurements, licensed standards validation or professional certification.
