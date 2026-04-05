# Issues

Parts, PCBAs, assemblies, and documents all support issues. Issues track problems, questions, or action items against specific items with a shared numbering system across your organization.

---

## Key Capabilities

- **Shared numbering** — all issues share a single counter starting at #1, regardless of which item they belong to
- **Criticality levels** — Low, High, and Critical
- **Upward flow** — an issue on a part automatically appears on any PCBA or assembly that uses it in its BOM
- **Cross-revision tracking** — open issues carry forward when creating a new revision
- **Inline editing** — change criticality and title directly in the issue table
- **Tags** — categorize issues with project tags

---

## Creating an Issue

1. Navigate to any part, PCBA, assembly, or document
2. Open the **Issues** tab
3. Click **Create New Issue**
4. Enter a title, set the criticality level, and add a description
5. Submit

---

## Criticality Levels

Each issue has one of three levels:

- **Low** — minor concern, no immediate action required
- **High** — significant issue that should be addressed before release
- **Critical** — blocking issue that must be resolved immediately

Change the criticality at any time using the inline dropdown in the issue table.

---

## Issue Lifecycle

Issues are **open** by default. To close an issue, click **Close Issue** on the issue dashboard. Closing an issue sends notifications to associated users based on the project's notification settings.

A closed issue can be **reopened** from its dashboard if the problem resurfaces.

---

## Cross-Revision Behavior

When you create a new revision of an item (e.g., Part revision A → B), all open issues from revision A are copied to revision B. If an issue is later closed in revision B, it remains visible in revision A with a note indicating it was closed in B.

---

## Upward Flow

Issues flow upward through the BOM hierarchy. If part PRT42A has an open issue, that issue is also visible on assembly ASM36B if the part appears in its BOM.

Use the filter options on the Issues tab to toggle between:

- **Current item only** — show only issues directly on this item
- **Including sub-items** — show issues from BOM components as well

This lets you see all potential blockers on a top-level assembly without having to check each component individually.

---

## Issue Dashboard

Click on an issue to open its dashboard, which contains:

- **Information card** — title, criticality, status, linked objects
- **Description** — markdown editor for detailed notes
- **Tags** — categorize the issue
- **Linked objects** — see which items this issue is connected to; click a part or document number to navigate directly

!!! tip
    Issue titles can be edited inline directly in the issue table — just click the title text.
