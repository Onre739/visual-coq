from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
import time

class FrontendUITests(StaticLiveServerTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.selenium = webdriver.Chrome()
        cls.selenium.implicitly_wait(5) 

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit() 
        super().tearDownClass()

    def open_import_modal(self):
        import_modal_button = self.selenium.find_element(By.ID, "showImportedModalBtn")
        import_modal_button.click()

    def import_definition(self, src):
        self.open_import_modal()
        text_area = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "defInput"))
        )
        text_area.clear()
        text_area.send_keys(src)

        submit_button = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "loadBtn"))
        )
        submit_button.click()

    def test_add_definition_creates_block(self):
        # 1. Arrange: Open the app
        self.selenium.get(self.live_server_url)

        # 2. Import definition
        self.import_definition("Inductive nat : Type := | O | S : nat -> nat.")

        # 5. Open accordion for imported types
        imported_types_accordion = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "importedTypesAccordionButton"))
        )
        imported_types_accordion.click() 

        # 6. Open accordion for nat type
        type_accordion = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "accordion-button-nat"))
        )
        type_accordion.click()

        # 7. Find and click spawn button for O constructor
        spawn_button = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "spawn-nat-O-btn"))
        )
        spawn_button.click()

        # 8. Wait for blocks to appear
        time.sleep(1)

        # 9. Check new block on screen
        blocks = self.selenium.find_elements(By.CLASS_NAME, "constructor-block-O")
        self.assertTrue(len(blocks) > 0, "No block for O constructor found on screen")

    def test_export_definition_with_atomic_input(self):
        self.selenium.get(self.live_server_url)

        # Create definition block
        new_def_btn = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "newDefBtn"))
        )
        new_def_btn.click()

        # Open accordion for atomic types
        atomic_types_accordion = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "atomicTypesAccordionButton"))
        )
        atomic_types_accordion.click()

        # Spawn nat atomic block
        def find_nat_spawn():
            items = self.selenium.find_elements(By.CSS_SELECTOR, "#atomicTypesList li")
            for item in items:
                if item.text.strip().startswith("nat"):
                    return item.find_element(By.CSS_SELECTOR, ".spawn-btn")
            return None

        nat_spawn_btn = WebDriverWait(self.selenium, 5).until(lambda d: find_nat_spawn())
        nat_spawn_btn.click()

        # Set atomic input value
        nat_block = WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.CLASS_NAME, "atomic-block-nat"))
        )
        nat_input = nat_block.find_element(By.TAG_NAME, "input")
        nat_input.clear()
        nat_input.send_keys("5")

        # Snap atomic block to definition block
        def_block = WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.CLASS_NAME, "definition-block-def"))
        )
        def_plug = def_block.find_element(By.CLASS_NAME, "block-plug")

        # Drag by aligning dot center to plug center
        dot_el = nat_block.find_element(By.CLASS_NAME, "block-dot")
        def_plug_rect = def_plug.rect
        dot_rect = dot_el.rect
        nat_rect = nat_block.rect

        offset_x = (def_plug_rect["x"] + def_plug_rect["width"] / 2) - (dot_rect["x"] + dot_rect["width"] / 2)
        offset_y = (def_plug_rect["y"] + def_plug_rect["height"] / 2) - (dot_rect["y"] + dot_rect["height"] / 2)

        ActionChains(self.selenium).click_and_hold(nat_block).move_by_offset(offset_x, offset_y).release().perform()

        # Wait until block is close to plug (snap)
        WebDriverWait(self.selenium, 5).until(lambda d: d.execute_script("""
            const block = arguments[0];
            const plug = arguments[1];
            const dot = block.querySelector('.block-dot');
            if (!dot) return false;
            const d = dot.getBoundingClientRect();
            const p = plug.getBoundingClientRect();
            const dx = (d.left + d.width/2) - (p.left + p.width/2);
            const dy = (d.top + d.height/2) - (p.top + p.height/2);
            return Math.hypot(dx, dy) < 40;
        """, nat_block, def_plug))

        # Export definition
        export_icon = def_block.find_element(By.CLASS_NAME, "export-icon")
        export_icon.click()

        # Switch to Exports tab
        show_exports_btn = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "label[for='showExportsBtn']"))
        )
        show_exports_btn.click()

        # Check export result contains value
        result_item = WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "#result li"))
        )
        self.assertIn("Definition", result_item.text)
        self.assertIn("5", result_item.text)

    def test_settings_parameters_modal(self):
        self.selenium.get(self.live_server_url)

        # Import polymorphic list type
        self.import_definition("Inductive list (A : Type) : Type := | nil : list A | cons : A -> list A -> list A.")

        # Open accordion for imported types
        imported_types_accordion = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "importedTypesAccordionButton"))
        )
        imported_types_accordion.click()

        # Open accordion for list type
        type_accordion = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "accordion-button-list"))
        )
        type_accordion.click()

        # Spawn cons constructor block
        spawn_button = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "spawn-list-cons-btn"))
        )
        spawn_button.click()

        cons_block = WebDriverWait(self.selenium, 5).until(
            EC.presence_of_element_located((By.CLASS_NAME, "constructor-block-cons"))
        )

        # Open settings modal
        settings_btn = cons_block.find_element(By.CLASS_NAME, "settings-block-btn")
        settings_btn.click()

        # Select first type parameter
        select_el = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "select[id^='typeParamSelect_']"))
        )
        Select(select_el).select_by_visible_text("nat")

        # Save
        save_btn = WebDriverWait(self.selenium, 5).until(
            EC.element_to_be_clickable((By.ID, "settingModalSaveBtn"))
        )
        save_btn.click()
