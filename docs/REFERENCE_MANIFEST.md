# Reference and asset manifest

Inspected 2026-11-05. These repositories were read-only references. Main commit SHAs were verified through GitHub's commits API before implementation; the pins below matched the specification's baselines.

| Reference | Immutable revision | Material used |
| --- | --- | --- |
| [Corporate gateway](https://github.com/HephzibahBehulahHQ/HephzibahBehulahHQ.github.io) | `bd116504412b37105166805018f64a6e7bbe3cde` | Corporate ownership and reference hierarchy |
| [Shared design system](https://github.com/HephzibahBehulahHQ/hb-design-system) | `52f01f9986d97088413ca9785bc7a2d3f2967123` | Product config schema 3, exact approved logo, naming, colors, one-logo header, four languages, Adigun BOT contract |
| [Engineering execution policy](https://github.com/HephzibahBehulahHQ/hb-AI-policy) | `d42d4e04ac6ab77ebafa1d4fccb724a4dde8d02e` | HB-AI-ENGINEERING-001 v2.0, product adoption, evidence states, scoped checkpoints |
| [HB Elektroniker](https://github.com/HephzibahBehulahHQ/hb-elektroniker) | `1daeed88df067a235b33516fb4cce111350ab80c` | Electrical-division guidance; separation of simulated, validated and hardware-tested claims |
| [HB Artificial Intelligence](https://github.com/HephzibahBehulahHQ/hb-artificial-intelligence) | `4d4eb7e9108f88f6a406cec52e3e9a551eb09bdd` | Responsible AI guidance, real capability reporting and human oversight |
| [Source calculator](https://github.com/HephzibahBehulahHQ/AdigunTokenCalculator) | `c04d971a97e490efd8fda47727039623a9f28218` | Read-only semantic and migration reference; this is not AdigunPowerLab's former repository |

## Exact corporate asset

- Source: [approved JPG](https://github.com/HephzibahBehulahHQ/hb-design-system/blob/52f01f9986d97088413ca9785bc7a2d3f2967123/assets/corporate/hephzibah-behulah-official.jpg).
- Product path: `public/assets/corporate/hephzibah-behulah-official.jpg`.
- Git blob: `f7b0e4a650d861fb9d52ed91ea894edec030e03b`.
- SHA-256: `409c401be5189b80593797cbaf00a3a42a91ab8c0645e3648ff91205b47d4c95`.
- Ownership: user-provided corporate artwork, used unchanged under this product's explicit branding instructions. No broader third-party license is asserted.
- Verification: local `git hash-object` equals the approved source blob. No recoloring, redrawing or substitute logo was used.

## Unicode PDF font

- Font: DejaVu Sans, bundled from the execution image's `fonts-dejavu-core` package.
- Product path: `public/assets/fonts/DejaVuSans.ttf`.
- SHA-256: `ae7b7855e115a5966d8b1b3f80f254ccc117ec86f9965e202ee2940453837280`.
- Source: [DejaVu Fonts](https://dejavu-fonts.github.io/).
- Rights: Bitstream Vera redistribution license; DejaVu changes are public domain. The supplied copyright and license are retained in `public/assets/fonts/DejaVuSans.LICENSE.txt`.
- Purpose: embedded PDF text with German characters and Yoruba diacritics. This is a document font, not a replacement for the corporate UI font stack.

## Product assets and implementation

Application UI, schematic drawings and calculation code are product-owned implementation. The dependency lockfile records exact package versions. No third-party standards tables, manufacturer curve datasets, stock customer records, weather data or device telemetry are bundled. Generic worked cases, where present, are explicitly analytical inputs rather than customer installations.

The design template is a configuration and behavior contract; it does not itself supply an AI backend, account service, finished React application or translation package. Availability flags must track verified implementation rather than planned functionality.
