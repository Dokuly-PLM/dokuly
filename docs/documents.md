# Documents

Dokuly's document management module lets you create, version, and organize engineering documents with structured numbering, revision control, and a built-in viewer.

---

## Key Capabilities

- **Automatic document numbering** with configurable prefixes per document type
- **Revision control** — each revision is a separate record; released documents are immutable
- **Automatic PDF front page** generation with your organization's logo and document metadata
- **Built-in viewer** for PDFs and office documents (Word, Excel, PowerPoint via OnlyOffice)
- **Inline editing** of office documents directly in the browser
- **Referenced documents** — link related documents together
- **Issues** — create and track issues against any document
- **Tags** — categorize documents with project tags for filtering and organization

---

## Document Numbering

Each document receives a unique number based on its prefix and project. For example, a document with prefix **TN** in project **100103** might be numbered **TN100103-2A**, where:

- **TN** is the document type prefix
- **100103** is the project number
- **2** is the document number within the project
- **A** is the revision

Prefixes are created in the [Administration dashboard](admin/settings.md) under the Documents tab. Each prefix maps to a document type (e.g., TN for Technical Note, TP for Test Plan).

---

## Creating a Document

1. Navigate to **Documents** in the sidebar
2. Click **New document**
3. Select the document type (prefix), project, and enter a title
4. Click **Submit**

The new document opens in Draft state. You can upload files, edit metadata, and write notes before releasing.

---

## Document Dashboard

Each document has a tabbed dashboard:

- **Overview** — Title, document number, description, release state, file attachments, and referenced documents
- **Issues** — Create and manage issues related to this document
- **Notes** — Inline markdown editor
- **Revisions** — View all revisions of the document

---

## File Attachments

Upload files to a document from the Overview tab. Supported file types include PDFs and Office documents (`.docx`, `.xlsx`, `.pptx`). Office documents can be edited directly in the browser using the integrated OnlyOffice editor.

---

## Revision Control and Release

Documents follow the same revision workflow as parts and assemblies:

- **Draft** — The document can be freely edited
- **Review** — Marked for quality assurance review
- **Released** — The document is locked and cannot be edited. To make changes, create a new revision

!!! tip
    The automatic front page is generated when a document is exported as PDF. It includes the document number, title, revision, and your organization logo.

---

## Referenced Documents

Link other documents from the Overview tab to create a web of related documentation. This is useful for traceability — for example, linking a test report to the test plan it follows.
