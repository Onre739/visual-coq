from django.test import TestCase

# Create your tests here.
class TestApi(TestCase):
    def test_new_definition_ok(self):
        src = "Inductive nat : Type := | O | S : nat -> nat."
        response = self.client.post("/api/newdef/", data=src, content_type="text/plain")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data[0]["name"], "nat")

    def test_new_definition_empty(self):
        response = self.client.post("/api/newdef/", data="", content_type="text/plain")
        self.assertEqual(response.status_code, 400)

    def test_new_definition_invalid_syntax(self):
        src = "Inductive spatny_zapis -> | : Type"
        response = self.client.post("/api/newdef/", data=src, content_type="text/plain")
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json()) # Check that error message is included in the response
        self.assertNotEqual(response.json().get("error"), "None")

    def test_new_definition_apostrophe_name(self):
        src = "Inductive list' : Type := | cons' : list'."
        response = self.client.post("/api/newdef/", data=src, content_type="text/plain")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data[0]["name"], "list'")

    def test_new_definition_wrong_method(self):
        # Try to access the endpoint with GET instead of POST
        response = self.client.get("/api/newdef/")
        
        self.assertEqual(response.status_code, 405) # 405 = Method Not Allowed
