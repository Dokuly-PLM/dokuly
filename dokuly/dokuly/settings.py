"""
For more information on this file, see
https://docs.djangoproject.com/en/3.0/topics/settings/
For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.0/ref/settings/
"""

import os
from datetime import timedelta
from importlib import util

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
testing_server = bool(int(os.environ.get("DJANGO_TESTING_SERVER", 0)))

LOCAL_SERVER = local_server
TESTING_SERVER = testing_server

LOCAL_FORWARD_IP = os.getenv("LOCAL_FORWARD_IP", "localhost:8000")
print(f"LOCAL_FORWARD_IP: {LOCAL_FORWARD_IP}")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.0/howto/deployment/checklist/

if local_server:
    # NOTE: If running self host on local machine, please set the secret_key variable to a random string in your .env file
    SECRET_KEY = os.getenv("django_secret_key", "asdofnasdfnasdioufasdioufasdifujnsdfaiun")  # This is a placeholder key
    # NOTE: If running self host on local machine, please set the secret_key variable to a random string in your .env file
else:
    SECRET_KEY = os.getenv("d_s_k")


if local_server:
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [
        str(os.getenv("allowed_hosts")),
        "." + str(os.getenv("allowed_hosts")),  # Wildcard mapping
        "https://." + str(os.getenv("allowed_hosts")),  # Wildcard mapping
        "stackpath.bootstrapcdn.com",
        "code.jquery.com",
        "cdn.jsdelivr.net",
        "https://" + str(os.getenv("allowed_hosts")),
        "https://." + str(os.getenv("allowed_hosts")),
        "https://.dokuly.com",
        "https://dokuly.com",
        ".dokuly.com",
        "dokuly.com",
    ]

# Application definition ---------------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",
    "accounts",
    "knox",
    "profiles",
    "domains",
    "timetracking",
    "documents",
    "rest_framework",
    "rest_framework_api_key",
    "drf_yasg",
    "frontend",
    "organizations.apps.OrganizationsConfig",
    "projects",
    "parts",
    "part_numbers",
    "assemblies",
    "customers",
    "files",
    "inventory",
    "images",
    "pcbas",
    "production",
    "purchasing",
    "requirements",
    "todos",
    "assembly_bom",
    "django_expiring_token",
]

if not testing_server:
    INSTALLED_APPS.append("debug_toolbar")

if util.find_spec("public_page") is not None:
    INSTALLED_APPS.append("public_page")


EXPIRING_TOKEN_DURATION = timedelta(hours=192)
# Any timedelta setting can be used! If not set, the default value is 1 day

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "knox.auth.TokenAuthentication",
        "django_expiring_token.authentication.ExpiringTokenAuthentication",
    )
}

# Swagger/OpenAPI Configuration - Modern UI with Testing Features
# "Try it out" is enabled by default in Swagger UI
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Token': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Django Knox Token authentication. Enter as: "Token <your-token>" (include the word "Token" and a space before your token)'
        },
        'Api-Key': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Organization API Key authentication. Enter as: "Api-Key <your-api-key>" (include "Api-Key" and a space before your key)'
        }
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
    'SUPPORTED_SUBMIT_METHODS': [
        'get',
        'post',
        'put',
        'delete',
        'patch'
    ],
    'OPERATIONS_SORTER': 'alpha',
    'TAGS_SORTER': 'alpha',
    'DOC_EXPANSION': 'list',  # Show all operations expanded by default
    'DEFAULT_INFO': None,  # Use the info from schema_view
    'DEEP_LINKING': True,
    'SHOW_EXTENSIONS': True,
    'DEFAULT_MODEL_RENDERING': 'example',  # Show example values
    'SHOW_REQUEST_HEADERS': True,  # Show request headers
    'DEFAULT_FIELD_INSPECTORS': [
        'drf_yasg.inspectors.CamelCaseJSONFilter',
        'drf_yasg.inspectors.ReferencingSerializerInspector',
        'drf_yasg.inspectors.RelatedFieldInspector',
        'drf_yasg.inspectors.ChoiceFieldInspector',
        'drf_yasg.inspectors.FileFieldInspector',
        'drf_yasg.inspectors.DictFieldInspector',
        'drf_yasg.inspectors.SimpleFieldInspector',
        'drf_yasg.inspectors.StringDefaultFieldInspector',
    ],
    'DEFAULT_PAGINATOR_INSPECTORS': [
        'drf_yasg.inspectors.DjangoRestResponsePagination',
        'drf_yasg.inspectors.CoreAPICompatInspector',
    ],
    'VALIDATOR_URL': None,  # Disable online validator for faster loading
}

REDOC_SETTINGS = {
    'LAZY_RENDERING': False,
    'HIDE_HOSTNAME': False,
    'EXPAND_RESPONSES': '200,201',
    'PATH_IN_MIDDLE': True,
}

AUTHENTICATION_BACKENDS = [
    'accounts.email_authentication.EmailAuthBackend',
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = "dokuly.urls"


REST_KNOX = {"TOKEN_TTL": timedelta(hours=96)}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django_permissions_policy.PermissionsPolicyMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if not testing_server:
    MIDDLEWARE.append("debug_toolbar.middleware.DebugToolbarMiddleware")

AUTH_USER_MODEL = "auth.User"

if local_server:
    print("Running dev...")
    CSRF_COOKIE_SECURE = False
    DEBUG = True
    # CORS settings for local development
    CORS_ORIGIN_ALLOW_ALL = True
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CORS_ALLOW_HEADERS = [
        'accept',
        'accept-encoding',
        'authorization',
        'content-type',
        'dnt',
        'origin',
        'user-agent',
        'x-csrftoken',
        'x-requested-with',
        'x-api-key',
    ]

else:
    print("Running PRODUCTION")
    DEBUG = False
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    CORS_ORIGIN_ALLOW_ALL = True
    PERMISSIONS_POLICY = {
        "accelerometer": ["'self'"],
        "ambient-light-sensor": ["'self'"],
        "autoplay": ["'self'"],
        "camera": ["'self'"],
        "display-capture": ["'self'"],
        "document-domain": ["'self'"],
        "encrypted-media": ["'self'"],
        "fullscreen": ["'self'"],
        "geolocation": ["'self'"],
        "gyroscope": ["'self'"],
        "interest-cohort": ["'self'"],
        "magnetometer": ["'self'"],
        "microphone": ["'self'"],
        "midi": ["'self'"],
        "payment": ["'self'"],
        "usb": ["'self'"],
    }
    SECURE_HSTS_SECONDS = 60
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_COOKIE_DOMAIN = "." + str(os.getenv("allowed_hosts"))
    CSRF_TRUSTED_ORIGINS = [
        "https://" + str(os.getenv("allowed_hosts")),
        "https://." + str(os.getenv("allowed_hosts")),
        "https://.dokuly.com",
        "https://dokuly.com",
        "https://stackpath.bootstrapcdn.com",
        "https://code.jquery.com",
        "https://cdn.jsdelivr.net",
    ]

GOOGLE_ANALYTICS_CLIENT_ID = os.getenv("GOOGLE_ANALYTICS_CLIENT_ID")

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "dokuly.wsgi.application"

if testing_server:
    TEST_DATABASE_PREFIX = "test_"

if local_server:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "DokulyOSS",
            "USER": "postgres",
            "PASSWORD": os.getenv("self_host_db_key", "AAAAmeaIE1elf213fe_fseof302fldAADokulySelfhost"),
            "HOST": "db",
            "PORT": "5432",
            "TEST": {"NAME": "systems_development_platform_testing"},
        }
    }
elif testing_server:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "DokulyOSS",
            "USER": "postgres",
            "PASSWORD": "AAAAmeaIE1elf213fe_fseof302fldAADokulySelfhost",
            "HOST": "127.0.0.1",
            "PORT": "5432",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("AZURE_POSTGRESQL_NAME"),
            "USER": os.getenv("AZURE_POSTGRESQL_USER"),
            "PASSWORD": os.getenv("AZURE_POSTGRESQL_PASSWORD"),
            "HOST": os.getenv("AZURE_POSTGRESQL_HOST"),
        }
    }

# Cache configuration
# Using file-based cache for persistence across server restarts
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
        'LOCATION': os.path.join(BASE_DIR, 'django_cache'),
        'TIMEOUT': 2592000,  # 30 days default timeout
        'OPTIONS': {
            'MAX_ENTRIES': 10000
        }
    }
}

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ____________________________________________________________________________________________________________________
# Google storage.

# # If you already have a bucket with Uniform access control set to public read, please keep GS_DEFAULT_ACL to None
# and set GS_QUERYSTRING_AUTH to False.
GS_DEFAULT_ACL = None
GS_QUERYSTRING_AUTH = False
GS_EXPIRATION = timedelta(minutes=5)

# Needed for uploading large streams, entirely optional otherwise
GS_BLOB_CHUNK_SIZE = 1024 * 256 * 40

GS_PROJECT_ID = os.getenv("gs_id")

# ____________________________________________________________________________________________________________________
# Static files

# If we want static files on the cloud bucket. Currently stored in the Docker.
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/
# STATICFILES_STORAGE = 'storages.backends.gcloud.GoogleCloudStorage'

# We are using whitenoise>=6.2.0 to serve static files, see its documentation for more info

# Collect static creates this new dir
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATIC_URL = "/static/"

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "frontend/static/"),
    os.path.join(BASE_DIR, "public_page/static/"),
]

DEFAULT_FILE_STORAGE = "tenants.azure_storage.CustomAzureStorage"  # Keep this here. Azure storage reconfigured for local root.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ____________________________________________________________________________________________________________________
# Media files
GS_BUCKET_NAME = os.getenv("GS_BUCKET_NAME")

AZURE_CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
AZURE_ACCOUNT_NAME = os.getenv("AZURE_ACCOUNT_NAME")
AZURE_CUSTOM_DOMAIN = f"{AZURE_ACCOUNT_NAME}.blob.core.windows.net"
AZURE_ACCOUNT_KEY = os.getenv("AZURE_ACCOUNT_KEY")

MEDIA_ROOT = os.path.join("/dokuly_image/", "media/")
MEDIA_URL = f"https://{AZURE_CUSTOM_DOMAIN}/{AZURE_CONTAINER_NAME}/"


if local_server or testing_server:
    print("Running local development bucket...")
    if (
        AZURE_CUSTOM_DOMAIN is None
        or AZURE_CONTAINER_NAME is None
        or AZURE_ACCOUNT_KEY is None
        or AZURE_ACCOUNT_NAME is None
    ):
        MEDIA_URL = os.path.join("/dokuly_image/", "media/")
        MEDIA_ROOT = os.path.join("/dokuly_image/", "media/")
        print("Using local storage, container config not found")
        DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# ____________________________________________________________________________________________________________________

# SMTP Email Backend Configuration
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_USE_TLS = True
EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = os.getenv("EMAIL_PORT")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")

NGROK_TESTING_SERVER = os.getenv("NGROK_TESTING_SERVER")
CURRENCY_API = os.getenv("CURRENCY_API")

ALLOW_NEW_TENANT_SUBSCRIPTIONS = os.getenv("allow_subscriptions")
if ALLOW_NEW_TENANT_SUBSCRIPTIONS == "1":
    ALLOW_NEW_TENANT_SUBSCRIPTIONS = 1
if ALLOW_NEW_TENANT_SUBSCRIPTIONS == "0":
    ALLOW_NEW_TENANT_SUBSCRIPTIONS = 0
if local_server:
    ALLOW_NEW_TENANT_SUBSCRIPTIONS = 1

# Paddle Configuration
PADDLE_ACCOUNT_MODEL = "organizations.Subscription"
PADDLE_MODE = "live"
PADDLE_VENDOR_ID = os.getenv("PADDLE_VENDOR_ID")
PADDLE_AUTH_CODE = os.getenv("PADDLE_VENDOR_AUTH_CODE")
PADDLE_PUBLIC_KEY = os.getenv("PADDLE_PUBLIC_KEY")
PADDLE_API_AUTH_CODE = os.getenv("PADDLE_API_AUTH_CODE")

if local_server:
    PADDLE_MODE = os.getenv("PADDLE_MODE") or "sandbox"
    PADDLE_VENDOR_ID = os.getenv("PADDLE_VENDOR_ID")
    PADDLE_AUTH_CODE = os.getenv("PADDLE_VENDOR_AUTH_CODE")
    PADDLE_API_AUTH_CODE = os.getenv("PADDLE_API_AUTH_CODE")
    PADDLE_PUBLIC_KEY = os.getenv("PADDLE_PUBLIC_KEY")


# Cryptography
FIELD_ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY")
if local_server:
    # For the local self hosting, if the field encryption key is not set, we set it to a default value
    FIELD_ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY", "eFBmelEr4kgibnGbt4Admrd634hef54gegwefbbfZz4=")
    # For best security practices, please set the FIELD_ENCRYPTION_KEY to a random string in your .env file

# Removes some non null init warnings
SILENCED_SYSTEM_CHECKS = ["models.W042",
                          "fields.E010", "staticfiles.W004", "fields.W340"]
