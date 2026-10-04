import CONFIG from '../config.js';
import WeatherCard from './WeatherCard.js';
import SearchInput from './SearchInput.js';
import ThermalChart from './ThermalChart.js';
import ForecastView from './ForecastView.js';
import StorageService from '../services/StorageService.js';

/**
 * UIController
 *
 * Responsabilidad:
 * - Coordinar el flujo completo de la interfaz de usuario
 * - Integrar SearchInput, WeatherCard, ThermalChart, ForecastView y StorageService
 * - Gestionar geolocalización nativa, historial reciente y conversor de unidades
 *
 * Principios:
 * - GRASP: Controller / Mediator
 * - DIP: Inyección de dependencias
 */

class UIController {
  constructor(weatherService, storageService = new StorageService()) {
    this.weatherService = weatherService;
    this.storageService = storageService;

    this.elements = this.initializeElements();
    this.currentWeather = null;
    this.currentForecast = null;
    this.currentUnit = this.storageService.getPreferredUnit() || 'metric';

    this.weatherCard = new WeatherCard();
    this.thermalChart = new ThermalChart(this.elements.thermalChart);
    this.forecastView = new ForecastView(this.elements.forecastContainer);

    this.searchInput = new SearchInput({
      formElement: this.elements.form,
      inputElement: this.elements.input,
      buttonElement: this.elements.button,
      onSearch: (city) => this.handleSearch(city),
    });

    this.attachEventListeners();
    this.setupInitialState();
  }

  /**
   * Captura referencias a los elementos del DOM
   */
  initializeElements() {
    return {
      form: document.querySelector(CONFIG.UI_SELECTORS.form),
      input: document.querySelector(CONFIG.UI_SELECTORS.input),
      button: document.querySelector(CONFIG.UI_SELECTORS.button),
      errorMessage: document.querySelector(CONFIG.UI_SELECTORS.errorMessage),
      geoBtn: document.querySelector('#geoBtn'),
      unitToggle: document.querySelector('#unitToggle'),
      recentSearches: document.querySelector('#recentSearches'),
      thermalChart: document.querySelector('#thermalChart'),
      forecastContainer: document.querySelector('#forecastContainer'),
      forecastSection: document.querySelector('#forecastSection'),
    };
  }

  /**
   * Vincula eventos de la interfaz
   */
  attachEventListeners() {
    if (this.elements.geoBtn) {
      this.elements.geoBtn.addEventListener('click', () => this.handleGeolocation());
    }

    if (this.elements.unitToggle) {
      this.elements.unitToggle.addEventListener('click', () => this.handleUnitToggle());
    }
  }

  /**
   * Prepara el estado inicial: unidad preferida, historial, reloj HUD y última ciudad consultada
   */
  setupInitialState() {
    this.startHudClock();
    this.updateUnitToggleButton();
    this.renderRecentSearches();

    const lastCity = this.storageService.getLastCity();
    if (lastCity) {
      this.fetchAndDisplayWeather(lastCity);
    }
  }

  /**
   * Inicia el reloj digital de telemetría en tiempo real
   */
  startHudClock() {
    const clockEl = document.querySelector('#hudClock');
    if (!clockEl) return;

    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      clockEl.textContent = `${hours}:${minutes}:${seconds} UTC`;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  /**
   * Maneja una solicitud de búsqueda por texto
   * @param {string} city 
   */
  async handleSearch(city) {
    const cleanCity = city?.trim();
    if (!cleanCity) {
      this.showError(CONFIG.MESSAGES.ERROR_EMPTY_INPUT);
      return;
    }

    await this.fetchAndDisplayWeather(cleanCity);
  }

  /**
   * Consulta el clima actual y el pronóstico extendido en paralelo
   * @param {string} city 
   */
  async fetchAndDisplayWeather(city) {
    try {
      this.setLoading(true);
      this.clearError();

      const [weather, forecast] = await Promise.all([
        this.weatherService.getWeatherByCity(city),
        this.weatherService.getForecastByCity(city).catch(err => {
          console.warn('⚠️ No se pudo obtener el pronóstico extendido:', err);
          return null;
        }),
      ]);

      this.currentWeather = weather;
      this.currentForecast = forecast;

      // Renderiza tarjeta principal
      this.weatherCard.render(weather, this.currentUnit);

      // Renderiza telemetría horaria y pronóstico a 5 días
      if (forecast) {
        if (this.elements.forecastSection) {
          this.elements.forecastSection.classList.remove('hidden');
        }
        this.thermalChart.render(forecast.hourly, this.currentUnit);
        this.forecastView.render(forecast.daily, this.currentUnit);
      }

      this.storageService.saveLastCity(weather.city);
      this.renderRecentSearches();

      this.searchInput.clear();

    } catch (error) {
      this.showError(error.message);
      if (!this.currentWeather) {
        this.weatherCard.showDefault();
      }
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Consulta el clima y pronóstico a partir de coordenadas GPS
   */
  handleGeolocation() {
    if (!navigator.geolocation) {
      this.showError('Tu navegador no soporta geolocalización.');
      return;
    }

    if (this.elements.geoBtn) {
      this.elements.geoBtn.disabled = true;
      this.elements.geoBtn.textContent = '⏳';
    }

    this.clearError();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          this.setLoading(true);
          const { latitude, longitude } = position.coords;

          const [weather, forecast] = await Promise.all([
            this.weatherService.getWeatherByCoords(latitude, longitude),
            this.weatherService.getForecastByCoords(latitude, longitude).catch(err => {
              console.warn('⚠️ No se pudo obtener pronóstico por coordenadas:', err);
              return null;
            }),
          ]);

          this.currentWeather = weather;
          this.currentForecast = forecast;

          this.weatherCard.render(weather, this.currentUnit);

          if (forecast) {
            if (this.elements.forecastSection) {
              this.elements.forecastSection.classList.remove('hidden');
            }
            this.thermalChart.render(forecast.hourly, this.currentUnit);
            this.forecastView.render(forecast.daily, this.currentUnit);
          }

          this.storageService.saveLastCity(weather.city);
          this.renderRecentSearches();

        } catch (error) {
          this.showError(error.message);
        } finally {
          this.setLoading(false);
          if (this.elements.geoBtn) {
            this.elements.geoBtn.disabled = false;
            this.elements.geoBtn.textContent = '📍';
          }
        }
      },
      (error) => {
        let msg = 'No se pudo obtener tu ubicación actual.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación denegado. Puedes escribir tu ciudad manualmente.';
        }
        this.showError(msg);
        if (this.elements.geoBtn) {
          this.elements.geoBtn.disabled = false;
          this.elements.geoBtn.textContent = '📍';
        }
      },
      { timeout: 10000 }
    );
  }

  /**
   * Alterna entre Celsius (°C) y Fahrenheit (°F) reactivamente
   */
  handleUnitToggle() {
    this.currentUnit = this.currentUnit === 'metric' ? 'imperial' : 'metric';
    this.storageService.setPreferredUnit(this.currentUnit);
    this.updateUnitToggleButton();

    if (this.currentWeather) {
      this.weatherCard.render(this.currentWeather, this.currentUnit);
    }

    if (this.currentForecast) {
      this.thermalChart.render(this.currentForecast.hourly, this.currentUnit);
      this.forecastView.render(this.currentForecast.daily, this.currentUnit);
    }
  }

  /**
   * Actualiza la etiqueta del botón de cambio de unidad
   */
  updateUnitToggleButton() {
    if (!this.elements.unitToggle) return;
    this.elements.unitToggle.textContent = 
      this.currentUnit === 'metric' ? 'ESCALA: [ °C ] ➔ °F' : 'ESCALA: [ °F ] ➔ °C';
  }

  /**
   * Renderiza los chips del historial de búsquedas recientes
   */
  renderRecentSearches() {
    if (!this.elements.recentSearches) return;

    const history = this.storageService.getHistory();
    this.elements.recentSearches.innerHTML = '';

    if (history.length === 0) return;

    history.forEach((city) => {
      const chip = document.createElement('span');
      chip.className = 'history-chip';
      chip.textContent = city;

      // Botón para eliminar chip individual
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'history-chip-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Eliminar ${city} del historial`;
      removeBtn.setAttribute('aria-label', `Eliminar ${city} del historial`);

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.storageService.removeFromHistory(city);
        this.renderRecentSearches();
      });

      chip.appendChild(removeBtn);

      chip.addEventListener('click', () => {
        this.fetchAndDisplayWeather(city);
      });

      this.elements.recentSearches.appendChild(chip);
    });
  }

  /**
   * Muestra mensajes de error accesibles y animados
   */
  showError(message) {
    if (!this.elements.errorMessage) return;

    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.remove('hidden');

    this.elements.errorMessage.style.animation = 'none';
    setTimeout(() => {
      if (this.elements.errorMessage) {
        this.elements.errorMessage.style.animation = `shake ${CONFIG.ANIMATIONS.errorShakeDuration / 1000}s ease`;
      }
    }, 10);

    setTimeout(() => this.clearError(), 6000);
  }

  clearError() {
    if (!this.elements.errorMessage) return;
    this.elements.errorMessage.textContent = '';
    this.elements.errorMessage.classList.add('hidden');
  }

  setLoading(loading) {
    this.searchInput.setLoading(loading);
  }
}

export default UIController;