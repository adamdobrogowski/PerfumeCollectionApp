# PerfumeCollectionApp

Aplikacja do rekomendacji perfum. Dane perfum pochodzą z Fragrantiki. Każde perfumy mają wektor zapachowy (512 liczb), należy do jednej z 17 podrodzin i 7 rodzin zapachowych, a całość leży w bazie PostgreSQL (z pgvector) w Supabase.

Ten plik opisuje, jak uruchomić projekt **na nowym komputerze**. Najpierw sprawdź, którą ścieżkę potrzebujesz.

| Co robisz | Ścieżka |
|---|---|
| Piszesz backend lub korzystasz z gotowej bazy | **A** (kilka minut, bez notatników) |
| Chcesz odtworzyć osadzenia, klastry lub pliki do bazy | **B** (dodatkowo środowisko Pythona i notatniki) |

## 1. Co jest w repozytorium, a co trzeba mieć lub wygenerować

| Element | Skąd go wziąć |
|---|---|
| Kod backendu (`backend/`), skrypty SQL (`baza/`), notatniki (`notatniki/`) | jest w repozytorium |
| Dane źródłowe (`dane/`: `fra_cleaned_final.csv`, słownik nut itd.) | jest w repozytorium |
| `.env` (dane połączenia z bazą) | **dostajesz prywatnie od właściciela bazy** (nie ma go w Gicie) |
| `backend/node_modules/` | wygeneruj poleceniem `npm install` |
| `notatniki/wyniki_embeddingow/` (wektory perfum) | wygeneruj notatnikiem `embeddings.ipynb` (ścieżka B) |
| `notatniki/wyniki_klasteryzacji/` (klastry, progi) | wygeneruj notatnikiem `clustering.ipynb` (ścieżka B) |
| `notatniki/baza_import/` (pliki CSV do załadowania do bazy) | wygeneruj notatnikiem `export_DB.ipynb`, komórki 1-6 (ścieżka B) |
| Baza danych w Supabase | **już załadowana**, niczego nie ładujesz |

Foldery `wyniki_*`, `baza_import` i plik `.env` są celowo ignorowane przez Git (są duże albo tajne).

## 2. Wymagania

- **Git** i **VS Code** (rozszerzenia: *Python* i *Jupyter*, tylko dla ścieżki B).
- **Node.js** w wersji LTS (20 lub 22). Express 5 wymaga co najmniej 18.
- **Python 3.12** (tylko ścieżka B). Linux: `python3 --version`, Windows: `py -3.12 --version`.
- Miejsce na dysku: ścieżka A ok. 100 MB, ścieżka B dodatkowo 1-2 GB (środowisko Pythona) i ok. 200 MB na pliki wynikowe.

## 3. Ścieżka A: backend

1. Pobierz repozytorium:
   ```
   git clone https://github.com/adamdobrogowski/PerfumeCollectionApp.git
   cd PerfumeCollectionApp
   ```
2. W **głównym folderze repozytorium** (obok `backend/`, `dane/`) utwórz plik `.env` z danymi od właściciela bazy:
   ```
   DB_HOST=...
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=...
   DB_PASSWORD=...
   ```
   Wpisz wartości bez cudzysłowów i spacji. Sprawdź `git status`: plik `.env` **nie może** się tam pojawić.
3. Uruchom backend:
   ```
   cd backend
   npm install
   npm run dev
   ```
4. Otwórz w przeglądarce `http://localhost:8080/api/v1/health`. Powinna wyświetlić się odpowiedź z `"status": "ok"`.

## 4. Ścieżka B: notatniki

### 4.1 Środowisko Pythona (raz)

W głównym folderze repozytorium:

- **Windows (PowerShell):**
  ```
  py -3.12 -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```
  Jeśli PowerShell blokuje skrypt: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned`, a potem ponów aktywację.
- **Linux:**
  ```
  python3 -m venv .venv
  source .venv/bin/activate
  ```

Następnie (przy aktywnym środowisku, w nawiasie widać `(.venv)`):

```
python -m pip install --upgrade pip
pip install -r requirements.txt
```

W VS Code otwórz dowolny notatnik, kliknij **Select Kernel** (prawy górny róg), wybierz **Python Environments** i środowisko **.venv**.

### 4.2 Kolejność uruchamiania

Każdy notatnik uruchamiaj od góry do dołu (*Run All* działa), kolejno. Nie zmieniaj folderu roboczego (to `notatniki/`).

| Krok | Notatnik | Co robi | Zapisuje do | Czas |
|---|---|---|---|---|
| 1 | `embeddings.ipynb` | liczy wektory perfum | `notatniki/wyniki_embeddingow/` | kilka minut |
| 2 | `clustering.ipynb` | dzieli perfumy na rodziny i podrodziny, liczy progi | `notatniki/wyniki_klasteryzacji/` | kilka-kilkanaście minut |
| 3 | `export_DB.ipynb`, **komórki 1-6** | dzieli dane na tabele | `notatniki/baza_import/` | ok. minuty |

Kroków 1-3 nie trzeba powtarzać, jeśli nie zmieniasz osadzeń ani klastrów.

Pozostałe notatniki (nie są potrzebne do uruchomienia aplikacji):
- `data_cleaning.ipynb`, `data_extraction.ipynb`: czyszczenie danych i listy unikalnych nut/akordów. Wynik (`dane/fra_cleaned_final.csv`) jest już w repozytorium.
- `embeddings_wstep.ipynb`: badania wstępne do wyboru metody osadzeń (do czytania).
- `notes_dictionary.ipynb`: słownik nut ogólnych. Wymaga dodatkowo `pip install spacy` oraz `python -m spacy download en_core_web_sm`.

### 4.3 Czego NIE uruchamiać

W `export_DB.ipynb` komórki **8, 9 i 10** (tworzenie tabel, ładowanie danych, indeksy) zmieniają wspólną bazę w Supabase, a komórki 8 i 9 mają ustawione czyszczenie tabel (`RESET_PRZED_TWORZENIEM`, `WYCZYSC_PRZED_LADOWANIEM` = `True`). Uruchomione przez przypadek **skasowałyby dane** i załadowały je od nowa. Dane do bazy ładuje wyłącznie właściciel bazy. Komórka 7 (test połączenia) jest bezpieczna, tylko czyta.

Wyniki wygenerowane u Ciebie mogą się minimalnie różnić od tych w bazie (inne wersje bibliotek lub system), dlatego bazy nie ładujemy z dwóch komputerów.

## 5. Połączenie z bazą

- Baza działa w Supabase (PostgreSQL 17 z rozszerzeniem pgvector), łączymy się przez **Session pooler** (port 5432).
- Dane połączenia są tylko w pliku `.env`. **Nigdy** nie wklejaj hasła do kodu, notatnika ani wiadomości na czacie, a plik `.env` nie może trafić do Gita.
- Zmiany struktury bazy robimy wyłącznie przez nowe, numerowane pliki SQL w folderze `baza/` (np. `04_users.sql`), a nie ręcznie w panelu.

## 6. Najczęstsze problemy

| Objaw | Przyczyna i rozwiązanie |
|---|---|
| `KeyError: 'DB_HOST'` w notatniku | notatnik nie widzi `.env`: plik musi leżeć w głównym folderze repozytorium |
| `password authentication failed` | błędne hasło w `.env` |
| `Tenant or user not found` | błędny `DB_USER` (ma postać `postgres.IDENTYFIKATOR`) albo `DB_HOST` |
| `ModuleNotFoundError` w notatniku | wybrano zły kernel (nie `.venv`) lub nie zainstalowano `requirements.txt` |
| `brak plikow wejsciowych` w `export_DB` | najpierw uruchom `embeddings.ipynb` i `clustering.ipynb` |
| `npm run dev` nie działa | sprawdź `node --version` (potrzebne co najmniej 18) i czy jesteś w folderze `backend/` |
