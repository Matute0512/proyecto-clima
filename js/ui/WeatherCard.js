import CONFIG from '../config.js';
import IconService from '../services/IconService.js';

/**
 * WeatherCard
 *
 * Responsabilidad única:
 * - Renderizar datos del clima en la tarjeta del DOM
 * - Actualizar elementos específicos con soporte de accesibilidad
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
   * Actualiza el nombre de la ciudad
   */
  updateCityInfo(weatherData) {
    if (!this.elements.cityName) return;
    const name = weatherData.displayName || 
      (weatherData.country ? `${weatherData.city}, ${weatherData.country}` : weatherData.city);
    this.elements.cityName.textContent = name;
  }

  /**
   * Actualiza la temperatura según la unidad elegida
   */
  updateTemperature(weatherData, unit = 'metric') {
    if (!this.elements.temperature) return;

    if (unit === 'imperial') {
      const tempF = weatherData.temperatureFahrenheit ?? Math.round((weatherData.temperature * 9) / 5 + 32);
      this.elements.temperature.textContent = `${tempF}°F`;
    } else {
      const tempC = Math.round(weatherData.temperature);
      this.elements.temperature.textContent = `${tempC}°C`;
    }
  }

  /**
   * Actualiza la descripción del clima
   */
  updateDescription(weatherData) {
    if (!this.elements.description) return;
    const description = weatherData.formattedDescription ||
      (weatherData.description.charAt(0).toUpperCase() + weatherData.description.slice(1));
    this.elements.description.textContent = description;
  }

  /**
   * Actualiza los detalles (humedad, viento, presión)
   */
  updateDetails(weatherData) {
    if (this.elements.humidity) {
      this.elements.humidity.textContent = `${Math.round(weatherData.humidity)}%`;
    }
    if (this.elements.windSpeed) {
      this.elements.windSpeed.textContent = `${Math.round(weatherData.windSpeed)} km/h`;
    }
    if (this.elements.pressure) {
      this.elements.pressure.textContent = `${Math.round(weatherData.pressure)} hPa`;
    }
  }

  /**
   * Actualiza el icono del clima utilizando IconService
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
    this.elements.weatherCard.className = `weather-card ${themeClass}`;
  }

  /**
   * Muestra el estado por defecto (antes de buscar)
   */
  showDefault() {
    this.currentWeather = null;

    if (this.elements.cityName) this.elements.cityName.textContent = 'Busca una ciudad...';
    if (this.elements.description) this.elements.description.textContent = 'Ingresa una ciudad para ver el clima';
    if (this.elements.temperature) this.elements.temperature.textContent = '--°C';
    if (this.elements.humidity) this.elements.humidity.textContent = '-- %';
    if (this.elements.windSpeed) this.elements.windSpeed.textContent = '-- km/h';
    if (this.elements.pressure) this.elements.pressure.textContent = '-- hPa';

    if (this.elements.weatherIcon) {
      this.elements.weatherIcon.src = '';
      this.elements.weatherIcon.alt = '';
      this.elements.weatherIcon.style.display = 'none';
    }

    if (this.elements.weatherCard) {
      this.elements.weatherCard.className = 'weather-card';
    }
  }
}

export default WeatherCard;