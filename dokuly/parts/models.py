from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField

from projects.models import Project, Tag
from purchasing.suppliermodel import Supplier
from files.models import Image
from files.models import File
from profiles.models import Profile


class Part(models.Model):
    """Instance of a part used in assembly.
    Can be used to create a standalone library of parts.
    """

    # dokuly unique part number. This defines the part, and is the same across revisions.
    part_number = models.IntegerField(default=-1, blank=True, null=True)

    # Implement full part number field to remove logic from front-end.
    # The complete part number of a document. e.g. PRT1234.
    full_part_number = models.CharField(null=True, blank=True, max_length=50)
    
    # Formatted revision field based on organization template (e.g., "A", "1", "A-0", "1-0")
    formatted_revision = models.CharField(null=True, blank=True, max_length=20)

    # Basic information fields
    display_name = models.CharField(max_length=150, blank=True)

    part_type = models.ForeignKey(
        "PartType", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Part Metadata
    description = models.TextField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    release_state = models.CharField(max_length=50, blank=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True
    )  # The person that did the review.
    released_date = models.DateTimeField(null=True, blank=True)

    # Unit of measurement for the part (e.g., pieces, kilograms)
    unit = models.CharField(max_length=20, blank=True, default="pcs", null=True)

    # Parts can be coupled to a project, such that access control can be given on a per project basis.
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)

    internal = models.BooleanField(null=True)
    last_updated = models.DateTimeField(auto_now=True)
    on_order_quantity = models.IntegerField(blank=True, null=True)

    # This field is used to keep track of the number of parts that have been produced.
    serial_number_counter = models.IntegerField(default=0)
    serial_number_offset = models.IntegerField(default=0)
    serial_number_prefix = models.CharField(default="")

    # Any files tied to Part. Deleted files, have their archived field set to true.
    files = models.ManyToManyField(File, blank=True)

    # The references field is used to attach reference documents to an assembly.
    # This can be any document, like design description, requirement specification etc.
    reference_list_id = models.IntegerField(default=-1, blank=True)

    # The primary revision counters. These are unrelated to formatting, and number/lettering style.
    revision_count_major = models.IntegerField(blank=True, null=True, default=0)
    revision_count_minor = models.IntegerField(blank=True, null=True, default=0)

    # Indicates if this is the latest revision of the part. It is used to quickly query for the latest revision without needing to sort through all revisions.
    is_latest_revision = models.BooleanField(default=False, blank=True)

    model_url = models.CharField(max_length=500, blank=True, null=True)
    git_link = models.CharField(max_length=200, blank=True, null=True)

    image_url = models.CharField(max_length=200, blank=True, null=True)
    thumbnail = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True)

    # External parts, extra part information
    mpn = models.CharField(max_length=50, blank=True, null=True)
    farnell_number = models.CharField(max_length=50, blank=True, null=True)
    manufacturer = models.CharField(max_length=60, blank=True, null=True)
    datasheet = models.CharField(max_length=200, blank=True, null=True)
    # Lifecycle # TODO change to lifecycle statur
    production_status = models.CharField(max_length=20, blank=True, null=True)

    # Nexar integration - unique identifier from Nexar API
    nexar_part_id = models.CharField(max_length=100, blank=True, null=True)

    # Part source - where the part data came from
    source = models.CharField(
        max_length=20,
        choices=[
            ("digikey", "DigiKey"),
            ("nexar", "Nexar"),
            ("manual", "Manual"),
        ],
        default="manual",
        blank=True,
        null=True,
        help_text="Source of the part data"
    )

    # Compliance
    is_rohs_compliant = models.BooleanField(default=False, blank=True)
    is_reach_compliant = models.BooleanField(default=False, blank=True)
    is_ul_compliant = models.BooleanField(default=False, blank=True)

    # ECCN
    export_control_classification_number = models.CharField(max_length=200, blank=True, null=True)
    country_of_origin = models.CharField(max_length=200, blank=True, null=True)
    hs_code = models.CharField(max_length=200, blank=True, null=True)

    estimated_factory_lead_days = models.IntegerField(blank=True, null=True)

    # Alternative_parts. Foreign keys to parts which have the same mechanical fit, with the same or greater performance.
    alternative_parts_v2 = models.ManyToManyField("self",
                                                  symmetrical=False,
                                                  blank=True,
                                                  related_name="alternative_to")

    # Archiving is used as a method of soft "deleting" objects, while still storing the data.
    is_archived = models.BooleanField(default=False, null=True, blank=True)

    revision_notes = models.CharField(max_length=20000, null=True, blank=True)
    # The errata field shall be used to write up errors on an assembly.
    errata = models.CharField(blank=True, null=True, max_length=20000)

    markdown_notes = models.ForeignKey(
        'documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True
    )

    stock = ArrayField(models.JSONField(blank=True, null=True), blank=True, null=True)
    urls = ArrayField(models.JSONField(blank=True, null=True), blank=True, null=True)

    # E.G. part number used in ERP other than dokuly
    external_part_number = models.CharField(max_length=1000, blank=True, null=True)

    # Stock data
    current_total_stock = models.IntegerField(blank=True, null=True)
    minimum_stock_level = models.IntegerField(blank=True, null=True, default=0)

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="parts_tags")

    markdown_note_tabs = models.ManyToManyField('documents.MarkdownText',
                                                blank=True,
                                                symmetrical=False,
                                                related_name="parts_markdown_note_tabs")

    # __________________________________________________________________________________________
    # DEPRECATED fields

    # This is the old revision field kept for compatibility.
    revision = models.CharField(max_length=10, blank=True, null=True)  # DEPRECATED

    backorder_quantity = models.IntegerField(blank=True, null=True)

    # From component vault
    part_information = models.JSONField(blank=True, null=True)
    # ID to the connected part on the component vault.
    component_vault_id = models.IntegerField(blank=True, null=True)


    rohs_status_code = models.CharField(max_length=20, blank=True, null=True)

    # DEPRECATED
    price_qty = models.CharField(max_length=6, blank=True, null=True)
    # DEPRECATED
    price = models.CharField(max_length=10, blank=True, null=True)
    # DEPRECATED
    currency = models.CharField(max_length=20, blank=True, default="USD", null=True)
    # DEPRECATED
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True
    )
    # DEPRECATED
    distributor = models.CharField(max_length=100, blank=True, null=True)  # Deprecated

    # DEPRECATED
    # IDs to the files table where the part drawings are stored.
    part_drawing_raw = models.IntegerField(default=-1, blank=True)
    # The part_drawing field shall not be able to upload to form the front end.
    # It is a field where processed PDFs are stored.

    # DEPRECATED
    part_drawing = models.IntegerField(default=-1, blank=True)

    # DEPRECATED
    # IDs to file fields.
    # Files in this array can be archived. The filtering, and possible recovering of these files, are handled in front-end.
    generic_file_ids = ArrayField(
        models.IntegerField(blank=True, default=0), default=list, blank=True
    )

    # Allowed part types: 'PCB', 'Electrical', 'Mechanical', 'Tool', 'Consumable', 'Software'.
    # DEPRECATED
    part_type_str = models.CharField(max_length=150, blank=True, null=True)

    # DEPRECATED.
    # Custom part specs, saved as string, used as JSON.
    # Defines both col name and value, used to store specs not found with API keys or on 3rd party sites.
    customSpecs = ArrayField(
        models.CharField(max_length=5000, blank=True, null=True), blank=True, null=True
    )

    alternative_parts = ArrayField(
        models.IntegerField(null=False, blank=True), default=[], blank=True, null=True
    )

    # DEPRECATED.
    supplier_stock = models.IntegerField(blank=True, null=True)

    # DEPRECATED. price_history, stock, urls, are not necessary to store on dokuly as well.
    price_history = ArrayField(
        models.JSONField(null=True, blank=True), blank=True, null=True
    )

    # DEPRECATED
    # After Octopart integration, these fields are DEPRECATED, however some legacy parts might still used these
    sellers = models.TextField(max_length=50000, blank=True, null=True)
    specs = models.TextField(max_length=50000, blank=True, null=True)

    # DEPRECATED file field. TODO: delete.
    # Change this part file, structure to a separate file model through foreign key (integer array field).
    # These files should be moved to File instances, with a table in frontend
    part_file1 = models.FileField(upload_to="documents", blank=True, null=True)
    part_file2 = models.FileField(upload_to="documents", blank=True, null=True)
    part_file3 = models.FileField(upload_to="documents", blank=True, null=True)
    part_file4 = models.FileField(upload_to="documents", blank=True, null=True)
    part_file5 = models.FileField(upload_to="documents", blank=True, null=True)

    # NOT IN USE. Perhaps if we reintroduce PCBs as parts, in the BOM of a PCBA, these fields may have purpose.
    pcb_width = models.CharField(max_length=6, blank=True, null=True)
    pcb_length = models.CharField(max_length=6, blank=True, null=True)


class PartType(models.Model):
    """Custom part types."""

    name = models.CharField(max_length=150, blank=True, null=True)
    description = models.CharField(max_length=500, blank=True, null=True)
    # The suggjested unit shown on part creation.
    default_unit = models.CharField(max_length=20, blank=True, null=True)
    icon_url = models.CharField(max_length=800, blank=True, null=True)
    prefix = models.CharField(blank=True, max_length=20, null=True)

    # Nice to have metadata. Not shown.
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    last_updated = models.DateTimeField(auto_now=True)
