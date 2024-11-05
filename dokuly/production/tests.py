from django.test import TestCase
from production.models import Production

class ProductionTestCase(TestCase):
    def setUp(self):
        Production.objects.create(serial_number="ASM1 0001")
    
    def test_get_production(self):
        serial_number = Production.objects.get(serial_number="ASM1 0001")
        self.assertEquals(serial_number.serial_number, "ASM1 0001")

