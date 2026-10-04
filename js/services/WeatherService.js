import CONFIG from '../config.js';
import Weather from '../models/Weather.js';
import Forecast from '../models/Forecast.js';

/**
 * WeatherService
 *
 * Responsabilidad única:
 * - Construir URLs de endpoints climáticos y de pronóstico
 * - Ejecutar peticiones fetch con timeout y control de errores
 * - Retornar entidades de dominio Weather y Forecast
 *
 * Principios:
 * - SRP (Single Responsibility Principle)
 * - GRASP: Expert
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

    buildForecastUrl(city) {
        const cleanCity = city.trim();
        const encodedCity = encodeURIComponent(cleanCity);
        return `${CONFIG.API_FORECAST_URL}?q=${encodedCity}&appid=${this.apiKey}&units=${CONFIG.UNITS}&lang=${CONFIG.LANGUAGE}`;
    }

    buildForecastCoordsUrl(lat, lon) {
        return `${CONFIG.API_FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${CONFIG.UNITS}&lang=${CONFIG.LANGUAGE}`;
    }

    async getWeatherByCity(city) {
        const cleanCity = city?.trim();
        if (!cleanCity){
            throw new Error(CONFIG.MESSAGES.ERROR_EMPTY_INPUT);
        }
        const data = await this._fetchJson(this.buildUrl(cleanCity));
        return Weather.fromApiResponse(data);
    }

    async getWeatherByCoords(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            throw new Error('Coordenadas geográficas inválidas.');
        }
        const data = await this._fetchJson(this.buildCoordsUrl(lat, lon));
        return Weather.fromApiResponse(data);
    }

    async getForecastByCity(city) {
        const cleanCity = city?.trim();
        if (!cleanCity){
            throw new Error(CONFIG.MESSAGES.ERROR_EMPTY_INPUT);
        }
        const data = await this._fetchJson(this.buildForecastUrl(cleanCity));
        return Forecast.fromApiResponse(data);
    }

    async getForecastByCoords(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            throw new Error('Coordenadas geográficas inválidas.');
        }
        const data = await this._fetchJson(this.buildForecastCoordsUrl(lat, lon));
        return Forecast.fromApiResponse(data);
    }

    async _fetchJson(url) {
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

            return await response.json();

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