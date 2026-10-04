/**
 * Forecast Model
 * 
 * Responsabilidad:
 * - Representar la telemetría predictiva del clima (horaria a 24h y extendida a 5 días)
 * - Agrupar y normalizar la lista de 40 puntos temporales de OpenWeatherMap
 * - Calcular rangos de temperatura mínima/máxima diaria y probabilidades de precipitación
 * - Principio GRASP: Information Expert
 */

export class HourlyPoint {
  constructor({ timestamp, temp, feelsLike, pop = 0, iconCode = '01d', description = '' }) {
    this.timestamp = timestamp;
    this.date = new Date(timestamp);
    this.temp = Math.round(temp);
    this.feelsLike = Math.round(feelsLike);
    this.pop = Math.round((pop ?? 0) * 100); // 0 a 100%
    this.iconCode = iconCode;
    this.description = description;

    Object.freeze(this);
  }

  get timeString() {
    const hours = String(this.date.getHours()).padStart(2, '0');
    return `${hours}:00`;
  }

  get tempF() {
    return Math.round((this.temp * 9) / 5 + 32);
  }

  get feelsLikeF() {
    return Math.round((this.feelsLike * 9) / 5 + 32);
  }
}

export class DailyPoint {
  constructor({ date, tempMin, tempMax, iconCode, description, maxPop }) {
    this.date = date;
    this.tempMin = Math.round(tempMin);
    this.tempMax = Math.round(tempMax);
    this.iconCode = iconCode || '01d';
    this.description = (description || '').trim();
    this.maxPop = Math.round(maxPop ?? 0);

    Object.freeze(this);
  }

  get dayName() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(this.date);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'HOY';
    if (diffDays === 1) return 'MAÑANA';

    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    return days[this.date.getDay()];
  }

  get dateString() {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const day = String(this.date.getDate()).padStart(2, '0');
    const month = months[this.date.getMonth()];
    return `${day} ${month}`;
  }

  get tempMinF() {
    return Math.round((this.tempMin * 9) / 5 + 32);
  }

  get tempMaxF() {
    return Math.round((this.tempMax * 9) / 5 + 32);
  }

  get formattedDescription() {
    if (!this.description) return 'Despejado';
    return this.description.charAt(0).toUpperCase() + this.description.slice(1);
  }
}

export class Forecast {
  constructor({ city, country, hourly = [], daily = [] }) {
    this.city = city;
    this.country = country;
    this.hourly = Object.freeze(hourly);
    this.daily = Object.freeze(daily);

    Object.freeze(this);
  }

  /**
   * Factory method para construir la predicción a partir de la API
   * @param {Object} rawData - Respuesta de /forecast
   * @returns {Forecast}
   */
  static fromApiResponse(rawData) {
    if (!rawData || !Array.isArray(rawData.list)) {
      throw new Error('Datos de pronóstico inválidos recibidos de la API.');
    }

    const city = rawData.city?.name || 'Objetivo';
    const country = rawData.city?.country || '';

    // 1. Puntos horarios: Tomamos los primeros 8 periodos (próximas 24 horas)
    const hourly = rawData.list.slice(0, 8).map(item => new HourlyPoint({
      timestamp: item.dt * 1000,
      temp: item.main.temp,
      feelsLike: item.main.feels_like ?? item.main.temp,
      pop: item.pop ?? 0,
      iconCode: item.weather[0]?.icon || '01d',
      description: item.weather[0]?.description || '',
    }));

    // 2. Puntos diarios: Agrupamos los 40 puntos por fecha de calendario (YYYY-MM-DD)
    const groups = new Map();

    rawData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey).push(item);
    });

    const daily = [];
    for (const [, items] of groups.entries()) {
      if (daily.length >= 5) break;

      let min = Infinity;
      let max = -Infinity;
      let maxPop = 0;

      items.forEach(item => {
        if (item.main.temp_min < min) min = item.main.temp_min;
        if (item.main.temp_max > max) max = item.main.temp_max;
        const popVal = (item.pop ?? 0) * 100;
        if (popVal > maxPop) maxPop = popVal;
      });

      // Buscamos el reporte más representativo de la mitad del día (cercano a las 12:00 / 15:00)
      const middayItem = items.find(i => {
        const h = new Date(i.dt * 1000).getHours();
        return h >= 11 && h <= 16;
      }) || items[Math.floor(items.length / 2)];

      daily.push(new DailyPoint({
        date: new Date(middayItem.dt * 1000),
        tempMin: min,
        tempMax: max,
        iconCode: middayItem.weather[0]?.icon || '01d',
        description: middayItem.weather[0]?.description || '',
        maxPop,
      }));
    }

    return new Forecast({ city, country, hourly, daily });
  }
}

export default Forecast;
