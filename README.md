# Astronomical Sun & Moon Card for Home Assistant

[![HACS Custom Repository](https://img.shields.io/badge/HACS-Custom%20Repo-orange.svg)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/adromir/ha-astronomical-sun-moon-card)](https://github.com/adromir/ha-astronomical-sun-moon-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A modern, highly tactile Lovelace Custom Card for Home Assistant that visualizes real-time celestial mechanics: the sun's trajectory across the sky dome, solar elevation & azimuth, day/golden-hour/dusk/night atmospheric transitions, and mathematically precise lunar phases with crater illumination.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-astronomical-sun-moon-card&category=plugin)

---

## ✨ Features

- **Real-Time Celestial Sky Dome**:
  - Parabolic solar trajectory arc from East (90°) through South (180°) to West (270°).
  - Sub-horizon night arc tracing solar movement underneath the earth.
  - Live sun object with radiant glow corona and real-time elevation readout.
- **Dynamic Atmospheric Backdrop**:
  - Seamlessly transforms its sky gradient based on real solar elevation:
    - **Daylight** (> 6°): Crisp daylight sky blue.
    - **Golden Hour** (0° – 6°): Warm sunset and sunrise orange & amber.
    - **Civil Twilight / Dusk** (-6° – 0°): Deep magenta, indigo, and evening dusk.
    - **Nautical Twilight** (-12° – -6°): Deep navy twilight.
    - **Astronomical Night** (< -12°): Cosmic midnight black with shimmering starfield!
- **Photorealistic SVG Lunar Phases**:
  - Accurate mathematical lunar terminator calculated from the synodic cycle.
  - Renders true-to-life crescent, quarter, gibbous, and full moon shapes with subtle lunar crater shading.
  - Live illumination percentage (0–100%) and moon age in days.
  - Countdown to next Full Moon and next New Moon.
- **Celestial Milestones**:
  - Exact times for Sunrise, Solar Noon (peak altitude), and Sunset.
  - Compass heading with exact azimuth degrees and cardinal direction (e.g. `184° SSW`).
- **Flexible View Modes**:
  - `combined`: Shows both Sun and Moon celestial data.
  - `sun_only`: Focuses purely on solar trajectory, milestones, and daytime metrics.
  - `moon_only`: Dedicated lunar calendar with illumination, phase details, and night sky.
  - Interactive on-card view switcher pills.
- **Visual GUI Lovelace Card Editor**:
  - Full graphical editor support in Home Assistant (`astronomical-sun-moon-card-editor`).
- **100% Theme Compliant**:
  - Uses native Home Assistant CSS tokens (`--ha-card-background`, `--primary-text-color`, `--divider-color`). Zero dependencies.

---

## 📦 Installation

### Option 1: Via HACS (Recommended)

1. Ensure [HACS](https://hacs.xyz/) is installed.
2. Click the badge below:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=adromir&repository=ha-astronomical-sun-moon-card&category=plugin)

3. Alternatively, in Home Assistant go to **HACS** > **Frontend** > **Three dots (top right)** > **Custom repositories**.
4. Add repository URL: `https://github.com/adromir/ha-astronomical-sun-moon-card`
5. Category: **Dashboard** / **Plugin**.
6. Click **Install**.
7. Refresh your browser cache.

### Option 2: Manual Installation

1. Download `dist/astronomical-sun-moon-card.js` from the [latest release](https://github.com/adromir/ha-astronomical-sun-moon-card/releases).
2. Upload `astronomical-sun-moon-card.js` into your `<config>/www/` directory.
3. In Home Assistant, go to **Settings** > **Dashboards** > **Three dots (top right)** > **Resources**.
4. Add resource:
   - URL: `/local/astronomical-sun-moon-card.js?v=1.0.0`
   - Type: `JavaScript Module`

---

## ⚙️ Configuration

### Graphical Editor

When editing your dashboard, click **Add Card**, search for **Astronomical Sun & Moon Card**, and customize settings directly in the visual GUI editor.

### YAML Example

```yaml
type: custom:astronomical-sun-moon-card
title: "Sonne & Mond"
sun_entity: sun.sun
moon_entity: sensor.moon
default_view: combined
show_view_switcher: true
show_milestones: true
show_stars: true
```

### Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | **Required** | `custom:astronomical-sun-moon-card` |
| `title` | string | `""` | Optional card title |
| `sun_entity` | string | `sun.sun` | Sun entity providing solar elevation and azimuth |
| `moon_entity` | string | `sensor.moon` | Optional moon entity (auto-calculates if omitted) |
| `default_view` | string | `combined` | Default display mode (`combined`, `sun_only`, `moon_only`) |
| `show_view_switcher` | boolean | `true` | Show interactive view toggle pills in the header |
| `show_milestones` | boolean | `true` | Show Sunrise, Solar Noon, and Sunset times |
| `show_stars` | boolean | `true` | Display shimmering starfield during night/twilight |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Author: **Adromir** (<https://github.com/adromir>)
