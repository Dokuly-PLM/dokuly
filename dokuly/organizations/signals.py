from django.dispatch import receiver
from django.conf import settings
import requests
from .models import Subscription
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from organizations.utils import update_subscriptions_from_paddle


@receiver(post_save, sender=User)
def update_subscriptions(sender, instance, created, **kwargs):
    """
    Update the subscriptions from Paddle when a User instance is saved.
    """
    print("Updating subscriptions...")
    if not created:
        update_subscriptions_from_paddle(instance)
