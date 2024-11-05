from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from rest_framework.renderers import JSONRenderer

from .models import Bom_item
from purchasing.priceModel import Price
from organizations.models import Organization
from profiles.views import check_user_auth_and_app_permission


class BOMCostCalculator:
    def __init__(self, organization_currency, currency_conversion_rates):
        self.organization_currency = organization_currency
        self.currency_conversion_rates = currency_conversion_rates
        self.parts_missing_price = []

    price_tree = None

    def build_price_tree(self, app, id):
        self.price_tree = self.build_cost_data(app, id)

    def build_cost_data(self, app, id, visited=None):
        """Build an object with the necessary data to calculate cost at different quantities."""
        if visited is None:
            visited = set()

        if (app, id) in visited:
            print(f"Skipping {app} with ID {id} to prevent infinite recursion")
            return {}

        visited.add((app, id))
        cost_data = {}

        try:
            bom_items_query = Bom_item.objects.all().select_related(
                "part", "pcba", "assembly"
            )

            bom_items = []
            if app == "assembly":
                bom_items = bom_items_query.filter(bom__assembly_id=id)
            elif app == "pcba":
                bom_items = bom_items_query.filter(bom__pcba__id=id).exclude(
                    is_mounted=False
                )

            for item in bom_items:
                item_id = None
                app_type = None
                if item.part:
                    item_id = item.part.id
                    app_type = "part"
                elif item.pcba:
                    item_id = item.pcba.id
                    app_type = "pcba"
                elif item.assembly:
                    item_id = item.assembly.id
                    app_type = "assembly"

                if item_id:
                    prices = Price.objects.filter(
                        **{f"{app_type}__id": item_id}, is_latest_price=True
                    )
                    price_data = []
                    for price in prices:
                        # Require price and currency to be set
                        if (
                            price.price is None
                            or price.currency is None
                            or price.currency == ""
                        ):
                            continue
                        price_data.append(
                            {
                                "price": price.price,
                                "minimum_order_quantity": price.minimum_order_quantity,
                                "currency": price.currency,
                            }
                        )

                    # Store the price data for this item
                    cost_data[item_id] = {
                        "app": app_type,
                        "id": item_id,
                        "quantity": item.quantity,
                        "price_data": price_data,
                    }

                    # If no direct price, recurse into its BOM
                    if not prices.exists() or (app_type == "part" and not price_data):
                        if app_type != "part":  # Recurse only if it's not a part
                            cost_data[item_id]["bom_cost_data"] = self.build_cost_data(
                                app_type, item_id, visited
                            )
                        elif app_type == "part":
                            self.parts_missing_price.append(item_id)

            return cost_data

        except Exception as e:
            print(f"build_cost_data failed: {e}")
            return {}

    def flatten_bom(self):
        """Flatten the BOM cost data to a single-level dictionary."""
        self.flat_bom = self.flatten_bom_recursive()

    def flatten_bom_recursive(self, node=None, multiplier=1, flat_bom=None):
        if node is None:
            node = self.price_tree  # Start from the root if no node is specified
        if flat_bom is None:
            flat_bom = {}  # Initialize the flat BOM

        for item_id, details in node.items():
            quantity = details["quantity"] * multiplier
            if item_id in flat_bom:
                flat_bom[item_id][
                    "quantity"
                ] += quantity  # Aggregate quantity for existing components
            else:
                flat_bom[item_id] = {
                    "app": details["app"],
                    "id": item_id,
                    "quantity": quantity,
                    "price_data": details["price_data"],
                }
            if "bom_cost_data" in details:
                # Recursive call to process nested components
                self.flatten_bom_recursive(details["bom_cost_data"], quantity, flat_bom)

        return flat_bom

    def calculate_aggregated_cost_breaks(self):
        cost_breaks = set()
        for item_id, details in self.flat_bom.items():
            for price_info in details["price_data"]:
                minimum_order_quantity = price_info.get("minimum_order_quantity", 0)
                # Calculate cost break considering the total aggregated quantity
                cost_break = max(1, minimum_order_quantity // details["quantity"])
                cost_breaks.add(cost_break)
        self.cost_break_quantitites = sorted(list(cost_breaks))
        return cost_breaks

    def calculate_bom_cost(self, quantity=1):
        """Calculates the total cost of the BOM based on aggregated price data and given quantity."""
        total_cost = 0.0
        for item_id, details in self.flat_bom.items():
            best_price = self.select_best_price(
                details["price_data"], quantity * details["quantity"]
            )
            if best_price:
                converted_price = self._convert_currency(
                    best_price["price"], best_price["currency"]
                )

                if (
                    quantity * details["quantity"]
                    < best_price["minimum_order_quantity"]
                ):
                    total_cost += converted_price * best_price["minimum_order_quantity"]
                    continue

                total_cost += converted_price * quantity * details["quantity"]

        return total_cost

    def select_best_price(self, price_data, required_quantity):
        """Selects the price with the highest MOQ that's still less than or equal to the required quantity."""
        if not price_data:
            return None
        elif len(price_data) == 1:
            return price_data[0]
        if required_quantity <= 0:
            return None

        applicable_prices = [
            price
            for price in price_data
            if price["minimum_order_quantity"] <= required_quantity
        ]
        if not applicable_prices:
            # return lowest MOQ price if no price is applicable.
            return sorted(
                price_data, key=lambda x: x["minimum_order_quantity"], reverse=False
            )[0]

        # Sort prices by MOQ in descending order to find the price with the greatest MOQ within the required quantity
        best_price = sorted(
            applicable_prices, key=lambda x: x["minimum_order_quantity"], reverse=True
        )[0]
        return best_price

    def _convert_currency(self, price, currency):
        """Converts the price from the given currency to the organization currency."""
        if currency == self.organization_currency:
            return float(price)
        conversion_rate = self.currency_conversion_rates.get(currency)
        if conversion_rate:
            converted_price = float(price) / float(conversion_rate)
            return converted_price * float(
                self.currency_conversion_rates.get(self.organization_currency, 1.0)
            )
        self.parts_missing_price.append(
            price
        )  # Assuming price refers to an item ID or similar for logging
        return 0.0


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom_cost(request, app, id):
    """Recursevly calculate the cost of a BOM. The cost is calculated in the currency of the organization."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    if id is None or id == -1:
        return Response(f"Invalid id: {id}", status=status.HTTP_400_BAD_REQUEST)
    if app is None:
        return Response(f"Invalid app: {app}", status=status.HTTP_400_BAD_REQUEST)

    try:
        if app != "assemblies" and app != "pcbas":
            return Response("Invalid app", status=status.HTTP_400_BAD_REQUEST)

        if app == "pcbas":
            app = "pcba"
        elif app == "assemblies":
            app = "assembly"

        # Get updated currency conversion rates
        organization = Organization.objects.get(id=1)

        calculator = BOMCostCalculator(
            organization.currency, organization.currency_conversion_rates
        )
        calculator.build_price_tree(app, id)
        calculator.flatten_bom()
        calculator.calculate_aggregated_cost_breaks()

        # go through calculator.cost_break_quantitites and calculate the cost for each quantity
        # make dict array of quantity:number and cost: number
        price_breaks = []
        for quantity in calculator.cost_break_quantitites:
            total_cost = calculator.calculate_bom_cost(quantity)
            unit_cost = total_cost / quantity
            price_breaks.append(
                {"quantity": quantity, "total_cost": total_cost, "unit_cost": unit_cost}
            )

        data = {
            "currency": organization.currency,
            "parts_missing_price": calculator.parts_missing_price,
            "price_breaks": price_breaks,
            "price_break_quantitites": calculator.cost_break_quantitites,
        }
        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(f"get_bom_cost failed: {e}", status=status.HTTP_404_NOT_FOUND)
