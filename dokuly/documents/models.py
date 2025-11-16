from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from profiles.models import Profile
from parts.models import Part
from assemblies.models import Assembly
from projects.models import Project, Tag
from tenants.azure_storage import CustomAzureStorage


class Document(models.Model):
    """Document object.
    Contains information about the document, including file and metadata.
    Connected to most db objects that require some form of documentation.
    """

    title = models.CharField(max_length=1000)

    # Document type is dummy field now. Data is set in document views,
    # see edit_document_info for references.
    # Keeping it here to minimize refactoring of frontend variables
    document_type = models.CharField(max_length=5, blank=True, null=True)

    # document_number is the doc. number on a per. project pasis. In the doc TN100102-4, the document_number is `4`.
    document_number = models.CharField(max_length=20, blank=True, null=True)
    # The complete document number of a document. e.g. TN100103-2A
    full_doc_number = models.CharField(null=True, blank=True, max_length=50)
    
    # Formatted revision field based on organization template (e.g., "A", "1", "A-0", "1-0")
    formatted_revision = models.CharField(null=True, blank=True, max_length=20)

    # id pointing to the selected prefix for the document
    # TODO: Need to change this to a foreign key to the prefix table
    prefix_id = models.IntegerField(blank=True, default=-1)

    # References mentioned in this document.
    referenced_documents = models.ManyToManyField("self", blank=True, symmetrical=False, related_name="references")

    description = models.TextField(max_length=1000, blank=True, null=True)

    release_state = models.CharField(max_length=50, blank=True, null=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True
    )  # The person that did the review.
    released_date = models.DateTimeField(null=True, blank=True)
    released_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="released_by"
    )

    document_supplier = models.CharField(max_length=50, blank=True, null=True)

    # The primary revision counters. These are unrelated to formatting, and number/lettering style.
    revision_count_major = models.IntegerField(blank=True, null=True, default=0)
    revision_count_minor = models.IntegerField(blank=True, null=True, default=0)

    # This is the old revision field kept for compatibility.
    revision = models.CharField(max_length=10, blank=True, null=True)  # DEPRECATED

    # Indicates if this is the latest revision of the document. It is used to quickly query for the latest revision without needing to sort through all revisions.
    is_latest_revision = models.BooleanField(blank=True, null=True)

    # ID of the preceding document revision. # TODO can we consider not using linked lists?
    previoius_revision_id = models.IntegerField(blank=True, default=-1)

    # Document metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    # Consider the created by, field as author.
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # All documents shall be coupled to a project, such that access control can be given on a per project basis.
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)

    language = models.CharField(max_length=50, blank=True, null=True)

    # Protection level - replaces the deprecated 'internal' boolean
    protection_level = models.ForeignKey(
        'Protection_Level', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='documents'
    )

    # Summary is intended for pdf generation.
    summary = models.TextField(max_length=2000, blank=True, null=True)
    revision_notes = models.TextField(max_length=20000, blank=True, null=True)
    errata = models.TextField(max_length=20000, blank=True, null=True)

    # TODO change with file fields.
    document_file = models.FileField(upload_to="documents", blank=True, null=True)
    zip_file = models.FileField(upload_to="zipFiles", blank=True, null=True)

    document_file = models.FileField(upload_to="documents", blank=True, null=True)
    zip_file = models.FileField(upload_to="zipFiles", blank=True, null=True)

    # Uploaded PDFs are saved under the `pdf_raw` field.
    pdf_raw = models.FileField(
        storage=CustomAzureStorage, upload_to="documents", blank=True, null=True
    )
    # Processed PDFs are stored under the  `pdf` field.
    pdf = models.FileField(
        storage=CustomAzureStorage, upload_to="documents", blank=True, null=True
    )
    # The below fields specicy what will be generated in the pdf.
    # When true, the specific item is generated for the pcba.
    front_page = models.BooleanField(blank=True, null=True)
    apply_ipr = models.BooleanField(blank=True, null=True)
    revision_table = models.BooleanField(blank=True, null=True)

    # Archiving
    is_archived = models.BooleanField(default=False, blank=True)
    archived_date = models.DateField(null=True, blank=True)

    shared_document_link = models.CharField(max_length=500, blank=True, null=True)

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="document_tags")

    # DEPRECATED
    # Internal/External. Used to show if a document is suitable for public release, or handover to a customer.
    internal = models.BooleanField(null=True)
    # DEPRECATED
    revision_locked = models.BooleanField(default=False)
    # DEPRECATED
    markdown = models.TextField(max_length=100000, blank=True, null=True)
    # DEPRECATED
    part = models.ForeignKey(Part, on_delete=models.SET_NULL, null=True)
    # DEPRECATED
    assembly = models.ForeignKey(Assembly, on_delete=models.SET_NULL, null=True)
    # DEPRECATED
    pcba_id = models.IntegerField(default=-1, blank=True)


class MarkdownText(models.Model):
    """
    Model for storing markdown text.
    Can be referenced by other models that need more featured markdown functionality.
    """
    text = models.TextField(blank=True, null=True, default="")

    # For markdown notes tabs
    title = models.CharField(max_length=1000, blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)


class Document_Prefix(models.Model):
    """Defines the document type.
    Contains the name of the type and its prefix.
    """

    # Unused document id. Might be needed if documents are required to describe prefixes
    document_id = models.IntegerField(blank=True, default=-1)
    display_name = models.CharField(blank=True, null=True, max_length=50)

    # The acronym of the field. E.g. the type Technical Note will have prefix 'TN'.
    prefix = models.CharField(blank=True, null=True, max_length=4)

    # A field for describing the function of the specific document type.
    # This is towards the goal of teaching the user a systems engineering process through using the tool.
    description = models.CharField(blank=True, null=True, max_length=1000)

    # Deprecated.
    # The below booleans decide if the prefix can be used on part doc. project doc. or both.
    # For example a project specification shall not be attached to a part number.
    # Similarly a test process document shall not be attached to a project. It shall be attached to the part to be tested.
    # Project documents are assigned a number based on a project, e.g. TN100100-5-A.
    project_doc = models.BooleanField(blank=True, null=True)
    # Part documents are assigned a number based on a target part, e.g. SCH483-E.
    part_doc = models.BooleanField(blank=True, null=True)

    # Archived document type shall not be shown in menus other than in the admin page.
    archived = models.CharField(
        default="False", blank=True, max_length=10
    )  # DEPRECATED
    # TODO move over to using this field
    is_archived = models.BooleanField(default=False, blank=True)
    archived_date = models.DateField(null=True, blank=True)


class Protection_Level(models.Model):
    """Defines the protection level for documents.
    Examples: Internal, Confidential, Public, Customer Releasable, etc.
    """

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(max_length=500, blank=True, null=True)
    level = models.IntegerField(default=0) # Numeric level for sorting protection levels in increasing order

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['level', 'name']


class Reference_List(models.Model):
    """List of documents.
    Used to attach references to parts, pcba, assembly etc.
    This can be any document, like design description, requirement specification etc.
    """

    # IDs (foreign keys) to the documents in the reference list.
    reference_doc_ids = ArrayField(
        models.IntegerField(null=True, blank=True), default=list, null=True, blank=True
    )
    # The 'is_specification field' specifies which documents in the reference_doc_id array are specifies the target object (part, asm, pcba etc).
    # Documents that are not 'specification', are other related documents.
    # Documents with the specification tag can only be added prior to target object release.
    # Similartly no document with Specificaiton tag can be removed from the list after release.
    is_specification = ArrayField(
        models.BooleanField(default=False, blank=True),
        default=list,
        null=True,
        blank=True,
    )
