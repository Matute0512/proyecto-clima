/**
 * config.js
 *
 * Centraliza constantes y configuración global de la app
 * Principio GRASP: Expert (aquí viven las constantes de configuración)
 */

const CONFIG = {
    // API
    API_BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    API_KEY: import.meta.env?.VITE_API_KEY || 'REDACTED_OPENWEATHER_API_KEY',

    // Unidades
    UNITS: 'metric',
    LANGUAGE: 'es',

    // Local Storage
    STORAGE_KEY_CITY: 'weatherApp_lastCity',
    STORAGE_KEY_HISTORY: 'weatherApp_history',

    // Mensajes
    MESSAGES: {
        ERROR_NOT_FOUND: 'Ciudad no encontrada. Verifica el nombre e intenta de nuevo.',
        ERROR_API: 'Error al conectar con el servidor. Intenta más tarde.',
        ERROR_EMPTY_INPUT: 'Por favor, escribe una ciudad.',
        ERROR_NETWORK: 'No hay conexión a internet.',
        LOADING: 'Buscando clima...',
        SUCCESS: 'Clima cargado correctamente',
    },

    // UI
    UI_SELECTORS: {
        form: '#weatherForm',
        input: '#cityInput',
        button: '.search-btn',
        weatherCard: '#weatherCard',
        errorMessage: '#errorMessage',
        cityName: '#cityName',
        temperature: '#temperature',
        description: '#weatherDescription',
        humidity: '#humidity',
        windSpeed: '#windSpeed',
        pressure: '#pressure',
        weatherIcon: '#weatherIcon',
    },

    // Animaciones
    ANIMATIONS: {
        errorShakeDuration: 500,
    },

    // Timeout para peticiones
    FETCH_TIMEOUT: 5000,
};

export default CONFIG;