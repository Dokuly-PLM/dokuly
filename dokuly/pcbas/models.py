from django.db import models
from django.contrib.auth.models import User
from profiles.models import Profile
from parts.models import Part
from django.core.validators import validate_comma_separated_integer_list
from django.contrib.postgres.fields import ArrayField

from projects.models import Project, Tag
from files.models import File
from files.models import Image


class Pcba(models.Model):
    """Instance of an assembled PCB Assembly
    Used in assemblies to create other items, or as a standalone item.
    Assembled from other Part instances.
    """

    # Integer 1234
    part_number = models.IntegerField(blank=True, null=True)
    # The complete part number of a pcba. e.g. PCBA1234.
    full_part_number = models.CharField(null=True, blank=True, max_length=50)

    revision = models.CharField(max_length=10, blank=True, null=True)
    is_latest_revision = models.BooleanField(default=False, blank=True)

    # Revision notes are the data that will be used in revision tables.
    revision_notes = models.TextField(max_length=20000, blank=True, null=True)
    errata = models.TextField(max_length=20000, blank=True, null=True)

    markdown_notes = models.ForeignKey(
        'documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True
    )

    # PCBA attributes. Icons are shown based on these attributes.
    attributes = models.JSONField(
        null=False,
        blank=True,
        default={
            "Critical Stackup": False,
            "Controlled Impedance": False,
            "Flex PCB": False,
        },
    )

    # Gerber layer names for rendering.
    pcb_layers = models.JSONField(
        null=False,
        blank=True,
        default={
            "copper top": "",
            "copper bot": "",
            "soldermask top": "",
            "soldermask bot": "",
            "silkscreen top": "",
            "silkscreen bot": "",
            "solder paste top": "",
            "solder paste bot": "",
            "board outline": "",
            "drill": "",
            "zip content": [],  # Files uploaded in the zip.
        },
    )

    # All PCBAs shall be coupled to a project, such that access control can be given on a per project basis.
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)

    release_state = models.CharField(max_length=50, blank=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True
    )  # The person that did the review.
    released_date = models.DateTimeField(null=True, blank=True)

    # Basic data fields
    display_name = models.CharField(max_length=150, blank=True)
    description = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    # Price fields.
    price = models.CharField(max_length=10, blank=True, null=True)
    currency = models.CharField(max_length=20, blank=True, default="USD", null=True)

    # Key to the Gerber zip file.
    gerber_file = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, related_name='gerber_file_pcba')

    # Gerber zip file. DEPRECATED for all new PCBAS after 19-06-2024.
    document_file = models.FileField(upload_to="gerber_files", blank=True, null=True)

    # This foreign key is to the part for the PCB.
    # The bare PCB is a part itself and shall occur in the BOM.
    # The PCB part shall be controlled from the PCBA only. It should be released by the accompanying PCBA view.
    # When a new revision of a PCBA is created, so shall the PCB part as well.
    # This is to limit the amount of manual labor.
    pcb = models.ForeignKey(Part, on_delete=models.SET_NULL, null=True)

    # Assembly drawing of the PCBA. This shows where componenes are to be placed.
    assembly_pdf = models.FileField(upload_to="assembly_pdf", blank=True, null=True)
    # Manufacture drawing. This is the documentation related to the PCB manufacturing, and should be shown in the accompanying PCB part.
    manufacture_pdf = models.FileField(
        upload_to="manufacture_pdf", blank=True, null=True
    )
    # This field should be used for a file showing e.g. the PCB or PCBA.
    layout_image = models.FileField(upload_to="layout_image", blank=True, null=True)
    thumbnail = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True)

    schematic_pdf = models.FileField(upload_to="schematic_pdf", blank=True, null=True)
    schematic_pdf_monochrome = models.FileField(
        upload_to="schematic_pdf_monochrome", blank=True, null=True
    )

    # The design files and simulation files for the PCBA.
    generic_files = models.ManyToManyField(File, blank=True)

    # This field is used to keep track of the number of pcbas that have been produced.
    serial_number_counter = models.IntegerField(default=0)
    serial_number_offset = models.IntegerField(default=0)
    serial_number_prefix = models.CharField(default="")

    # Find number of the parts in the above BOM Items.
    # The list is a set of ids to the files table.
    pcb_renders = ArrayField(
        models.IntegerField(null=True, blank=True), default=list, null=True, blank=True
    )

    # The references field is used to attach reference documents to an assembly.
    # This can be any document, like design description, requirement specification etc.
    reference_list_id = models.IntegerField(default=-1, blank=True)

    is_archived = models.BooleanField(default=False, blank=True)
    archived_date = models.DateField(null=True, blank=True)

    external_part_number = models.CharField(max_length=1000, blank=True, null=True)

    # Stock data
    current_total_stock = models.IntegerField(blank=True, null=True)
    minimum_stock_level = models.IntegerField(blank=True, null=True, default=0)

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="pcbas_tags")

    markdown_note_tabs = models.ManyToManyField('documents.MarkdownText',
                                                blank=True,
                                                symmetrical=False,
                                                related_name="pcbas_markdown_note_tabs")

    # __________________________________________________________________________________________
    # DEPRECATED fields

    # DEPRECATED
    # Graph datafields
    # The graph works as a double linked list, where we have items pointing to the next and previous item in the list.
    next_pcba = ArrayField(
        models.CharField(null=True, max_length=20), blank=True, null=True
    )
    prev_pcba = ArrayField(
        models.CharField(null=True, max_length=20), blank=True, null=True
    )
