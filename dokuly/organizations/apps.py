from django.apps import AppConfig


class OrganizationsConfig(AppConfig):
    name = 'organizations'

    def ready(self):
        import organizations.signals
