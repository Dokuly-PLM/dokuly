from django.contrib import admin
from django.urls import path, include
from importlib import util


urlpatterns = [
    path("", include("django_expiring_token.urls")),
    path("", include("tenants.urls")),
    path("", include("domains.urls")),
]

if util.find_spec("public_page"):
    urlpatterns.append(path("", include("public_page.urls")))
