from django.conf import settings
from storages.backends.gcloud import GoogleCloudStorage
from urllib.parse import urljoin
from django_tenants import utils
from django.utils.deconstruct import deconstructible

# DO NOT DELETE; FILE IS INCLUDED IN THE MIGRATION RECORDS

@deconstructible
class GoogleCloudMediaStorage(GoogleCloudStorage):

    def __init__(self, *args, **kwargs) -> None:
        if not settings.MEDIA_URL:
            raise Exception("MEDIA_URL not configured!")
        kwargs['bucket_name'] = getattr(settings, 'GS_BUCKET_NAME')
        super(GoogleCloudMediaStorage, self).__init__(*args, **kwargs)

    def url (self, name):
        return urljoin(settings.MEDIA_URL, name)

    # Sets the tenants file location
    @property
    def location(self):
        _location = utils.parse_tenant_config_path('%s')
        return _location