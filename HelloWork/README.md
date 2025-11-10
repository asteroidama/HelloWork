# 🍕 Hello Work! v2.0 - PWA per Gestione Turni

App Progressive Web App (PWA) professionale per tracciare turni di lavoro, con calendario visuale, temi personalizzabili e statistiche avanzate.

## ✨ Novità v2.0

### 🎨 Design Maturo e Professionale
- Design moderno stile Material Design 3
- Interfaccia pulita e spaziosa
- Animazioni fluide e micro-interazioni
- Ottimizzato per usabilità

### 📅 Calendario Visuale
- Vista mensile con navigazione
- Visualizzazione turni direttamente sui giorni
- Click su giorno per dettagli turno completi
- Modal elegante per ogni turno

### 🌓 Sistema Temi Completo
- **Modalità Chiara/Scura** - Dark mode stile Adobe/Claude
- **10 Colori Personalizzabili** - Palette "cute" professionale:
  - Soft Blue (default)
  - Blush Pink
  - Lavender
  - Mint Green
  - Peach
  - Coral
  - Sky Blue
  - Lilac
  - Sage Green
  - Warm Gray

### 🎯 Riorganizzazione UI
- Tab 1: **Calendario** - Vista mensile dei turni
- Tab 2: **Riepilogo** - Statistiche e grafici
- Tab 3: **Aggiungi Turno** - Form inserimento veloce
- Impostazioni tramite icona ingranaggio (⚙️)

## 📱 Funzionalità

### Core
- ✅ Gestione completa turni (aggiungi, visualizza, elimina)
- 📊 Riepilogo mensile con statistiche
- 📈 Grafico ore per settimana
- 🔔 Notifiche promemoria per turni
- 💾 Backup e ripristino dati (JSON)
- 📱 Installabile come app nativa
- 🌐 Funziona offline
- 💨 Veloce e leggera

### Avanzate
- 🎨 Temi personalizzabili (chiaro/scuro + 10 colori)
- 📅 Calendario interattivo mensile
- 🔍 Modal dettaglio turno per ogni giorno
- ⚡ Animazioni fluide e transizioni
- 🎯 Design responsivo perfetto
- 💫 Micro-interazioni eleganti

## 🚀 Come Usare

### Deploy Online (CONSIGLIATO)

#### GitHub Pages
1. Crea repository su GitHub
2. Carica tutti i file mantenendo la struttura:
   ```
   HelloWork/
   ├── icons/
   ├── index.html
   ├── style.css
   ├── app.js
   ├── manifest.json
   └── service-worker.js
   ```
3. Vai su Settings → Pages
4. Attiva GitHub Pages
5. URL: `https://tuousername.github.io/HelloWork/`

#### Netlify (Alternativa)
1. Vai su [netlify.com](https://netlify.com)
2. Trascina la cartella HelloWork
3. Ottieni URL istantaneo

### Installazione come App

**Su Android (Chrome):**
1. Apri l'app nel browser
2. Menu → "Installa app"
3. L'app appare sulla home screen

**Su iOS (Safari):**
1. Apri in Safari
2. Condividi → "Aggiungi alla schermata Home"

## 🎨 Personalizzazione

### Cambiare Tema
1. Click su icona ⚙️ (ingranaggio)
2. Sezione "Aspetto"
3. Scegli Chiaro/Scuro
4. Scegli uno dei 10 colori

### Modificare Paga Oraria Default
Apri `index.html`, cerca:
```html
<input type="number" id="shift-hourly" step="0.01" value="8.00" required>
```
Cambia `value="8.00"` con il tuo valore.

## 🔧 Struttura Tecnica

### Tecnologie
- **HTML5** - Struttura semantica
- **CSS3** - Design system con variabili CSS
- **Vanilla JavaScript** - Zero dipendenze
- **PWA APIs** - Service Worker, Manifest, Notifiche
- **LocalStorage** - Persistenza dati locale

### File Principali
- `index.html` - Struttura app e markup
- `style.css` - Design system e temi
- `app.js` - Logica applicativa
- `manifest.json` - Configurazione PWA
- `service-worker.js` - Cache e offline

### Sistema Temi
```css
:root {
  --primary: #5B8FB9;
  --bg-primary: #FAFAFA;
  --text-primary: #1A1A1A;
  /* ... */
}

body.dark-mode {
  --bg-primary: #1E1E1E;
  --text-primary: #E8E8E8;
  /* ... */
}

body[data-color="pink"] {
  --primary: #FFB3BA;
  /* ... */
}
```

## 🔄 Conversione in App Android (Capacitor)

Questa PWA è progettata per essere facilmente convertita in APK con Capacitor:

### Preparazione
1. Installa Node.js
2. Installa Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   ```

### Build APK
```bash
npx cap init HelloWork com.tuonome.hellowork
npx cap add android
npx cap copy
npx cap open android
```

### Note Capacitor
- LocalStorage funziona identico
- Notifiche funzionano native
- Temi salvati persistono
- Tutto offline al 100%

## 📊 Dati Salvati

Tutti i dati sono in localStorage:

```javascript
{
  "shifts": [...],      // Array turni
  "settings": {         // Impostazioni
    "theme": "light",   // light/dark
    "color": "blue",    // Colore scelto
    "notificationsEnabled": true,
    "notificationTime": 2
  }
}
```

## 🔐 Privacy

- ✅ Tutti i dati sul TUO dispositivo
- ✅ Zero server esterni
- ✅ Zero tracciamento
- ✅ Zero analytics
- ✅ Open source completo

## 🐛 Troubleshooting

### Tema non si salva
- Verifica che localStorage sia abilitato
- Verifica permessi browser

### Notifiche non arrivano
- Controlla permessi notifiche
- Verifica HTTPS (obbligatorio)
- iOS ha supporto limitato

### Dark mode strani colori
- Aggiorna la pagina
- Cancella cache
- Verifica ultima versione

## 🎯 Roadmap Future

- [ ] Sync Google Drive automatico
- [ ] Esportazione PDF riepiloghi
- [ ] Widget ore settimanali
- [ ] Categorie turni personalizzate
- [ ] Multi-lingua (EN, ES, FR)
- [ ] Grafici avanzati con Chart.js

## 📝 Changelog

### v2.0.0 (Novembre 2025)
- 🎨 Design maturo e professionale
- 📅 Calendario visuale interattivo
- 🌓 Sistema temi chiaro/scuro
- 🎨 10 colori personalizzabili
- ⚙️ Pagina impostazioni dedicata
- 🔄 Riorganizzazione UI completa
- ✨ Animazioni fluide

### v1.0.0
- Release iniziale base

## 🆘 Supporto

Per problemi o domande, contatta lo sviluppatore.

---

**Versione**: 2.0.0  
**Data**: Novembre 2025  
**Compatibilità**: Chrome 90+, Safari 14+, Firefox 90+  
**Licenza**: Uso personale
