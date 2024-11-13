from rest_framework import routers
from .api import PurchaseOrderViewSet, SupplierViewSet
from . import views, supplierViews, priceViews, poItemViews
from django.urls.conf import path

router = routers.DefaultRouter()
router.register("api/purchasing", PurchaseOrderViewSet, "purchasing")

urlpatterns = [
    # Purchase Order
    path("api/purchasing/get/all/", views.get_all_purchase_orders),
    path("api/purchasing/get/<int:purchase_order_id>/", views.get_purchase_order),
    path("api/purchasing/create/", views.create_purchase_order),
    path("api/purchasing/update/<int:purchase_order_id>/", views.update_purchase_order),
    path("api/purchasing/delete/<int:purchase_order_id>/", views.delete_purchase_order),
    path(
        "api/PurchaseOrder/add_file/<int:po_id>/<int:file_id>/",
        views.add_file_to_purchase_order,
    ),
    path("api/purchasing/migrate_po/<int:po_id>/", views.migrate_purchase_order),
    path("api/purchasing/createFromBOM/", views.create_po_from_bom),

    # PoItem
    path("api/purchase_order/<int:poId>/matchPoItemsWithParts/", poItemViews.match_po_items_with_parts),
    path("api/purchase_order/getItems/<int:po_id>/", poItemViews.get_po_items_by_po_id),
    path("api/purchase_order/editItem/<int:itemId>/", poItemViews.edit_po_item),
    path("api/purchase_order/removeItem/<int:itemId>/", poItemViews.remove_po_item),
    path("api/purchase_order/<int:poId>/addItem/", poItemViews.add_po_item),
    path(
        "api/purchase_order/<int:poId>/addItemWithContents/",
        poItemViews.add_po_item_with_contents,
    ),
    path("api/purchase_order/<int:poId>/clearOrderItems/", poItemViews.clear_po_items),
    path("api/purchase_order/markItemAsReceived/<int:itemId>/", poItemViews.mark_item_as_received),
    # Supplier
    path("api/supplier/get/all/", supplierViews.get_all_suppliers),
    path("api/supplier/get/<int:supplier_id>/", supplierViews.get_supplier),
    path("api/supplier/create/", supplierViews.create_supplier),
    path("api/supplier/update/<int:supplier_id>/", supplierViews.update_supplier),
    path("api/supplier/delete/<int:supplier_id>/", supplierViews.delete_supplier),
    # Price
    path(
        "api/price/get/latestPrices/<str:app>/<int:id>/", priceViews.get_latest_prices
    ),
    path(
        "api/price/get/priceHistory/<str:app>/<int:id>/", priceViews.get_price_history
    ),
    path("api/price/post/addNewPrice/<str:app>/<int:id>/", priceViews.add_new_price),
    path("api/price/put/editPrice/<int:price_id>/", priceViews.edit_price),
    path("api/price/delete/<int:price_id>/", priceViews.delete_or_deactivate_price),
]

urlpatterns += router.urls
