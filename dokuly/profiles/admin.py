from django.contrib import admin
from .models import Profile, Notification, TableView


@admin.register(TableView)
class TableViewAdmin(admin.ModelAdmin):
    list_display = ["table_name", "name", "user", "is_shared", "created_at", "updated_at"]
    list_filter = ["table_name", "is_shared", "created_at"]
    search_fields = ["name", "table_name", "user__username"]
    readonly_fields = ["created_at", "updated_at"]
