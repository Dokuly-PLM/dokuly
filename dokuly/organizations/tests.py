from types import SimpleNamespace

from django.test import TestCase

from organizations.odoo_service import _format_odoo_internal_description, create_or_update_odoo_product


class _MockOdooModels:
    """Records execute_kw calls; simulates existing product.product + product.template write."""

    def __init__(self):
        self.calls = []

    def execute_kw(self, database, uid, api_key, model, method, args, kwargs=None):
        self.calls.append((model, method, args))
        if model == "product.product" and method == "search":
            return [101]
        if model == "product.product" and method == "read":
            return [{"product_tmpl_id": [202, "Tmpl"]}]
        if model == "product.template" and method == "write":
            return True
        raise AssertionError(f"Unexpected execute_kw: {model}.{method}")


class CreateOrUpdateOdooProductUpdatePathTests(TestCase):
    def test_existing_product_write_includes_uom_id_when_template_data_has_it(self):
        models = _MockOdooModels()
        integration = SimpleNamespace(odoo_update_fields_existing=["name"])

        create_or_update_odoo_product(
            models,
            uid=1,
            database="db",
            api_key="key",
            product_data={
                "default_code": "PN-1",
                "name": "Part One",
                "description": "Desc",
            },
            template_data={"uom_id": 55},
            integration_settings=integration,
        )

        write_calls = [c for c in models.calls if c[0] == "product.template" and c[1] == "write"]
        self.assertEqual(len(write_calls), 1)
        _model, _method, args = write_calls[0]
        self.assertEqual(args[0], [202])
        vals = args[1]
        self.assertEqual(vals.get("uom_id"), 55)
        self.assertIn("name", vals)

    def test_existing_product_write_omits_uom_id_when_not_in_template_data(self):
        models = _MockOdooModels()
        integration = SimpleNamespace(odoo_update_fields_existing=["name"])

        create_or_update_odoo_product(
            models,
            uid=1,
            database="db",
            api_key="key",
            product_data={
                "default_code": "PN-1",
                "name": "Part One",
                "description": "Desc",
            },
            template_data={"type": "consu"},
            integration_settings=integration,
        )

        write_calls = [c for c in models.calls if c[0] == "product.template" and c[1] == "write"]
        self.assertEqual(len(write_calls), 1)
        vals = write_calls[0][2][1]
        self.assertNotIn("uom_id", vals)


class OdooInternalDescriptionFormatTests(TestCase):
    def test_both_empty_returns_empty_string(self):
        self.assertEqual(_format_odoo_internal_description("", ""), "")
        self.assertEqual(_format_odoo_internal_description(None, None), "")

    def test_both_populated(self):
        out = _format_odoo_internal_description("  Part desc  ", "  Rev A  ")
        self.assertEqual(
            out,
            "<pre>Description:\nPart desc\n\nRevision Notes:\nRev A</pre>",
        )

    def test_only_description(self):
        out = _format_odoo_internal_description("Only desc", "")
        self.assertEqual(
            out,
            "<pre>Description:\nOnly desc\n\nRevision Notes:\n</pre>",
        )

    def test_only_revision_notes(self):
        out = _format_odoo_internal_description("", "Only notes")
        self.assertEqual(
            out,
            "<pre>Description:\n\n\nRevision Notes:\nOnly notes</pre>",
        )

    def test_newlines_in_content_preserved_inside_pre(self):
        out = _format_odoo_internal_description("Line1\nLine2", "A\nB")
        self.assertEqual(
            out,
            "<pre>Description:\nLine1\nLine2\n\nRevision Notes:\nA\nB</pre>",
        )

    def test_escapes_html_in_user_text(self):
        out = _format_odoo_internal_description("<b>x</b>", "&")
        self.assertEqual(
            out,
            "<pre>Description:\n&lt;b&gt;x&lt;/b&gt;\n\nRevision Notes:\n&amp;</pre>",
        )
