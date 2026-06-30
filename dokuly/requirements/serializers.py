from rest_framework import serializers
from projects.serializers import ProjectSerializer, TagSerializer
from requirements.models import RequirementSet, Requirement


class RequirementDocumentReferenceSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    page_number = serializers.IntegerField(allow_null=True)
    document_id = serializers.IntegerField(source="document.id")
    pdf_print_id = serializers.IntegerField(source="document.pdf_print_id", allow_null=True)
    full_doc_number = serializers.CharField(source="document.full_doc_number", allow_null=True)
    thumbnail = serializers.IntegerField(source="document.thumbnail_id", allow_null=True)
    formatted_revision = serializers.CharField(
        source="document.formatted_revision", allow_null=True
    )
    title = serializers.CharField(source="document.title")


class RequirementSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementSet
        fields = "__all__"


class RequirementSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    statement_references = serializers.SerializerMethodField()
    verification_references = serializers.SerializerMethodField()

    def get_statement_references(self, obj):
        refs = obj.statement_references.select_related("document").all()
        return RequirementDocumentReferenceSerializer(refs, many=True).data

    def get_verification_references(self, obj):
        refs = obj.verification_references.select_related("document").all()
        return RequirementDocumentReferenceSerializer(refs, many=True).data

    class Meta:
        model = Requirement
        fields = "__all__"


class RequirementSetSerializerWithProject(serializers.ModelSerializer):
    project = ProjectSerializer(many=False, read_only=True)

    class Meta:
        model = RequirementSet
        fields = "__all__"
