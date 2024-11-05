from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings


def send_workspace_creation_email(email, domain_name, resetLink, username):
    subject = 'Welcome to dokuly: Your Workspace is Ready'
    from_email = settings.EMAIL_SENDER
    recipient_list = [email]

    context = {
        'domain_name': domain_name,
        'resetLink': resetLink,
        'username': username,
    }

    html_content = render_to_string('workspace_creation_email.html', context)
    text_content = f"""Your workspace is now ready! Click the link below to start using it:
    Workspace name: {domain_name}
    Workspace Startup Link: {resetLink}
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


def send_email_confirmation(email, confirmation_link):
    subject = 'Complete Your Signup: Confirm Your Email'
    from_email = settings.EMAIL_SENDER
    recipient_list = [email]

    context = {
        'confirmation_link': confirmation_link,
    }

    html_content = render_to_string('email_verification.html', context)
    text_content = f"""Thank you for registering on our website. Please click on the link below to confirm your email address:
    {confirmation_link}
    If you did not request this registration, please ignore this email.
    
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
