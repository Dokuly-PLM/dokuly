from django.urls import path
from rest_framework import routers
from .api import DocumentViewSet, DocumentPrefixViewSet
from . import views
from . import viewsPrefix
from . import viewsProtectionLevel
from . import viewsMarkdown

router = routers.DefaultRouter()
router.register("api/documents", DocumentViewSet, "documents")
router.register("api/documentsPrefix", DocumentPrefixViewSet, "documentPrefix")

urlpatterns = [
    # Document
    path("api/documents/createNewDocument/", views.create_new_document),
    path("api/documents/fetchDocument/<int:pk>/", views.get_document),
    path("api/documents/getDocuments/<str:documentIds>/",
         views.get_documents_by_ids),
    path(
        "api/documents/put/revisionNotes/<int:documentId>/",
        views.update_revision_notes,
    ),
    path("api/documents/update/errata/<int:documentId>/", views.update_errata),
    path(
        "api/documents/get/documentNumber/<int:documentId>/",
        views.fetch_document_number,
    ),
    path("api/documents/post/newRevision/<int:pk>/",
         views.auto_new_revision),
    path("api/documents/updateDoc/<int:pk>/", views.update_doc),
    path("api/documents/get/allEnhanced/", views.get_documents_enhanced),
    path("api/documents/get/latestRevisions/", views.get_latest_revisions),
    path(
        "api/documents/get/getLatestRevisionsFirst25/",
        views.get_latest_revisions_first_25,
    ),
    path("api/documents/put/editInfo/<int:documentId>/", views.edit_document_info),
    path(
        "api/documents/put/generateDocumentNumber/<int:documentId>/",
        views.auto_gen_doc_number,
    ),

    # Markdown / Markdown tabs
    path("api/documents/markdownNotesTab/add/", viewsMarkdown.add_markdown_notes_tab),
    path("api/documents/markdownNotesTab/delete/<int:pk>/",
         viewsMarkdown.delete_markdown_notes_tab),
    path("api/documents/markdownNotesTab/edit/<int:pk>/", viewsMarkdown.edit_markdown_notes_tab),
    path("api/documents/markdownNotesTab/get/",
         viewsMarkdown.get_markdown_notes_tab),

    # DEPRECATED
    path("api/documents/put/archiveDocument/<int:pk>/",
         views.archive_document),
    path(
        "api/documents/put/setArchiveDocument/<int:pk>/",
        views.set_doc_to_archived,
    ),
    path(
        "api/documents/get/revisions/<int:documentId>/",
        views.get_revisions,
    ),
    # Admin views
    path("api/documents/get/archived/", views.admin_get_archived),
    path("api/documents/get/all/", views.admin_get_documents),
    path("api/documents/get/allEnhanced/admin/",
         views.admin_get_documents_enhanced),
    # Document files
    path("api/documents/fetchFileList/<int:id>/", views.fetch_file_list),
    path("api/documents/download/<str:file_identifier>/<int:id>/", views.download_file),
    path("api/documents/uploadFile/", views.upload_file),
    path(
        "api/documents/fetchdocumenFiles/<int:documentId>/", views.fetch_document_file
    ),  # DEPRECATED
    path(
        "api/documents/fetchdocumenFilesPdf/<int:documentId>/", views.fetch_document_pdf
    ),  # DEPRECATED
    path(
        "api/documents/fetchdocumenFilesPdfRaw/<int:documentId>/",
        views.fetch_document_pdf_raw,
    ),  # DEPRECATED
    # Prefixes
    path("api/documentPrefixes/get/all/", viewsPrefix.fetch_prefixes),
    path("api/documentPrefixes/post/newPrefix/", viewsPrefix.new_prefix),
    path("api/documentPrefixes/put/<int:prefixId>/", viewsPrefix.edit_prefix),
    path("api/documentPrefixes/get/archived/",
         viewsPrefix.fetch_archived_prefixes),
    # Protection Levels
    path("api/protectionLevels/get/all/", viewsProtectionLevel.fetch_protection_levels),
    path("api/protectionLevels/post/new/", viewsProtectionLevel.new_protection_level),
    path("api/protectionLevels/put/<int:protection_level_id>/", viewsProtectionLevel.edit_protection_level),
    path("api/protectionLevels/delete/<int:protection_level_id>/", viewsProtectionLevel.delete_protection_level),
    # Reference List
    path(
        "api/referenceList/get/references/<int:referenceListId>/",
        views.get_reference_documents,
    ),
    path("api/referenceList/put/addReference/", views.add_reference_document),
    path("api/referenceList/put/removeReferences/",
         views.remove_reference_documents),
]

urlpatterns += router.urls
