import CONFIG from '../config.js';
import IconService from '../services/IconService.js';

/**
 * WeatherCard
 *
 * Responsabilidad única:
 * - Renderizar datos del clima en la tarjeta del DOM estilo HUD futurista
 * - Actualizar telemetría (temperatura, sensación térmica, viento, humedad, presión)
 * - Controlar barras de nivel e indicadores dinámicos
 * - Integrar IconService para temas visuales y URLs de iconos
 *
 * Principios:
 * - SRP: solo renderiza
 * - Bajo acoplamiento: delega iconos y temas a IconService
 */

class WeatherCard {
  constructor(iconService = new IconService()) {
    this.iconService = iconService;
    this.elements = this.initializeElements();
    this.currentWeather = null;
    this.currentUnit = 'metric';
  }

  /**
   * Captura referencias a los elementos del DOM
   */
  initializeElements() {
    return {
      cityName: document.querySelector(CONFIG.UI_SELECTORS.cityName),
      temperature: document.querySelector(CONFIG.UI_SELECTORS.temperature),
      description: document.querySelector(CONFIG.UI_SELECTORS.description),
      humidity: document.querySelector(CONFIG.UI_SELECTORS.humidity),
      windSpeed: document.querySelector(CONFIG.UI_SELECTORS.windSpeed),
      pressure: document.querySelector(CONFIG.UI_SELECTORS.pressure),
      weatherIcon: document.querySelector(CONFIG.UI_SELECTORS.weatherIcon),
      weatherCard: document.querySelector(CONFIG.UI_SELECTORS.weatherCard),
      feelsLike: document.querySelector('#feelsLike'),
      geoCoordinates: document.querySelector('#geoCoordinates'),
      humidityBar: document.querySelector('#humidityBar'),
      windBar: document.querySelector('#windBar'),
      pressureBar: document.querySelector('#pressureBar'),
    };
  }

  /**
   * Actualiza la tarjeta completa con datos del clima
   * @param {Object|Weather} weatherData - Instancia de Weather o datos normalizados
   * @param {string} unit - 'metric' (°C) o 'imperial' (°F)
   */
  render(weatherData, unit = 'metric') {
    if (!weatherData) {
      this.showDefault();
      return;
    }

    this.currentWeather = weatherData;
    this.currentUnit = unit;

    this.updateCityInfo(weatherData);
    this.updateTemperature(weatherData, unit);
    this.updateDescription(weatherData);
    this.updateDetails(weatherData);
    this.updateWeatherIcon(weatherData);
    this.applyTheme(weatherData);
  }

  /**
   * Actualiza el nombre de la ciudad y coordenadas HUD
   */
  updateCityInfo(weatherData) {
    if (this.elements.cityName) {
      const name = weatherData.displayName || 
        (weatherData.country ? `${weatherData.city}, ${weatherData.country}` : weatherData.city);
      this.elements.cityName.textContent = name.toUpperCase();
    }

    if (this.elements.geoCoordinates) {
      this.elements.geoCoordinates.textContent = 
        weatherData.formattedCoords || 'COORD: ORBITAL TELEMETRY LINK';
    }
  }

  /**
   * Actualiza la temperatura y sensación térmica según la unidad
   */
  updateTemperature(weatherData, unit = 'metric') {
    const isImperial = unit === 'imperial';

    if (this.elements.temperature) {
      if (isImperial) {
        const tempF = weatherData.temperatureFahrenheit ?? Math.round((weatherData.temperature * 9) / 5 + 32);
        this.elements.temperature.textContent = `${tempF}°F`;
      } else {
        const tempC = Math.round(weatherData.temperature);
        this.elements.temperature.textContent = `${tempC}°C`;
      }
    }

    if (this.elements.feelsLike) {
      if (isImperial) {
        const feelsF = weatherData.feelsLikeFahrenheit ?? Math.round((weatherData.feelsLike * 9) / 5 + 32);
        this.elements.feelsLike.textContent = `SENSACIÓN: ${feelsF}°F`;
      } else {
        const feelsC = Math.round(weatherData.feelsLike);
        this.elements.feelsLike.textContent = `SENSACIÓN: ${feelsC}°C`;
      }
    }
  }

  /**
   * Actualiza la descripción del clima
   */
  updateDescription(weatherData) {
    if (!this.elements.description) return;
    const description = weatherData.formattedDescription ||
      (weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1));
    this.elements.description.textContent = description.toUpperCase();
  }

  /**
   * Actualiza los detalles y las barras telemétricas
   */
  updateDetails(weatherData) {
    // Humedad
    if (this.elements.humidity) {
      const hum = Math.round(weatherData.humidity);
      this.elements.humidity.textContent = `${hum}%`;
      if (this.elements.humidityBar) {
        this.elements.humidityBar.style.width = `${Math.min(100, Math.max(0, hum))}%`;
      }
    }

    // Viento
    if (this.elements.windSpeed) {
      const wind = Math.round(weatherData.windSpeed);
      this.elements.windSpeed.textContent = `${wind} km/h`;
      if (this.elements.windBar) {
        // Escala normalizada hasta 100 km/h
        const windPercent = Math.min(100, Math.max(5, Math.round(wind * 1.5)));
        this.elements.windBar.style.width = `${windPercent}%`;
      }
    }

    // Presión
    if (this.elements.pressure) {
      const press = Math.round(weatherData.pressure);
      this.elements.pressure.textContent = `${press} hPa`;
      if (this.elements.pressureBar) {
        // Rango común de 960 a 1040 hPa
        const pressPercent = Math.min(100, Math.max(5, Math.round(((press - 960) / 80) * 100)));
        this.elements.pressureBar.style.width = `${pressPercent}%`;
      }
    }
  }

  /**
   * Actualiza el icono atmosférico con efecto holográfico
   */
  updateWeatherIcon(weatherData) {
    if (!this.elements.weatherIcon) return;

    const iconCode = weatherData.iconCode || '01d';
    const iconUrl = this.iconService.getIconUrl(iconCode, '4x');
    const accessibleLabel = this.iconService.getAccessibleLabel(weatherData.description, iconCode);

    this.elements.weatherIcon.src = iconUrl;
    this.elements.weatherIcon.alt = accessibleLabel;
    this.elements.weatherIcon.style.display = 'block';
  }

  /**
   * Aplica la clase de tema visual usando IconService
   */
  applyTheme(weatherData) {
    if (!this.elements.weatherCard) return;

    const themeClass = this.iconService.getThemeClass(weatherData.iconCode);
    this.elements.weatherCard.className = `weather-card cyber-panel ${themeClass}`;
  }

  /**
   * Muestra el estado por defecto (antes de buscar)
   */
  showDefault() {
    this.currentWeather = null;

    if (this.elements.cityName) this.elements.cityName.textContent = 'BUSCANDO SEÑAL...';
    if (this.elements.description) this.elements.description.textContent = 'INICIE ESCANEO DE CIUDAD O COORDENADAS';
    if (this.elements.temperature) this.elements.temperature.textContent = '--°C';
    if (this.elements.feelsLike) this.elements.feelsLike.textContent = 'SENSACIÓN: --°C';
    if (this.elements.humidity) this.elements.humidity.textContent = '-- %';
    if (this.elements.windSpeed) this.elements.windSpeed.textContent = '-- km/h';
    if (this.elements.pressure) this.elements.pressure.textContent = '-- hPa';
    if (this.elements.geoCoordinates) this.elements.geoCoordinates.textContent = 'COORD: STANDBY';

    if (this.elements.humidityBar) this.elements.humidityBar.style.width = '0%';
    if (this.elements.windBar) this.elements.windBar.style.width = '0%';
    if (this.elements.pressureBar) this.elements.pressureBar.style.width = '0%';

    if (this.elements.weatherIcon) {
      this.elements.weatherIcon.src = '';
      this.elements.weatherIcon.alt = '';
      this.elements.weatherIcon.style.display = 'none';
    }

    if (this.elements.weatherCard) {
      this.elements.weatherCard.className = 'weather-card cyber-panel';
    }
  }
}

export default WeatherCard;