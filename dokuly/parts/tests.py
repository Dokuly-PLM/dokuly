from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory
from .models import Part

class PartsTests(TestCase):
    
    def setUp(self):
        part = Part.objects.create(part_number=1)
        self.factory = RequestFactory()

    def test_fetch_part(self):
        result = Part.objects.get(part_number=1)
        self.assertEqual(result.part_number, 1)