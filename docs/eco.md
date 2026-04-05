# Engineering Change Orders

Engineering Change Orders (ECOs) formalize and track changes to your product data. An ECO groups affected items — parts, PCBAs, assemblies, and documents — under a single reviewable record with a description of what changed and why.

---

## Key Capabilities

- **Change tracking** — document what changed, why, and who is responsible
- **Affected items** — link the specific parts, PCBAs, assemblies, and documents impacted by the change
- **Issue linking** — connect related issues to each affected item for traceability
- **Release workflow** — ECOs follow Draft / Review / Released states with quality assurance sign-off
- **Project scoping** — each ECO belongs to a project for access control
- **Markdown description** — write detailed change descriptions with formatting
- **Tags** — categorize ECOs with project tags

---

## When to Use ECOs

ECOs are appropriate when you need to:

- Document a design change that affects released items
- Coordinate changes across multiple parts or documents
- Maintain an audit trail of what changed and who approved it
- Communicate changes to the team with a formal record

For minor edits to items still in Draft state, an ECO is typically not needed — just edit the item directly.

---

## Creating an ECO

1. Navigate to **ECOs** in the sidebar
2. Click **New ECO**
3. Fill in:
   - **Title** — a short descriptive name for the change
   - **Project** — the project this change belongs to
   - **Responsible** — the person driving the change
   - **Description** — detailed explanation of what is changing and why (supports markdown)
4. Submit

The ECO is created in **Draft** state.

---

## Adding Affected Items

Once the ECO is created, add the items that are impacted:

1. Open the ECO
2. In the affected items section, click **Add item**
3. Search for and select a part, PCBA, assembly, or document
4. Optionally add a description of what changed for this specific item
5. Link any related issues

Each affected item entry captures:

- The item reference (part, PCBA, assembly, or document)
- A description of the change for that item
- Linked issues that motivated or relate to the change

---

## Review and Release

ECOs follow the standard release workflow:

- **Draft** — the ECO is being prepared; items and descriptions can be edited
- **Review** — the ECO is submitted for quality assurance review
- **Released** — the change is approved and the ECO is locked

The **quality assurance** reviewer and **released by** user are recorded on the ECO, along with the release date.

!!! tip
    Release all affected items (new revisions of parts, documents, etc.) before or alongside the ECO release to keep your change history consistent.

---

## Traceability

ECOs connect to other dokuly features through:

- **Affected items** — direct links to the changed revisions of parts, PCBAs, assemblies, and documents
- **Issues** — each affected item can reference the issues that drove the change
- **Project** — the ECO is scoped to a project, making it visible to project members

This creates a traceable chain from issue to ECO to changed item, useful for audits and impact analysis.
