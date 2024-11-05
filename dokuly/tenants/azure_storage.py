from django.core.files.storage import FileSystemStorage, Storage
from django_tenants.files.storage import TenantFileSystemStorage
from storages.backends.azure_storage import AzureStorage
from django.conf import settings
from django.utils.deconstruct import deconstructible
from django_tenants import utils
from urllib.parse import urljoin
import os


@deconstructible
class CustomAzureStorage(Storage):
    """
    A custom storage class that switches between FileSystemStorage for local development
    and AzureStorage for production, based on the environment variable DJANGO_LOCAL_SERVER.
    """

    def __init__(self, *args, **kwargs):
        # Check if we are running in a local environment
        self.local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))

        if self.local_server and (settings.AZURE_CUSTOM_DOMAIN is None
                                  or settings.AZURE_CONTAINER_NAME is None
                                  or settings.AZURE_ACCOUNT_KEY is None
                                  or settings.AZURE_ACCOUNT_NAME is None):
            # Use local storage if running locally, and Azure settings are not set
            self._storage = TenantFileSystemStorage(
                location=settings.MEDIA_ROOT,
                base_url=settings.MEDIA_URL
            )
        else:
            # If not use Azure storage
            self._storage = CustomAzureBlobStorage()

    def _get_storage(self):
        """Returns the appropriate storage backend."""
        return self._storage

    def open(self, name, mode='rb'):
        return self._get_storage().open(name, mode)

    def save(self, name, content, max_length=None):
        return self._get_storage().save(name, content, max_length=max_length)

    def delete(self, name):
        self._get_storage().delete(name)

    def exists(self, name):
        return self._get_storage().exists(name)

    def listdir(self, path):
        return self._get_storage().listdir(path)

    def size(self, name):
        return self._get_storage().size(name)

    def url(self, name):
        if self.local_server:
            return self._get_storage().url(name)
        return urljoin(settings.MEDIA_URL, name)

    def accessed_time(self, name):
        return self._get_storage().accessed_time(name)

    def created_time(self, name):
        return self._get_storage().created_time(name)

    def modified_time(self, name):
        return self._get_storage().modified_time(name)

    def path(self, name):
        if self.local_server:
            return self._get_storage().path(name)
        raise NotImplementedError("Azure Storage does not support file paths.")

    @property
    def location(self):
        """
        Sets the tenant-specific file location for local and Azure storage.
        Uses the `parse_tenant_config_path` function for tenant-specific paths.
        """
        if self.local_server:
            # Local storage path based on MEDIA_ROOT
            # return os.path.join(settings.MEDIA_ROOT, utils.parse_tenant_config_path('%s'))
            _location = os.path.join(settings.MEDIA_ROOT, utils.parse_tenant_config_path('%s'))
            return _location

        # Azure container path for production
        _location = utils.parse_tenant_config_path('%s')
        return _location


@deconstructible
class CustomAzureBlobStorage(AzureStorage):

    account_name = settings.AZURE_ACCOUNT_NAME
    account_key = settings.AZURE_ACCOUNT_KEY
    azure_container = settings.AZURE_CONTAINER_NAME
    expiration_secs = None

    def __init__(self, *args, **kwargs) -> None:
        if not settings.MEDIA_URL:
            raise Exception("MEDIA_URL not configured!")
        kwargs['azure_container'] = getattr(settings, 'AZURE_CONTAINER_NAME')
        super(CustomAzureBlobStorage, self).__init__(*args, **kwargs)

    def url(self, name):
        return urljoin(settings.MEDIA_URL, name)

    # Sets the tenants file location
    @property
    def location(self):
        _location = utils.parse_tenant_config_path('%s')
        return _location
