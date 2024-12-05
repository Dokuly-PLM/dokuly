# Administration dashboard

The administration dashboard can be used to change your preferences, settings, permissions and roles, and edit data that normal users cannot access. It is comprised of these tabs:

- **General**: Change basic settings including your organization, modules and logo.
- **Users**: Manage your users, change permissions, create new users, and more. 
- **Projects**: Manage projects access for your users, and manage notification settings for the project.
- **Documents**: Create document prefixes, edit faulty data in documents, archive management. 
- **Parts**: Create and edit part types, and part prefixes. 
- **Release Management**: Allows you to override a release state and fix possible mistakes.
- **Locations**: Create and manage location types, and inventory locations.
- **API keys**: Create and manage API keys to dokuly.

---

## General

Tab for changing basic settings including your organization, modules and logo.

### Disabling modules
In the **General** tab on the administration dashboard, you can find organization settings. Here you can disable different modules by clicking the checkbox to turn them off or on for every user in your organization.  

### Organization settings
In the information card you can see your storage usage. This is only relevant if using dokuly with *cloud hosting* provided by Norsk Datateknikk. If you are running dokuly yourself, its limited by your host system. 

Here you can also edit the organization information, including name, delivery address info, default currency and enabling two factor authentication (2FA).

On the right hand side, you can upload a logo for your organization. This logo will be used on the generated front page for your PDFs.

---

## Users

Tab where you mange your users, change permissions, create new and edit existing users, adding subscriptions.

### Manage a user profile

To create a new user click on **Add user** and fill in the information you want. Remember to set the appropriate role for the user. Then click submit. An email will be sent to the email you filled in, containing a link to dokuly to set a new password for the user. 

For the permissions, there are 3 roles:

- **Viewer**: Read-only user. Cannot edit data.
- **User**: Can edit data it has access to, does **NOT** have access to the admin dashboard.
- **Admin**: Can edit data it has access to, and have access to the admin dashboard.

In addition, there is *one* user with the **Owner** role, assigned to the owner of the organization. This is the only user that can demote other admin users. The owner also have access to the admin dashboard, and is the only role that can delete the workspace and its data.

### Add a new subscription

If using cloud hosting via Norsk Datateknikk, you will have some counters at in the **Manage subscriptions** card. *Active users* is the number of users you have currently activated, versus the total number of active users you can have at any time. In addition, there is a count for active viewer users versus the total number of active viewer users you can have.

If you have the maximum number of active users compared to your total allowed, activating another user will cause a user of the lowest permission possible to be automatically deactivated. To avoid this, click on *Add subscription*, and select a new plan for the user you plan on creating. This will redirect you to the public page to complete the transaction. When completed, you will be redirected back to admin, and can now freely create a new user. 

---

## Projects

This tab lets you update the project access settings, change project owners, and manage notification settings for your projects.

### Managing a project

Click on a project in the table. A modal will open, and here you can set the active state of the project, change the project owner, and set when and who gets notifications. To add a user to a project which gives them access to the items connected to the projects, click on the *Add* button next to the user's name under the **Non-Project Users**. To remove access click on the *Remove* button under the **Project Users**.

---

## Documents

The documents tab lets you edit mistakes in document data normal users cannot access, like the release state after a release, or the document type. Here you can also create and edit document prefixes. 

---

## Parts

Create and edit *part types* in this tab. Click on the new part type to create a new part type. Give it a name and a prefix. The prefix will affect how the part number looks, e.g. the prefix *EL*, will make a part created with this part type have the part number ELXXXXA, where XXXX is the number part and A is the revision. Click submit to save your changes. 

---

## Release Management

Override the release state of all objects that have a release state. Here you can fix a mistake such as setting a part to being *Released* from its *Draft* state. When the part is released, it cannot be edited, a new revision must be created. However, on this tab you can override the state.

---

## Locations

Here you can create location types, and locations for inventory management. To create a location, you must first create at least one location type. Click on **Add type** to create a new location type, and hit submit to save your changes. Then to create a new location, click on **Add location** and select a appropriate location type for it. 

**NOTE:** The location number is controlled manually by the user at this point.

---

## API keys

Dokuly has an API that its users can access. The API documentation can be found <a href="https://dokuly.com/#/api" target="_blank" rel="noreferrer">here.</a> On this tab you can create API keys, that also have project access built in to them.

To create a new API key click on **Generate new API Key**. This will switch the card to show an *Expiry Date* and a table with your current active projects. To allow or disallow access to the project for the key you are creating, check or uncheck the allow access checkbox for that project. Click submit to generate the new API key.

To copy the API for use, click on the copy icon in the table, under the column **API Key**.