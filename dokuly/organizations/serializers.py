from rest_framework import serializers
from .models import Organization, Subscription


class CustomerOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'org_number', 'name', 'num_employees',
                  'logo', 'file_ids', 'image_ids', 'logo_id',
                  'tenant_id', 'enforce_2fa', 'current_storage_size',
                  'storage_limit', 'component_vault_api_key', 'currency',
                  'use_number_revisions', 'revision_format', 'revision_separator',
                  'full_part_number_template']


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
