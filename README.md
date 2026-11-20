# PerfumeCollectionApp

Aplikacja internetowa do zarządzania kolekcją perfum i rekomendacji zapachów (praca inżynierska). Dane perfum pochodzą z Fragrantiki i leżą we wspólnej bazie PostgreSQL (z pgvector) w Supabase. Baza jest już w pełni załadowana, więc do uruchomienia aplikacji wystarczy pobrać kod, mieć plik `.env` i zainstalować zależności.

- **Backend:** Node.js, Express 5 (`backend/`), port 8080
- **Frontend:** React, Vite, Mantine, TanStack Query (`frontend/`), port 5173
- **Baza:** PostgreSQL w Supabase (wspólna dla całego zespołu)

## 1. Wymagania

- **Git**
- **Node.js 20.19 lub nowszy, albo 22.12 lub nowszy** (wymaga tego Vite 8). Sprawdź: `node --version`.
- **VS Code** (zalecany). Do ręcznego testowania API wygodne jest rozszerzenie *REST Client* (otwiera pliki `.http` z folderu `requests/`).
- **Plik `.env`** od właściciela projektu (dostajesz go prywatnie, nie ma go w Gicie).

## 2. Uruchomienie krok po kroku

1. Pobierz repozytorium:
   ```
   git clone https://github.com/adamdobrogowski/PerfumeCollectionApp.git
   cd PerfumeCollectionApp
   ```
2. Umieść plik `.env` w **głównym folderze repozytorium** (obok `backend/` i `frontend/`, nie w środku nich). Sprawdź `git status`: plik `.env` **nie może** się tam pojawić.

   Plik zawiera zmienne (wartości bez cudzysłowów i spacji):
   ```
   DB_HOST=...
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=...
   DB_PASSWORD=...
   SESSION_SECRET=...
   ```
   `SESSION_SECRET` to losowy ciąg do podpisywania sesji. Jeśli w pliku od właściciela go nie ma, wygeneruj własny (dopisz do `.env`):
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. **Backend** (pierwszy terminal):
   ```
   cd backend
   npm install
   npm run dev
   ```
   Sprawdź w przeglądarce:
   - `http://localhost:8080/api/v1/health` powinno zwrócić `"status": "ok"`,
   - `http://localhost:8080/api/v1/health/db` powinno zwrócić nazwę bazy, wersję pgvector i liczbę perfum (potwierdza, że `.env` jest dobry).
4. **Frontend** (drugi terminal, backend musi działać):
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Otwórz adres wypisany przez Vite (zwykle `http://localhost:5173`).
5. Zarejestruj konto (hasło minimum 12 znaków) i zaloguj się. Baza jest wspólna dla całego zespołu, więc używaj adresu e-mail wyraźnie testowego (np. `imie+test@example.com`).

Gotowe. Do uruchomienia aplikacji nie trzeba niczego generować ani ładować do bazy. Foldery z danymi źródłowymi i analizami (`dane/`, `notatniki/`) nie są potrzebne do jej działania.

## 3. Struktura repozytorium

| Folder lub plik | Zawartość |
|---|---|
| `backend/src/` | serwer API: `routes/` (endpointy), `auth/` (logowanie, sesje, walidacja), `catalog/`, `shelf/`, `db.js` (połączenie z bazą), `app.js` (rejestracja routerów) |
| `frontend/src/` | aplikacja React: `pages/` (strony), `api/` (wywołania API), `auth/`, `layout/`, `catalog/`, `shelf/`, `perfume/`, `shared/` (elementy używane w wielu miejscach) |
| `baza/` | numerowane skrypty SQL opisujące strukturę bazy (patrz sekcja 5) |
| `requests/` | pliki `.http` do ręcznego testowania API |
| `scripts/` | `psql.js`: uruchamia `psql` z danymi z `.env` (dla właściciela bazy) |
| `.env` | dane dostępowe, tylko lokalnie, **nigdy w Gicie** |

Foldery `docs/`, `diagramy/` oraz plik `CLAUDE.md` są poza Gitem (dokumentacja robocza i zasady pracy). Dostajesz je od właściciela projektu.

## 4. Codzienna praca

- **Uruchamianie:** dwa terminale (backend: `npm run dev` w `backend/`, frontend: `npm run dev` w `frontend/`). Oba przeładowują się same po zapisaniu pliku. Frontend przekierowuje zapytania `/api` na `http://localhost:8080` (`frontend/vite.config.js`), więc backend musi działać na porcie 8080.
- **Testowanie backendu:** pliki w `requests/` (`auth.http`, `catalog.http`, `perfumes.http`, `perfumes_search.http`). Nowe endpointy testuj tak samo, w nowym pliku `.http`.
- **Kontrola kodu frontendu:** `npm run lint` w `frontend/`. Sprawdzenie produkcyjnego budowania: `npm run build`.
- **Nowy endpoint:** plik w `backend/src/routes/`, rejestracja w `backend/src/app.js` (stałe ścieżki przed parametrycznymi), walidacja w osobnym pliku (wzór: `shelf/shelf-state.js`). Zapytania do bazy tylko z parametrami `$1, $2...` przez `getPool()`.
- **Nowa strona frontendu:** plik w `frontend/src/pages/`, trasa w `App.jsx` (zalogowani: grupa `RequireAuth`), wywołania API w `api/`, wzór: moduł półki (`shelf/`, `api/shelf.js`, `pages/ShelfPage.jsx`).
- **Styl:** kod, nazwy i pliki po angielsku, komentarze po polsku. Backend: 4 spacje i średniki. Frontend: 2 spacje, bez średników.
- **Git:**
  - przed pracą `git pull`,
  - przed commitem `git status` i `git diff`,
  - do commita dodawaj jawne ścieżki (`git add ścieżka/do/pliku`), nigdy `git add .`,
  - opisy commitów po polsku,
  - plik `.env` nigdy nie trafia do Gita.

## 5. Baza danych

- Baza działa w Supabase (PostgreSQL z pgvector). Łączymy się przez **Session pooler** (port 5432).
- Dane połączenia są tylko w `.env`. **Nigdy** nie wklejaj hasła do kodu, wiadomości ani czatu z asystentem.
- Baza jest wspólna, więc zmiany struktury robimy wyłącznie przez nowe, numerowane pliki SQL w `baza/` (kolejny numer po ostatnim). Wykonuje je **tylko właściciel bazy** poleceniem `node scripts/psql.js -v ON_ERROR_STOP=1 -f baza/NN_nazwa.sql` (wymaga zainstalowanego `psql`). Osoby piszące kod nie zmieniają plików w `baza/` i nie edytują bazy ręcznie w panelu. Jeśli czegoś w bazie brakuje, zgłoś to właścicielowi.
- Konta i dane tworzone podczas testów trafiają do wspólnej bazy, więc nie usuwaj ani nie zmieniaj cudzych kont.

## 6. Najczęstsze problemy

| Objaw | Przyczyna i rozwiązanie |
|---|---|
| backend kończy się komunikatem `SESSION_SECRET nie jest ustawiony w pliku .env` | brak `SESSION_SECRET` w `.env` (patrz krok 2) |
| `Brakujące zmienne środowiskowe: DB_...` | `.env` leży w złym miejscu (musi być w głównym folderze repozytorium) albo brakuje zmiennej |
| `password authentication failed` | błędne hasło w `.env` |
| `Tenant or user not found` | błędny `DB_USER` (ma postać `postgres.IDENTYFIKATOR`) albo `DB_HOST` |
| `/api/v1/health` działa, a `/api/v1/health/db` zwraca błąd 503 | backend nie łączy się z bazą: sprawdź zmienne `DB_*` w `.env` |
| `npm run dev` we frontendzie: komunikat o wersji Node | potrzebny Node 20.19+ lub 22.12+ (`node --version`) |
| w przeglądarce ekran „Spróbuj ponownie” zaraz po wejściu | backend nie działa albo nie ma połączenia z bazą: sprawdź `/api/v1/health/db` |
| `EADDRINUSE` na porcie 8080 | inny proces zajmuje port (często drugi uruchomiony backend): zamknij go |
| `npm run dev` w backendzie nie działa | jesteś w złym folderze (musi być `backend/`) lub nie wykonano `npm install` |