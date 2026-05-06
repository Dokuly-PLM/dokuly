from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone

from organizations.odoo_service import (
    _format_odoo_internal_description,
    create_or_update_odoo_product,
    get_open_issue_lines_for_odoo_item,
)
from parts.models import Part
from projects.issuesModel import Issues


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

    def test_issues_only_non_empty(self):
        out = _format_odoo_internal_description("", "", ["- [High] Fix leak"])
        self.assertEqual(
            out,
            "<pre>Description:\n\n\nRevision Notes:\n\n\nOpen Issues:\n- [High] Fix leak</pre>",
        )

    def test_desc_notes_and_issues(self):
        out = _format_odoo_internal_description("D", "R", ["- [Low] A"])
        self.assertEqual(
            out,
            "<pre>Description:\nD\n\nRevision Notes:\nR\n\nOpen Issues:\n- [Low] A</pre>",
        )

    def test_empty_issue_list_omits_open_issues_section(self):
        out = _format_odoo_internal_description("D", "R", [])
        self.assertEqual(
            out,
            "<pre>Description:\nD\n\nRevision Notes:\nR</pre>",
        )

    def test_all_empty_including_issues_returns_empty(self):
        self.assertEqual(_format_odoo_internal_description("", "", []), "")
        self.assertEqual(_format_odoo_internal_description(None, None, None), "")


class GetOpenIssueLinesForOdooItemTests(TestCase):
    def test_orders_by_criticality_and_excludes_closed(self):
        part = Part.objects.create(part_number=9001, full_part_number="PRT-9001-A")

        low = Issues.objects.create(title="Low first alphabetically", criticality="Low")
        low.parts.add(part)

        critical = Issues.objects.create(title="Z critical", criticality="Critical")
        critical.parts.add(part)

        high = Issues.objects.create(title="Mid", criticality="High")
        high.parts.add(part)

        closed = Issues.objects.create(title="Closed", criticality="Critical")
        closed.parts.add(part)
        closed.closed_at = timezone.now()
        closed.save(update_fields=["closed_at"])

        lines = get_open_issue_lines_for_odoo_item(part, "parts")
        self.assertEqual(
            lines,
            [
                "- [Critical] Z critical",
                "- [High] Mid",
                "- [Low] Low first alphabetically",
            ],
        )

    def test_no_title_uses_placeholder_and_blank_criticality(self):
        part = Part.objects.create(part_number=9002, full_part_number="PRT-9002-A")
        i1 = Issues.objects.create(title="", criticality="")
        i1.parts.add(part)
        i2 = Issues.objects.create(title="  ", criticality="High")
        i2.parts.add(part)

        lines = get_open_issue_lines_for_odoo_item(part, "parts")
        self.assertEqual(lines, ["- [High] (no title)", "- (no title)"])
