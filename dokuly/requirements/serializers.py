from rest_framework import serializers
from projects.serializers import ProjectSerializer, TagSerializer
from requirements.models import RequirementSet, Requirement


class RequirementSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequirementSet
        fields = "__all__"


class RequirementSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Requirement
        fields = "__all__"


class RequirementSetSerializerWithProject(serializers.ModelSerializer):
    project = ProjectSerializer(many=False, read_only=True)

    class Meta:
        model = RequirementSet
        fields = "__all__"
