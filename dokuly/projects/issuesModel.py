from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class Issues(models.Model):
    """Issues model.
    Contains information about a given issue.
    FK to markdown test for description.
    M2M to part, pcba, assembly, or document.
    FK to part, pcba, assembly, or document. Where the issue was opened.
    Duplicate FK to part, pcba, assembly, or document for connecting what
    revision the issue was closed in.
    All issues between opening revision and closing revision will have the issue.
    """
    title = models.CharField(max_length=500, null=True, blank=True)
    description = models.ForeignKey('documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True)

    parts = models.ManyToManyField('parts.Part', related_name='parts_issues', blank=True)
    pcbas = models.ManyToManyField('pcbas.Pcba', related_name='pcbas_issues', blank=True)
    assemblies = models.ManyToManyField('assemblies.Assembly', related_name='assemblies_issues', blank=True)
    documents = models.ManyToManyField('documents.Document', related_name='documents_issues', blank=True)

    opened_in_part = models.ForeignKey('parts.Part', on_delete=models.SET_NULL, null=True, blank=True, related_name='opened_parts_issues')
    opened_in_pcba = models.ForeignKey('pcbas.Pcba', on_delete=models.SET_NULL, null=True, blank=True, related_name='opened_pcbas_issues')
    opened_in_assembly = models.ForeignKey('assemblies.Assembly', on_delete=models.SET_NULL, null=True, blank=True, related_name='opened_assemblies_issues')
    opened_in_document = models.ForeignKey('documents.Document', on_delete=models.SET_NULL, null=True, blank=True, related_name='opened_documents_issues')

    closed_in_part = models.ForeignKey('parts.Part', on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_parts_issues')
    closed_in_pcba = models.ForeignKey('pcbas.Pcba', on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_pcbas_issues')
    closed_in_assembly = models.ForeignKey('assemblies.Assembly', on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_assemblies_issues')
    closed_in_document = models.ForeignKey('documents.Document', on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_documents_issues')

    # Issue metadata
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_issues')
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='closed_issues')
    criticality = models.CharField(max_length=500, blank=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_issues')

    tags = models.ManyToManyField('projects.Tag', blank=True, symmetrical=False, related_name="issue_tags")
