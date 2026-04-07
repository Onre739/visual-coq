## COQ Definition Maker (Bakalářská práce)
Tato aplikace slouží k vizuální tvorbě a manipulaci s definicemi pro Coq Proof Assistant pomocí blokového schématu. Projekt je postaven na frameworku Django a pro parsování Coq kódu využívá ANTLR4.
- Projekt lze získat z https://github.com/Onre739/visual-coq.git

### Spouštění přes Docker:
1. Kořenová složka projektu ( visual-coq ) 
2. `docker build -t coq-blocks-app .`
3. `docker run -p 8000:8000 coq-blocks-app`
4. V prohlížeči: http://localhost:8000

### Lokální spuštění (Bez Dockeru)
1. Kořenová složka projektu ( visual-coq ) 
2. Tvorba virtuální prostředí + aktivace
- `python -m venv coq_blocks_env`
- `.\coq_blocks_env\Scripts\activate` 

3. Instalace závislostí:
  - `pip install -r requirements.txt`

4. Spouštění Django serveru:
  - `cd coq_blocks`
  - `python manage.py runserver`

5. Prohlížeč: http://localhost:8000

### Testování
1. Kořenová složka projektu ( visual-coq )
2. `cd coq_blocks`
3. `python manage.py test`

### 📂 Struktura projektu
- visual-coq/
  - coq_blocks/ - Hlavní Django projekt.
    - antlr/ - Gramatika a vygenerované parsovací soubory.
    - static - Statické soubory a JS komponenty
    - templates - Hlavní HTML stránka index.html
    - web_coq_blocks/ - Django aplikace (views, urls, testy).
      - views.py - Backend endpoint
      - urls.py - Nastavení url adres
      - tests.py, test_ui.py, test_parser.py - UNIT testy
    - block_classes.py - Definice Python tříd pro reprezentaci bloků.
  - commands.txt - Užitečné příkazy
  - dockerfile - Pro spouštění pomocí Dockeru
  - requirements.txt - Výpis knihoven pro spoštění bez Dockeru
