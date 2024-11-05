from django.db import models
from django.contrib.auth.models import User
from django.core.validators import validate_comma_separated_integer_list
from django.contrib.postgres.fields import ArrayField
# Create your models here.


class Reimbursement(models.Model):
    """This table is currently deprecated and will be removed in the future. It is kept for reference purposes only. 
    """
    receiver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    item = ArrayField(
        models.CharField(max_length=100,  blank=True), default=list, null=True)
    price = ArrayField(
        models.DecimalField(max_digits=10, decimal_places=2), default=list, null=True)
    zip_file = models.FileField(
        upload_to='reimbursement_attachements', blank=True, null=True)
    pdf = models.FileField(
        upload_to='reimbursement_pdfs', blank=True, null=True)
    state = models.CharField(max_length=10, blank=True, null=True)
