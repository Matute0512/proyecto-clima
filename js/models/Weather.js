/**
 * Weather Model
 * 
 * Responsabilidad:
 * - Representar una entidad de clima validada e inmutable
 * - Calcular propiedades derivadas (conversión de unidades, estado día/noche, categorías)
 * - Principio GRASP: Information Expert
 */
export class Weather {
  constructor({
    city,
    country = '',
    temperature,
    feelsLike,
    humidity,
    pressure,
    windSpeed,
    description,
    iconCode,
    conditionMain = '',
    timestamp = Date.now(),
  }) {
    if (!city || typeof city !== 'string') {
      throw new Error('El modelo Weather requiere un nombre de ciudad válido.');
    }
    if (typeof temperature !== 'number' || isNaN(temperature)) {
      throw new Error('El modelo Weather requiere un valor numérico de temperatura.');
    }

    this.city = city.trim();
    this.country = (country || '').trim().toUpperCase();
    this.temperature = Math.round(temperature);
    this.feelsLike = Math.round(feelsLike ?? temperature);
    this.humidity = Math.max(0, Math.min(100, Math.round(humidity ?? 0)));
    this.pressure = Math.round(pressure ?? 1013);
    this.windSpeed = Math.round((windSpeed ?? 0) * 10) / 10;
    this.description = (description || 'Sin descripción').trim();
    this.iconCode = iconCode || '01d';
    this.conditionMain = conditionMain;
    this.timestamp = timestamp;

    Object.freeze(this);
  }

  /**
   * Nombre formateado con país si está disponible
   * @returns {string}
   */
  get displayName() {
    return this.country ? `${this.city}, ${this.country}` : this.city;
  }

  /**
   * Descripción con primera letra capitalizada
   * @returns {string}
   */
  get formattedDescription() {
    return this.description.charAt(0).toUpperCase() + this.description.slice(1);
  }

  /**
   * Temperatura convertida a grados Fahrenheit
   * @returns {number}
   */
  get temperatureFahrenheit() {
    return Math.round((this.temperature * 9) / 5 + 32);
  }

  /**
   * Sensación térmica en grados Fahrenheit
   * @returns {number}
   */
  get feelsLikeFahrenheit() {
    return Math.round((this.feelsLike * 9) / 5 + 32);
  }

  /**
   * Indica si las condiciones son diurnas según el código del icono
   * @returns {boolean}
   */
  get isDay() {
    return this.iconCode.endsWith('d');
  }

  /**
   * Categoría general del clima para ambientación
   * @returns {string}
   */
  get category() {
    const code = this.iconCode.slice(0, 2);
    switch (code) {
      case '01': return 'clear';
      case '02': return 'few-clouds';
      case '03':
      case '04': return 'cloudy';
      case '09':
      case '10': return 'rain';
      case '11': return 'thunderstorm';
      case '13': return 'snow';
      case '50': return 'atmosphere';
      default: return 'clear';
    }
  }

  /**
   * Factory method para construir la entidad inmutable a partir de la API de OpenWeatherMap
   * @param {Object} rawData - Respuesta cruda en formato JSON
   * @returns {Weather}
   */
  static fromApiResponse(rawData) {
    if (!rawData || !rawData.main || !Array.isArray(rawData.weather) || !rawData.weather[0]) {
      throw new Error('Estructura de datos de clima inválida recibida de la API.');
    }

    return new Weather({
      city: rawData.name,
      country: rawData.sys?.country || '',
      temperature: rawData.main.temp,
      feelsLike: rawData.main.feels_like ?? rawData.main.temp,
      humidity: rawData.main.humidity,
      pressure: rawData.main.pressure,
      windSpeed: rawData.wind?.speed ?? 0,
      description: rawData.weather[0].description,
      iconCode: rawData.weather[0].icon,
      conditionMain: rawData.weather[0].main,
      timestamp: rawData.dt ? rawData.dt * 1000 : Date.now(),
    });
  }
}

export default Weather;
