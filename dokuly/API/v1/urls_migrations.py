from django.urls import path
from parts import viewsMigration as parts
from documents import viewsMigration as documents

urlpatterns = [
    path("api/v1/migrate/parts/", parts.bulk_upload_parts_auto_create_part_files, kwargs={"model_type": "part"}),
    path("api/v1/migrate/documents/", documents.bulk_upload_documents, kwargs={"model_type": "document"}),
]
