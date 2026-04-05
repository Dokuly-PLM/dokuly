# Requirements

The requirements module provides a structured, model-based environment for defining, organizing, and verifying product requirements. Requirements are grouped into sets, support hierarchical relationships, and include built-in verification tracking.

---

## Key Capabilities

- **Requirement sets** — group related requirements under a named set tied to a project
- **Hierarchical structure** — requirements can have sub-requirements (parent-child relationships)
- **Derived requirements** — link requirements that are derived from higher-level requirements
- **Superseding** — mark a requirement as superseded by a newer one
- **Obligation levels** — classify requirements as "Shall" (mandatory) or "Should" (recommended)
- **Requirement types** — categorize by type following SEBoK taxonomy (Functional, Performance, Interface, Safety, etc.)
- **Verification tracking** — define verification class, method, and results for each requirement
- **Quality assurance** — assign a reviewer for each requirement
- **Tags** — categorize with project tags for filtering

---

## Requirement Sets

A requirement set is a named collection of requirements belonging to a project. Use sets to organize requirements by subsystem, specification document, or any grouping that fits your workflow.

To create a requirement set:

1. Navigate to **Requirements** in the sidebar
2. Click **New requirement set**
3. Enter a name and description
4. Select the project
5. Submit

---

## Creating Requirements

Within a requirement set, add requirements individually:

1. Open the requirement set
2. Click **Add requirement**
3. Fill in the fields:
   - **Statement** — the actual requirement text (e.g., "The system shall operate at temperatures between -20 C and +60 C")
   - **Obligation level** — "Shall" or "Should"
   - **Type** — Functional, Performance, Interface, Safety, etc.
   - **Rationale** — why this requirement exists
4. Submit

### Sub-requirements

To create a child requirement, set the **parent requirement** when creating or editing. Sub-requirements appear nested under their parent in the requirement set view.

### Derived Requirements

Link a requirement to the higher-level requirement(s) it was derived from. This creates a traceability chain from top-level system requirements down to detailed component requirements.

### Superseding

When a requirement is replaced by a newer version, mark it as **superseded by** the new requirement. The original remains in the set for historical reference but is visually marked as superseded.

---

## Verification

Each requirement has built-in verification fields:

- **Verification class** — how the requirement will be verified, following SEBoK categories:
    - Inspection
    - Analysis
    - Analogy or Similarity
    - Demonstration
    - Test
    - Sampling
- **Verification method** — detailed description of the verification approach
- **Verification results** — document what was observed or measured
- **Verified** — boolean flag marking the requirement as verified
- **Verified by** — the person who performed the verification

!!! tip
    Use the verification fields to build a complete verification matrix. Each requirement's verification status is visible at a glance in the requirement set table.

---

## Requirement States

Requirements have a state field that tracks their lifecycle. Combined with the quality assurance reviewer assignment, this supports a review workflow where requirements are drafted, reviewed, and approved.

---

## Traceability

The combination of hierarchical, derived, and superseding relationships creates a traceable web of requirements. This is useful for:

- **Impact analysis** — when a requirement changes, follow the derived chain to see what else is affected
- **Coverage** — verify that all top-level requirements have been decomposed into verifiable lower-level requirements
- **Audits** — demonstrate that every requirement has a rationale, verification method, and result
