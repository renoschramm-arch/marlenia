# Marlenia — Projektstand (Stand: v1.65)

## Überblick
Marlenia ist eine Intervallfasten-Tracker-App (deutschsprachig), gebaut für Reno Schramm als persönliches Projekt, benannt nach seiner Frau Marlen. Tagline: „Intervallfasten leicht gemacht".

## Architektur
- **Einzelne, eigenständige HTML-Datei** (`index.html`), keine Build-Pipeline, kein npm/Bundler.
- React 18 und Tailwind CSS werden zur Laufzeit von CDN geladen (`unpkg.com`, `cdn.tailwindcss.com`).
- Kein JSX — reines `React.createElement` (Alias `e`), da die Datei ohne Babel/Transpiler läuft.
- Icons: teils hand-gezeichnete Inline-SVGs, teils `svgBase()`-Helper — **kein** lucide-react (das war nur in einer inzwischen verworfenen `.jsx`-Artefakt-Version im Einsatz; diese wird nicht mehr gepflegt).
- Daten-Persistenz: **`localStorage`**, Key `"marlenia:state:v1"`.
- Zustand liegt komplett im `state`-Objekt der `Dashboard`-Komponente, wird bei jeder Änderung per `saveState()` synchron in `localStorage` geschrieben.

## Hosting & Deployment
- Live-Version läuft über **GitHub Pages**: Repo `renoschramm-arch/marlenia`, URL `https://renoschramm-arch.github.io/marlenia/`.
- GitHub Pages serviert die Datei **zwingend unter dem Namen `index.html`** (Branch `main`, `/ (root)`).
- Von dort zum iPhone-Home-Bildschirm hinzugefügt → läuft im Vollbild-Standalone-Modus (kein lokales HTML-Datei-Handling mehr nötig, das war ein früherer, inzwischen aufgegebener Ansatz über Dateien-App/iCloud, der nicht zuverlässig funktionierte).
- **Versionierungs-Konvention:** Jede Änderung erhöht `APP_VERSION` (Konstante im Script, wird im Info-Tab angezeigt) UND den Dateinamen (`marlenia-v1.XX.html`). Zusätzlich wird stets eine identische Kopie als `index.html` bereitgestellt, die direkt das bestehende `index.html` im Repo ersetzt (GitHub erkennt das beim Hochladen automatisch als Replace).

## Design-System
- Grundpalette „Schokobraun": Hintergrund-Verlauf `linear-gradient(135deg, #4A2C1D 0%, #2B1810 55%, #1F1209 100%)`.
- Karten: `bg-[#3A2317]/70 backdrop-blur-sm`, Rand `border-[#5C4530]`.
- Text: primär `#F3E4CC`, sekundär `#C9A47C`, gedämpft `#8F7355`.
- Akzent Gold: `#D9A860` (Buttons, Ring, aktive Zustände).
- Akzent Rosa/Brombeere: `#C9739E` (Danksagung, Gewichts-Tracker, Gefahren-Button).
- Fonts: Fraunces (Display/Serif) + Inter (Fließtext), via Google Fonts `<style>`-Import.
- Bar-Chart-Farbverläufe (jeweils zu Gold): Trinkmenge Blau `#6FB1E0`, Fastenzeit Orange `#E0703A`, Gewicht Grün `#6FA87A`.

## Tab-Struktur
1. **Fasten** — Ring-Timer, Streak-Badge, Progression-Vorschlag, Start/Stop (inkl. rückwirkend), Wasser-Tracker, Gewichts-Tracker.
2. **Verlauf** — Fastenkalender (Monats-Heatmap), Zielgewicht-Fortschrittsbalken (editierbar), Gewichtstrend-Chart (mit kg-Skala), gemeinsame Karte mit drei 7-Tage-Balkendiagrammen (Trinkmenge/Fastenzeit/Gewicht), „Verlauf verwalten" (ausklappbar, Bearbeiten/Löschen einzelner Einträge).
3. **Plan** — Wochenrotation, Protokoll-Auswahl (14:10 bis 36h), eigene Fastenzeit.
4. **Design** — Hintergrund-Auswahl: 5 Farbverläufe (Schokobraun, Mitternacht, Waldgrün, Bordeaux, Anthrazit) + Foto-Themes (siehe unten) + eigene Fotos aus der Galerie hochladbar (clientseitig auf ~640px verkleinert, als Data-URL in `state.customBackgrounds` gespeichert).
5. **Info** — Logo/Version, Home-Bildschirm-Anleitung (ausklappbar), Entwickler/Tech-Stack, Danksagung an Marlen, Spenden-Button (öffnet Modal mit PayPal-Link `paypal.me/renoschramm`), Copyright.

## Foto-Hintergründe (aktuell aktiv)
| Theme-Key | Name | Quelle | Lizenz-Status |
|---|---|---|---|
| `beach` | Strand | Pexels | ✅ frei |
| `moss` | Lagune | Pexels | ✅ frei |
| `hills` | Nebelhügel | Pexels (Munnar, Indien) | ✅ frei |
| `buddha` | Erleuchtung | Selbst per KI-Tool erstellt | ✅ eigene Rechte |
| `elephant` | Elefant | Selbst per Grok erstellt | ✅ eigene Rechte |

Alle Fotos werden als Base64-JPEG direkt im Script eingebettet (`const XYZ_BACKGROUND = "data:image/jpeg;base64,..."`), entweder als Objekt mit 4 Ausschnitten (`{fasten, verlauf, plan, info}` — bei Panorama-tauglichen Querformat-Fotos, per Sliding-Window über die Bildbreite erzeugt) oder als einzelner String (ein Ausschnitt für alle 4 Tabs — bei Hochformat-/quadratischen Fotos oder Motiven mit Inhalt nur auf einer Seite).

**Wichtiges Detail zur „Erleuchtung"-Ausrichtung:** Der Bildausschnitt wurde so kalibriert, dass der Heiligenschein im Bild optisch mit dem Fasten-Ring übereinstimmt. Die reale Ring-Position wurde empirisch aus einem Screenshot vermessen (Ring-Mittelpunkt bei ca. 40,2 % der Bildschirmhöhe, horizontal zentriert — **nicht** 33 % wie eine erste Schätzung ohne Streak-Badge ergab). Falls der Hintergrund nochmal geändert wird: Streak-Badge-Sichtbarkeit verändert die Ring-Position spürbar.

## Wichtige technische Stolperfallen (aus der bisherigen Historie)

1. **`const`-Deklarationsreihenfolge:** Alle `const XYZ_BACKGROUND`-Bildkonstanten müssen **vor** `const BACKGROUND_THEMES = {...}` stehen, da sie darin referenziert werden (temporal dead zone). Mehrfach als Bug aufgetreten, als Bilder ausgetauscht wurden.
2. **Anführungszeichen-Fallen:** Deutsche typografische Anführungszeichen (`„…"`) dürfen nicht mit geraden `"` im selben JS-String gemischt werden — das bricht den String vorzeitig ab. Immer `„…"` konsistent verwenden oder escapen.
3. **iOS-Einschränkungen im eingeschränkten HTML-Viewer** (z. B. wenn die Datei lokal statt über echtes Hosting geöffnet wird):
   - `URL.createObjectURL()` / Blob-Downloads werden blockiert → Export nutzt stattdessen ein Modal mit Copy-to-Clipboard (`navigator.clipboard.writeText`, Fallback `document.execCommand('copy')`).
   - Native `confirm()`/`alert()`-Dialoge werden ggf. stillschweigend ignoriert → alle Bestätigungen laufen über eigene React-Modals (`ConfirmModal`, `ExportModal`, `ImportModal`, `SupportModal`).
   - „Zum Home-Bildschirm hinzufügen" funktioniert nur zuverlässig, wenn die Datei als echte `https://`-Seite in Safari läuft — **nicht** bei lokaler Dateivorschau. Deshalb jetzt GitHub-Pages-Hosting.
4. **Datei ist groß** (aktuell ~1,4 MB durch eingebettete Bilder). Der Lade-Fallback-Timer (JS außerhalb der React-Root, prüft ob `#root` nach X Sekunden leer ist) steht auf 12 Sekunden, um langsames CDN-Laden auf dem Handy nicht fälschlich als Fehler zu melden.
5. **Vor jeder Auslieferung:** Datei mit `node --check` auf einer extrahierten `<script>`-Sektion validieren (strenger als `new Function()`), UND jede neue Komponente/jeden neuen State explizit per `grep` verifizieren (Funktion definiert? State deklariert? Aufruf verdrahtet? Im Render-Baum eingebunden?) — reines „Datei wurde geschrieben" ist keine Garantie, dass alle Teile auch verbunden sind.

## Offene Ideen (besprochen, noch nicht umgesetzt)
- Automatische Erinnerung zum Datenexport (kein Cloud-Sync vorhanden — bei Geräteverlust sind Daten weg).
- Ggf. weitere Monetarisierungs-Optionen über PayPal-Spenden hinaus.

