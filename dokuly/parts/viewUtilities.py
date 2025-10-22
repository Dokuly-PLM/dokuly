import os
import random
from documents.models import MarkdownText
from django.db import transaction

if __name__ == "__main__":
    import doctest
    doctest.testmod()


def copy_markdown_tabs_to_new_revision(current_obj, new_obj):
    if hasattr(current_obj, 'markdown_note_tabs'):
        existing_tabs = list(current_obj.markdown_note_tabs.all())
        new_tabs = [
            MarkdownText(
                text=tab.text,
                created_by=tab.created_by,
                title=tab.title,
            )
            for tab in existing_tabs
        ]

        with transaction.atomic():
            # Bulk create new MarkdownText instances
            MarkdownText.objects.bulk_create(new_tabs)

            # Associate all new tabs with new_obj
            new_obj.markdown_note_tabs.add(*new_tabs)
            # Preserve the is_latest_revision flag when saving
            is_latest = new_obj.is_latest_revision
            new_obj.save()
            if is_latest:
                new_obj.is_latest_revision = True
                new_obj.save()
