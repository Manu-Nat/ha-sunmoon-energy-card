# ☀️🌙 Sun Moon Energy

**Una card Lovelace personalizzata per Home Assistant che porta il flusso energetico della casa in una scena animata: sole, cielo, luna, traliccio, abitazione e nodo centrale, con dati di produzione, consumo e scambio con la rete.** La configurazione avviene tramite un editor grafico integrato; i sensori e le funzionalità facoltative possono essere selezionati in base agli elementi disponibili nel proprio impianto.

**Lingue della documentazione:** Italiano · English below

> **Stato del progetto:** pacchetto iniziale per GitHub. La card legge entità già presenti in Home Assistant: non installa integrazioni, non crea sensori e non sostituisce la configurazione dell'inverter, del contatore o della batteria. Prima di usarla come dashboard operativa, verifica le entità, le unità di misura e il segno dei sensori nel tuo impianto.

---

## 🇮🇹 Documentazione in italiano

### ✨ Caratteristiche

- **Scena energetica animata** con sole, cielo, luna, traliccio elettrico e casa.
- **Flussi energetici colorati** per produzione fotovoltaica, prelievo dalla rete, immissione in rete e consumo domestico.
- **Nodo centrale configurabile**: rappresentazione tipo inverter, nucleo/reattore oppure flussi diretti senza nodo.
- **Meteo e ciclo giorno/notte** tramite entità di Home Assistant, con anteprime per provare condizioni e illuminazione.
- **Supporto opzionale per batteria e auto elettrica**, se sono disponibili i relativi sensori.
- **Totali giornalieri facoltativi** per produzione, consumo, energia importata/esportata e altre misure configurate.
- **Editor visuale integrato** per scegliere le entità, modificare colori e regolare scala e posizione degli elementi senza scrivere tutto lo YAML a mano.
- **Personalizzazione grafica**: colori dei flussi, etichette, immagini personalizzate e regolazione di dimensioni/posizioni degli elementi supportati.

Le funzionalità effettivamente visibili dipendono dalle entità configurate e dai dati forniti dalle integrazioni del tuo impianto.

### 📋 Requisiti

- Home Assistant con dashboard Lovelace.
- Nessuna integrazione Python `custom_components` è richiesta dalla card.
- Entità di Home Assistant per i dati che si desidera mostrare. Possono provenire, per esempio, dall'integrazione dell'inverter, da un contatore/monitor dei consumi, da un sistema di accumulo, da un caricatore EV o da un'integrazione meteo.
- Per il ciclo giorno/notte è possibile usare `sun.sun` (se presente) oppure configurare i sensori di alba e tramonto previsti dalla card.
- Per il meteo è facoltativa un'entità di dominio `weather`.

**Non è obbligatorio avere tutti i sensori.** Lascia vuote le opzioni non utilizzate nell'editor grafico. La card non può mostrare valori che Home Assistant non riceve.

### 📦 Installazione manuale

1. Scarica `sunmoon-energy.js` da questo repository.
2. Copialo nella cartella `/config/www/` di Home Assistant.
3. Apri **Impostazioni → Dashboard → Risorse** (la dicitura può cambiare in base alla versione di Home Assistant).
4. Aggiungi una risorsa JavaScript di tipo **Modulo** con URL:

   ```text
   /local/sunmoon-energy.js
   ```

5. Salva e aggiorna la pagina. Se la vecchia versione resta in cache, esegui un aggiornamento forzato del browser.
6. Apri una dashboard, aggiungi una scheda manuale e usa `type: custom:sunmoon-energy`.

### 🧩 Installazione tramite HACS

1. Pubblica il repository su GitHub.
2. Apri **HACS** e vai al menu dei repository personalizzati.
3. Aggiungi l'URL del repository GitHub e seleziona la categoria **Dashboard**.
4. Installa **Sun Moon Energy**.
5. Se la risorsa non viene aggiunta automaticamente, registrala in **Impostazioni → Dashboard → Risorse** usando `/hacsfiles/sunmoon-energy/sunmoon-energy.js` oppure l'URL indicato dalla tua installazione HACS.
6. Aggiorna il browser e aggiungi la card alla dashboard.

> Le voci e gli URL gestiti da HACS possono variare secondo la versione. Se il file non viene caricato, controlla la risorsa effettiva mostrata in Home Assistant.

### ⚡ Entità e sensori

I nomi degli entity ID sono diversi da impianto a impianto. I seguenti sono esempi, non entità create automaticamente dalla card.

| Opzione | Cosa rappresenta | Obbligatoria? |
|---|---|---|
| `solar_power` | Potenza fotovoltaica istantanea | Consigliata per il flusso solare |
| `home_power` | Potenza istantanea assorbita dalla casa | Consigliata per il consumo domestico |
| `grid_power` | Potenza di scambio con la rete | Consigliata per distinguere prelievo e immissione |
| `solar_forecast_remaining` | Entità configurata per il valore di produzione residua/previsione previsto dalla card | Facoltativa |
| `solar_total_today` | Energia solare prodotta oggi | Facoltativa |
| `grid_import_today` | Energia prelevata dalla rete oggi | Facoltativa |
| `grid_export_today` | Energia immessa in rete oggi | Facoltativa |
| `home_total_today` | Energia consumata oggi | Facoltativa |
| `weather_entity` | Entità meteo di dominio `weather` | Facoltativa |
| `sun_entity` | Entità sole, normalmente `sun.sun` | Facoltativa se si usano sensori alternativi |
| `sun_rising`, `sun_setting` | Sensori di alba e tramonto | Facoltativi |
| `battery_power`, `battery_soc` | Potenza e stato di carica della batteria | Facoltativi |
| `battery_charge_today`, `battery_discharge_today` | Energia di carica/scarica giornaliera | Facoltativi |
| `car_power`, `car_soc`, `car_energy_today` | Potenza, stato di carica e/o energia dell'auto | Facoltativi |
| `hub_entity` | Entità di potenza associata al nodo centrale | Facoltativa |

Le unità più comuni sono **W** per la potenza e **kWh** per l'energia; controlla le unità reali dei tuoi sensori. Il significato del segno della potenza di rete varia secondo l'integrazione. Se prelievo e immissione risultano invertiti, usa l'opzione di inversione della rete nell'editor.

### 🧪 Esempio di configurazione YAML

Puoi configurare la card dall'editor visuale oppure inserire manualmente una configurazione essenziale. Sostituisci gli entity ID con quelli effettivi della tua installazione.

```yaml
type: custom:sunmoon-energy
solar_power: sensor.fuori_inverter_potenza_in_ingresso
home_power: sensor.consumo_casa
grid_power: sensor.potenza_rete_inverted
sun_entity: sun.sun
```

I tre sensori energetici dell'esempio provengono da una configurazione di sviluppo e **non sono nomi universali**. Se non esistono nel tuo Home Assistant, seleziona i sensori corretti nell'editor.

### 🎨 Editor grafico e personalizzazione

L'editor della card raggruppa le impostazioni in sezioni, tra cui:

- sensori di potenza e totali giornalieri;
- colori dei flussi energetici;
- meteo, giorno/notte e fase/velocità della luna;
- nodo centrale e relativa etichetta o immagine;
- sole, traliccio e casa;
- batteria e auto elettrica;
- immagini personalizzate e controlli di scala/posizione per gli elementi e i riquadri supportati.

I nomi e i controlli visibili possono dipendere dalla versione del file JavaScript installato.

### 🛠️ Risoluzione dei problemi

- **“Custom element doesn't exist: sunmoon-energy”**: controlla che il file sia nella cartella corretta, che la risorsa sia registrata come modulo e che l'URL sia corretto; quindi aggiorna la cache del browser.
- **Valori vuoti o non corretti**: verifica gli entity ID in **Strumenti per sviluppatori → Stati** e controlla che i sensori restituiscano valori validi.
- **Flussi di rete al contrario**: controlla il segno usato dal sensore e l'opzione di inversione della rete.
- **Meteo non visualizzato**: seleziona un'entità `weather` valida e controlla che riporti una condizione supportata.
- **Effetti giorno/notte non coerenti**: verifica `sun.sun` oppure configura sensori alternativi di alba e tramonto.
- **Modifiche non visibili**: ricarica forzatamente la pagina e controlla la console del browser per eventuali errori JavaScript.

### 🐞 Segnalazioni e contributi

Quando apri una segnalazione, indica la versione di Home Assistant, la versione di Sun Moon Energy, il metodo d'installazione e gli errori della console. Oscura token, credenziali e informazioni personali. Se possibile, includi una configurazione YAML di esempio senza dati sensibili.

### 📄 Licenza

Nel pacchetto attuale non è ancora inclusa una licenza: la scelta deve essere confermata dall'autore prima della pubblicazione definitiva. La sola presenza su GitHub non concede automaticamente il diritto di riutilizzare, modificare o ridistribuire il codice.

---

## 🇬🇧 English documentation

### Overview

**Sun Moon Energy is a custom Home Assistant Lovelace card that presents household energy data in an animated scene** featuring the sun, sky, moon, power pylon, house and a configurable central energy node. It provides configurable energy-flow colors, optional daily totals, weather/day-night effects, optional battery and EV data, and a built-in visual editor for entities and supported layout controls.

The card reads existing Home Assistant entities. It does not install integrations, create sensors or replace the configuration of your inverter, meter, battery or EV charger.

### Features

- Animated energy scene with sun, moon, sky, pylon and house.
- Configurable solar, grid-import, grid-export and home-consumption flow colors.
- Central node styles: inverter, reactor/core, or direct flows.
- Optional weather and day/night effects, with preview controls.
- Optional battery and electric-vehicle data when matching entities are available.
- Optional daily energy totals.
- Built-in visual editor for entities, colors, labels, images, element scale and positioning.

The displayed features depend on the entities available and configured in your Home Assistant instance.

### Requirements

- Home Assistant with Lovelace dashboards.
- No Python `custom_components` integration is required for the card itself.
- Existing Home Assistant entities for the values you want to display.
- A `weather` entity is optional. The default sun entity is `sun.sun`; alternative sunrise/sunset sensors can be configured.

### Manual installation

1. Copy `sunmoon-energy.js` to `/config/www/`.
2. Open **Settings → Dashboards → Resources**.
3. Add a JavaScript **Module** resource pointing to `/local/sunmoon-energy.js`.
4. Refresh the frontend, clearing the browser cache if needed.
5. Add a manual Lovelace card using `type: custom:sunmoon-energy`.

### HACS installation

1. Publish this repository on GitHub.
2. In HACS, add the repository under **Custom repositories** and select **Dashboard** as the category.
3. Install **Sun Moon Energy**.
4. If needed, add the JavaScript resource using the URL shown by your HACS installation.
5. Refresh the frontend and add the card to a dashboard.

### Minimal YAML example

```yaml
type: custom:sunmoon-energy
solar_power: sensor.fuori_inverter_potenza_in_ingresso
home_power: sensor.consumo_casa
grid_power: sensor.potenza_rete_inverted
sun_entity: sun.sun
```

Replace the example entity IDs with your own. They are not universal IDs and are not created by the card.

### Entity reference

| Option | Purpose | Required? |
|---|---|---|
| `solar_power` | Instant solar/PV power | Recommended |
| `home_power` | Instant home consumption | Recommended |
| `grid_power` | Grid exchange power | Recommended |
| `solar_total_today` | Solar energy produced today | Optional |
| `grid_import_today` | Energy imported today | Optional |
| `grid_export_today` | Energy exported today | Optional |
| `home_total_today` | Home energy consumed today | Optional |
| `weather_entity` | Weather entity | Optional |
| `sun_entity` | Sun entity, usually `sun.sun` | Optional when using alternatives |
| `sun_rising`, `sun_setting` | Sunrise/sunset sensors | Optional |
| `battery_power`, `battery_soc` | Battery power and state of charge | Optional |
| `car_power`, `car_soc`, `car_energy_today` | EV power, state of charge and energy | Optional |

Check the units and sign convention of your sensors. Power is commonly reported in W and energy in kWh, but this depends on the integration.

### Troubleshooting

- **Card type not found:** check the resource URL, module type and file location, then refresh the browser cache.
- **Missing values:** verify entity IDs and states in Developer Tools.
- **Reversed grid flow:** check the sensor's sign convention and the grid inversion setting.
- **Missing weather/day-night effects:** check the configured weather and sun entities.
- **Changes not appearing:** force-refresh the frontend and inspect the browser console.

### License

A license has not yet been included. The author should choose and add a license before the repository is considered ready for public reuse or redistribution.
