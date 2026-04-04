from django.test import TestCase

from organizations.odoo_service import _format_odoo_internal_description


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
