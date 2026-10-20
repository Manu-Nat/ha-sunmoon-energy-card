# Sun Moon Energy

Custom Lovelace card for Home Assistant with an animated energy scene, weather/day-night effects, configurable energy flows and a graphical configuration editor.

> **Status:** initial GitHub packaging. The JavaScript source is the existing custom-card implementation renamed to `sunmoon-energy`. Before treating this as a release, test it in a non-critical Home Assistant dashboard and verify all configured entities. No integration-specific compatibility is implied by the card name.

## Requirements

- Home Assistant with the Lovelace dashboard frontend.
- No separate custom integration is required by the card itself.
- Sensors/entities for the values you want to display. The card reads entity states from Home Assistant; it does not create sensors or calculate data that the configured entities do not provide.
- Optional weather and sun information use Home Assistant entities (for example `weather.forecast_home` and `sun.sun`).

The card can be used without every optional sensor. Configure only the entities you have, and check the editor's options for the sections you want to use.

## Install manually

1. Copy `sunmoon-energy.js` to `/config/www/sunmoon-energy.js`.
2. In Home Assistant, open **Settings → Dashboards → Resources** (the exact menu label can vary by version).
3. Add a JavaScript module resource with URL `/local/sunmoon-energy.js`.
4. Refresh the browser, clearing the frontend cache if necessary.
5. Add a **Manual card** to a dashboard and use the example below, replacing entity IDs with your own.

```yaml
type: custom:sunmoon-energy
solar_power: sensor.fuori_inverter_potenza_in_ingresso
home_power: sensor.consumo_casa
grid_power: sensor.potenza_rete_inverted
```

The three sensor IDs above are example defaults from the development setup, not universal Home Assistant entities. If your entity IDs differ, replace them. Use the graphical editor to configure optional sensors, colors, labels and visual positioning.

## Install with HACS

1. Publish this repository to GitHub.
2. In HACS, open the menu and choose **Custom repositories**.
3. Add the GitHub repository URL and select category **Dashboard**.
4. Install **Sun Moon Energy**.
5. Add the resource if HACS does not add it automatically, then refresh the frontend.

HACS menu labels can vary by version. This repository does not currently include a license file; no open-source license has been selected yet.

## Entity configuration

Configure entities in the card's graphical editor. Typical categories are:

- **Power:** PV/solar power, house consumption, grid exchange.
- **Daily energy:** solar production, grid import, grid export and house energy totals, if your setup exposes them.
- **Weather and daylight:** a weather entity, `sun.sun`, and optional sunrise/sunset sensors.
- **Battery and EV:** optional power, state-of-charge and daily energy entities, if available.
- **Central equipment:** optional inverter/energy-hub entity and custom images.

Entity names vary by integration and installation. There is no mandatory brand-specific integration: use the entities your existing inverter, smart meter, battery, EV charger or weather integration provides. Check units and sign conventions for grid power in the editor before relying on import/export flow direction.

## Troubleshooting

- **Card type not found:** verify the resource URL and that the file is served from `/config/www/`; refresh the browser.
- **Blank or incorrect values:** verify each entity ID in **Developer Tools → States** and confirm the state is numeric where a numeric sensor is expected.
- **Import/export reversed:** adjust the grid inversion option to match your sensor's sign convention.
- **Missing weather/day-night effects:** select a valid weather entity and ensure `sun.sun` or the configured daylight entities exist.
- **Changes do not appear:** clear the browser cache and inspect Home Assistant's frontend console for JavaScript errors.

## Development

The custom element type is `sunmoon-energy`; the card YAML type is `custom:sunmoon-energy`. Keep the filename, custom element registration, editor registration and HACS metadata in sync when renaming.

## License

No license has been included because the author's preferred license has not yet been confirmed. Until a license is added, GitHub publication alone does not grant permission for others to reuse, modify or redistribute the code.
