# utilityFunctions.py
from typing import Optional
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Notification, Profile
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from typing import Type, Union
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from documents.models import Document, MarkdownText
from documents.models import Document
from projects.models import Issues, Project

ModelType = Union[Type[Part], Type[Pcba], Type[Assembly], Type[Document]]

APP_TO_MODEL: dict[str, ModelType] = {
    'parts': Part,
    'pcbas': Pcba,
    'assemblies': Assembly,
    'documents': Document
}

MODEL_TO_MODEL_STRING: dict[ModelType, str] = {
    Part: 'part',
    Pcba: 'pcba',
    Assembly: 'assembly',
    Document: 'document'
}


def create_notification(user: User, message: str, uri: str, app: str, is_project_notification: Optional[bool] = False) -> Optional[Notification]:
    """
    Creates and saves a notification for a user.

    :param user: The User object to whom the notification is to be sent.
    :param message: The message of the notification (rendered as markdown).
    :param uri: The URI for navigation when the notification is pressed.
    :param app: The app associated with the notification (for selecting an icon).
    :return: The created Notification object.
    """
    if user == None or message == None or uri == None or app == None:
        return None

    notification = Notification(
        user=user,
        message=message,
        uri=uri,
        app=app,
        created_at=timezone.now(),
        is_viewed_by_user=False,
        is_project_notification=is_project_notification
    )
    notification.save()
    return notification


def send_reset_password_mail_with_template(organization, user, first_name, email, reset_link):
    subject = 'Invitation to Workspace'
    from_email = settings.EMAIL_SENDER
    recipient_list = [email]
    username = user.username

    context = {
        'resetLink': reset_link,
        'username': username,
        'organization': organization.name,
    }

    html_content = render_to_string('userAdded.html', context)
    text_content = f"""Hello {first_name}\n\nYou have been added to the {organization.name} workspace. Click the link below to start using Dokuly:
    Join workspace: {reset_link}
    Username: {username}

    Best Regards,
    Dokuly Team"""

    send_mail(
        subject=subject,
        message=text_content,
        from_email=from_email,
        recipient_list=recipient_list,
        fail_silently=False,
        html_message=html_content  # This is the key part
    )


def notify_on_release_approval(item: ModelType, user, app_name: str):
    """
    Sends notifications when an item is approved for release.

    :param item: The item (Part, Pcba, Assembly, Document) that was approved.
    :param app_name: The name of the app (e.g., 'parts', 'pcbas') to determine the model.
    """
    try:
        model_type = APP_TO_MODEL[app_name]  # Determine the model type based on app name
        model_string = MODEL_TO_MODEL_STRING[model_type]  # Get the model string for URL construction
        project: Project = item.project
        project_owner = project.project_owner

        # Notification for the creator of the item
        creator_profile = Profile.objects.get(user=item.created_by)
        if creator_profile.notify_user_on_item_passed_review and user != item.created_by and project_owner.user != item.created_by:
            create_notification(
                item.created_by,
                f"{model_string.capitalize()} {get_model_object_number(item)} is approved for Release.",
                f"/{app_name}/{item.id}/",
                model_string.capitalize()
            )

        # Notification for the project owner if different from the creator
        if project.notify_project_owner_on_item_passed_review and project_owner.user != user:
            create_notification(
                project_owner.user,
                f"{model_string.capitalize()} {get_model_object_number(item)} is approved for Release.",
                f"/{app_name}/{item.id}/",
                model_string.capitalize(),
                is_project_notification=True
            )
    except Exception as e:
        print(str(e))
        pass


def notify_on_new_revision(new_revision: ModelType, app_name: str, user: User):
    """
    Sends notifications when a new revision of an item is created.

    :param new_revision: The new revision of the item (Part, Pcba, Assembly, Document).
    :param app_name: The name of the app (e.g., 'parts', 'pcbas') used to format the URI.
    """
    try:
        # Fetch the profile of the creator of the new revision
        author = Profile.objects.get(user=new_revision.created_by)
        project: Project = new_revision.project
        project_owner = project.project_owner

        # Notify the creator if they have opted in for notifications on new revisions
        if author.notify_user_on_item_new_revision and user != new_revision.created_by:
            create_notification(
                user=new_revision.created_by,
                message=f"A new revision is created of {get_model_object_number(new_revision)}.",
                uri=f"/{app_name}/{new_revision.id}/",
                app=app_name.capitalize()  # Assuming the app name is suitable for display as the type
            )

        # Check if there's a related project and if the project owner should be notified
        if project and project_owner:
            if project.notify_project_owner_on_item_new_revision and user != project_owner.user and project_owner.user != new_revision.created_by:
                create_notification(
                    user=project_owner.user,
                    message=f"A new revision is created of {get_model_object_number(new_revision)}.",
                    uri=f"/{app_name}/{new_revision.id}/",
                    app=app_name.capitalize(),
                    is_project_notification=True
                )
    except Exception as e:
        print(str(e))
        pass


def notify_on_state_change_to_release(user, item: ModelType, new_state: str, app_name: str):
    """
    Sends notifications to relevant parties when an item's state changes.

    :param user: The user who triggered the state change.
    :param item: The item (Part, Pcba, Assembly, Document) whose state was changed.
    :param new_state: The new state of the item.
    :param app_name: The application name corresponding to the item for URL construction.
    """
    try:
        model_type = APP_TO_MODEL[app_name]  # Get the model type based on the app name
        model_string = MODEL_TO_MODEL_STRING[model_type]  # Get the model string for notifications
        project: Project = item.project
        project_owner = project.project_owner
        user_profile = Profile.objects.get(user=user)

        project_owner_is_item_creator = False
        if project_owner and item:
            project_owner_is_item_creator = project_owner.user == item.created_by

        # Notify the item's creator if the user making the change isn't the creator. If the creator is the project owner, they will be notified separately.
        if user != item.created_by and user_profile.notify_user_on_item_released and new_state == 'Released' and not project_owner_is_item_creator:
            create_notification(
                item.created_by,
                f"{get_model_object_number(item)} changed state to {new_state}.",
                f"/{app_name}/{item.id}/",
                model_string.capitalize()
            )

        # Check if there's a related project and if the project owner should be notified
        # If the project owner is the item creator and the state is released, the project owner will already be notified from statement above
        if project and project_owner and project_owner.user != user:
            # Notify the project owner if the notification setting is enabled and the project owner is not the user making the change
            if project.notify_project_owner_on_item_state_change_to_review and (new_state == 'Review' or new_state == 'Released'):
                create_notification(
                    project.project_owner.user,
                    f"{get_model_object_number(item)} changed state to {new_state}.",
                    f"/{app_name}/{item.id}/",
                    model_string.capitalize(),
                    is_project_notification=True
                )
    except Exception as e:
        # TODO add logging
        pass


def get_model_object_number(object_instance):
    """
    Gets the object number of a given model instance.

    :param object_instance: The model instance from which to get the object number.
    :return: The object number of the model instance.
    """
    if type(object_instance) != Document:
        return object_instance.full_part_number
    return object_instance.full_doc_number


def notify_user(user, notify_condition, message, notified_users, object_id, app, issue_id, is_project_notification=False):
    if notify_condition and user not in notified_users:
        create_notification(
            user=user,
            message=message,
            uri=f"/{app}/{object_id}/issues/{issue_id}",
            app=app,
            is_project_notification=is_project_notification
        )
        notified_users[user] = True


def send_issue_closure_notifications(issue: Issues, object_closed_in: ModelType, app: str, object_id, issue_id, user: User):
    """
    Send notifications to relevant users when an issue is closed, ensuring no duplicate notifications.
    :param issue: The issue that was closed.
    :param object_closed_in: The object associated with the closed issue.
    :param app: Application name for URI construction.
    :param object_id: ID of the object associated with the issue.
    :param issue_id: ID of the issue.
    """
    try:
        # Collect the users and their preferences
        issue_author = Profile.objects.get(user=issue.created_by)
        object_author = Profile.objects.get(user=object_closed_in.created_by)
        project: Project = object_closed_in.project
        project_owner = project.project_owner

        # Dictionary to check if notification has been sent to a particular user
        notified_users = {}

        if user != issue_author.user:
            # Always notify issue and object authors if they opted for notifications, unless they are the same user
            notify_user(
                issue_author.user,
                issue_author.notify_user_on_issue_close,
                f"Your issue #{issue.pk} on {get_model_object_number(object_closed_in)} has been closed.",
                notified_users,
                object_id=object_id,
                app=app.capitalize(),
                issue_id=issue_id
            )

        if object_author.user != issue_author.user and object_author.user != user:
            notify_user(
                object_author.user,
                object_author.notify_user_on_issue_close,
                f"Issue #{issue.pk} on {get_model_object_number(object_closed_in)} has been closed.",
                notified_users,
                object_id=object_id,
                app=app.capitalize(),
                issue_id=issue_id
            )

        # Notify the project owner if the project exists and owner is different from issue and object authors
        if project and project_owner and project_owner.user != user:
            if project.notify_project_owner_on_issue_close:
                notify_user(
                    project_owner.user,
                    True,
                    f"Issue #{issue.pk} on {get_model_object_number(object_closed_in)} has been closed.",
                    notified_users,
                    object_id=object_id,
                    app=app.capitalize(),
                    issue_id=issue_id,
                    is_project_notification=True
                )
    except Exception as e:
        # TODO add logging
        pass


def send_issue_creation_notifications(issue: Issues, object: ModelType, app: str, object_id, user: User):
    """
    Send notifications to relevant users when a new issue is created on an object,
    ensuring no duplicate notifications for the same event.
    :param issue: The issue that was created.
    :param object: The object associated with the newly created issue.
    :param app: Application name for URI construction.
    :param object_id: ID of the object associated with the issue.
    """
    try:
        object_author = Profile.objects.get(user=object.created_by)
        project: Project = object.project
        project_owner = project.project_owner
        issue_author = issue.created_by

        notified_users = {}
        if object_author.user != issue_author:
            # Notify the object author if they opted in for notifications
            notify_user(
                object_author.user,
                object_author.notify_user_on_issue_creation,
                f"A new issue on {get_model_object_number(object)} has been created.",
                notified_users,
                object_id=object_id,
                app=app.capitalize(),
                issue_id=issue.id
            )

        # Handle project notification if applicable and ensure no duplicates
        if project and project_owner and project_owner.user != user:
            notify_user(
                project_owner.user,
                project.notify_project_owner_on_issue_creation,
                f"A new issue on {get_model_object_number(object)} has been created.",
                notified_users,
                object_id=object_id,
                app=app.capitalize(),
                issue_id=issue.id,
                is_project_notification=True
            )
    except Exception as e:
        # TODO add logging
        pass


def send_issue_assignee_notification(issue: Issues, assignee: User, app: str, object_id, issue_id):
    """
    Send a notification to a user when they are assigned to an issue.
    :param issue: The issue that was assigned.
    :param assignee: The user who was assigned to the issue.
    :param app: Application name for URI construction.
    :param object_id: ID of the object associated with the issue.
    :param issue_id: ID of the issue.
    """
    try:
        if assignee and object_id:
            model = APP_TO_MODEL.get(app)
            if model:
                try:
                    object = model.objects.get(id=object_id)
                    object_number = get_model_object_number(object)
                    message = f"You have been assigned to issue #{issue.pk} on {object_number}."
                    create_notification(
                        user=assignee,
                        message=message,
                        uri=f"/issues/{issue_id}",
                        app=app.capitalize(),
                        is_project_notification=False
                    )
                except model.DoesNotExist:
                    pass
    except Exception as e:
        # TODO add logging
        pass
