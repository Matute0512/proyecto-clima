import IconService from '../services/IconService.js';

/**
 * ForecastView
 * 
 * Responsabilidad:
 * - Renderizar la cuadrícula de pronóstico extendido a 5 días
 * - Calcular barras de rango térmico (mínima y máxima)
 * - Mapear iconos climáticos y porcentajes de precipitación
 * - Principio GRASP: Information Expert de la vista extendida
 */
class ForecastView {
  /**
   * @param {HTMLElement} containerElement 
   * @param {IconService} iconService 
   */
  constructor(containerElement, iconService = new IconService()) {
    this.container = containerElement;
    this.iconService = iconService;
    this.dailyData = [];
    this.currentUnit = 'metric';
  }

  /**
   * Renderiza las tarjetas de los próximos 5 días
   * @param {DailyPoint[]} dailyData 
   * @param {string} unit - 'metric' (°C) o 'imperial' (°F)
   */
  render(dailyData = [], unit = 'metric') {
    if (!this.container) return;

    this.dailyData = dailyData;
    this.currentUnit = unit;
    this.container.innerHTML = '';

    if (dailyData.length === 0) return;

    // Calcular temperaturas absolutas para la escala visual relativa
    const isImperial = unit === 'imperial';
    const allMins = dailyData.map(d => isImperial ? d.tempMinF : d.tempMin);
    const allMaxs = dailyData.map(d => isImperial ? d.tempMaxF : d.tempMax);
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const globalRange = Math.max(1, globalMax - globalMin);

    dailyData.forEach((day, index) => {
      const min = isImperial ? day.tempMinF : day.tempMin;
      const max = isImperial ? day.tempMaxF : day.tempMax;
      const unitSymbol = isImperial ? '°F' : '°C';

      // Posición relativa de la barra térmica dentro del día
      const leftPercent = Math.max(0, Math.round(((min - globalMin) / globalRange) * 100));
      const widthPercent = Math.min(100 - leftPercent, Math.max(15, Math.round(((max - min) / globalRange) * 100)));

      const card = document.createElement('div');
      card.className = 'forecast-card cyber-subpanel';
      card.style.animationDelay = `${index * 0.08}s`;

      const iconUrl = this.iconService.getIconUrl(day.iconCode, '2x');

      card.innerHTML = `
        <div class="forecast-day-header">
          <span class="forecast-day">${day.dayName}</span>
          <span class="forecast-date">${day.dateString}</span>
        </div>

        <div class="forecast-icon-box">
          <img src="${iconUrl}" alt="${day.formattedDescription}" class="forecast-icon" loading="lazy">
          ${day.maxPop > 0 ? `<span class="forecast-pop">💧 ${day.maxPop}%</span>` : ''}
        </div>

        <p class="forecast-desc">${day.formattedDescription}</p>

        <div class="forecast-thermal-range">
          <span class="range-val min">${min}${unitSymbol}</span>
          <div class="range-track">
            <div class="range-bar" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
          </div>
          <span class="range-val max">${max}${unitSymbol}</span>
        </div>
      `;

      this.container.appendChild(card);
    });
  }
}

export default ForecastView;
