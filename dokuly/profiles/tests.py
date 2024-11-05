from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory
from .models import Profile

class PartsTests(TestCase):
    
    def setUp(self):
        profile = Profile.objects.create(first_name="test")
        self.factory = RequestFactory()

    def test_fetch_part(self):
        result = Profile.objects.get(first_name="test")
        self.assertEqual(result.first_name, "test")