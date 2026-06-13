# My Library — Project Brief for Claude Code

## Obiettivo
Creare una **PWA (Progressive Web App)** per Android per il tracciamento della libreria personale di libri fisici. L'app deve essere installabile sulla home screen di Android (come un'app nativa) e funzionare offline.

## Requisiti funzionali

### Catalogo libri
- Aggiunta libri tramite **ricerca online** (Google Books API) o **inserimento manuale**
- Dati salvati per ogni libro:
  - Titolo (obbligatorio)
  - Autore
  - Genere
  - Anno di pubblicazione
  - Casa editrice
  - Lingua
  - Numero di pagine
  - Copertina (URL immagine, recuperata automaticamente da Google Books)
  - Note personali
- Visualizzazione lista libri con copertina, titolo, autore, tag genere/lingua
- Ricerca per titolo o autore
- Filtri per genere e lingua
- Modifica ed eliminazione di ogni libro

### Statistiche
- Totale libri, autori unici, generi, pagine totali
- Grafico a barre: libri per genere
- Grafico a barre: libri per lingua

### PWA
- Installabile su Android dalla home screen
- Funzionamento offline (service worker + cache)
- Icona personalizzata
- Nessuna barra del browser una volta installata (display: standalone)
- Dati persistenti in localStorage

## Stack tecnico
- HTML + CSS + JavaScript vanilla (nessun framework, per semplicità e leggerezza)
  - In alternativa, Claude Code può proporre un framework leggero se lo ritiene opportuno
- Google Books API (pubblica, no API key richiesta per ricerche base)
- PWA standard: manifest.json + service-worker.js
- Hosting: GitHub Pages (gratuito, HTTPS, necessario per PWA)

## UX / Design
- **Mobile-first**, pensata per Android
- Bottom navigation bar (Library / Add / Stats)
- Bottom sheet per dettaglio e modifica libri (stile Material Design)
- Tema scuro
- Feedback visivi su tap (transizioni, stati active)
- Supporto safe area (notch, barra di navigazione Android)

## Cosa esiste già
Nella cartella del progetto sono presenti 4 file di una prima versione funzionante ma non rifinita:
- `index.html` — app monolitica (HTML + CSS + JS in un unico file)
- `manifest.json` — manifest PWA
- `service-worker.js` — service worker base
- `icon-192.png`, `icon-512.png` — icone placeholder

Questi file possono essere usati come riferimento per le funzionalità, ma si può riscrivere tutto da zero in modo più strutturato se opportuno.

## Priorità
1. Funzionare bene come PWA su Android (installazione, offline, UX mobile)
2. Aggiunta libri rapida (search online → un tap → salvato)
3. Catalogo ben leggibile
4. Statistiche per genere

## Note
- Uso personale, nessun backend necessario, tutto client-side
- I dati non devono sincronizzarsi tra dispositivi (localStorage è sufficiente)
- Nessuna autenticazione
