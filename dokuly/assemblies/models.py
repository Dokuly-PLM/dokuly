from django.db import models
from django.core.validators import validate_comma_separated_integer_list
from django.contrib.postgres.fields import ArrayField

from django.contrib.auth.models import User
from profiles.models import Profile
from projects.models import Project, Tag
from files.models import Image
from files.models import File


class Assembly(models.Model):
    """Instance of an assembled object.
    Contains parts / pcbas / asms.
    References are parts, pcbas, asms and documents.
    Special references are the bom_ids, found in assembly_bom table.
    """

    part_number = models.IntegerField()

    # The complete part number of a document. e.g. ASM1234.
    full_part_number = models.CharField(null=True, blank=True, max_length=50)

    # Assembly basic data fields
    display_name = models.CharField(max_length=150, blank=True)
    description = models.TextField(max_length=500, blank=True)
    revision = models.CharField(max_length=2)
    is_latest_revision = models.BooleanField(default=False, blank=True)

    release_state = models.CharField(max_length=50, blank=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True
    )  # The person that did the review.
    released_date = models.DateTimeField(null=True, blank=True)

    # All assemblies shall be coupled to a project, such that access control can be given on a per project basis.
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # The price shall be calculated based on the BOM.
    # This field takes presedence over the calculated price.
    price = models.DecimalField(max_digits=12, decimal_places=4, blank=True)
    currency = models.CharField(max_length=20, blank=True, default="USD", null=True)

    # The model URL is intended to be used for link to fusion teams, or other online viewers.
    model_url = models.CharField(max_length=200, blank=True)

    thumbnail = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True)

    # Used for the react-flow-renderer library
    graph_blueprint = models.BooleanField(default=False)

    # The errata field shall be used to write up errors on an assembly.
    errata = models.CharField(blank=True, null=True, max_length=20000)
    # Revision notes are supposed to be used to note the changes since the last revision.
    revision_notes = models.CharField(blank=True, null=True, max_length=20000)

    markdown_notes = models.ForeignKey(
        'documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True
    )

    # Any files tied to Assembly. Deleted files, have their archived field set to true.
    files = models.ManyToManyField(File, blank=True)

    # This field is used to keep track of the number of assemblies that have been produced.
    serial_number_counter = models.IntegerField(default=0)
    serial_number_offset = models.IntegerField(default=0)
    serial_number_prefix = models.CharField(default="")

    # The references field is used to attach reference documents to an assembly.
    # This can be any document, like design description, requirement specification etc.
    reference_list_id = models.IntegerField(default=-1, blank=True)

    # Object management fields
    is_archived = models.BooleanField(default=False, blank=True)
    archived_date = models.DateField(null=True, blank=True)

    external_part_number = models.CharField(max_length=1000, blank=True, null=True)

    # Stock data
    current_total_stock = models.IntegerField(blank=True, null=True)
    minimum_stock_level = models.IntegerField(blank=True, null=True, default=0)

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="assemblies_tags")

    markdown_note_tabs = models.ManyToManyField('documents.MarkdownText',
                                                blank=True,
                                                symmetrical=False,
                                                related_name="assemblies_markdown_note_tabs")

    # __________________________________________________________________________________________
    # DEPRECATED fields

    # DEPRECATED
    generic_file_ids = ArrayField(
        models.IntegerField(blank=True, default=0), default=list, blank=True
    )
    generic_files_used = ArrayField(
        models.IntegerField(blank=True, default=0), default=list, blank=True
    )
    # DEPRECATED. Comments can be moved to the errata field.
    notes_for_next_revision = models.CharField(blank=True, null=True, max_length=1000)
    # DEPRECATED
    # IDs to the files table where the assembly drawings are stored.
    assembly_drawing_raw = models.IntegerField(default=-1, blank=True)
    # The asssembly_drawing field shall not be able to upload to form the front end.
    # It is a filed where processed pdfs are stored.
    assembly_drawing = models.IntegerField(default=-1, blank=True)

    # DEPRECATED.  # TODO delete. The assembly BOMs reference to the assembly. Use that reference instead.
    bom_id = models.IntegerField(null=True, blank=True)
