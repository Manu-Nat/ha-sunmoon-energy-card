/*!
 * Sunmoon Energy  v1.0.0
 * Card Lovelace custom per Home Assistant: sole, traliccio, casa e flussi energetici animati.
 * Configurabile interamente da editor grafico.
 */
const NEXUS_VERSION = '1.0.0';

const NEXUS_DEFAULTS = {
  solar_power: '',
  home_power: '',
  grid_power: '',
  grid_invert: false,
  solar_forecast_remaining: '',
  solar_total_today: '',
  grid_import_today: '',
  grid_export_today: '',
  home_total_today: '',
  solar_max_power: 6000,
  weather_entity: '',
  sun_entity: 'sun.sun',
  sun_rising: '',
  sun_setting: '',
  weather_intensity: 1,
  moon_phase: 'real',
  moon_speed: 1,
  battery_power: '', battery_soc: '', battery_invert: false, battery_charge_today: '', battery_discharge_today: '',
  car_power: '', car_soc: '', car_energy_today: '',
  battery_color: '#3DFFB0', car_color: '#B58CFF',
  battery_label: 'BATTERIA', car_label: 'AUTO',
  house_image: '', battery_image: '', car_image: '',
  battery_scale: 1, battery_x: 0, battery_y: 0,
  car_scale: 1, car_x: 0, car_y: 0,
  battery_box_scale: 1, battery_box_value_scale: 1, battery_box_x: 0, battery_box_y: 0,
  car_box_scale: 1, car_box_value_scale: 1, car_box_x: 0, car_box_y: 0,
  preview_weather: 'auto',
  preview_night: 'auto',
  hub_style: 'inverter',
  inverter_label: 'INVERTER',
  hub_entity: '',
  hub_image: '',
  hub_scale: 1, hub_x: 0, hub_y: 0,
  pv_color: '#FFD34E',
  import_color: '#FF304F',
  export_color: '#A6FF00',
  home_color: '#55F4FF',
  sun_scale: 1, sun_x: 0, sun_y: 0,
  pylon_scale: 1, pylon_x: 0, pylon_y: 0,
  house_scale: 1, house_x: 0, house_y: 0,
  solar_box_scale: 1, solar_box_value_scale: 1, solar_box_x: 0, solar_box_y: 0,
  grid_box_scale: 1, grid_box_value_scale: 1, grid_box_x: 0, grid_box_y: 0,
  home_box_scale: 1, home_box_value_scale: 1, home_box_x: 0, home_box_y: 0,
};

const NEXUS_COLOR_KEYS = ['pv_color', 'import_color', 'export_color', 'home_color', 'battery_color', 'car_color'];

const nxToRgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  if (!m) return [255, 255, 255];
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const nxToHex = (v) => {
  if (Array.isArray(v)) {
    return '#' + v.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
  }
  return typeof v === 'string' && v ? v : null;
};
const nxMix = (hex, t) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const [r, g, b] = nxToRgb(hex).map((c) => Math.round(c + (255 - c) * t));
  return nxToHex([r, g, b]);
};

const nxClamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const nxSmooth = (t) => { const x = nxClamp(t); return x * x * (3 - 2 * x); };
const nxLerpC = (a, b, t) => {
  const A = nxToRgb(a), B = nxToRgb(b), k = nxClamp(t);
  return nxToHex(A.map((v, i) => Math.round(v + (B[i] - v) * k)));
};
const nxRng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* palette e ingredienti per ogni condizione meteo (sky = cielo di giorno: alto / centro / orizzonte) */
const NX_WX = {
  default: { sky: ['#10223C', '#071020', '#02050D'], cloudCol: '#9db8d4', clouds: 0, stars: 0.85, glow: 0.28, dim: 1, tw: 0.55, cs: 1 },
  sunny: { sky: ['#2a82d6', '#1b62ae', '#0e386a'], cloudCol: '#ffffff', clouds: 1, stars: 1, glow: 1, dim: 1, tw: 1, cs: 1.3 },
  'clear-night': { sky: ['#2a82d6', '#1b62ae', '#0e386a'], cloudCol: '#ffffff', clouds: 0, stars: 1, glow: 1, dim: 1, tw: 1, cs: 1 },
  partlycloudy: { sky: ['#3a86cc', '#2468a6', '#12406e'], cloudCol: '#f2f7fd', clouds: 4, stars: 0.55, glow: 0.7, dim: 0.9, tw: 0.9, cs: 1 },
  cloudy: { sky: ['#5f7288', '#4a5b70', '#2c3846'], cloudCol: '#b7c2cf', clouds: 8, front: 3, stars: 0.12, glow: 0.12, dim: 0.62, tw: 0.5, cs: 1 },
  fog: { sky: ['#8a98a6', '#6d7b89', '#46525e'], cloudCol: '#cfd8e0', clouds: 2, fog: 1, stars: 0.06, glow: 0.1, dim: 0.5, tw: 0.3, cs: 1.5 },
  rainy: { sky: ['#3d4d62', '#2d3b4e', '#18212d'], cloudCol: '#7f8fa1', clouds: 7, front: 3, rain: [55, 0.95, 1.35, 16, 26], stars: 0, glow: 0.05, dim: 0.5, tw: 0.25, cs: 0.8 },
  pouring: { sky: ['#2b3748', '#202b3a', '#10161f'], cloudCol: '#667689', clouds: 9, front: 4, rain: [115, 0.55, 0.85, 20, 34], stars: 0, glow: 0.03, dim: 0.4, tw: 0.2, cs: 0.6 },
  lightning: { sky: ['#2d2b47', '#211f38', '#0f0d1c'], cloudCol: '#5d5a7c', clouds: 8, front: 3, flash: 1, stars: 0, glow: 0.03, dim: 0.4, tw: 0.2, cs: 0.7 },
  'lightning-rainy': { sky: ['#2d2b47', '#211f38', '#0f0d1c'], cloudCol: '#5d5a7c', clouds: 8, front: 3, flash: 1, rain: [75, 0.7, 1.05, 18, 30], stars: 0, glow: 0.03, dim: 0.4, tw: 0.2, cs: 0.6 },
  hail: { sky: ['#34465b', '#27374a', '#131c27'], cloudCol: '#8798ab', clouds: 7, front: 3, hail: 60, stars: 0, glow: 0.05, dim: 0.5, tw: 0.25, cs: 0.8 },
  snowy: { sky: ['#7d93ac', '#627a94', '#3d4f64'], cloudCol: '#dfe8f1', clouds: 6, front: 2, snow: 70, stars: 0, glow: 0.1, dim: 0.6, tw: 0.35, cs: 1.4 },
  'snowy-rainy': { sky: ['#6a7f98', '#516780', '#334458'], cloudCol: '#c3cfdb', clouds: 6, front: 2, snow: 40, rain: [28, 1, 1.4, 14, 22], stars: 0, glow: 0.06, dim: 0.55, tw: 0.3, cs: 1.1 },
  windy: { sky: ['#3a86cc', '#2468a6', '#12406e'], cloudCol: '#f2f7fd', clouds: 5, wind: 1, stars: 0.6, glow: 0.75, dim: 0.88, tw: 0.9, cs: 0.32 },
  'windy-variant': { sky: ['#5f7288', '#4a5b70', '#2c3846'], cloudCol: '#b7c2cf', clouds: 7, front: 2, wind: 1, stars: 0.15, glow: 0.15, dim: 0.65, tw: 0.5, cs: 0.34 },
  exceptional: { sky: ['#6b3d3d', '#4d2b2f', '#261417'], cloudCol: '#b98c8c', clouds: 6, front: 2, stars: 0.1, glow: 0.12, dim: 0.5, tw: 0.4, cs: 0.9 },
};

const NX_WX_LABELS = {
  sunny: 'Soleggiato', 'clear-night': 'Notte serena', partlycloudy: 'Parzialmente nuvoloso', cloudy: 'Nuvoloso', fog: 'Nebbia',
  rainy: 'Pioggia', pouring: 'Pioggia forte', lightning: 'Fulmini', 'lightning-rainy': 'Temporale (fulmini e pioggia)', hail: 'Grandine',
  snowy: 'Neve', 'snowy-rainy': 'Nevischio', windy: 'Vento', 'windy-variant': 'Vento e nuvole', exceptional: 'Eccezionale',
};

/* colori del cielo in funzione di meteo e "notte" (0 = giorno pieno, 1 = notte piena); al tramonto vira all'arancio */
const nxSky = (cond, night) => {
  const P = NX_WX[cond] || NX_WX.default;
  const tw = Math.sin(Math.PI * night) * P.tw;
  const n = night * 0.9;
  return {
    tw,
    top: nxLerpC(P.sky[0], '#04070f', n),
    mid: nxLerpC(nxLerpC(P.sky[1], '#050a16', n), '#8b3a58', tw * 0.3),
    bot: nxLerpC(nxLerpC(P.sky[2], '#08101f', n), '#d9582b', tw * 0.5),
  };
};

const NEXUS_STYLE = `
  :host { display: block; }
  ha-card {
    padding: 0;
    overflow: hidden;
    border-radius: 26px;
    background: #030610;
    border: 1px solid rgba(71,220,255,0.48);
    box-shadow: 0 0 35px rgba(0,177,255,0.15), inset 0 0 32px rgba(0,120,255,0.08);
  }
  .nx-stage { position: relative; width: 100%; overflow: hidden; }
  .nx-svg { position: relative; display: block; width: 100%; height: auto; }
  .nx-layer { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
  .nx-svg text, .nx-boxes text { font-family: Roboto, Arial, sans-serif; }

  .nx-sun-active .nx-sun-rays { animation: nx-sun-radiate 1.5s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .nx-sun-idle .nx-sun-rays { animation: nx-sun-radiate 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  .nx-sun-aura { transform-box: fill-box; transform-origin: center; animation: nx-sun-aura 2.2s ease-in-out infinite; }
  .nx-sun-corona { transform-box: fill-box; transform-origin: center; animation: nx-corona-spin 18s linear infinite; }
  .nx-sun-active .nx-sun-nucleus { transform-box: fill-box; transform-origin: center; animation: nx-nucleus-pulse 1.4s ease-in-out infinite; }
  .nx-sun-active .nx-sun-body { animation: nx-plasma-breathe 2.2s ease-in-out infinite; }
  .nx-plasma-shell { transform-box: fill-box; transform-origin: center; animation: nx-corona-spin 12s linear infinite reverse; }
  .nx-plasma-filaments { animation: nx-filament-flicker .75s ease-in-out infinite alternate; }
  .nx-sun-spark { animation: nx-sun-flare .9s ease-in-out infinite alternate; }

  .nx-bolt { overflow: visible; }
  .nx-bolt path { fill: none; stroke-linecap: round; stroke-linejoin: bevel; }
  .nx-bolt-halo { opacity: .55; filter: url(#nx-halo); }
  .nx-bolt-mid {
    stroke-dasharray: 17 5 3 8 2 12;
    animation: nx-electric-travel .25s linear infinite, nx-electric-flicker .2s steps(2, end) infinite;
    filter: url(#nx-glow);
  }
  .nx-bolt-white {
    stroke-dasharray: 3 12 2 7;
    animation: nx-electric-travel .16s linear infinite, nx-electric-flicker .13s steps(2, end) infinite;
    filter: url(#nx-glow);
  }
  .nx-electric-pulse {
    stroke-dasharray: 2 15 5 11 2 18;
    animation: nx-electric-travel .3s linear infinite, nx-electric-flicker .19s steps(2, end) infinite;
    filter: url(#nx-glow);
  }
  .nx-grid-import .nx-bolt-halo { opacity: .85; }
  .nx-bolt-pv { animation: nx-energy-pv .8s ease-in-out infinite alternate; }
  .nx-grid-import { animation: nx-energy-import .4s ease-in-out infinite alternate; }
  .nx-grid-export { animation: nx-energy-export .45s ease-in-out infinite alternate; }
  .nx-cable { stroke-dasharray: 8 5; animation: nx-electric-travel .55s linear infinite; }
  .nx-solar-panels { transition: opacity .5s ease; }
  .nx-panels-live { animation: nx-panels-live 1.8s ease-in-out infinite alternate; }
  .nx-panels-off { filter: grayscale(.85) brightness(.6); }
  .nx-panel-light { animation: nx-panel-light 1.8s ease-in-out infinite alternate; }
  .nx-panel-sweep { animation: nx-panel-sweep 2.6s ease-in-out infinite; }
  .nx-hub-on .nx-hub-ring { transform-box: fill-box; transform-origin: center; animation: nx-corona-spin 6s linear infinite; }
  .nx-hub-on .nx-hub-ring2 { transform-box: fill-box; transform-origin: center; animation: nx-corona-spin 4s linear infinite reverse; }
  .nx-hub-on .nx-hub-core { transform-box: fill-box; transform-origin: center; animation: nx-nucleus-pulse 1.3s ease-in-out infinite; }
  .nx-hub-on .nx-hub-aura { transform-box: fill-box; transform-origin: center; animation: nx-sun-aura 2s ease-in-out infinite; }
  .nx-panel-reflection { animation: nx-panel-shine 2s ease-in-out infinite alternate; }
  .nx-roof-energy { stroke-dasharray: 18 7 3 7; animation: nx-roof-flow .48s linear infinite; }
  .nx-roof-pulse { animation: nx-roof-pulse .7s linear infinite; filter: url(#nx-glow); }
  .nx-house-circuit { stroke-dasharray: 7 5; animation: nx-roof-flow .8s linear infinite; }

  @keyframes nx-electric-travel { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -58; } }
  @keyframes nx-electric-flicker { 0%,100% { opacity: 1; } 30% { opacity: .48; } 55% { opacity: .95; } 75% { opacity: .65; } }
  @keyframes nx-energy-import { from { filter: brightness(.85); } to { filter: brightness(1.45); } }
  @keyframes nx-energy-export { from { filter: brightness(.8); } to { filter: brightness(1.5); } }
  @keyframes nx-energy-pv { from { filter: brightness(.85); } to { filter: brightness(1.3); } }
  @keyframes nx-sun-radiate { 0%,100% { transform: scale(.92); opacity: .72; } 50% { transform: scale(1.12); opacity: 1; } }
  @keyframes nx-sun-aura { 0%,100% { transform: scale(.94); opacity: .65; } 50% { transform: scale(1.1); opacity: 1; } }
  @keyframes nx-corona-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes nx-nucleus-pulse { 0%,100% { transform: scale(.92); filter: brightness(1); } 50% { transform: scale(1.12); filter: brightness(1.4); } }
  @keyframes nx-plasma-breathe { 0%,100% { opacity: .82; } 50% { opacity: 1; } }
  @keyframes nx-filament-flicker { from { opacity: .5; } to { opacity: 1; } }
  @keyframes nx-sun-flare { 0%,100% { opacity: .45; } 50% { opacity: 1; } }
  @keyframes nx-panel-shine { from { opacity: .35; } to { opacity: 1; } }
  @keyframes nx-roof-flow { to { stroke-dashoffset: -42; } }
  @keyframes nx-roof-pulse { 0% { stroke-dashoffset: 0; opacity: .95; } 100% { stroke-dashoffset: -42; opacity: .3; } }
  @keyframes nx-panels-live { from { filter: brightness(1.1) saturate(1.1); } to { filter: brightness(1.75) saturate(1.45); } }
  @keyframes nx-panel-light { from { opacity: .45; } to { opacity: 1; } }
  @keyframes nx-panel-sweep { 0% { transform: translateX(0); opacity: 0; } 20% { opacity: .6; } 80% { opacity: .6; } 100% { transform: translateX(215px); opacity: 0; } }

  /* ---------- batteria e auto ---------- */
  .nx-seg { animation: nx-seg 1.1s ease-in-out infinite; }
  @keyframes nx-seg { 0%,100% { filter: brightness(1); opacity: .72; } 50% { filter: brightness(1.8); opacity: 1; } }
  .nx-bolt-bat { animation: nx-energy-pv .9s ease-in-out infinite alternate; }
  .nx-bolt-car { animation: nx-energy-pv .8s ease-in-out infinite alternate; }

  /* ---------- luna ---------- */
  /* luna animata */
  .nx-moon-sway { animation: nx-moon-sway 7s ease-in-out infinite; }
  @keyframes nx-moon-sway {
    0%,100% { transform: translate(calc(-3px * var(--a)), calc(2px * var(--a))) rotate(calc(-2.6deg * var(--a))); }
    50% { transform: translate(calc(3px * var(--a)), calc(-5px * var(--a))) rotate(calc(2.6deg * var(--a))); } }
  .wx-shoot { opacity: 0; animation: wx-shoot 9s linear infinite; }
  @keyframes wx-shoot { 0% { opacity: 0; transform: translate(0, 0); } 1% { opacity: 1; } 9% { opacity: 0; transform: translate(300px, 110px); } 100% { opacity: 0; transform: translate(300px, 110px); } }

  /* ---------- meteo ---------- */
  .wx-cl { animation: wx-drift 100s linear infinite; }
  @keyframes wx-drift { from { transform: translateX(-380px); } to { transform: translateX(1180px); } }
  .wx-star { animation: wx-twinkle 3.5s ease-in-out infinite; }
  @keyframes wx-twinkle { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
  .wx-drop { stroke: #b4cdea; stroke-linecap: round; animation: wx-fall 1s linear infinite; }
  @keyframes wx-fall { from { transform: translate(0, -60px); } to { transform: translate(-95px, 740px); } }
  .wx-hail { fill: #eaf4ff; animation: wx-hailfall .8s linear infinite; }
  @keyframes wx-hailfall { from { transform: translate(0, -40px); } to { transform: translate(-40px, 720px); } }
  .wx-flake { fill: #ffffff; animation: wx-snow 10s linear infinite; }
  @keyframes wx-snow {
    0% { transform: translate(0, -20px); } 25% { transform: translate(16px, 160px); } 50% { transform: translate(-12px, 330px); }
    75% { transform: translate(14px, 500px); } 100% { transform: translate(-4px, 700px); } }
  .wx-fogband { animation: wx-fogmove 20s ease-in-out infinite alternate; }
  @keyframes wx-fogmove { from { transform: translateX(-80px); } to { transform: translateX(80px); } }
  .wx-flash, .wx-bolt { opacity: 0; animation: wx-flash 8s linear infinite; }
  .wx-bolt2 { animation-duration: 13s; animation-delay: -5s; }
  @keyframes wx-flash { 0%,88% { opacity: 0; } 89% { opacity: 1; } 90% { opacity: .1; } 91% { opacity: .8; } 94% { opacity: 0; } 100% { opacity: 0; } }
  .wx-wind { stroke: #ffffff; stroke-opacity: .25; stroke-linecap: round; animation: wx-windmove 3s linear infinite; }
  @keyframes wx-windmove { from { transform: translateX(-220px); } to { transform: translateX(1120px); } }
`;

class NexusSolarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._last = {};
  }

  setConfig(config) {
    if (!config) throw new Error('Configurazione non valida');
    this._config = { ...NEXUS_DEFAULTS, ...config };
    this._last = {};
    this._wxSig = '';
    this._wxKey = '';
    this._H = 0;
    this.shadowRoot.innerHTML = `<style>${NEXUS_STYLE}</style>
<ha-card>
  <div class="nx-stage">
    <svg class="nx-layer nx-wx-back" viewBox="0 0 1000 650" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg class="nx-svg" viewBox="0 0 1000 650" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Sunmoon Energy: sole, luna, rete elettrica, flussi energetici e casa"></svg>
    <svg class="nx-layer nx-wx-front" viewBox="0 0 1000 650" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg class="nx-layer nx-boxes" viewBox="0 0 1000 650" xmlns="http://www.w3.org/2000/svg"></svg>
  </div>
</ha-card>`;
    const q = (c) => this.shadowRoot.querySelector(c);
    this._el = { back: q('.nx-wx-back'), scene: q('.nx-svg'), front: q('.nx-wx-front'), boxes: q('.nx-boxes') };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 6; }

  getGridOptions() {
    return { columns: 12, rows: 6, min_columns: 6, min_rows: 3 };
  }

  static getConfigElement() {
    return document.createElement('sunmoon-energy-editor');
  }

  static getStubConfig() {
    return {
      solar_power: 'sensor.fuori_inverter_potenza_in_ingresso',
      home_power: 'sensor.consumo_casa',
      grid_power: 'sensor.potenza_rete_inverted',
    };
  }

  /* ---------- rotazione della luna (sfera: i crateri girano con prospettiva) ---------- */
  _moonStep() {
    const els = this._el && this._el.scene ? this._el.scene.querySelectorAll('.mcr') : [];
    if (!els.length) return false;
    const sp = nxClamp(Number(this._config.moon_speed) || 1, 0.2, 4);
    const now = performance.now();
    const dt = this._mt ? Math.min(1, (now - this._mt) / 1000) : 0;
    this._mt = now;
    this._th = (this._th || 0) + (dt * sp * 2 * Math.PI) / 36;           // a velocità 1: un giro ogni 36 secondi
    const th = this._th;
    const R = 66, D = Math.PI / 180;
    els.forEach((e) => {
      const a = Number(e.dataset.lon) * D + th, lat = Number(e.dataset.lat) * D, r = Number(e.dataset.r);
      const ca = Math.cos(a), n = ca * Math.cos(lat);                    // quanto la zona guarda verso di noi
      if (n <= 0.04) { e.setAttribute('opacity', '0'); return; }
      e.setAttribute('cx', (R * Math.cos(lat) * Math.sin(a)).toFixed(1));
      e.setAttribute('cy', (R * Math.sin(lat)).toFixed(1));
      e.setAttribute('rx', Math.max(0.6, r * n).toFixed(1));
      e.setAttribute('ry', (r * Math.max(0.35, Math.cos(lat) * 0.6 + 0.4)).toFixed(1));
      e.setAttribute('opacity', (Number(e.dataset.o) * Math.min(1, n * 2.4)).toFixed(2));
    });
    return true;
  }

  _moonLoop(on) {
    if (!on) { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; } return; }
    if (this._raf) return;
    let last = 0;
    const tick = (t) => {
      this._raf = requestAnimationFrame(tick);
      if (t - last < 40) return;                                         // ~25 fps bastano
      last = t;
      if (!this._moonStep()) { cancelAnimationFrame(this._raf); this._raf = 0; }
    };
    this._raf = requestAnimationFrame(tick);
  }

  connectedCallback() { if (this._config && this._el) this._moonLoop(!!this._el.scene.querySelector('.mcr')); }
  disconnectedCallback() { this._moonLoop(false); }

  /* ---------- giorno / notte ---------- */
  _night(pvW, cond) {
    const c = this._config;
    const pn = c.preview_night;
    if (pn !== undefined && pn !== null && pn !== '' && pn !== 'auto' && Number.isFinite(Number(pn))) return nxClamp(Number(pn));
    const states = (this._hass && this._hass.states) || {};

    /* 1) elevazione del sole (sun.sun): +4° = giorno pieno, -8° = notte piena */
    const se = states[c.sun_entity || 'sun.sun'];
    const el = se && se.attributes ? Number(se.attributes.elevation) : NaN;
    if (Number.isFinite(el)) return nxSmooth((4 - el) / 12);

    /* 2) sensori sun_next_rising / sun_next_setting */
    const ts = (id) => {
      const st = id && states[id];
      if (!st || !st.state || ['unknown', 'unavailable'].includes(st.state)) return null;
      const t = Date.parse(st.state);
      return Number.isFinite(t) ? t : null;
    };
    const rise = ts(c.sun_rising), set = ts(c.sun_setting);
    if (rise !== null && set !== null) {
      const D = 864e5, now = Date.now();
      const isDay = set < rise;
      const setRef = isDay ? set : set - D;
      const riseRef = isDay ? rise - D : rise;
      const x = (now - setRef) / 60000;   // minuti dal tramonto
      const y = (now - riseRef) / 60000;  // minuti dall'alba
      const evening = nxClamp((x + 45) / 85);
      const morning = nxClamp((45 - y) / 85);
      return nxSmooth(Math.max(evening, morning));
    }

    /* 3) solo produzione */
    if (cond === 'clear-night') return 1;
    return pvW > 10 ? 0 : 1;
  }

  /* ---------- livelli meteo (dietro e davanti alla scena) ---------- */
  _wxBuild(cond, sx, sy, H = 650) {
    const P = NX_WX[cond] || NX_WX.default;
    const R = nxRng(11 + cond.length * 17 + cond.charCodeAt(0));
    const rr = (a, b) => a + (b - a) * R();
    const cloudShape = '<ellipse cx="0" cy="0" rx="78" ry="28"/><ellipse cx="-46" cy="9" rx="50" ry="24"/><ellipse cx="50" cy="8" rx="56" ry="26"/><ellipse cx="6" cy="-17" rx="46" ry="28"/><ellipse cx="-24" cy="-8" rx="36" ry="22"/>';
    const grad = (id, pfx) => `<radialGradient id="${id}"><stop id="${pfx}0" offset="0" stop-color="#fff" stop-opacity=".92"/><stop id="${pfx}1" offset=".6" stop-color="#fff" stop-opacity=".55"/><stop id="${pfx}2" offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
    const layer = (ref, n, yMin, yMax, sMin, sMax, dMin, dMax, aMin, aMax) => {
      const arr = [];
      for (let i = 0; i < n; i++) arr.push({ y: rr(yMin, yMax), s: rr(sMin, sMax), d: rr(dMin, dMax) * P.cs, a: rr(aMin, aMax), o: R() });
      arr.sort((p, q) => p.s - q.s);
      return arr.map((c) => `<g class="wx-cl" style="animation-duration:${c.d.toFixed(1)}s;animation-delay:-${(c.o * c.d).toFixed(1)}s" opacity="${c.a.toFixed(2)}"><g transform="translate(0 ${c.y.toFixed(0)}) scale(${c.s.toFixed(2)})"><use href="#${ref}"/></g></g>`).join('');
    };

    /* DIETRO: cielo, aloni, stelle, nuvole */
    const diag = cond === 'default';
    let stars = '';
    for (let i = 0; i < 64; i++) {
      stars += `<circle class="wx-star" cx="${rr(14, 986).toFixed(0)}" cy="${(Math.pow(R(), 1.4) * 400 + 10).toFixed(0)}" r="${rr(0.6, 1.9).toFixed(2)}" fill="#fff" style="animation-duration:${rr(2.5, 5.5).toFixed(1)}s;animation-delay:-${rr(0, 5).toFixed(1)}s"/>`;
    }
    const back = `<defs>
      <linearGradient id="wx-sky" x1="0" y1="0" x2="${diag ? 1 : 0}" y2="1">
        <stop id="wx-s0" offset="0" stop-color="#000"/><stop id="wx-s1" offset=".5" stop-color="#000"/><stop id="wx-s2" offset="1" stop-color="#000"/>
      </linearGradient>
      <radialGradient id="wx-sg" gradientUnits="userSpaceOnUse" cx="${sx}" cy="${sy}" r="380">
        <stop id="wx-sg0" offset="0" stop-color="#ffe3a0" stop-opacity=".95"/><stop offset=".35" stop-color="#ffb257" stop-opacity=".32"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="wx-mg" gradientUnits="userSpaceOnUse" cx="${sx}" cy="${sy}" r="300">
        <stop offset="0" stop-color="#bcd4ff" stop-opacity=".9"/><stop offset=".4" stop-color="#7f9ee0" stop-opacity=".3"/><stop offset="1" stop-color="#5a78c8" stop-opacity="0"/>
      </radialGradient>
      ${grad('wx-cgb', 'wx-cb')}
      <g id="wx-cb" fill="url(#wx-cgb)">${cloudShape}</g>
    </defs>
    <rect width="1000" height="${H}" rx="20" fill="url(#wx-sky)"/>
    <circle id="wx-glow" cx="${sx}" cy="${sy}" r="380" fill="url(#wx-sg)" opacity="0"/>
    <circle id="wx-moonglow" cx="${sx}" cy="${sy}" r="300" fill="url(#wx-mg)" opacity="0"/>
    <g id="wx-stars" opacity="0">${stars}
      <linearGradient id="wx-shg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".95"/></linearGradient>
      <g transform="translate(130 70)"><g class="wx-shoot" style="animation-duration:9s;animation-delay:-2s"><line x1="-90" y1="-33" x2="0" y2="0" stroke="url(#wx-shg)" stroke-width="2" stroke-linecap="round"/></g></g>
      <g transform="translate(560 30)"><g class="wx-shoot" style="animation-duration:14s;animation-delay:-8s"><line x1="-80" y1="-29" x2="0" y2="0" stroke="url(#wx-shg)" stroke-width="1.8" stroke-linecap="round"/></g></g>
      <g transform="translate(720 140)"><g class="wx-shoot" style="animation-duration:19s;animation-delay:-13s"><line x1="-100" y1="-37" x2="0" y2="0" stroke="url(#wx-shg)" stroke-width="2.2" stroke-linecap="round"/></g></g>
    </g>
    <g id="wx-bc">${P.clouds ? layer('wx-cb', P.clouds, 28, 330, 0.8, 1.7, 70, 150, 0.45, 0.85) : ''}</g>`;

    /* DAVANTI: nuvole basse, precipitazioni, nebbia, lampi, vento */
    let fr = '';
    if (P.front) fr += layer('wx-cf', P.front, 150, 330, 1.5, 2.3, 55, 95, 0.38, 0.55);
    if (P.rain) {
      const [n, d0, d1, l0, l1] = P.rain;
      for (let i = 0; i < n; i++) {
        const len = rr(l0, l1);
        fr += `<g transform="translate(${rr(-40, 1060).toFixed(0)} 0)"><line class="wx-drop" x1="0" y1="0" x2="${(-len * 0.119).toFixed(1)}" y2="${len.toFixed(1)}" stroke-width="${rr(0.9, 1.7).toFixed(2)}" opacity="${rr(0.3, 0.7).toFixed(2)}" style="animation-duration:${rr(d0, d1).toFixed(2)}s;animation-delay:-${rr(0, 2).toFixed(2)}s"/></g>`;
      }
    }
    if (P.hail) {
      for (let i = 0; i < P.hail; i++) {
        fr += `<g transform="translate(${rr(0, 1060).toFixed(0)} 0)"><circle class="wx-hail" cx="0" cy="0" r="${rr(1.6, 3).toFixed(1)}" opacity="${rr(0.6, 1).toFixed(2)}" style="animation-duration:${rr(0.6, 1).toFixed(2)}s;animation-delay:-${rr(0, 1).toFixed(2)}s"/></g>`;
      }
    }
    if (P.snow) {
      for (let i = 0; i < P.snow; i++) {
        fr += `<g transform="translate(${rr(0, 1000).toFixed(0)} 0)"><circle class="wx-flake" cx="0" cy="0" r="${rr(1.4, 3.4).toFixed(1)}" opacity="${rr(0.5, 0.95).toFixed(2)}" style="animation-duration:${rr(7, 14).toFixed(1)}s;animation-delay:-${rr(0, 12).toFixed(1)}s"/></g>`;
      }
    }
    if (P.fog) {
      [300, 380, 450, 530, 600].forEach((y, i) => {
        fr += `<ellipse class="wx-fogband" cx="${500 + (i % 2 ? 140 : -140)}" cy="${y}" rx="640" ry="${70 + i * 8}" fill="url(#wx-fg)" style="animation-duration:${18 + i * 5}s;animation-delay:-${i * 4}s"/>`;
      });
      fr += `<rect width="1000" height="${H}" rx="20" fill="#dfe7ee" opacity=".1"/>`;
    }
    if (P.flash) {
      fr += `<rect class="wx-flash" width="1000" height="${H}" rx="20" fill="#d8e8ff" fill-opacity=".38"/>
        <path class="wx-bolt" d="M700 60L668 168L708 178L648 300L690 310L606 470" fill="none" stroke="#fff" stroke-width="3.6" stroke-linejoin="bevel" filter="url(#wx-bg)"/>
        <path class="wx-bolt wx-bolt2" d="M300 70L328 160L292 170L340 290L304 298L360 440" fill="none" stroke="#eaf2ff" stroke-width="3" stroke-linejoin="bevel" filter="url(#wx-bg)"/>`;
    }
    if (P.wind) {
      for (let i = 0; i < 16; i++) {
        fr += `<g transform="translate(0 ${rr(40, 600).toFixed(0)})"><path class="wx-wind" d="M0 0H${rr(70, 170).toFixed(0)}" stroke-width="${rr(1.2, 2.4).toFixed(1)}" style="animation-duration:${rr(1.8, 3.8).toFixed(1)}s;animation-delay:-${rr(0, 4).toFixed(1)}s"/></g>`;
      }
    }
    const front = `<defs>
      ${grad('wx-cgf', 'wx-cf')}
      <g id="wx-cf" fill="url(#wx-cgf)">${cloudShape}</g>
      <radialGradient id="wx-fg"><stop offset="0" stop-color="#e9eff4" stop-opacity=".5"/><stop offset=".6" stop-color="#e9eff4" stop-opacity=".2"/><stop offset="1" stop-color="#e9eff4" stop-opacity="0"/></radialGradient>
      <filter id="wx-bg" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs><g id="wx-fr">${fr}</g>`;
    return { back, front };
  }

  _wxApply(cond, night, intensity) {
    const r = this.shadowRoot;
    const set = (id, a, v) => { const e = r.getElementById(id); if (e) e.setAttribute(a, v); };
    const P = NX_WX[cond] || NX_WX.default;
    const sky = nxSky(cond, night);
    set('wx-s0', 'stop-color', sky.top);
    set('wx-s1', 'stop-color', sky.mid);
    set('wx-s2', 'stop-color', sky.bot);
    const cc = nxLerpC(nxLerpC(P.cloudCol, '#18213a', night * 0.82), '#ff9a62', sky.tw * 0.35);
    const cf = nxLerpC(cc, '#0b1018', 0.2);
    [0, 1, 2].forEach((i) => { set(`wx-cb${i}`, 'stop-color', cc); set(`wx-cf${i}`, 'stop-color', cf); });
    set('wx-stars', 'opacity', (Math.pow(night, 1.3) * P.stars).toFixed(2));
    set('wx-glow', 'opacity', ((1 - night) * P.glow * 0.7).toFixed(2));
    set('wx-sg0', 'stop-color', nxLerpC('#ffe3a0', '#ff7a3d', Math.min(1, sky.tw * 1.5)));
    set('wx-moonglow', 'opacity', (night * Math.min(1, P.stars + 0.25) * 0.38).toFixed(2));
    set('wx-bc', 'opacity', intensity.toFixed(2));
    set('wx-fr', 'opacity', intensity.toFixed(2));
  }

  /* ---------- lettura stati ---------- */
  _state(id) {
    if (!id || !this._hass || !this._hass.states) return null;
    const s = this._hass.states[id];
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(s.state)) return null;
    const n = Number(s.state);
    if (!Number.isFinite(n)) return null;
    return { n, unit: String((s.attributes && s.attributes.unit_of_measurement) || '').toLowerCase() };
  }

  _power(id) {
    const s = this._state(id);
    if (!s) return null;
    if (s.unit === 'kw') return s.n * 1000;
    if (s.unit === 'mw') return s.n * 1e6;
    return s.n;
  }

  _pct(id) {
    const st = this._state(id);
    return st ? nxClamp(st.n, 0, 100) : null;
  }

  _energy(id) {
    const s = this._state(id);
    if (!s) return null;
    if (s.unit === 'wh') return s.n / 1000;
    if (s.unit === 'mwh') return s.n * 1000;
    return s.n;
  }

  /* ---------- riquadro generico ---------- */
  _box(o) {
    const vs = o.vs;
    const hasStatus = !!o.status;
    const baseH = (hasStatus ? 79 : 73) * vs;
    const rows = o.rows || [];
    const H = baseH + (rows.length ? (4 + 16 * rows.length) * vs : 0);
    const w = o.w;
    const center = o.shape === 'solar';
    const tx = center ? w / 2 : (o.shape === 'home' ? 14 : 16);
    const anchor = center ? 'middle' : 'start';

    let frame;
    if (o.shape === 'solar') {
      frame = `<path d="M0 0H${w}L${w + 12} 12V${H - 12}L${w} ${H}H0L-12 ${H - 12}V12Z" fill="#0A1427" stroke="${o.color}" stroke-opacity=".9"/>
               <path d="M0 0H${w}" stroke="${o.color}" stroke-width="2"/>`;
    } else if (o.shape === 'grid') {
      frame = `<path d="M0 0H${w}L${w + 12} 12V${H - 12}L${w} ${H}H0Z" fill="#091426" stroke="${o.color}" stroke-opacity=".85"/>
               <path d="M0 0H5V${H}H0Z" fill="${o.color}"/>`;
    } else {
      frame = `<path d="M0 0H${w}L${w + 12} 12V${H - 12}L${w} ${H}H0Z" fill="#091728" stroke="${o.color}" stroke-opacity=".85"/>
               <path d="M0 0H${w}" stroke="${o.color}" stroke-width="2"/>`;
    }

    const labelFill = o.shape === 'home' ? '#A6C6D9' : (o.shape === 'solar' ? '#B7C7DF' : '#A9BED7');
    let g = frame;
    g += `<text x="${tx}" y="${22 * vs}" text-anchor="${anchor}" fill="${labelFill}" font-size="${10 * vs}" letter-spacing="${2 * vs}">${o.title}</text>`;
    g += `<text x="${tx}" y="${(hasStatus ? 53 : 52) * vs}" text-anchor="${anchor}" fill="${o.valueColor || '#FFFFFF'}" font-size="${27 * vs}" font-weight="900">${o.value}<tspan fill="#B6C8DF" font-size="${12 * vs}"> ${o.unit}</tspan></text>`;
    if (hasStatus) {
      g += `<text x="${tx}" y="${69 * vs}" fill="${o.statusColor || o.color}" font-size="${9 * vs}" font-weight="800" letter-spacing="${vs}">${o.status}</text>`;
    }
    if (rows.length) {
      g += `<path d="M12 ${baseH - 4 * vs}H${w - 12}" stroke="#3B6382" stroke-opacity=".6" stroke-width="1"/>`;
      rows.forEach((r, i) => {
        const y = baseH + (12 + i * 16) * vs;
        g += `<text x="14" y="${y}" fill="#8FA6C2" font-size="${8.5 * vs}" letter-spacing="${vs}">${r.label}</text>`;
        g += `<text x="${w - 14}" y="${y}" text-anchor="end" fill="${r.color || '#FFFFFF'}" font-size="${11 * vs}" font-weight="800">${r.value}</text>`;
      });
    }
    return { g, H };
  }

  /* ---------- rendering ---------- */
  _render() {
    if (!this._config) return;
    const c = this._config;
    const num = (k) => {
      const v = Number(c[k]);
      return Number.isFinite(v) ? v : NEXUS_DEFAULTS[k];
    };
    const sc = (k) => Math.max(0.2, num(k));
    const col = (k) => nxToHex(c[k]) || NEXUS_DEFAULTS[k];
    const lang = (this._hass && this._hass.locale && this._hass.locale.language) || 'it-IT';

    const pvColor = col('pv_color');
    const importColor = col('import_color');
    const exportColor = col('export_color');
    const homeColor = col('home_color');

    /* valori */
    const solar = this._power(c.solar_power);
    const home = this._power(c.home_power);
    let grid = this._power(c.grid_power);
    if (grid !== null && c.grid_invert) grid = -grid;

    /* batteria di accumulo e auto elettrica (opzionali) */
    let batt = this._power(c.battery_power);
    if (batt !== null && c.battery_invert) batt = -batt;               // positivo = in carica
    const hasBatt = !!(c.battery_power || c.battery_soc);
    const hasCar = !!(c.car_power || c.car_soc);
    const soc = this._pct(c.battery_soc);
    const battW = batt ?? 0;
    const charging = batt !== null && battW > 25, discharging = batt !== null && battW < -25;
    const bc = charging ? battW : 0, bd = discharging ? -battW : 0;
    const carRaw = this._power(c.car_power);
    const carW = Math.max(0, carRaw ?? 0);
    const carCharging = carW > 25;
    const carSoc = this._pct(c.car_soc);
    const battColor = col('battery_color'), carColor = col('car_color');
    const H = 650;                                   // sempre un pannello singolo
    const X = hasBatt || hasCar;                     // con batteria/auto la scena si compatta

    const pvW = Math.max(0, solar ?? 0);
    const homeW = Math.max(0, home ?? 0);
    const gridW = grid ?? 0;
    const pv = pvW > 10;
    const load = homeW > 10;
    const importing = grid !== null && gridW > 25;
    const exporting = grid !== null && gridW < -25;

    const fmt = (n) => (n === null ? '—' : Math.round(n).toLocaleString(lang));
    const fmtE = (n) => (n === null ? '—' : n.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' kWh');

    const idleColor = '#55EAFF';
    const gridColor = importing ? importColor : exporting ? exportColor : idleColor;
    const gridLabel = grid === null ? 'RETE NON DISPONIBILE'
      : importing ? 'PRELIEVO DALLA RETE'
      : exporting ? 'IMMISSIONE IN RETE' : 'BILANCIO STABILE';
    const solarColor = pv ? pvColor : '#8495AD';
    const houseColor = load ? homeColor : '#8193AC';

    const maxP = Math.max(1, num('solar_max_power'));
    const solarLevel = Math.round(Math.min(1, pvW / maxP) * 50) / 50;
    const panelOpacity = 0.24 + solarLevel * 0.76;

    /* chi alimenta la casa: il nodo e' un "bus", ogni utilizzatore preleva dalle fonti nella stessa proporzione */
    const srcPv = pv ? pvW : 0, srcBat = bd, srcImp = importing ? gridW : 0;
    const supply = srcPv + srcBat + srcImp;
    const frRaw = supply > 10 ? [srcPv / supply, srcBat / supply, srcImp / supply] : [0, 0, 0];
    const fr = frRaw.map((f) => Math.round(f * 50) / 50);
    const mixSrc = [['pv', pvColor, fr[0]], ['bat', battColor, fr[1]], ['imp', importColor, fr[2]]].filter((x) => x[2] >= 0.04);
    const mixTot = mixSrc.reduce((a, x) => a + x[2], 0) || 1;
    let mixStops = '';
    {
      let acc = 0;
      mixSrc.forEach((x) => {
        const a0 = (acc / mixTot) * 100;
        acc += x[2];
        const b0 = (acc / mixTot) * 100;
        mixStops += `<stop offset="${a0.toFixed(1)}%" stop-color="${x[1]}"/><stop offset="${b0.toFixed(1)}%" stop-color="${x[1]}"/>`;
      });
    }
    const roofMulti = mixSrc.length > 1;
    const roofColor = roofMulti ? 'url(#nx-roof-mix)' : mixSrc.length ? mixSrc[0][1] : '#294052';
    const roofGlow = pv || importing || exporting || bd > 0 ? 1 : 0.2;

    /* geometrie con scala e offset */
    const ss = sc('sun_scale'), sx = 500 + num('sun_x'), sy = 245 + num('sun_y');
    const ts = sc('pylon_scale') * (X ? 0.88 : 1), px = (X ? 150 : 180) + num('pylon_x'), py = (X ? 488 : 524) + num('pylon_y');
    const hs = sc('house_scale') * (X ? 0.88 : 1), hx = (X ? 878 : 871) + num('house_x'), hy = (X ? 470 : 494) + num('house_y');
    const gp = (lx, ly) => [px + (lx - 106) * ts, py + (ly - 289) * ts];
    const gh = (lx, ly) => [hx + (lx - 107) * hs, hy + (ly - 229) * hs];
    const bsc = sc('battery_scale') * 0.95, bx = 642 + num('battery_x'), by = 582 + num('battery_y');
    const csc = sc('car_scale') * 0.9, carX = 392 + num('car_x'), carY = 590 + num('car_y');
    const gb = (lx, ly) => [bx + lx * bsc, by + ly * bsc];
    const gcar = (lx, ly) => [carX + lx * csc, carY + ly * csc];
    const imgUrl = (k) => String(c[k] || '').trim().replace(/["<>]/g, '');
    const battImg = imgUrl('battery_image'), carImg = imgUrl('car_image'), houseImg = imgUrl('house_image');

    const bolt = (a, b, amp) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const n = Math.max(6, Math.round(len / 26));
      const nx = -dy / len, ny = dx / len;
      let d = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const o = i === n ? 0 : (i % 2 ? amp : -amp);
        d += ` L${(a[0] + dx * t + nx * o).toFixed(1)} ${(a[1] + dy * t + ny * o).toFixed(1)}`;
      }
      return d;
    };

    const hubS = Math.max(0.2, num('hub_scale'));
    const hubStyle = ['inverter', 'reactor', 'direct'].includes(c.hub_style) ? c.hub_style : 'inverter';
    const hubX = 500 + num('hub_x'), hubY = (X ? 445 : 455) + num('hub_y');
    const hubP = (lx, ly) => [hubX + lx * hubS, hubY + ly * hubS];
    const hubImg = hubStyle === 'inverter' ? String(c.hub_image || '').trim().replace(/["<>]/g, '') : '';
    const hubPorts = hubStyle === 'reactor'
      ? { top: hubP(0, -44), left: hubP(-44, 0), right: hubP(44, 0), bl: hubP(-26, 36), br: hubP(26, 36) }
      : hubImg
        ? { top: hubP(0, -64), left: hubP(-64, 0), right: hubP(64, 0), bl: hubP(-40, 60), br: hubP(40, 60) }
        : { top: hubP(0, -48), left: hubP(-48, 0), right: hubP(60, 0), bl: hubP(-24, 44), br: hubP(24, 44) };

    const gridStart = gp(188, 150);
    const gridEnd = gh(20, 150);
    const pvEnd = gh(16, 100);

    const fromSun = (t) => {
      const dx = t[0] - sx, dy = t[1] - sy;
      const l = Math.hypot(dx, dy) || 1;
      const r = 62 * ss + 4;
      return [sx + (dx / l) * r, sy + (dy / l) * r];
    };
    const sh = (a, b, s) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l * s, ny = dx / l * s;
      return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]];
    };

    const flow = (d, color, cls, end, pulse) => `
      <g class="nx-bolt ${cls}">
        <path class="nx-bolt-halo" d="${d}" stroke="${color}" stroke-width="22"/>
        <path class="nx-bolt-mid" d="${d}" stroke="${color}" stroke-width="6"/>
        <path class="nx-bolt-white" d="${d}" stroke="${nxMix(color, 0.85)}" stroke-width="2"/>
        ${pulse ? `<path class="nx-electric-pulse" d="${d}" stroke="#FFFFFF" stroke-width="3"/>` : ''}
        <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="6" fill="#FFFFFF" filter="url(#nx-glow)"/>
      </g>`;

    /* ripartizione energia */
    const expW = exporting ? -gridW : 0;
    const pvHome = pv ? Math.max(0, pvW - expW) : 0;
    const pvOnHome = pvHome > 10;

    let flows = '';
    const battTop = battImg ? gb(0, -66) : gb(7, -57);
    const wallTop = carImg ? gcar(-40, -80) : gcar(-137, -56);
    const jBatt = hubStyle === 'direct' ? gh(30, 205) : hubPorts.br;
    const jCar = hubStyle === 'direct' ? gh(26, 200) : hubPorts.bl;
    if (hubStyle === 'direct') {
      if (pvOnHome) flows += flow(bolt(fromSun(pvEnd), pvEnd, 5), pvColor, 'nx-bolt-pv', pvEnd, false);
      if (exporting) flows += flow(bolt(fromSun(gridStart), gridStart, 9), exportColor, 'nx-grid-export', gridStart, true);
      if (importing) flows += flow(bolt(gridStart, gridEnd, 9), importColor, 'nx-grid-import', gridEnd, true);
    } else {
      if (pv) flows += flow(bolt(fromSun(hubPorts.top), hubPorts.top, 5), pvColor, 'nx-bolt-pv', hubPorts.top, false);
      if ((homeW > 10 || home === null) && mixSrc.length) {
        const n = mixSrc.length;
        mixSrc.forEach((x, i) => {
          const off = (i - (n - 1) / 2) * 12;
          const [a1, b1] = n > 1 ? sh(hubPorts.right, gridEnd, off) : [hubPorts.right, gridEnd];
          const cls = x[0] === 'pv' ? 'nx-bolt-pv' : x[0] === 'bat' ? 'nx-bolt-bat' : 'nx-grid-import';
          flows += flow(bolt(a1, b1, x[0] === 'imp' ? 7 : 5), x[1], cls, b1, x[0] === 'imp');
        });
      }
      if (importing) flows += flow(bolt(gridStart, hubPorts.left, 9), importColor, 'nx-grid-import', hubPorts.left, true);
      if (exporting) flows += flow(bolt(hubPorts.left, gridStart, 9), exportColor, 'nx-grid-export', gridStart, true);
    }
    if (hasBatt && charging) flows += flow(bolt(jBatt, battTop, 6), battColor, 'nx-bolt-bat', battTop, false);
    if (hasBatt && discharging) flows += flow(bolt(battTop, jBatt, 6), battColor, 'nx-bolt-bat', jBatt, false);
    if (hasCar && carCharging) flows += flow(bolt(jCar, wallTop, 6), carColor, 'nx-bolt-car', wallTop, false);

    /* nodo centrale */
    const hubActive = pv || importing || exporting;
    const hubColor = pv ? pvColor : importing ? importColor : exporting ? exportColor : idleColor;
    let hubMarkup = '';
    /* valore mostrato dal nodo: entità scelta, altrimenti potenza in transito (produzione + prelievo) */
    const hubVal = c.hub_entity ? this._power(c.hub_entity) : supply;
    const hubKw = hubVal === null ? '—' : (hubVal / 1000).toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const hubOn = hubVal !== null && hubVal > 10;
    const hubLevel = Math.min(1, Math.max(0, (hubVal || 0) / maxP));
    const hubLabel = String(c.inverter_label || 'INVERTER').replace(/[<>&"]/g, '');
    const pill = (y) => `<rect x="-44" y="${y}" width="88" height="22" rx="11" fill="#06111F" fill-opacity=".92" stroke="${hubColor}" stroke-opacity=".8"/>
        <text x="0" y="${y + 15}" text-anchor="middle" fill="${hubOn ? '#F2FAFF' : '#5B7186'}" font-size="12" font-weight="800">${hubKw}<tspan fill="#9DB6CC" font-size="9"> kW</tspan></text>
        <text x="0" y="${y + 34}" text-anchor="middle" fill="#7F97B0" font-size="8" font-weight="800" letter-spacing="2">${hubLabel}</text>`;

    if (hubStyle === 'inverter' && hubImg) {
      hubMarkup = `<g transform="translate(${hubX} ${hubY}) scale(${hubS})">
        <ellipse cx="0" cy="62" rx="78" ry="12" fill="${hubColor}" opacity="${hubActive ? 0.3 : 0.06}" filter="url(#nx-blur)"/>
        <image href="${hubImg}" x="-64" y="-64" width="128" height="128" preserveAspectRatio="xMidYMid meet"/>
        ${pill(70)}
      </g>`;
    } else if (hubStyle === 'inverter') {
      const bar = Math.round(hubLevel * 56);
      const dim = hubActive ? hubColor : '#4C7690';
      hubMarkup = `<g transform="translate(${hubX} ${hubY}) scale(${hubS})">
        <ellipse cx="6" cy="56" rx="82" ry="12" fill="${hubColor}" opacity="${hubActive ? 0.3 : 0.06}" filter="url(#nx-blur)"/>
        <path d="M46 -42L60 -49V34L46 42Z" fill="#0A1626" stroke="${dim}" stroke-opacity=".7"/>
        <path d="M-46 -42L-32 -49H60L46 -42Z" fill="#2C4C6C" stroke="#7FD9F0" stroke-opacity=".6"/>
        <rect x="-46" y="-42" width="92" height="84" rx="7" fill="url(#nx-inv-front)" stroke="${dim}" stroke-width="2"/>
        <rect x="-46" y="-40" width="4" height="80" rx="2" fill="${hubColor}" opacity="${hubActive ? 0.95 : 0.3}" filter="url(#nx-glow)"/>
        <text x="2" y="-27" text-anchor="middle" fill="#E8F6FF" font-size="9" font-weight="900" letter-spacing="3">${hubLabel}</text>
        <path d="M-32 -21H36" stroke="${hubColor}" stroke-opacity=".6"/>
        <rect x="-32" y="-14" width="68" height="30" rx="5" fill="#04101D" stroke="${hubColor}" stroke-opacity=".7"/>
        <text x="-6" y="8" text-anchor="middle" fill="${hubOn ? nxMix(hubColor, 0.35) : '#5B7186'}" font-size="17" font-weight="900">${hubKw}</text>
        <text x="22" y="8" fill="#9DB6CC" font-size="8" font-weight="700">kW</text>
        <rect x="-32" y="23" width="56" height="4" rx="2" fill="#12263B"/>
        <rect x="-32" y="23" width="${bar}" height="4" rx="2" fill="${hubColor}" opacity="${hubOn ? 1 : 0}" filter="url(#nx-glow)"/>
        <circle cx="31" cy="25" r="3.2" fill="${hubOn ? '#52FFA0' : '#53697C'}" filter="url(#nx-glow)"/>
        <path d="M-32 33H36 M-32 36H36 M-32 39H36" stroke="#27455F" stroke-width="1.2"/>
      </g>`;
    } else if (hubStyle === 'reactor') {
      hubMarkup = `<g transform="translate(${hubX} ${hubY}) scale(${hubS})" class="${hubActive ? 'nx-hub-on' : 'nx-hub-off'}">
        <circle r="70" fill="url(#nx-hub-aura)" opacity="${hubActive ? 1 : 0.2}" filter="url(#nx-big-glow)" class="nx-hub-aura"/>
        <circle r="38" fill="#050C18" stroke="${hubColor}" stroke-width="2.5" stroke-opacity=".9"/>
        <circle r="44" fill="none" stroke="${hubColor}" stroke-width="4" stroke-dasharray="26 10 6 10" stroke-linecap="round" opacity="${hubActive ? 0.95 : 0.3}" filter="url(#nx-glow)" class="nx-hub-ring"/>
        <circle r="30" fill="none" stroke="${nxMix(hubColor, 0.5)}" stroke-width="2.5" stroke-dasharray="4 8" opacity="${hubActive ? 0.9 : 0.25}" class="nx-hub-ring2"/>
        <circle r="22" fill="url(#nx-hub-core)" opacity="${hubActive ? 1 : 0.4}" filter="url(#nx-glow)" class="nx-hub-core"/>
        <circle r="8" fill="#FFFFFF" opacity="${hubActive ? 1 : 0.5}"/>
        ${pill(54)}
      </g>`;
    }

    /* riquadri */
    const solarRows = [];
    if (c.solar_forecast_remaining) solarRows.push({ label: 'RIMANENTE PREVISTO', value: fmtE(this._energy(c.solar_forecast_remaining)), color: nxMix(pvColor, 0.35) });
    if (c.solar_total_today) solarRows.push({ label: 'PRODOTTO OGGI', value: fmtE(this._energy(c.solar_total_today)), color: nxMix(pvColor, 0.35) });
    const gridRows = [];
    if (c.grid_import_today) gridRows.push({ label: 'PRELEVATO OGGI', value: fmtE(this._energy(c.grid_import_today)), color: nxMix(importColor, 0.25) });
    if (c.grid_export_today) gridRows.push({ label: 'IMMESSO OGGI', value: fmtE(this._energy(c.grid_export_today)), color: nxMix(exportColor, 0.1) });
    const homeRows = [];
    if (c.home_total_today) homeRows.push({ label: 'CONSUMATO OGGI', value: fmtE(this._energy(c.home_total_today)), color: nxMix(homeColor, 0.3) });

    const bSolar = this._box({ shape: 'solar', w: 248, color: pvColor, title: 'PRODUZIONE FOTOVOLTAICA', value: fmt(solar), unit: 'W', valueColor: solarColor, rows: solarRows, vs: sc('solar_box_value_scale') });
    const bGrid = this._box({ shape: 'grid', w: 225, color: gridColor, title: 'SCAMBIO RETE', value: fmt(grid === null ? null : Math.abs(grid)), unit: 'W', status: gridLabel, rows: gridRows, vs: sc('grid_box_value_scale') });
    let homeFrame = houseColor, homeStatusColor = houseColor, homeStatus = load ? 'CARICO ATTIVO' : 'CARICO RIDOTTO';
    if (mixSrc.length && (load || home === null)) {
      const NM = { pv: 'SOLARE', bat: 'BATT.', imp: 'RETE' };
      const pct = mixSrc.map((x) => Math.round((x[2] / mixTot) * 100));
      pct[pct.length - 1] += 100 - pct.reduce((a2, b2) => a2 + b2, 0);
      const top = mixSrc.reduce((a2, x) => (x[2] > a2[2] ? x : a2), mixSrc[0]);
      homeStatusColor = top[1];
      if (mixSrc.length > 1) {
        homeFrame = 'url(#nx-box-mix)';
        homeStatus = mixSrc.map((x, i) => `${NM[x[0]]} ${pct[i]}%`).join(' · ');
      } else {
        homeFrame = top[1];
        homeStatus = top[0] === 'pv' ? 'ALIMENTATA DAL SOLARE' : top[0] === 'bat' ? 'ALIMENTATA DALLA BATTERIA' : 'ALIMENTATA DALLA RETE';
      }
    }
    const bHome = this._box({ shape: 'home', w: 219, color: homeFrame, statusColor: homeStatusColor, title: 'CONSUMO CASA', value: fmt(home), unit: 'W', status: homeStatus, rows: homeRows, vs: sc('home_box_value_scale') });

    let bBatt = null, bCar = null;
    if (hasBatt) {
      const rows = [];
      if (c.battery_charge_today) rows.push({ label: 'CARICATA OGGI', value: fmtE(this._energy(c.battery_charge_today)), color: nxMix(battColor, 0.3) });
      if (c.battery_discharge_today) rows.push({ label: 'SCARICATA OGGI', value: fmtE(this._energy(c.battery_discharge_today)), color: nxMix(battColor, 0.3) });
      const bst = batt === null ? '' : charging ? `IN CARICA · ${fmt(bc)} W` : discharging ? `IN SCARICA · ${fmt(bd)} W` : 'IN ATTESA';
      bBatt = this._box({ shape: 'home', w: 219, color: charging || discharging ? battColor : '#7F97B0', title: 'BATTERIA', value: soc === null ? fmt(batt === null ? null : Math.abs(batt)) : String(Math.round(soc)), unit: soc === null ? 'W' : '%', status: bst, rows, vs: sc('battery_box_value_scale') });
    }
    if (hasCar) {
      const rows = [];
      if (c.car_soc) rows.push({ label: 'BATTERIA AUTO', value: carSoc === null ? '—' : `${Math.round(carSoc)}%`, color: nxMix(carColor, 0.3) });
      if (c.car_energy_today) rows.push({ label: 'ENERGIA OGGI', value: fmtE(this._energy(c.car_energy_today)), color: nxMix(carColor, 0.3) });
      bCar = this._box({ shape: 'grid', w: 225, color: carCharging ? carColor : '#7F97B0', title: 'RICARICA AUTO', value: c.car_power ? fmt(carRaw === null ? null : carW) : (carSoc === null ? '—' : String(Math.round(carSoc))), unit: c.car_power ? 'W' : '%', status: carCharging ? 'IN CARICA' : 'IN ATTESA', rows, vs: sc('car_box_value_scale') });
    }
    const bbs = sc('battery_box_scale') * 0.9, cbs = sc('car_box_scale') * 0.9;
    const battT = `translate(${982 + num('battery_box_x') - 231 * bbs} ${540 + num('battery_box_y')}) scale(${bbs})`;
    const carT = `translate(${24 + num('car_box_x')} ${540 + num('car_box_y')}) scale(${cbs})`;

    const sbs = sc('solar_box_scale'), gbs = sc('grid_box_scale'), hbs = sc('home_box_scale');
    const solarT = `translate(${500 + num('solar_box_x') - 124 * sbs} ${18 + num('solar_box_y')}) scale(${sbs})`;
    const gridT = `translate(${24 + num('grid_box_x')} ${118 + num('grid_box_y')}) scale(${gbs})`;
    const homeT = `translate(${982 + num('home_box_x') - 231 * hbs} ${118 + num('home_box_y')}) scale(${hbs})`;

    /* ---- meteo, giorno/notte e luna ---- */
    const wxStates = (this._hass && this._hass.states) || {};
    const pw = c.preview_weather && c.preview_weather !== 'auto' ? c.preview_weather : null;
    const wxEnt = c.weather_entity ? wxStates[c.weather_entity] : null;
    let cond = 'default';
    if (pw && NX_WX[pw]) cond = pw;
    else if (wxEnt && NX_WX[wxEnt.state]) cond = wxEnt.state;
    const wxP = NX_WX[cond];
    const night = this._night(pvW, cond);
    const cover = Math.round(night * 100) / 100;                       // quanto la luna ha coperto il sole (0..1)
    const moonLit = nxSmooth((cover - 0.85) / 0.15);                   // a copertura quasi totale la luna si accende
    const sunVis = 1 - nxSmooth((cover - 0.85) / 0.15);                // ...e il corona del sole si spegne
    const sunOp = (sunVis * wxP.dim).toFixed(2);
    let moonMarkup = '';
    if (cover > 0.01) {
      const R = 66;
      const slide = nxSmooth(cover / 0.85);
      const dx = (1 - slide) * 132, dy = -(1 - slide) * 24;            // il disco lunare scivola sul sole
      const skyNow = nxSky(cond, cover);
      const sil = nxLerpC(skyNow.mid, '#010208', 0.7);
      const PH = { new_moon: 0, waxing_crescent: 0.125, first_quarter: 0.25, waxing_gibbous: 0.375, full_moon: 0.5, waning_gibbous: 0.625, last_quarter: 0.75, waning_crescent: 0.875 };
      const mp = c.moon_phase;
      let k = 0.5;                                                     // 0 = nuova, 0.5 = piena
      if (!mp || mp === 'real') k = ((((Date.now() - 947182440000) / 2551442877) % 1) + 1) % 1;
      else if (PH[mp] !== undefined) k = PH[mp];
      const f = (1 - Math.cos(2 * Math.PI * k)) / 2;                   // frazione illuminata
      const rx = Math.abs(1 - 2 * f) * R;
      const litPath = `M0 ${-R}A${R} ${R} 0 0 1 0 ${R}A${rx.toFixed(1)} ${R} 0 0 ${f < 0.5 ? 0 : 1} 0 ${-R}Z`;
      const discPath = `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0Z`;
      const phaseShadow = `<path transform="scale(${k > 0.5 ? -1 : 1} 1)" d="${discPath}${litPath}" fill-rule="evenodd" fill="#050916" fill-opacity=".86"/>`;
      const SPH = [
        ['m', 60, -5, 24], ['m', 150, 18, 20], ['m', 235, -12, 22], ['m', 320, 10, 18],
        ['c', 10, -15, 13], ['c', 48, 8, 9], ['c', 82, -30, 11], ['c', 120, 22, 15], ['c', 160, -8, 8], ['c', 200, 35, 10],
        ['c', 236, -20, 13], ['c', 275, 5, 9], ['c', 310, -38, 7], ['c', 345, 28, 11], ['c', 25, 45, 7], ['c', 140, -48, 8],
        ['c', 255, 48, 6], ['c', 190, -4, 12],
      ];
      const craters = SPH.map(([t, lon, lat, r]) => `<ellipse class="mcr" data-lon="${lon}" data-lat="${lat}" data-r="${r}" data-o="${t === 'm' ? 0.4 : 0.52}" fill="${t === 'm' ? '#8795B6' : '#A9B4CE'}" opacity="0" rx="1" ry="1"/>`).join('');
      const sync = (period) => `animation-delay:-${((Date.now() / 1000) % period).toFixed(2)}s`;   // le animazioni restano continue ai ridisegni
      const sp = nxClamp(Number(c.moon_speed) || 1, 0.2, 4);
      const swayDur = 7 / sp;
      moonMarkup = `<g transform="translate(${sx} ${sy}) scale(${ss})" opacity="${((0.5 + 0.5 * wxP.dim) * nxClamp(cover * 8)).toFixed(2)}">
        <clipPath id="nx-moon-clip"><circle r="${R}"/></clipPath>
        <circle r="125" fill="url(#nx-moon-aura)" opacity="${(moonLit * 0.9).toFixed(2)}"/>
        <g class="nx-moon-sway" style="--a:${moonLit.toFixed(2)};animation-duration:${swayDur.toFixed(2)}s;animation-delay:-${((Date.now() / 1000) % swayDur).toFixed(2)}s">
        <g clip-path="url(#nx-moon-clip)">
          <g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">
            <circle r="${R}" fill="${sil}"/>
            <g opacity="${moonLit.toFixed(2)}">
              <circle r="${R}" fill="url(#nx-moon-face)"/>
              <g class="nx-moon-sphere">${craters}</g>
              <circle r="${R}" fill="url(#nx-moon-shade)"/>
              ${phaseShadow}
            </g>
            <circle r="${R}" fill="none" stroke="${pvColor}" stroke-opacity="${((1 - moonLit) * 0.9).toFixed(2)}" stroke-width="3" filter="url(#nx-glow)"/>
          </g>
        </g>
        </g>
      </g>`;
    }

    /* ---- batteria di accumulo ---- */
    let batteryMarkup = '';
    if (hasBatt) {
      const battLab = String(c.battery_label || 'BATTERIA').replace(/[<>&"]/g, '');
      const socTxt = soc === null ? '' : `${Math.round(soc)}%`;
      const battAct = charging || discharging;
      const socCol = soc === null ? battColor : soc < 20 ? '#FF3B55' : soc < 45 ? '#FFB020' : battColor;
      const dimB = battAct ? battColor : '#4C7690';
      if (battImg) {
        batteryMarkup = `<g transform="translate(${bx} ${by}) scale(${bsc})">
          <ellipse cx="0" cy="68" rx="70" ry="11" fill="${battColor}" opacity="${battAct ? 0.3 : 0.06}" filter="url(#nx-blur)"/>
          <image href="${battImg}" x="-64" y="-64" width="128" height="128" preserveAspectRatio="xMidYMid meet"/>
          ${socTxt ? `<rect x="-34" y="74" width="68" height="20" rx="10" fill="#06111F" fill-opacity=".92" stroke="${socCol}" stroke-opacity=".8"/><text x="0" y="88" text-anchor="middle" fill="#F2FAFF" font-size="12" font-weight="800">${socTxt}</text>` : ''}
        </g>`;
      } else {
        const lit = soc === null ? 0 : Math.max(soc > 2 ? 1 : 0, Math.round((soc / 100) * 8));
        let segs = '';
        for (let i = 0; i < 8; i++) {
          const on = i < lit;
          const y = 29.1 - 6.9 * (i + 1);
          const dl = charging ? i * 0.13 : discharging ? (7 - i) * 0.13 : 0;
          segs += `<rect class="${on && battAct ? 'nx-seg' : ''}" x="-19" y="${y.toFixed(1)}" width="38" height="5.3" rx="1.6" fill="${on ? socCol : '#12263B'}" style="animation-delay:${dl.toFixed(2)}s"/>`;
        }
        batteryMarkup = `<g transform="translate(${bx} ${by}) scale(${bsc})">
          <ellipse cx="7" cy="60" rx="66" ry="11" fill="${battColor}" opacity="${battAct ? 0.3 : 0.06}" filter="url(#nx-blur)"/>
          <path d="M36 -50L50 -57V43L36 50Z" fill="#0A1626" stroke="${dimB}" stroke-opacity=".7"/>
          <path d="M-36 -50L-22 -57H50L36 -50Z" fill="#2C4C6C" stroke="#7FD9F0" stroke-opacity=".6"/>
          <rect x="-36" y="-50" width="72" height="100" rx="7" fill="url(#nx-inv-front)" stroke="${dimB}" stroke-width="2"/>
          <rect x="-36" y="-48" width="4" height="96" rx="2" fill="${battColor}" opacity="${battAct ? 0.95 : 0.3}" filter="url(#nx-glow)"/>
          <text x="-6" y="-36" text-anchor="middle" fill="#E8F6FF" font-size="7" font-weight="900" letter-spacing="1.4">${battLab}</text>
          ${charging ? `<path d="M28 -44L24 -37H27L25.5 -32L31 -40H27.5Z" fill="${battColor}" filter="url(#nx-glow)"/>` : ''}
          <rect x="-24" y="-28" width="48" height="58" rx="4" fill="#04101D" stroke="${battColor}" stroke-opacity=".6"/>
          ${segs}
          <text x="0" y="43" text-anchor="middle" fill="${soc === null ? '#5B7186' : '#F2FAFF'}" font-size="12" font-weight="900">${socTxt || '—'}</text>
        </g>`;
      }
    }

    /* ---- auto elettrica con wallbox ---- */
    let carMarkup = '';
    if (hasCar) {
      const carLab = String(c.car_label || 'AUTO').replace(/[<>&"]/g, '');
      const edge = carCharging ? carColor : '#4ADDEC';
      const socPill = carSoc === null ? '' : `<rect x="-32" y="-70" width="64" height="19" rx="9.5" fill="#06111F" fill-opacity=".92" stroke="${carColor}" stroke-opacity=".8"/>
          <rect x="-26" y="-63" width="${(52 * carSoc / 100).toFixed(1)}" height="2.4" rx="1.2" fill="${carColor}" opacity=".9"/>
          <text x="0" y="-55.5" text-anchor="middle" fill="#F2FAFF" font-size="9.5" font-weight="800">${Math.round(carSoc)}%</text>`;
      const wheel = (wx) => `<g transform="translate(${wx} 12)">
            <circle r="17" fill="#0A1020" stroke="#3A5570" stroke-width="2"/>
            <circle r="9.5" fill="#16324A" stroke="${carCharging ? carColor : '#6FA4C4'}" stroke-width="1.6"/>
            <path d="M-9 0H9M0 -9V9M-6.4 -6.4L6.4 6.4M6.4 -6.4L-6.4 6.4" stroke="${carCharging ? carColor : '#6FA4C4'}" stroke-opacity=".7" stroke-width="1.2"/>
            <circle r="2.6" fill="#D9F6FF"/></g>`;
      if (carImg) {
        carMarkup = `<g transform="translate(${carX} ${carY}) scale(${csc})">
          <ellipse cx="0" cy="34" rx="125" ry="12" fill="${carColor}" opacity="${carCharging ? 0.32 : 0.06}" filter="url(#nx-blur)"/>
          <image href="${carImg}" x="-115" y="-78" width="230" height="112" preserveAspectRatio="xMidYMid meet"/>
          ${socPill}
        </g>`;
      } else {
        carMarkup = `<g transform="translate(${carX} ${carY}) scale(${csc})">
          <ellipse cx="-20" cy="27" rx="138" ry="10" fill="${carColor}" opacity="${carCharging ? 0.34 : 0.06}" filter="url(#nx-blur)"/>
          <rect x="-152" y="-54" width="28" height="72" rx="6" fill="url(#nx-inv-front)" stroke="${carCharging ? carColor : '#4C7690'}" stroke-width="1.8"/>
          <rect x="-147" y="-48" width="18" height="3" rx="1.5" fill="${carCharging ? carColor : '#2C4A63'}"/>
          <rect x="-147" y="-39" width="18" height="15" rx="2" fill="#04101D" stroke="#3A5A73" stroke-width=".8"/>
          <path d="M-136 -37L-141 -30H-137L-139 -25L-133 -32H-137Z" fill="${carCharging ? carColor : '#53697C'}"/>
          <circle cx="-138" cy="-12" r="3" fill="${carCharging ? '#52FFA0' : '#53697C'}"/>
          <text x="-138" y="9" text-anchor="middle" fill="#7F97B0" font-size="5.5" font-weight="800" letter-spacing=".8">${carLab}</text>
          <path d="M-124 -8C-112 18 -96 14 -86 -2" fill="none" stroke="#0A1626" stroke-width="5.5" stroke-linecap="round"/>
          <path d="M-124 -8C-112 18 -96 14 -86 -2" fill="none" stroke="${carCharging ? carColor : '#3A5A73'}" stroke-width="2" stroke-linecap="round" ${carCharging ? 'class="nx-cable"' : ''}/>
          <path d="M-92 8L-94 -4Q-93 -12 -84 -14L-62 -22Q-48 -40 -26 -41L22 -41Q42 -40 58 -22L84 -13Q96 -9 96 -1L95 8Z" fill="url(#nx-car-body)" stroke="${edge}" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="-52" cy="12" r="21" fill="#040A14"/><circle cx="52" cy="12" r="21" fill="#040A14"/>
          <path d="M-60 -22Q-48 -36 -26 -37L-6 -37V-22Z" fill="url(#nx-car-glass)" stroke="${edge}" stroke-opacity=".6" stroke-width="1"/>
          <path d="M2 -37L22 -37Q38 -36 52 -22L2 -22Z" fill="url(#nx-car-glass)" stroke="${edge}" stroke-opacity=".6" stroke-width="1"/>
          <path d="M-6 -37V6 M-92 5H95" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>
          <path d="M-16 -16H-8 M16 -16H24" stroke="${edge}" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
          <ellipse cx="91" cy="-5" rx="5" ry="2.6" fill="#FFF3B8" filter="url(#nx-glow)"/>
          <ellipse cx="-91" cy="-4" rx="3.6" ry="2.2" fill="#FF3B55"/>
          <circle cx="-86" cy="-3" r="3" fill="${carCharging ? carColor : '#2C4A63'}" ${carCharging ? 'filter="url(#nx-glow)"' : ''}/>
          ${wheel(-52)}${wheel(52)}
          ${socPill}
        </g>`;
      }
    }

    /* ---- casa: parallelepipedo isometrico con tetto a due falde. Muri, porta, finestre e pannelli
          derivano tutti dalla stessa proiezione, quindi restano sempre in proporzione ---- */
    const WZ = 108, RH = 46;                                                  // altezza dei muri e del colmo
    const pj = (a, b, z) => [22 + 84 * (a + b), 199 + 30 * a - 30 * b - z];
    const Pt = (a, b, z) => { const q = pj(a, b, z); return `${q[0].toFixed(1)} ${q[1].toFixed(1)}`; };
    const poly = (pts) => 'M' + pts.map((q) => Pt(q[0], q[1], q[2])).join('L') + 'Z';
    const SP = (sv, tv) => [-0.03 + 1.06 * sv, -0.05 + 0.55 * tv, WZ - 3 + (RH + 3) * tv];   // punto sulla falda anteriore
    const quadS = (s0, s1, t0, t1) => poly([SP(s0, t0), SP(s1, t0), SP(s1, t1), SP(s0, t1)]);
    let panels = '', panLines = '', panClip = '';
    for (let ci = 0; ci < 4; ci++) {
      for (let ri = 0; ri < 2; ri++) {
        const s0 = 0.08 + ci * 0.21 + 0.012, s1 = 0.08 + (ci + 1) * 0.21 - 0.012;
        const t0 = 0.14 + ri * 0.36 + 0.02, t1 = 0.14 + (ri + 1) * 0.36 - 0.02;
        const d = quadS(s0, s1, t0, t1);
        panels += `<path d="${d}" fill="${pv ? 'url(#nx-panel-lit)' : 'url(#nx-panel-off)'}" stroke="${pv ? nxMix(pvColor, 0.75) : '#4F7088'}" stroke-width="1.3" stroke-linejoin="round"/>`;
        panClip += `<path d="${d}"/>`;
        const sm = (s0 + s1) / 2, tm = (t0 + t1) / 2;
        panLines += `M${Pt(...SP(sm, t0))}L${Pt(...SP(sm, t1))}M${Pt(...SP(s0, tm))}L${Pt(...SP(s1, tm))}`;
      }
    }
    const lvlP = pv ? 0.55 + solarLevel * 0.45 : 0;
    const ledD = `M${Pt(-0.03, -0.06, WZ - 6)}L${Pt(1.03, -0.06, WZ - 6)}L${Pt(1.03, 1.04, WZ - 6)}`;
    const wallStroke = 'stroke="#4ADDEC" stroke-width="1.8" stroke-linejoin="round"';
    const winFill = `fill="${load ? '#4AF4FF' : '#1C3045'}" fill-opacity="${load ? 0.9 : 0.3}" stroke="${houseColor}" stroke-width="1.6"`;
    const winBars = `stroke="#D9FFFF" stroke-opacity="${load ? 0.9 : 0.22}" stroke-width="1.3" fill="none"`;
    const houseDrawn = `
        <ellipse cx="99" cy="222" rx="125" ry="20" fill="${houseColor}" opacity="${load ? 0.24 : 0.05}" filter="url(#nx-blur)"/>
        <path d="M7 211L107 245L207 211L107 181Z" fill="#06111F" stroke="#32657D" stroke-opacity=".7"/>
        <path d="${poly([[-0.03, 1.05, WZ - 3], [1.03, 1.05, WZ - 3], [1.03, 0.5, WZ + RH], [-0.03, 0.5, WZ + RH]])}" fill="#0F2B44" stroke="#4ADDEC" stroke-opacity=".5" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="${poly([[0, 0, 0], [1, 0, 0], [1, 0, WZ], [0, 0, WZ]])}" fill="url(#nx-house-front)" ${wallStroke}/>
        <path d="${poly([[1, 0, 0], [1, 1, 0], [1, 1, WZ], [1, 0, WZ]])}" fill="#15405E" ${wallStroke}/>
        <path d="${poly([[1, 0, WZ], [1, 1, WZ], [1, 0.5, WZ + RH]])}" fill="#1A4A6C" ${wallStroke}/>
        <path d="${poly([[-0.03, -0.05, WZ - 3], [1.03, -0.05, WZ - 3], [1.03, 0.5, WZ + RH], [-0.03, 0.5, WZ + RH]])}" fill="url(#nx-roof)" stroke="#B5FFFF" stroke-width="1.8" stroke-linejoin="round"/>

        ${pv ? `<g class="nx-panel-light" filter="url(#nx-blur)"><path d="${quadS(0.06, 0.94, 0.12, 0.88)}" fill="${pvColor}" opacity="${lvlP.toFixed(2)}"/></g>` : ''}
        <g class="nx-solar-panels">
          ${panels}
          <path d="${panLines}" fill="none" stroke="${pv ? '#FFFFFF' : '#6D93AF'}" stroke-opacity="${pv ? 0.55 : 0.4}" stroke-width="1"/>
          ${pv ? `<clipPath id="nx-panel-clip">${panClip}</clipPath><g clip-path="url(#nx-panel-clip)"><path class="nx-panel-sweep" d="M-30 40L-6 40L34 140L10 140Z" fill="#FFFFFF" opacity=".55"/></g>` : ''}
        </g>

        <path d="${ledD}" fill="none" stroke="${roofColor}" stroke-width="16" stroke-opacity="${roofGlow * 0.25}" stroke-linejoin="round" filter="url(#nx-blur)"/>
        <path d="${ledD}" fill="none" stroke="${roofColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#nx-glow)" class="nx-roof-energy"/>
        <path d="${ledD}" fill="none" stroke="#FFFFFF" stroke-opacity="${roofGlow * 0.8}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 18" class="nx-roof-pulse"/>

        <path d="${poly([[0.1, 0, 52], [0.4, 0, 52], [0.4, 0, 90], [0.1, 0, 90]])}" ${winFill}/>
        <path d="M${Pt(0.25, 0, 52)}L${Pt(0.25, 0, 90)}M${Pt(0.1, 0, 71)}L${Pt(0.4, 0, 71)}" ${winBars}/>
        <path d="${poly([[1, 0.14, 50], [1, 0.4, 50], [1, 0.4, 88], [1, 0.14, 88]])}" ${winFill}/>
        <path d="${poly([[1, 0.6, 50], [1, 0.86, 50], [1, 0.86, 88], [1, 0.6, 88]])}" ${winFill}/>
        <path d="M${Pt(1, 0.27, 50)}L${Pt(1, 0.27, 88)}M${Pt(1, 0.14, 69)}L${Pt(1, 0.4, 69)}M${Pt(1, 0.73, 50)}L${Pt(1, 0.73, 88)}M${Pt(1, 0.6, 69)}L${Pt(1, 0.86, 69)}" ${winBars}/>
        <circle cx="${pj(1, 0.5, WZ + 18)[0].toFixed(1)}" cy="${pj(1, 0.5, WZ + 18)[1].toFixed(1)}" r="5" fill="${load ? '#4AF4FF' : '#1C3045'}" fill-opacity="${load ? 0.85 : 0.3}" stroke="${houseColor}" stroke-width="1.4"/>

        <path d="${poly([[0.58, 0, 0], [0.82, 0, 0], [0.82, 0, 66], [0.58, 0, 66]])}" fill="#FFCA69" fill-opacity="${load ? 0.85 : 0.2}" stroke="#FFDC88" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M${Pt(0.64, 0, 4)}L${Pt(0.64, 0, 62)}" stroke="#FFF5CA" stroke-opacity=".55" stroke-width="1.2"/>
        <circle cx="${pj(0.78, 0, 32)[0].toFixed(1)}" cy="${pj(0.78, 0, 32)[1].toFixed(1)}" r="2" fill="#FFF5CA"/>

        <path d="M${Pt(0.06, 0, 16)}L${Pt(0.46, 0, 16)}L${Pt(0.46, 0, 5)}M${Pt(1, 0.12, 24)}L${Pt(1, 0.7, 24)}L${Pt(1, 0.7, 34)}" fill="none" stroke="${houseColor}" stroke-opacity=".85" stroke-width="1.6" class="nx-house-circuit"/>

        <path d="M22 199L106 229L190 199" fill="none" stroke="${roofColor}" stroke-width="4" filter="url(#nx-glow)"/>
        <path d="M22 199L106 229L190 199" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="3 13" class="nx-roof-pulse"/>
        <g fill="${gridColor}" filter="url(#nx-glow)">
          <circle cx="22" cy="199" r="3.5"/><circle cx="106" cy="229" r="3.5"/><circle cx="190" cy="199" r="3.5"/>
        </g>`;

    const houseImgMarkup = houseImg ? `<g transform="translate(${hx} ${hy}) scale(${hs}) translate(-107 -229)">
        <ellipse cx="107" cy="226" rx="120" ry="17" fill="${roofColor}" opacity="${load || pv ? 0.55 : 0.12}" filter="url(#nx-blur)"/>
        <image href="${houseImg}" x="-13" y="25" width="240" height="220" preserveAspectRatio="xMidYMid meet"/>
      </g>` : '';

    const active = pv ? 'nx-sun-active' : 'nx-sun-idle';

    const sceneInner = `
      <defs>
        <linearGradient id="nx-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#10223C"/><stop offset=".48" stop-color="#071020"/><stop offset="1" stop-color="#02050D"/>
        </linearGradient>
        <linearGradient id="nx-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#F2FCFF"/><stop offset=".2" stop-color="#83AFCB"/><stop offset=".45" stop-color="#253C59"/>
          <stop offset=".68" stop-color="#D1F0FF"/><stop offset="1" stop-color="#344A65"/>
        </linearGradient>
        <linearGradient id="nx-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#D9FFFF"/><stop offset=".4" stop-color="#278EB8"/><stop offset="1" stop-color="#10223D"/>
        </linearGradient>
        <linearGradient id="nx-house-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1A4661"/><stop offset="1" stop-color="#071222"/>
        </linearGradient>
        <linearGradient id="nx-panel-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#CFFFFF"/><stop offset=".18" stop-color="#59EDFF"/><stop offset=".48" stop-color="#167DA9"/><stop offset="1" stop-color="#071C3C"/>
        </linearGradient>
        <radialGradient id="nx-moon-aura">
          <stop offset="0" stop-color="#cfe0ff" stop-opacity=".75"/><stop offset=".45" stop-color="#8aa6e8" stop-opacity=".3"/><stop offset="1" stop-color="#6a86d6" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="nx-moon-face" cx=".42" cy=".38" r=".75">
          <stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F3F0DD"/><stop offset=".8" stop-color="#CBD3E6"/><stop offset="1" stop-color="#97A4C2"/>
        </radialGradient>
        <radialGradient id="nx-moon-shade" cx=".3" cy=".3" r=".9">
          <stop offset=".55" stop-color="#0a1226" stop-opacity="0"/><stop offset="1" stop-color="#0a1226" stop-opacity=".5"/>
        </radialGradient>
        <linearGradient id="nx-roof-mix" x1="0" y1="0" x2="1" y2="0">${mixStops}</linearGradient>
        <linearGradient id="nx-car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#31608A"/><stop offset=".55" stop-color="#16314D"/><stop offset="1" stop-color="#0A1829"/>
        </linearGradient>
        <linearGradient id="nx-car-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8AEBFF" stop-opacity=".9"/><stop offset="1" stop-color="#0F3A5E" stop-opacity=".95"/>
        </linearGradient>
        <radialGradient id="nx-sun-core" cx="48%" cy="42%" r="60%">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="12%" stop-color="#FFFFFF"/><stop offset="25%" stop-color="#FFFDE1"/>
          <stop offset="39%" stop-color="#FFF27A"/><stop offset="53%" stop-color="#FFC43D"/><stop offset="68%" stop-color="#FF8B24"/>
          <stop offset="82%" stop-color="#FF542D" stop-opacity=".8"/><stop offset="100%" stop-color="#FF542D" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="nx-sun-aura">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".72"/><stop offset="18%" stop-color="#FFF4A2" stop-opacity=".55"/>
          <stop offset="42%" stop-color="#FFB52F" stop-opacity=".3"/><stop offset="68%" stop-color="#FF6A27" stop-opacity=".12"/>
          <stop offset="100%" stop-color="#FF572D" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="nx-sun-hotspot">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="35%" stop-color="#FFFFF0"/><stop offset="68%" stop-color="#FFF5AE"/>
          <stop offset="100%" stop-color="#FFD34E" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="nx-plasma-streak" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="32%" stop-color="#FFF8B0"/><stop offset="65%" stop-color="#FFB52F"/><stop offset="100%" stop-color="#FF5A2E"/>
        </linearGradient>
        <pattern id="nx-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V30" fill="none" stroke="#62BAFF" stroke-opacity=".07"/>
        </pattern>
        <pattern id="nx-panel-cells" width="17" height="12" patternUnits="userSpaceOnUse">
          <rect width="17" height="12" fill="url(#nx-panel-face)"/>
          <path d="M0 0H17M0 0V12" fill="none" stroke="#C4FFFF" stroke-opacity=".9" stroke-width="1"/>
        </pattern>
        <filter id="nx-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nx-big-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="11" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="nx-halo" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="900">
          <feGaussianBlur stdDeviation="15"/>
        </filter>
        <filter id="nx-blur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="15"/>
        </filter>
        <linearGradient id="nx-inv-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22425F"/><stop offset="1" stop-color="#0A1526"/>
        </linearGradient>
        <linearGradient id="nx-panel-lit" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="${nxMix(pvColor, 0.6)}"/>
          <stop offset=".75" stop-color="${pvColor}"/><stop offset="1" stop-color="${pvColor}" stop-opacity=".7"/>
        </linearGradient>
        <linearGradient id="nx-panel-off" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#17324D"/><stop offset="1" stop-color="#07101F"/>
        </linearGradient>
        <radialGradient id="nx-hub-core">
          <stop offset="0%" stop-color="#FFFFFF"/><stop offset="40%" stop-color="${nxMix(hubColor, 0.5)}"/>
          <stop offset="75%" stop-color="${hubColor}"/><stop offset="100%" stop-color="${hubColor}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="nx-hub-aura">
          <stop offset="0%" stop-color="${nxMix(hubColor, 0.4)}" stop-opacity=".7"/>
          <stop offset="60%" stop-color="${hubColor}" stop-opacity=".2"/><stop offset="100%" stop-color="${hubColor}" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <rect width="1000" height="${H}" rx="20" fill="url(#nx-grid)"/>

      <g fill="none" stroke="#39CFFA" stroke-opacity=".27" stroke-width="1.5">
        <path d="M0 125H55L76 146H108"/><path d="M1000 132H940L916 156H884"/>
        <path d="M0 505H60L84 481H120"/><path d="M1000 502H944L920 478H884"/>
        <path d="M250 0V24L272 46H300"/><path d="M730 650V614L752 592H782"/>
      </g>
      <g fill="#71EFFF" filter="url(#nx-glow)">
        <circle cx="55" cy="125" r="3"/><circle cx="940" cy="132" r="3"/><circle cx="60" cy="505" r="3"/><circle cx="944" cy="502" r="3"/>
      </g>

      <path d="M35 485L500 360L965 485L500 625Z" fill="#061427" fill-opacity=".42" stroke="#45CFFF" stroke-opacity=".17"/>
      <path d="M65 489L500 386L935 489" fill="none" stroke="#50DFFF" stroke-opacity=".17"/>
      <path d="M175 536L500 442L825 536" fill="none" stroke="#50DFFF" stroke-opacity=".13"/>
      <path d="M290 575L500 510L710 575" fill="none" stroke="#50DFFF" stroke-opacity=".1"/>

      <!-- TRALICCIO -->
      <g transform="translate(${px} ${py}) scale(${ts}) translate(-106 -289)">
        <ellipse cx="106" cy="267" rx="105" ry="18" fill="${gridColor}" opacity=".18" filter="url(#nx-blur)"/>
        <path d="M108 7L25 265 M108 7L192 265 M25 265H192 M36 229H180 M48 193H168 M60 157H156 M72 121H144 M84 85H132
                 M25 265L180 229 M192 265L36 229 M36 229L168 193 M180 229L48 193 M48 193L156 157 M168 193L60 157
                 M60 157L144 121 M156 157L72 121 M72 121L132 85 M144 121L84 85 M84 85L108 7 M132 85L108 7"
              fill="none" stroke="#030813" stroke-width="9" stroke-linejoin="round"/>
        <path d="M108 7L25 265 M108 7L192 265 M25 265H192 M36 229H180 M48 193H168 M60 157H156 M72 121H144 M84 85H132
                 M25 265L180 229 M192 265L36 229 M36 229L168 193 M180 229L48 193 M48 193L156 157 M168 193L60 157
                 M60 157L144 121 M156 157L72 121 M72 121L132 85 M144 121L84 85"
              fill="none" stroke="url(#nx-metal)" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M48 193H168 M60 157H156 M72 121H144 M36 229H180" fill="none" stroke="${gridColor}" stroke-opacity=".8" stroke-width="2.4"/>
        <path d="M43 125H173 M54 113H162 M72 82H144 M30 145H186" fill="none" stroke="url(#nx-metal)" stroke-width="4" stroke-linecap="round"/>
        <g stroke="#8DDFFF" stroke-width="2.5" fill="#18344D">
          <path d="M51 113V129 M62 113V129 M73 113V129 M143 113V129 M154 113V129 M165 113V129"/>
          <path d="M82 73V88 M91 73V88 M100 73V88 M116 73V88 M125 73V88 M134 73V88"/>
        </g>
        <g fill="${gridColor}" filter="url(#nx-glow)">
          <circle cx="108" cy="7" r="4"/><circle cx="54" cy="113" r="3"/><circle cx="162" cy="113" r="3"/>
          <circle cx="48" cy="193" r="3"/><circle cx="168" cy="193" r="3"/>
        </g>
        <path d="M-25 116Q20 105 51 116 M162 116Q202 105 237 116 M-20 135Q18 126 30 135 M186 135Q208 126 235 135" fill="none" stroke="#91AECB" stroke-width="1.6"/>
        <path d="M-25 116Q20 105 51 116 M162 116Q202 105 237 116" fill="none" stroke="${gridColor}" stroke-opacity=".8" stroke-width="2.5" class="nx-cable"/>
        <path d="M25 265L12 282 M192 265L205 282 M68 265L58 282 M149 265L159 282" stroke="url(#nx-metal)" stroke-width="5"/>
        <path d="M5 283H213" stroke="#8FC8E9" stroke-width="3"/>
        <path d="M15 289H203" stroke="${gridColor}" stroke-opacity=".6" stroke-width="1.5"/>
      </g>

      <!-- SOLE -->
      <g opacity="${sunOp}">
      <g transform="translate(${sx} ${sy}) scale(${ss})" class="${active}">
        <circle r="120" fill="url(#nx-sun-aura)" opacity="${pv ? 1 : 0.25}" filter="url(#nx-big-glow)" class="nx-sun-aura"/>
        <path class="nx-sun-corona"
              d="M0-100L9-83L23-96L28-77L47-85L45-65L67-69L61-49L82-43L69-26L91-13L73 2L88 20L67 30L72 52L50 54
                 L43 75L23 66L9 87L-5 68L-25 82L-31 60L-53 64L-54 42L-76 34L-65 13L-87-1L-68-17L-79-38L-57-46L-58-67L-36-63L-25-83L-8-70Z"
              fill="#FF8A2A" opacity="${pv ? 0.55 : 0.16}" filter="url(#nx-big-glow)"/>
        <g class="nx-sun-rays" opacity="${pv ? 1 : 0.38}" stroke-linecap="round" filter="url(#nx-glow)">
          <path d="M0-82V-108 M0 82V108 M-82 0H-108 M82 0H108" stroke="#FFF7B8" stroke-width="4"/>
          <path d="M-58-58L-77-77 M58-58L77-77 M-58 58L-77 77 M58 58L77 77" stroke="#FFE77B" stroke-width="4"/>
          <path d="M-29-77L-39-101 M29-77L39-101 M-29 77L-39 101 M29 77L39 101 M-77-29L-101-39 M77-29L101-39 M-77 29L-101 39 M77 29L101 39" stroke="#FFB938" stroke-width="2.5"/>
        </g>
        <g class="nx-plasma-shell" fill="none" stroke-linecap="round">
          <path d="M-47-28C-58-56-19-75 7-59C33-45 47-23 31-4" stroke="#FFF9C8" stroke-width="5" opacity="${pv ? 0.9 : 0.25}"/>
          <path d="M42 19C35 47 4 58-18 43C-37 31-43 9-27-8" stroke="#FF9B2E" stroke-width="7" opacity="${pv ? 0.9 : 0.25}"/>
          <path d="M-12-44C10-55 34-34 23-15C15 1-5 6-13 22" stroke="#FFFFFF" stroke-width="3" opacity="${pv ? 0.95 : 0.3}"/>
          <path d="M-43 18C-30 44 1 40 11 22" stroke="#FFE16A" stroke-width="3" opacity="${pv ? 0.95 : 0.25}"/>
        </g>
        <circle r="61" fill="url(#nx-sun-core)" opacity="${pv ? 1 : 0.58}" filter="url(#nx-big-glow)" class="nx-sun-body"/>
        <circle r="43" fill="url(#nx-sun-hotspot)" opacity="${pv ? 1 : 0.65}"/>
        <circle r="29" fill="#FFF9D6" opacity="${pv ? 0.98 : 0.68}" filter="url(#nx-glow)" class="nx-sun-nucleus"/>
        <circle r="19" fill="#FFFFFF" opacity="${pv ? 1 : 0.72}"/>
        <circle r="9" fill="#FFFFFF" opacity="${pv ? 1 : 0.75}"/>
        <g fill="none" stroke="url(#nx-plasma-streak)" stroke-width="2.4" stroke-linecap="round" class="nx-plasma-filaments">
          <path d="M-29-32Q-48-12-27 3T-12 32"/><path d="M16-39Q42-19 20 1T29 30"/>
          <path d="M-5-43Q14-22-4-7T7 37"/><path d="M-41 5Q-17-8 0 12T37 7"/>
        </g>
        <g class="nx-sun-spark" opacity="${pv ? 1 : 0.2}" fill="#FFFFFF" filter="url(#nx-glow)">
          <circle cx="-64" cy="-32" r="3"/><circle cx="64" cy="-32" r="3"/><circle cx="-64" cy="32" r="3"/><circle cx="64" cy="32" r="3"/>
          <circle cx="0" cy="-91" r="3"/><circle cx="0" cy="91" r="3"/>
          <circle cx="-37" cy="-78" r="2"/><circle cx="37" cy="-78" r="2"/><circle cx="-37" cy="78" r="2"/><circle cx="37" cy="78" r="2"/>
        </g>
      </g>
      </g>

      ${moonMarkup}

      <!-- FLUSSI -->
      ${flows}

      ${hubMarkup}

      <!-- CASA -->
      ${houseImgMarkup}
      <g ${houseImg ? 'display="none"' : ''} transform="translate(${hx} ${hy}) scale(${hs}) translate(-107 -229)">${houseDrawn}</g>

      ${batteryMarkup}
      ${carMarkup}
`;

    const boxesInner = `
      <defs>
        <linearGradient id="nx-box-mix" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="231" y2="0">${mixStops}</linearGradient>
      </defs>
      <g transform="${gridT}">${bGrid.g}</g>
      <g transform="${solarT}">${bSolar.g}</g>
      <g transform="${homeT}">${bHome.g}</g>
      ${bBatt ? `<g transform="${battT}">${bBatt.g}</g>` : ''}
      ${bCar ? `<g transform="${carT}">${bCar.g}</g>` : ''}`;

    if (this._H !== H) { this._H = H; Object.values(this._el).forEach((e) => e.setAttribute('viewBox', `0 0 1000 ${H}`)); }
    if (sceneInner !== this._last.scene) { this._last.scene = sceneInner; this._el.scene.innerHTML = sceneInner; }
    this._moonStep();
    this._moonLoop(moonMarkup !== '');
    if (boxesInner !== this._last.boxes) { this._last.boxes = boxesInner; this._el.boxes.innerHTML = boxesInner; }

    /* meteo: i livelli si ricostruiscono solo se cambia la condizione, i colori si aggiornano sul posto */
    const wxSig = `${cond}|${sx}|${sy}|${H}`;
    if (wxSig !== this._wxSig) {
      this._wxSig = wxSig;
      const w = this._wxBuild(cond, sx, sy, H);
      this._el.back.innerHTML = w.back;
      this._el.front.innerHTML = w.front;
      this._wxKey = '';
    }
    const intensity = nxClamp(num('weather_intensity'), 0.2, 1);
    const wxKey = `${cond}|${night.toFixed(3)}|${intensity}`;
    if (wxKey !== this._wxKey) { this._wxKey = wxKey; this._wxApply(cond, night, intensity); }
  }
}

/* ======================= EDITOR GRAFICO ======================= */

const NX_LABELS = {
  battery_power: 'Potenza batteria (positiva = in carica)',
  battery_soc: 'Livello batteria (%)',
  battery_invert: 'Inverti segno batteria (attiva se positivo = scarica)',
  battery_charge_today: 'Energia caricata oggi (kWh)',
  battery_discharge_today: 'Energia scaricata oggi (kWh)',
  battery_label: 'Scritta sulla batteria',
  battery_image: 'Foto della batteria (URL, es. /local/batteria.png): sostituisce il disegno',
  car_power: 'Potenza ricarica auto / wallbox',
  car_soc: 'Livello batteria auto (%)',
  car_energy_today: 'Energia ricaricata oggi (kWh)',
  car_label: 'Scritta sulla wallbox',
  car_image: 'Foto dell\'auto (URL, es. /local/auto.png): sostituisce il disegno',
  house_image: 'Foto della casa (URL, es. /local/casa.png): sostituisce il disegno',
  battery_color: 'Flusso batteria', car_color: 'Flusso ricarica auto',
  battery_scale: 'Batteria: scala', battery_x: 'Batteria: X', battery_y: 'Batteria: Y',
  car_scale: 'Auto: scala', car_x: 'Auto: X', car_y: 'Auto: Y',
  solar_power: 'Produzione fotovoltaica (potenza)',
  home_power: 'Consumo casa (potenza)',
  grid_power: 'Scambio rete (potenza)',
  grid_invert: 'Inverti segno rete (attiva se positivo = immissione)',
  solar_forecast_remaining: 'Produzione rimanente prevista (kWh)',
  solar_total_today: 'Totale prodotto oggi (kWh)',
  grid_import_today: 'Totale prelevato oggi (kWh)',
  grid_export_today: 'Totale immesso oggi (kWh)',
  home_total_today: 'Totale consumato oggi (kWh)',
  solar_max_power: 'Potenza massima impianto (W) per luminosità pannelli',
  weather_entity: 'Entità meteo (es. weather.openweathermap)',
  sun_entity: 'Entità sole (di solito sun.sun)',
  sun_rising: 'Sensore prossima alba (solo se non usi sun.sun)',
  sun_setting: 'Sensore prossimo tramonto (solo se non usi sun.sun)',
  weather_intensity: 'Intensità effetti meteo (nuvole, pioggia, neve...)',
  moon_phase: 'Fase della luna',
  moon_speed: 'Velocità animazione luna',
  preview_weather: 'Anteprima meteo (per provare gli sfondi)',
  preview_night: 'Anteprima giorno / tramonto / notte',
  hub_style: 'Nodo centrale che smista i flussi',
  inverter_label: 'Scritta sull\'inverter',
  hub_entity: 'Entità del nodo (potenza). Vuota = produzione + prelievo',
  hub_image: 'Foto dell\'inverter (URL, es. /local/inverter.png): sostituisce il disegno',
  hub_scale: 'Nodo: scala', hub_x: 'Nodo: X', hub_y: 'Nodo: Y',
  pv_color: 'Flusso solare',
  import_color: 'Flusso prelievo dalla rete',
  export_color: 'Flusso immissione in rete',
  home_color: 'Colore casa / consumo',
  sun_scale: 'Sole: scala', sun_x: 'Sole: X', sun_y: 'Sole: Y',
  pylon_scale: 'Traliccio: scala', pylon_x: 'Traliccio: X', pylon_y: 'Traliccio: Y',
  house_scale: 'Casa: scala', house_x: 'Casa: X', house_y: 'Casa: Y',
  solar_box_scale: 'Riquadro: scala', solar_box_value_scale: 'Valori: scala', solar_box_x: 'Riquadro: X', solar_box_y: 'Riquadro: Y',
  grid_box_scale: 'Riquadro: scala', grid_box_value_scale: 'Valori: scala', grid_box_x: 'Riquadro: X', grid_box_y: 'Riquadro: Y',
  home_box_scale: 'Riquadro: scala', home_box_value_scale: 'Valori: scala', home_box_x: 'Riquadro: X', home_box_y: 'Riquadro: Y',
};

const nxScale = { number: { min: 0.3, max: 2.5, step: 0.05, mode: 'slider' } };
const nxOffset = { number: { min: -300, max: 300, step: 5, mode: 'box' } };
const nxElem = (p) => ({
  type: 'grid', name: '', column_min_width: '110px',
  schema: [
    { name: `${p}_scale`, selector: nxScale },
    { name: `${p}_x`, selector: nxOffset },
    { name: `${p}_y`, selector: nxOffset },
  ],
});
const nxBox = (p) => ({
  type: 'grid', name: '', column_min_width: '110px',
  schema: [
    { name: `${p}_scale`, selector: nxScale },
    { name: `${p}_value_scale`, selector: nxScale },
    { name: `${p}_x`, selector: nxOffset },
    { name: `${p}_y`, selector: nxOffset },
  ],
});
const nxEnt = (name) => ({ name, selector: { entity: {} } });

const NX_SCHEMA = [
  {
    type: 'expandable', name: '', title: 'Sensori di potenza', flatten: true, expanded: true,
    schema: [nxEnt('solar_power'), nxEnt('home_power'), nxEnt('grid_power'), { name: 'grid_invert', selector: { boolean: {} } }],
  },
  {
    type: 'expandable', name: '', title: 'Totali giornalieri', flatten: true,
    schema: [nxEnt('solar_forecast_remaining'), nxEnt('solar_total_today'), nxEnt('grid_import_today'), nxEnt('grid_export_today'), nxEnt('home_total_today')],
  },
  {
    type: 'expandable', name: '', title: 'Colori dei flussi', flatten: true,
    schema: [
      { type: 'grid', name: '', column_min_width: '140px', schema: [
        { name: 'pv_color', selector: { color_rgb: {} } },
        { name: 'import_color', selector: { color_rgb: {} } },
        { name: 'export_color', selector: { color_rgb: {} } },
        { name: 'battery_color', selector: { color_rgb: {} } },
        { name: 'car_color', selector: { color_rgb: {} } },
        { name: 'home_color', selector: { color_rgb: {} } },
      ] },
    ],
  },
  {
    type: 'expandable', name: '', title: 'Meteo, giorno e notte', flatten: true,
    schema: [
      { name: 'weather_entity', selector: { entity: { domain: 'weather' } } },
      { name: 'sun_entity', selector: { entity: { domain: 'sun' } } },
      { name: 'sun_rising', selector: { entity: { domain: 'sensor' } } },
      { name: 'sun_setting', selector: { entity: { domain: 'sensor' } } },
      { name: 'weather_intensity', selector: { number: { min: 0.2, max: 1, step: 0.05, mode: 'slider' } } },
      { name: 'moon_speed', selector: { number: { min: 0.2, max: 3, step: 0.1, mode: 'slider' } } },
      { name: 'moon_phase', selector: { select: { mode: 'dropdown', options: [
        { value: 'real', label: 'Reale (calcolata dalla data)' },
        { value: 'full_moon', label: 'Sempre piena' },
        { value: 'new_moon', label: 'Luna nuova' },
        { value: 'waxing_crescent', label: 'Falce crescente' },
        { value: 'first_quarter', label: 'Primo quarto' },
        { value: 'waxing_gibbous', label: 'Gibbosa crescente' },
        { value: 'waning_gibbous', label: 'Gibbosa calante' },
        { value: 'last_quarter', label: 'Ultimo quarto' },
        { value: 'waning_crescent', label: 'Falce calante' },
      ] } } },
      { name: 'preview_weather', selector: { select: { mode: 'dropdown', options: [
        { value: 'auto', label: "Automatico (usa l'entità meteo)" },
        ...Object.keys(NX_WX_LABELS).map((k) => ({ value: k, label: NX_WX_LABELS[k] })),
      ] } } },
      { name: 'preview_night', selector: { select: { mode: 'dropdown', options: [
        { value: 'auto', label: 'Automatico (usa il sole reale)' },
        { value: '0', label: 'Giorno' },
        { value: '0.25', label: 'Tramonto: la luna inizia a coprire' },
        { value: '0.5', label: 'Tramonto: metà' },
        { value: '0.75', label: 'Tramonto: quasi coperto' },
        { value: '1', label: 'Notte (luna)' },
      ] } } },
    ],
  },
  {
    type: 'expandable', name: '', title: 'Nodo centrale (inverter / reattore)', flatten: true, expanded: true,
    schema: [
      { name: 'hub_style', selector: { select: { mode: 'dropdown', options: [
        { value: 'inverter', label: 'Inverter (sole → inverter → casa / rete)' },
        { value: 'reactor', label: 'Nucleo reattore' },
        { value: 'direct', label: 'Nessun nodo (flussi diretti)' },
      ] } } },
      { name: 'inverter_label', selector: { text: {} } },
      nxEnt('hub_entity'),
      { name: 'hub_image', selector: { text: {} } },
      nxElem('hub'),
    ],
  },
  {
    type: 'expandable', name: '', title: 'Sole', flatten: true,
    schema: [nxElem('sun'), { name: 'solar_max_power', selector: { number: { min: 500, max: 50000, step: 100, mode: 'box', unit_of_measurement: 'W' } } }],
  },
  { type: 'expandable', name: '', title: 'Traliccio', flatten: true, schema: [nxElem('pylon')] },
  { type: 'expandable', name: '', title: 'Casa', flatten: true, schema: [{ name: 'house_image', selector: { text: {} } }, nxElem('house')] },
  {
    type: 'expandable', name: '', title: 'Batteria di accumulo', flatten: true,
    schema: [
      nxEnt('battery_power'), nxEnt('battery_soc'), { name: 'battery_invert', selector: { boolean: {} } },
      nxEnt('battery_charge_today'), nxEnt('battery_discharge_today'),
      { name: 'battery_label', selector: { text: {} } }, { name: 'battery_image', selector: { text: {} } },
      nxElem('battery'), nxBox('battery_box'),
    ],
  },
  {
    type: 'expandable', name: '', title: 'Auto elettrica (ricarica)', flatten: true,
    schema: [
      nxEnt('car_power'), nxEnt('car_soc'), nxEnt('car_energy_today'),
      { name: 'car_label', selector: { text: {} } }, { name: 'car_image', selector: { text: {} } },
      nxElem('car'), nxBox('car_box'),
    ],
  },
  { type: 'expandable', name: '', title: 'Riquadro produzione', flatten: true, schema: [nxBox('solar_box')] },
  { type: 'expandable', name: '', title: 'Riquadro rete', flatten: true, schema: [nxBox('grid_box')] },
  { type: 'expandable', name: '', title: 'Riquadro consumo casa', flatten: true, schema: [nxBox('home_box')] },
];

class NexusSolarCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _build() {
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = (s) => NX_LABELS[s.name] || s.title || s.name;
      this._form.addEventListener('value-changed', (ev) => {
        ev.stopPropagation();
        const v = { ...ev.detail.value };
        NEXUS_COLOR_KEYS.forEach((k) => { if (Array.isArray(v[k])) v[k] = nxToHex(v[k]); });
        Object.keys(v).forEach((k) => { if (v[k] === '' || v[k] === undefined || v[k] === null) delete v[k]; });
        v.type = 'custom:sunmoon-energy';
        this._config = v;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: v }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...NEXUS_DEFAULTS, ...this._config };
    NEXUS_COLOR_KEYS.forEach((k) => { data[k] = nxToRgb(nxToHex(data[k]) || NEXUS_DEFAULTS[k]); });
    this._form.hass = this._hass;
    this._form.schema = NX_SCHEMA;
    this._form.data = data;
  }
}

if (!customElements.get('sunmoon-energy')) customElements.define('sunmoon-energy', NexusSolarCard);
if (!customElements.get('sunmoon-energy-editor')) customElements.define('sunmoon-energy-editor', NexusSolarCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'sunmoon-energy')) {
  window.customCards.push({
    type: 'sunmoon-energy',
    name: 'Sunmoon Energy',
    description: 'Sole, traliccio, casa e flussi energetici animati, con totali giornalieri e editor grafico.',
    preview: true,
  });
}

console.info(`%c SUNMOON-ENERGY %c v${NEXUS_VERSION} `, 'color:#030610;background:#55EAFF;font-weight:700', 'color:#55EAFF;background:#030610');
