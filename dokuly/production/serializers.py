from rest_framework import serializers
from production.models import Production, TestData, Lot
from parts.serializers import (GlobalSearchAssemblySerializer,
                               GlobalSearchPartSerializer,
                               GlobalSearchPcbaSerializer, PartThumbnailTitleSerializer)
from assemblies.serializers import AssemblyThumbnailTitleSerializer
from pcbas.serializers import PcbaThumbnailTitleSerializer
from projects.serializers import ProjectSerializer
from documents.serializers import MarkdownTextSerializer


class LeanLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lot
        fields = ['id', 'title', 'lot_number']


class ProductionSerializer(serializers.ModelSerializer):
    # Consider creating unique serializers for production table.
    part = GlobalSearchPartSerializer()
    # Consider creating unique serializers for production table.
    pcba = GlobalSearchPcbaSerializer()
    # Consider creating unique serializers for production table.
    assembly = GlobalSearchAssemblySerializer()

    description = MarkdownTextSerializer()

    lot = LeanLotSerializer()

    class Meta:
        model = Production
        fields = '__all__'


class TestDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestData
        fields = '__all__'


class LotSerializer(serializers.ModelSerializer):

    part = PartThumbnailTitleSerializer()
    assembly = AssemblyThumbnailTitleSerializer()
    pcba = PcbaThumbnailTitleSerializer()
    description = MarkdownTextSerializer()

    class Meta:
        model = Lot
        fields = '__all__'


class LotSerializerWithProject(serializers.ModelSerializer):

    part = PartThumbnailTitleSerializer()
    assembly = AssemblyThumbnailTitleSerializer()
    pcba = PcbaThumbnailTitleSerializer()

    class Meta:
        model = Lot
        fields = '__all__'
