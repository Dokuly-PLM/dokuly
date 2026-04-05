# Projects and Customers

In dokuly, most items are connected to a project, which in turn is connected to a customer. Projects provide access control and organizational context for your parts, documents, assemblies, and other data.

---

## Customers

Customers represent the organizations or individuals your projects are for — whether internal teams, external clients, or product lines.

### Creating a Customer

1. Navigate to **Customers** in the sidebar
2. Click **New customer**
3. Enter the customer details (name, contact information)
4. Click **Submit**

---

## Projects

Projects are the primary organizational unit. They scope access control, part numbering, and reporting.

### Creating a Project

1. Navigate to **Projects** in the sidebar
2. Click **New project**
3. Fill in the project name, select a customer, and configure settings
4. Click **Submit**

### Project Features

Each project provides:

- **Access control** — only project members can view and edit items in the project. Members are managed in the [Administration dashboard](admin/settings.md).
- **Time tracking** — log time against custom tasks within the project
- **Task management** — create and assign tasks to team members
- **Gantt chart** — visualize tasks and timelines
- **Notifications** — configure who gets notified about changes (managed in Admin > Projects)

### Connecting Items to Projects

When creating parts, documents, PCBAs, assemblies, or other items, you select which project they belong to. This determines:

- Who can see and edit the item (based on project membership)
- The numbering context for documents
- Which items appear in project-scoped views and reports

---

## Access Control

Project-based access control is the primary security boundary in dokuly. A user who is not a member of a project cannot see or modify items belonging to that project.

To manage project membership:

1. Go to **Admin** in the sidebar
2. Open the **Projects** tab
3. Click on a project
4. Add or remove users under **Project Users** and **Non-Project Users**

See [Administration](admin/settings.md) for more details on user and project management.
