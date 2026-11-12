/**
 * Astronomical Sun & Moon Card
 * Lovelace Custom Card for Home Assistant
 * Visualizes real-time celestial trajectories, elevation, azimuth, milestones, and lunar phases.
 * 
 * Author: Adromir (https://github.com/adromir)
 * Version: 1.0.0
 * License: MIT
 */

(function () {
  'use strict';

  // --- LUNAR ASTRONOMICAL CALCULATOR ---
  const SYNODIC_MONTH = 29.53058867;
  const KNOWN_NEW_MOON = new Date('2024-01-11T11:57:00Z').getTime();

  function calculateMoonPhase(date = new Date()) {
    const diffDays = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
    const cycles = diffDays / SYNODIC_MONTH;
    const phaseFraction = cycles - Math.floor(cycles); // 0.0 to 1.0
    const ageDays = phaseFraction * SYNODIC_MONTH;
    const illumination = Math.round((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2 * 100);

    let phaseKey = 'new_moon';
    let phaseNameEn = 'New Moon';
    let phaseNameDe = 'Neumond';

    if (phaseFraction < 0.03 || phaseFraction > 0.97) {
      phaseKey = 'new_moon';
      phaseNameEn = 'New Moon';
      phaseNameDe = 'Neumond';
    } else if (phaseFraction < 0.22) {
      phaseKey = 'waxing_crescent';
      phaseNameEn = 'Waxing Crescent';
      phaseNameDe = 'Zunehmende Sichel';
    } else if (phaseFraction < 0.28) {
      phaseKey = 'first_quarter';
      phaseNameEn = 'First Quarter';
      phaseNameDe = 'Erstes Viertel';
    } else if (phaseFraction < 0.47) {
      phaseKey = 'waxing_gibbous';
      phaseNameEn = 'Waxing Gibbous';
      phaseNameDe = 'Zunehmender Mond';
    } else if (phaseFraction < 0.53) {
      phaseKey = 'full_moon';
      phaseNameEn = 'Full Moon';
      phaseNameDe = 'Vollmond';
    } else if (phaseFraction < 0.72) {
      phaseKey = 'waning_gibbous';
      phaseNameEn = 'Waning Gibbous';
      phaseNameDe = 'Abnehmender Mond';
    } else if (phaseFraction < 0.78) {
      phaseKey = 'last_quarter';
      phaseNameEn = 'Last Quarter';
      phaseNameDe = 'Letztes Viertel';
    } else {
      phaseKey = 'waning_crescent';
      phaseNameEn = 'Waning Crescent';
      phaseNameDe = 'Abnehmende Sichel';
    }

    // Days until next full moon (phaseFraction = 0.5)
    let daysToFull = (0.5 - phaseFraction);
    if (daysToFull < 0) daysToFull += 1.0;
    daysToFull = Math.round(daysToFull * SYNODIC_MONTH);

    // Days until next new moon (phaseFraction = 1.0)
    let daysToNew = (1.0 - phaseFraction);
    daysToNew = Math.round(daysToNew * SYNODIC_MONTH);

    return {
      phaseFraction,
      ageDays: Math.round(ageDays * 10) / 10,
      illumination,
      phaseKey,
      phaseNameEn,
      phaseNameDe,
      daysToFull,
      daysToNew
    };
  }

  function getCompassHeading(azimuth) {
    if (azimuth === null || azimuth === undefined || isNaN(azimuth)) return '--';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((azimuth % 360) / 22.5)) % 16;
    return directions[index];
  }

  function formatTime(isoString, hass) {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '--:--';
      const lang = (hass && hass.language) || 'de';
      return d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '--:--';
    }
  }

  function formatDuration(minutes) {
    if (isNaN(minutes) || minutes < 0) return '--';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  }

  // Generate SVG path for precise lunar phase rendering
  function renderMoonSvg(phaseFraction, radius = 24) {
    const r = radius;
    const cx = r;
    const cy = r;
    const p = phaseFraction; // 0 to 1

    // Waxing: 0 to 0.5 (light grows from right side)
    // Waning: 0.5 to 1.0 (light shrinks towards left side)
    const isWaxing = p < 0.5;
    // Cosine of angle maps the terminator curvature
    const cosAngle = Math.cos(2 * Math.PI * p);
    const rx = Math.abs(r * cosAngle);

    // Construct path for illuminated portion
    let litPath = '';
    if (isWaxing) {
      // Lit on the right side
      if (p <= 0.25) {
        // Crescent: outer right circle arc, inner curved terminator arc on same side
        litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r} Z`;
      } else {
        // Gibbous: outer right circle arc + inner bulging terminator arc
        litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
      }
    } else {
      // Lit on the left side
      if (p <= 0.75) {
        // Gibbous: outer left circle arc + inner bulging terminator arc
        litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r} Z`;
      } else {
        // Crescent: outer left circle arc + inner concave terminator arc
        litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
      }
    }

    return `
      <svg width="${r * 2}" height="${r * 2}" viewBox="0 0 ${r * 2} ${r * 2}" class="moon-svg">
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fffde7" stop-opacity="0.9" />
            <stop offset="65%" stop-color="#cfd8dc" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#90a4ae" stop-opacity="0.7" />
          </radialGradient>
          <filter id="lunarShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#b0bec5" flood-opacity="0.4" />
          </filter>
        </defs>
        <!-- Dark Side Background -->
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1c202d" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
        <!-- Subtle Lunar Craters -->
        <circle cx="${cx - r * 0.3}" cy="${cy - r * 0.2}" r="${r * 0.16}" fill="rgba(0,0,0,0.15)" />
        <circle cx="${cx + r * 0.2}" cy="${cy + r * 0.3}" r="${r * 0.22}" fill="rgba(0,0,0,0.12)" />
        <circle cx="${cx - r * 0.1}" cy="${cy + r * 0.4}" r="${r * 0.14}" fill="rgba(0,0,0,0.1)" />
        <!-- Lit Portion -->
        <path d="${litPath}" fill="url(#moonGlow)" filter="url(#lunarShadow)" />
      </svg>
    `;
  }

  // --- CARD CUSTOM ELEMENT ---
  class AstronomicalSunMoonCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._viewMode = 'combined'; // 'combined', 'sun_only', 'moon_only'
      this._timer = null;
    }

    setConfig(config) {
      if (!config) throw new Error('Invalid configuration');
      this._config = Object.assign({
        title: '',
        sun_entity: 'sun.sun',
        moon_entity: 'sensor.moon',
        default_view: 'combined', // combined, sun_only, moon_only
        show_view_switcher: true,
        show_milestones: true,
        show_elevation: true,
        show_azimuth: true,
        show_stars: true,
        show_daylight_progress: true,
        sky_height: 180,
      }, config);

      if (!this._hasUserSwitchedView) {
        this._viewMode = this._config.default_view;
      }
      this._requestRender();
    }

    set hass(hass) {
      this._hass = hass;
      this._requestRender();
    }

    connectedCallback() {
      this._startTicker();
    }

    disconnectedCallback() {
      this._stopTicker();
    }

    _startTicker() {
      if (this._timer) return;
      this._timer = setInterval(() => {
        this._requestRender();
      }, 30000); // refresh every 30s for solar movement
    }

    _stopTicker() {
      if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
      }
    }

    _requestRender() {
      if (!this._config || !this._hass) return;
      this.render();
    }

    // --- DATA EXTRACTION ---
    _getData() {
      const sunEntity = this._hass.states[this._config.sun_entity];
      const moonEntity = this._hass.states[this._config.moon_entity];
      const now = new Date();

      // Sun metrics
      let sunElevation = 0;
      let sunAzimuth = 0;
      let isSunAboveHorizon = false;
      let nextRising = null;
      let nextSetting = null;
      let nextNoon = null;
      let nextMidnight = null;

      if (sunEntity && sunEntity.attributes) {
        sunElevation = parseFloat(sunEntity.attributes.elevation) || 0;
        sunAzimuth = parseFloat(sunEntity.attributes.azimuth) || 0;
        isSunAboveHorizon = sunEntity.state === 'above_horizon' || sunElevation > 0;
        nextRising = sunEntity.attributes.next_rising;
        nextSetting = sunEntity.attributes.next_setting;
        nextNoon = sunEntity.attributes.next_noon;
        nextMidnight = sunEntity.attributes.next_midnight;
      }

      // Moon metrics
      const calculatedMoon = calculateMoonPhase(now);
      let moonState = calculatedMoon.phaseKey;
      let moonName = (this._hass.language === 'de') ? calculatedMoon.phaseNameDe : calculatedMoon.phaseNameEn;
      let illumination = calculatedMoon.illumination;

      if (moonEntity) {
        if (moonEntity.state && moonEntity.state !== 'unknown' && moonEntity.state !== 'unavailable') {
          moonState = moonEntity.state;
          // Format state name if entity provided
          const clean = moonEntity.state.replace(/_/g, ' ');
          moonName = clean.charAt(0).toUpperCase() + clean.slice(1);
        }
        if (moonEntity.attributes && moonEntity.attributes.illumination !== undefined) {
          illumination = Math.round(parseFloat(moonEntity.attributes.illumination));
        }
      }

      // Estimate daylight duration from rising/setting
      let daylightDurationMin = 0;
      let daylightRemainingMin = 0;
      if (nextRising && nextSetting) {
        const rDate = new Date(nextRising);
        const sDate = new Date(nextSetting);
        if (isSunAboveHorizon) {
          // Setting is upcoming today
          daylightRemainingMin = Math.max(0, (sDate.getTime() - now.getTime()) / (1000 * 60));
        }
      }

      return {
        sunElevation,
        sunAzimuth,
        isSunAboveHorizon,
        nextRising,
        nextSetting,
        nextNoon,
        nextMidnight,
        daylightRemainingMin,
        moon: calculatedMoon,
        moonName,
        illumination,
      };
    }

    // --- SKY ATMOSPHERE STYLING ---
    _getSkyAtmosphere(elevation) {
      if (elevation > 6) {
        // Broad daylight
        return {
          type: 'day',
          background: 'linear-gradient(180deg, #1e88e5 0%, #42a5f5 55%, #90caf9 100%)',
          sunGlow: '#ffeb3b',
          textColor: '#ffffff',
          horizonColor: 'rgba(255,255,255,0.4)',
        };
      } else if (elevation > 0) {
        // Golden hour / sunrise / sunset
        return {
          type: 'golden_hour',
          background: 'linear-gradient(180deg, #d84315 0%, #f4511e 35%, #fb8c00 70%, #fdd835 100%)',
          sunGlow: '#fff176',
          textColor: '#ffffff',
          horizonColor: 'rgba(255,255,255,0.5)',
        };
      } else if (elevation > -6) {
        // Civil twilight / dusk
        return {
          type: 'civil_twilight',
          background: 'linear-gradient(180deg, #1a237e 0%, #4a148c 45%, #880e4f 75%, #e65100 100%)',
          sunGlow: '#ff9800',
          textColor: '#ffffff',
          horizonColor: 'rgba(255,255,255,0.3)',
        };
      } else if (elevation > -12) {
        // Nautical twilight
        return {
          type: 'nautical_twilight',
          background: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)',
          sunGlow: '#ffb74d',
          textColor: '#e0e1dd',
          horizonColor: 'rgba(255,255,255,0.2)',
        };
      } else {
        // Astronomical night
        return {
          type: 'night',
          background: 'linear-gradient(180deg, #05070f 0%, #0c1222 55%, #152238 100%)',
          sunGlow: '#ffd54f',
          textColor: '#e2e8f0',
          horizonColor: 'rgba(255,255,255,0.15)',
        };
      }
    }

    render() {
      const data = this._getData();
      const sky = this._getSkyAtmosphere(data.sunElevation);
      const isDe = this._hass.language === 'de';

      // Dimensions for the celestial SVG dome
      const svgW = 480;
      const svgH = 170;
      const horizonY = 120; // 0° elevation line
      const zenithY = 25;   // ~60°-90° peak
      const nadirY = 155;   // under horizon

      // Map Sun elevation to Y
      // Above horizon: 0° -> 120, 60° -> 25
      // Below horizon: 0° -> 120, -60° -> 155
      let sunY = horizonY;
      if (data.sunElevation >= 0) {
        const norm = Math.min(1, data.sunElevation / 60);
        sunY = horizonY - norm * (horizonY - zenithY);
      } else {
        const norm = Math.min(1, Math.abs(data.sunElevation) / 60);
        sunY = horizonY + norm * (nadirY - horizonY);
      }

      // Map Sun Azimuth to X
      // Standard: 90° (East) -> X=50, 180° (South) -> X=240, 270° (West) -> X=430
      // Normalizing azimuth around South
      let sunX = 240;
      if (data.sunAzimuth >= 60 && data.sunAzimuth <= 300) {
        const frac = (data.sunAzimuth - 60) / 240; // 0 (East) to 1 (West)
        sunX = 50 + frac * 380;
      } else if (data.sunAzimuth > 300) {
        // Past West into night
        const frac = (data.sunAzimuth - 300) / 120;
        sunX = 430 - frac * 190;
      } else {
        // Before East (Night)
        const frac = data.sunAzimuth / 60;
        sunX = 240 - (1 - frac) * 190;
      }

      // Arc paths for celestial dome
      // Parabolic curve for daytime sky
      const skyArcD = `M 40 ${horizonY} Q 240 -20 440 ${horizonY}`;
      // Sub-horizon dashed curve for night
      const nightArcD = `M 440 ${horizonY} Q 240 190 40 ${horizonY}`;

      // Starfield dots for night / twilight
      let starFieldSvg = '';
      if (this._config.show_stars && (sky.type === 'night' || sky.type === 'nautical_twilight' || sky.type === 'civil_twilight')) {
        const stars = [
          { x: 50, y: 30, r: 1.2, o: 0.8 },
          { x: 95, y: 55, r: 0.8, o: 0.6 },
          { x: 140, y: 22, r: 1.4, o: 0.9 },
          { x: 190, y: 45, r: 1.0, o: 0.7 },
          { x: 230, y: 20, r: 1.5, o: 1.0 },
          { x: 285, y: 35, r: 0.9, o: 0.6 },
          { x: 330, y: 18, r: 1.3, o: 0.85 },
          { x: 380, y: 50, r: 0.8, o: 0.5 },
          { x: 425, y: 28, r: 1.2, o: 0.75 },
          { x: 70, y: 80, r: 1.0, o: 0.65 },
          { x: 410, y: 85, r: 1.1, o: 0.7 },
        ];
        starFieldSvg = stars.map(s => `
          <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#ffffff" opacity="${s.o}">
            <animate attributeName="opacity" values="${s.o};0.3;${s.o}" dur="${3 + (s.x % 4)}s" repeatCount="indefinite" />
          </circle>
        `).join('');
      }

      // Moon position in night arc (offset from sun)
      const moonX = ((sunX + 240) % 380) + 50;
      const moonElevation = -data.sunElevation; // approximate celestial anti-podal elevation
      let moonY = horizonY;
      if (moonElevation >= 0) {
        const mNorm = Math.min(1, moonElevation / 60);
        moonY = horizonY - mNorm * (horizonY - zenithY);
      } else {
        const mNorm = Math.min(1, Math.abs(moonElevation) / 60);
        moonY = horizonY + mNorm * (nadirY - horizonY);
      }

      const showSun = this._viewMode === 'combined' || this._viewMode === 'sun_only';
      const showMoon = this._viewMode === 'combined' || this._viewMode === 'moon_only';

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          ha-card {
            overflow: hidden;
            border-radius: var(--ha-card-border-radius, 16px);
            background: var(--ha-card-background, var(--card-background-color, #ffffff));
            box-shadow: var(--ha-card-box-shadow, 0 4px 20px rgba(0,0,0,0.06));
            color: var(--primary-text-color, #212121);
            font-family: var(--ha-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
            transition: all 0.3s ease;
          }
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px 10px;
          }
          .card-title {
            font-size: 1.15rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--primary-text-color);
          }
          .view-switcher {
            display: flex;
            background: var(--secondary-background-color, rgba(127,127,127,0.12));
            padding: 2px;
            border-radius: 20px;
            gap: 2px;
          }
          .view-btn {
            background: transparent;
            border: none;
            padding: 4px 12px;
            font-size: 0.8rem;
            font-weight: 500;
            border-radius: 16px;
            color: var(--secondary-text-color);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .view-btn.active {
            background: var(--card-background-color, #ffffff);
            color: var(--primary-text-color);
            box-shadow: 0 1px 4px rgba(0,0,0,0.12);
            font-weight: 600;
          }
          .sky-canvas-container {
            position: relative;
            background: ${sky.background};
            margin: 0 16px 12px;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: inset 0 2px 10px rgba(0,0,0,0.25);
            transition: background 1s ease;
          }
          svg.sky-svg {
            display: block;
            width: 100%;
            height: auto;
          }
          .horizon-line {
            stroke: ${sky.horizonColor};
            stroke-width: 1.5;
            stroke-dasharray: 3 3;
          }
          .dome-sky-arc {
            stroke: rgba(255,255,255,0.45);
            stroke-width: 2;
            fill: none;
          }
          .dome-night-arc {
            stroke: rgba(255,255,255,0.2);
            stroke-width: 1.5;
            stroke-dasharray: 4 4;
            fill: none;
          }
          .sun-element {
            filter: drop-shadow(0 0 12px ${sky.sunGlow});
            transition: cx 0.8s ease, cy 0.8s ease;
          }
          .cardinal-label {
            font-size: 10px;
            font-weight: 600;
            fill: rgba(255,255,255,0.7);
            text-anchor: middle;
          }
          .milestone-text {
            font-size: 9.5px;
            font-weight: 500;
            fill: rgba(255,255,255,0.85);
            text-anchor: middle;
          }

          /* Metrics Section */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px;
            padding: 0 16px 16px;
          }
          .metric-card {
            background: var(--secondary-background-color, rgba(127,127,127,0.08));
            border-radius: 12px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            border: 1px solid var(--divider-color, rgba(127,127,127,0.12));
          }
          .metric-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--secondary-text-color);
            font-weight: 500;
          }
          .metric-value {
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--primary-text-color);
            display: flex;
            align-items: baseline;
            gap: 4px;
          }
          .metric-sub {
            font-size: 0.75rem;
            color: var(--secondary-text-color);
          }

          /* Lunar Showcase Section */
          .moon-section {
            display: flex;
            align-items: center;
            gap: 16px;
            background: var(--secondary-background-color, rgba(127,127,127,0.08));
            margin: 0 16px 16px;
            padding: 14px 18px;
            border-radius: 14px;
            border: 1px solid var(--divider-color, rgba(127,127,127,0.12));
          }
          .moon-avatar {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .moon-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .moon-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .moon-phase-title {
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--primary-text-color);
          }
          .illumination-badge {
            background: rgba(144, 202, 249, 0.18);
            color: var(--primary-color, #1e88e5);
            font-weight: 700;
            font-size: 0.78rem;
            padding: 2px 8px;
            border-radius: 12px;
          }
          .moon-stats-row {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            font-size: 0.8rem;
            color: var(--secondary-text-color);
            margin-top: 2px;
          }
          .moon-stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          /* Solar Milestones Row */
          .solar-milestones {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 16px 14px;
          }
          .milestone-chip {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.82rem;
            color: var(--secondary-text-color);
          }
          .milestone-time {
            font-weight: 600;
            color: var(--primary-text-color);
          }

          /* Progress Bar */
          .daylight-progress-wrap {
            margin: 0 16px 14px;
          }
          .progress-label-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
          }
          .progress-track {
            height: 6px;
            border-radius: 3px;
            background: var(--divider-color, rgba(127,127,127,0.15));
            overflow: hidden;
            position: relative;
          }
          .progress-fill {
            height: 100%;
            border-radius: 3px;
            background: linear-gradient(90deg, #ff9800 0%, #ffeb3b 50%, #4caf50 100%);
            transition: width 0.5s ease;
          }
        </style>

        <ha-card>
          <!-- HEADER -->
          <div class="card-header">
            <div class="card-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>${this._config.title || (isDe ? 'Sonne & Mond Trajektorie' : 'Astronomical Sun & Moon')}</span>
            </div>

            ${this._config.show_view_switcher ? `
              <div class="view-switcher">
                <button class="view-btn ${this._viewMode === 'combined' ? 'active' : ''}" data-view="combined">
                  ${isDe ? 'Beides' : 'Both'}
                </button>
                <button class="view-btn ${this._viewMode === 'sun_only' ? 'active' : ''}" data-view="sun_only">
                  ${isDe ? 'Sonne' : 'Sun'}
                </button>
                <button class="view-btn ${this._viewMode === 'moon_only' ? 'active' : ''}" data-view="moon_only">
                  ${isDe ? 'Mond' : 'Moon'}
                </button>
              </div>
            ` : ''}
          </div>

          <!-- CELESTIAL SKY DOME (SVG) -->
          <div class="sky-canvas-container">
            <svg class="sky-svg" viewBox="0 0 ${svgW} ${svgH}">
              <defs>
                <radialGradient id="sunDiscGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="#ffffff" />
                  <stop offset="40%" stop-color="${sky.sunGlow}" />
                  <stop offset="100%" stop-color="#ff9800" />
                </radialGradient>
              </defs>

              <!-- Starfield -->
              ${starFieldSvg}

              <!-- Trajectory Arcs -->
              ${showSun ? `
                <path class="dome-sky-arc" d="${skyArcD}" />
                <path class="dome-night-arc" d="${nightArcD}" />
              ` : ''}

              <!-- Horizon Line -->
              <line x1="20" y1="${horizonY}" x2="460" y2="${horizonY}" class="horizon-line" />

              <!-- Cardinal Directions -->
              <text x="40" y="${horizonY + 14}" class="cardinal-label">${isDe ? 'Ost' : 'East'} (90°)</text>
              <text x="240" y="${horizonY + 14}" class="cardinal-label">${isDe ? 'Süd' : 'South'} (180°)</text>
              <text x="440" y="${horizonY + 14}" class="cardinal-label">${isDe ? 'West' : 'West'} (270°)</text>

              <!-- Milestone Indicators along Horizon -->
              ${this._config.show_milestones && showSun ? `
                <text x="40" y="${horizonY - 8}" class="milestone-text">🌅 ${formatTime(data.nextRising, this._hass)}</text>
                <text x="240" y="22" class="milestone-text">☀️ ${formatTime(data.nextNoon, this._hass)}</text>
                <text x="440" y="${horizonY - 8}" class="milestone-text">🌇 ${formatTime(data.nextSetting, this._hass)}</text>
              ` : ''}

              <!-- Sun Celestial Object -->
              ${showSun ? `
                <g class="sun-element">
                  <circle cx="${sunX}" cy="${sunY}" r="14" fill="url(#sunDiscGrad)" />
                  <circle cx="${sunX}" cy="${sunY}" r="17" fill="none" stroke="${sky.sunGlow}" stroke-width="1.5" opacity="0.6">
                    <animate attributeName="r" values="16;20;16" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <text x="${sunX}" y="${sunY - 18}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700">
                    ${data.sunElevation.toFixed(1)}°
                  </text>
                </g>
              ` : ''}

              <!-- Moon Celestial Object in Sky (if in Moon or Combined mode) -->
              ${showMoon && (!data.isSunAboveHorizon || this._viewMode === 'moon_only') ? `
                <g transform="translate(${moonX - 16}, ${moonY - 16})">
                  ${renderMoonSvg(data.moon.phaseFraction, 16)}
                  <text x="16" y="42" text-anchor="middle" fill="#e2e8f0" font-size="9.5" font-weight="600">
                    ${data.illumination}%
                  </text>
                </g>
              ` : ''}
            </svg>
          </div>

          <!-- SOLAR MILESTONES BAR (When Sun is visible) -->
          ${showSun && this._config.show_milestones ? `
            <div class="solar-milestones">
              <div class="milestone-chip">
                <span>🌅 ${isDe ? 'Aufgang' : 'Sunrise'}:</span>
                <span class="milestone-time">${formatTime(data.nextRising, this._hass)}</span>
              </div>
              <div class="milestone-chip">
                <span>☀️ ${isDe ? 'Mittag' : 'Solar Noon'}:</span>
                <span class="milestone-time">${formatTime(data.nextNoon, this._hass)}</span>
              </div>
              <div class="milestone-chip">
                <span>🌇 ${isDe ? 'Untergang' : 'Sunset'}:</span>
                <span class="milestone-time">${formatTime(data.nextSetting, this._hass)}</span>
              </div>
            </div>
          ` : ''}

          <!-- ASTRONOMICAL METRICS GRID -->
          <div class="metrics-grid">
            ${showSun ? `
              <div class="metric-card">
                <div class="metric-header">
                  <span>${isDe ? 'Sonnenhöhe' : 'Sun Elevation'}</span>
                  <span>📐</span>
                </div>
                <div class="metric-value">
                  ${data.sunElevation.toFixed(1)}°
                </div>
                <div class="metric-sub">
                  ${data.isSunAboveHorizon ? (isDe ? 'Über Horizont' : 'Above horizon') : (isDe ? 'Unter Horizont' : 'Below horizon')}
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-header">
                  <span>${isDe ? 'Azimut / Kompass' : 'Azimuth / Direction'}</span>
                  <span>🧭</span>
                </div>
                <div class="metric-value">
                  ${Math.round(data.sunAzimuth)}°
                  <span style="font-size:0.85rem;font-weight:600;color:var(--primary-color,#1e88e5);">
                    ${getCompassHeading(data.sunAzimuth)}
                  </span>
                </div>
                <div class="metric-sub">
                  ${isDe ? 'Himmelsrichtung' : 'Heading'}
                </div>
              </div>
            ` : ''}

            ${showMoon ? `
              <div class="metric-card">
                <div class="metric-header">
                  <span>${isDe ? 'Beleuchtung' : 'Illumination'}</span>
                  <span>🌕</span>
                </div>
                <div class="metric-value">
                  ${data.illumination}%
                </div>
                <div class="metric-sub">
                  ${data.moon.ageDays} ${isDe ? 'Tage alt' : 'days age'}
                </div>
              </div>

              <div class="metric-card">
                <div class="metric-header">
                  <span>${isDe ? 'Nächster Vollmond' : 'Next Full Moon'}</span>
                  <span>🗓️</span>
                </div>
                <div class="metric-value">
                  ${data.moon.daysToFull}
                  <span style="font-size:0.8rem;font-weight:500;">${isDe ? 'Tage' : 'days'}</span>
                </div>
                <div class="metric-sub">
                  ${isDe ? `Neumond in ${data.moon.daysToNew} T.` : `New moon in ${data.moon.daysToNew}d`}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- LUNAR SHOWCASE CARD (When Moon is active) -->
          ${showMoon ? `
            <div class="moon-section">
              <div class="moon-avatar">
                ${renderMoonSvg(data.moon.phaseFraction, 26)}
              </div>
              <div class="moon-details">
                <div class="moon-title-row">
                  <span class="moon-phase-title">${data.moonName}</span>
                  <span class="illumination-badge">${data.illumination}% ${isDe ? 'Beleuchtet' : 'Illuminated'}</span>
                </div>
                <div class="moon-stats-row">
                  <div class="moon-stat-item">
                    <span>⏳</span>
                    <span>${isDe ? 'Mondalter' : 'Moon Age'}: ${data.moon.ageDays} ${isDe ? 'Tage' : 'days'}</span>
                  </div>
                  <div class="moon-stat-item">
                    <span>🌕</span>
                    <span>${isDe ? 'Vollmond in' : 'Full moon in'} ${data.moon.daysToFull} ${isDe ? 'Tagen' : 'days'}</span>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
        </ha-card>
      `;

      // Event listeners for view switcher buttons
      const buttons = this.shadowRoot.querySelectorAll('.view-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this._viewMode = e.target.getAttribute('data-view');
          this._hasUserSwitchedView = true;
          this.render();
        });
      });
    }

    getCardSize() {
      return 4;
    }

    static getConfigElement() {
      return document.createElement('astronomical-sun-moon-card-editor');
    }

    static getStubConfig() {
      return {
        title: 'Sonne & Mond',
        sun_entity: 'sun.sun',
        moon_entity: 'sensor.moon',
        default_view: 'combined',
        show_view_switcher: true,
        show_milestones: true,
        show_elevation: true,
        show_azimuth: true,
        show_stars: true,
      };
    }
  }

  // --- LOVELACE CARD VISUAL GUI EDITOR ---
  class AstronomicalSunMoonCardEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
      this._config = Object.assign({}, config);
      this.render();
    }

    set hass(hass) {
      this._hass = hass;
      this.render();
    }

    render() {
      if (!this._config) return;
      const isDe = (this._hass && this._hass.language === 'de');

      this.shadowRoot.innerHTML = `
        <style>
          .editor-form {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding: 12px 0;
            font-family: var(--ha-font-family, system-ui, sans-serif);
          }
          .form-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--primary-text-color, #212121);
          }
          input[type="text"], select {
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid var(--divider-color, #ccc);
            background: var(--card-background-color, #fff);
            color: var(--primary-text-color, #212121);
            font-size: 0.9rem;
          }
          .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 0;
          }
          .toggle-label {
            font-size: 0.85rem;
            color: var(--primary-text-color, #212121);
          }
        </style>
        <div class="editor-form">
          <div class="form-row">
            <label>${isDe ? 'Kartentitel' : 'Card Title'}</label>
            <input type="text" id="title" value="${this._config.title || ''}" placeholder="${isDe ? 'Sonne & Mond Trajektorie' : 'Astronomical Sun & Moon'}" />
          </div>

          <div class="form-row">
            <label>${isDe ? 'Sonne Entität' : 'Sun Entity'}</label>
            <input type="text" id="sun_entity" value="${this._config.sun_entity || 'sun.sun'}" />
          </div>

          <div class="form-row">
            <label>${isDe ? 'Mond Entität (optional)' : 'Moon Entity (optional)'}</label>
            <input type="text" id="moon_entity" value="${this._config.moon_entity || 'sensor.moon'}" />
          </div>

          <div class="form-row">
            <label>${isDe ? 'Standard-Ansicht' : 'Default View'}</label>
            <select id="default_view">
              <option value="combined" ${this._config.default_view === 'combined' ? 'selected' : ''}>${isDe ? 'Beides (Sonne & Mond)' : 'Both (Sun & Moon)'}</option>
              <option value="sun_only" ${this._config.default_view === 'sun_only' ? 'selected' : ''}>${isDe ? 'Nur Sonne' : 'Sun Only'}</option>
              <option value="moon_only" ${this._config.default_view === 'moon_only' ? 'selected' : ''}>${isDe ? 'Nur Mond' : 'Moon Only'}</option>
            </select>
          </div>

          <div class="toggle-row">
            <span class="toggle-label">${isDe ? 'Ansichtswähler anzeigen' : 'Show View Switcher'}</span>
            <input type="checkbox" id="show_view_switcher" ${this._config.show_view_switcher !== false ? 'checked' : ''} />
          </div>

          <div class="toggle-row">
            <span class="toggle-label">${isDe ? 'Meilensteine (Aufgang/Untergang) anzeigen' : 'Show Milestones (Rise/Set)'}</span>
            <input type="checkbox" id="show_milestones" ${this._config.show_milestones !== false ? 'checked' : ''} />
          </div>

          <div class="toggle-row">
            <span class="toggle-label">${isDe ? 'Sternenhimmel bei Nacht' : 'Show Night Stars'}</span>
            <input type="checkbox" id="show_stars" ${this._config.show_stars !== false ? 'checked' : ''} />
          </div>
        </div>
      `;

      // Event listeners for inputs
      const titleInput = this.shadowRoot.getElementById('title');
      const sunInput = this.shadowRoot.getElementById('sun_entity');
      const moonInput = this.shadowRoot.getElementById('moon_entity');
      const viewSelect = this.shadowRoot.getElementById('default_view');
      const switchToggle = this.shadowRoot.getElementById('show_view_switcher');
      const milestonesToggle = this.shadowRoot.getElementById('show_milestones');
      const starsToggle = this.shadowRoot.getElementById('show_stars');

      const triggerChange = () => {
        const newConfig = Object.assign({}, this._config, {
          title: titleInput.value,
          sun_entity: sunInput.value,
          moon_entity: moonInput.value,
          default_view: viewSelect.value,
          show_view_switcher: switchToggle.checked,
          show_milestones: milestonesToggle.checked,
          show_stars: starsToggle.checked,
        });
        const event = new CustomEvent('config-changed', {
          detail: { config: newConfig },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(event);
      };

      titleInput.addEventListener('input', triggerChange);
      sunInput.addEventListener('input', triggerChange);
      moonInput.addEventListener('input', triggerChange);
      viewSelect.addEventListener('change', triggerChange);
      switchToggle.addEventListener('change', triggerChange);
      milestonesToggle.addEventListener('change', triggerChange);
      starsToggle.addEventListener('change', triggerChange);
    }
  }

  // Register Elements
  if (!customElements.get('astronomical-sun-moon-card')) {
    customElements.define('astronomical-sun-moon-card', AstronomicalSunMoonCard);
  }
  if (!customElements.get('astronomical-sun-moon-card-editor')) {
    customElements.define('astronomical-sun-moon-card-editor', AstronomicalSunMoonCardEditor);
  }

  // Register on customCards for Lovelace UI Picker
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'astronomical-sun-moon-card',
    name: 'Astronomical Sun & Moon Card',
    description: 'Real-time celestial trajectory dome visualizing Sun & Moon positions, elevation, azimuth, milestones, and realistic lunar phases.',
    preview: true,
    documentationURL: 'https://github.com/adromir/ha-astronomical-sun-moon-card',
  });

  console.info(
    '%c ASTRONOMICAL-SUN-MOON-CARD %c v1.0.0 ',
    'color: white; background: #0c1222; font-weight: 700; border-radius: 3px 0 0 3px;',
    'color: white; background: #ff9800; font-weight: 700; border-radius: 0 3px 3px 0;'
  );
})();
