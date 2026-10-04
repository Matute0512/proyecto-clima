import CONFIG from './config.js';
import WeatherService from './services/WeatherService.js';
import UIController from './ui/UIController.js';

/**
 * app.js
 *
 * Responsabilidad:
 * - Instanciar servicios
 * - Inyectar dependencias
 * - Inicializar la aplicación
 *
 * Principios:
 * - SOLID DIP (Dependency Injection)
 * - GRASP: Creator (crea objetos)
 * - Separación de responsabilidades
 */

class WeatherApp {
  constructor() {
    this.weatherService = null;
    this.uiController = null;
  }

  /**
   * Inicializa la aplicación
   * Crea instancias y las conecta
   */
  init() {
    try {
      // Validar que tenemos la API key
      if (!CONFIG.API_KEY) {
        console.error('❌ Error: API_KEY no encontrada en configuración');
        console.warn('Por favor, configura tu API key en config.js');
        this.showSetupError();
        return;
      }

      // Crear instancia del servicio de clima
      this.weatherService = new WeatherService(CONFIG.API_KEY);

      // Crear instancia del controlador UI (inyectamos el servicio)
      this.uiController = new UIController(this.weatherService);

      console.log('✅ App inicializada correctamente');
      console.log('🌍 Listo para buscar ciudades');

    } catch (error) {
      console.error('❌ Error al inicializar la app:', error);
      this.showSetupError();
    }
  }

  /**
   * Muestra error si algo falla en la inicialización
   */
  showSetupError() {
    const errorElement = document.querySelector(CONFIG.UI_SELECTORS.errorMessage);
    if (errorElement) {
      errorElement.textContent = '❌ Error al inicializar la aplicación. Revisa la consola.';
      errorElement.style.display = 'block';
    }
  }
}

// Exportamos la clase para que main.js la pueda usar
export default WeatherApp;