from rest_framework import serializers
from .models import Organization, Subscription, Rules


class CustomerOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'org_number', 'name', 'num_employees',
                  'logo', 'file_ids', 'image_ids', 'logo_id',
                  'tenant_id', 'enforce_2fa', 'current_storage_size',
                  'storage_limit', 'component_vault_api_key', 'currency',
                  'use_number_revisions', 'revision_format', 'start_major_revision_at_one',
                  'full_part_number_template', 'formatted_revision_template',
                  'full_document_number_template', 'document_use_number_revisions', 
                  'document_revision_format', 'document_start_major_revision_at_one',
                  'time_tracking_is_enabled', 'customer_is_enabled', 'document_is_enabled',
                  'pcba_is_enabled', 'assembly_is_enabled', 'procurement_is_enabled',
                  'requirement_is_enabled', 'production_is_enabled', 'supplier_is_enabled',
                  'inventory_is_enabled', 'eco_is_enabled']


class OrgComponentVaultAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'component_vault_api_key']


class OrganizationManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'


class RulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rules
        fields = '__all__'
