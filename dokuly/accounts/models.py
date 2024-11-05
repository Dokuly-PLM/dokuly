from django.db import models
from django.contrib.auth.models import User, AbstractBaseUser, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver

# Accounts are the basic django models, see django documentation for more information:
# https://docs.djangoproject.com/en/4.0/topics/auth/default/#user-objects
