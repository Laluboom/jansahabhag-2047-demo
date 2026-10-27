# Source documents

The owner-supplied source documents are **held locally and are not published in this
repository**. On 27 October 2026 the owner decided that every reference document stays
on the local machine only. The folder is ignored by git apart from this note, and
`.vercelignore` already keeps `docs/` and `*.docx` out of the deploy.

Several of these documents name real people and describe their roles, so they are not
public material. Earlier commits in this repository's history still contain the four
Word files and the portrait that were tracked before this decision; the owner chose
removal from the current tip without a history rewrite.

Use [the scope guide](../../README_01_RULES_REQUIREMENTS_BY_SCOPE.md#0-source-precedence)
for precedence and [product decisions](../decisions.md) for owner choices made after the
documents were written. Owner decisions recorded there take precedence over anything
proposed in these sources.

## What is held locally

| Document | Role | SHA-256 |
|---|---|---|
| `JanSahabhag_2047_MASTER_PRD_v3.1_LOSSLESS_ARCHIVE.docx` | Governing product requirements; canonical opening rules take precedence over historical appendices. | `e970f6c2a8495c9b1a70d81d363650e02e016c8511c750d4106fe28c1df8a4e6` |
| `JanSahabhag_2047_Cleaned_Developer_Start_Here.docx` | Demo scope and implementation guidance, subordinate to the Master PRD. | `8a76533e6b5936f974621fca579cd52531e939e0f1775f3be893abc2d5ceb614` |
| `JanSahabhag_2047_Developer_Handoff.docx` | Public identity and About Us content supplement; publication still needs fact approval. | `aa980955e77d0338cfdfbac8babe528f758ef9528383d7e5d4bbb397be86d84f` |
| `JanSahabhag_2047_Supplementary_PRD_33pct_Womens_Reservation_v2.docx` | Proposed extension approved in principle; use subsequent owner decisions for formula, unfilled places and remaining open rules. | `c3e1e1e438275cc3aed1abe62244f2a6d672f18cc1433f3b4ff49018c7efd2ac` |

Dated folders `21-10-26/`, `24-10-2026/` and `25-10-2026/` hold the later Change Plan,
Review Additions, Platform Audit, Executive Summary, Demo Personas, both Gratitude and
Credits versions, the logo research and the Logo Concepts PDF. They have never been
tracked here.

The two handoff documents were recovered from a local untracked `docs-rescued/` folder
on 13 October 2026. The Master PRD and supplement in that folder matched the
then-tracked copies byte for byte. The unrelated Markdown files and original folder
contents were preserved in the local ignored
`.subagy/quarantine/docs-rescued-2026-10-13/` directory; that quarantine is not part of
this repository.
