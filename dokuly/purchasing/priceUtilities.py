from .priceModel import Price


def copy_price_to_new_revision(old_revision, new_revision):
    """
    Copies all prices from the old revision to the new revision.
    The old_revision and new_revision are expected to be instances of
    Pcba, Assembly, or Part models.
    """
    try:
        # Determine the model type of the revisions
        model_type = (
            old_revision.__class__.__name__.lower()
        )  # Ensure lowercase for consistency

        # Filter prices directly using the model name as the field name
        filter_kwargs = {f"{model_type}": old_revision}

        # Get all prices related to the old revision
        price_queryset = Price.objects.filter(**filter_kwargs).exclude(
            is_latest_price=False
        )

        # Copy each price to the new revision
        new_prices = []
        for price in price_queryset:
            new_price = Price(
                price=price.price,
                minimum_order_quantity=price.minimum_order_quantity,
                currency=price.currency,
                supplier=price.supplier,
                is_latest_price=price.is_latest_price,
                created_by=price.created_by,
            )
            setattr(new_price, model_type, new_revision)  # Set the new revision
            new_prices.append(new_price)

        # Bulk create to improve performance
        Price.objects.bulk_create(new_prices)

    except Exception as e:
        # TODO add logging
        return None
