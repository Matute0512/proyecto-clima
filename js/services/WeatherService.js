import CONFIG from '../config.js';
import Weather from '../models/Weather.js';

/**
 * WeatherService
 *
 * Responsabilidad única:
 * - Construir la URL de la API (por ciudad o por coordenadas)
 * - Ejecutar peticiones fetch con timeout y control de errores
 * - Retornar entidades Weather del dominio
 *
 * Principios:
 * - SRP (Single Responsibility Principle)
 * - GRASP: Expert (sabe cómo consultar el clima)
 */

class WeatherService {
    constructor(apikey = CONFIG.API_KEY){
        this.apiKey = apikey;
    }

    buildUrl(city) {
        const cleanCity = city.trim();
        const encodedCity = encodeURIComponent(cleanCity);

        return `${CONFIG.API_BASE_URL}?q=${encodedCity}&appid=${this.apiKey}&units=${CONFIG.UNITS}&lang=${CONFIG.LANGUAGE}`;
    }

    buildCoordsUrl(lat, lon) {
        return `${CONFIG.API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${CONFIG.UNITS}&lang=${CONFIG.LANGUAGE}`;
    }

    async getWeatherByCity(city) {
        const cleanCity = city?.trim();

        if (!cleanCity){
            throw new Error(CONFIG.MESSAGES.ERROR_EMPTY_INPUT);
        }

        const url = this.buildUrl(cleanCity);
        return this._fetchWeather(url);
    }

    async getWeatherByCoords(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            throw new Error('Coordenadas geográficas inválidas.');
        }

        const url = this.buildCoordsUrl(lat, lon);
        return this._fetchWeather(url);
    }

    async _fetchWeather(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
            });

            if (!response.ok){
                if (response.status === 404){
                    throw new Error(CONFIG.MESSAGES.ERROR_NOT_FOUND);
                }

                throw new Error(CONFIG.MESSAGES.ERROR_API);
            }

            const data = await response.json();
            return this.normalizeWeather(data);

        } catch (error) {
            if (error.name === 'AbortError'){
                throw new Error(CONFIG.MESSAGES.ERROR_NETWORK);
            }

            throw error;

        } finally {
            clearTimeout(timeoutId);
        }
    }

    normalizeWeather(data) {
        return Weather.fromApiResponse(data);
    }
}

export default WeatherService;