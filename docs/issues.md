# Issues

**Parts**, **PCBAs**, **Assemblies**, and **Documents** all have the issues module. To create a new issue, go to the **Issues** tab on either of the dashboards for the items that have the issues module, and click on **Create New Issue**. All issues in your organization share a issue number counter, starting at #1. Issues have 3 levels of criticality:
<b style="color: #54a4da;">Low</b>,
<b style="color: #f6c208;">High</b>, and
<b style="color: #ff0000;">Critical</b>. 
To change the criticality of an issue, use the inline dropdown button. Or open the issue by using the navigation arrow or **Ctrl** + click, and edit it in its own dashboard.

---

By default, issues are *open*, meaning they are current for the item you are managing. Issues can span over multiple revision of any part-item. Any issues that are open in revision A, when creating revision B they will be copied over. If the issue is closed in a later revision it will still be shown in the revision is was created, but with a note: **Closed in: B**. To close any issue, simply click the **Close Issue** button. When an issue is closed, notifications will be sent to the associated users, depending on the projects notification settings. (See <a href="/admin/settings/#projects">project administration</a> for more info)

Issues flow upward through your connected items. This means that an issue on PRT42A will be visible in ASM36B if the part is being used in its BOM. use the filter options to toggle only viewing the current items issues, or including upwards flowing issues. This makes it practical to create issues on its related object, instead of creating many issues on the top level assembly, and gives you a solid overview of potentials blockers during development.

---

## Issue dashboard

The issue dashboard contains an information card, and a markdown editor for the issue description. In the dashboard, the issue can be edited, closed, and tags can be added to the issue. In addition, you can see the objects this issue is linked to. Click on the object number (could be a part number, or a document number) to navigate to the item. From the dashboard, an issue can also be reopened, setting the issue from a *closed* state, back to *open*.

<small><b>Tip:</b> The title of the issue can be edited inline in the issue table.</small>