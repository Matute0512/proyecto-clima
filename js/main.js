import WeatherApp from './app.js';

/**
 * main.js
 *
 * Punto de entrada de la aplicación
 *
 * Responsabilidad única:
 * - Esperar a que el DOM esté listo
 * - Instanciar y inicializar la app
 */

function startApp() {
  const app = new WeatherApp();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}