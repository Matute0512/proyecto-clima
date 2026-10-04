/**
 * IconService
 * 
 * Responsabilidad:
 * - Mapeo de códigos de icono y condiciones de OpenWeatherMap a assets visuales
 * - Proveer URLs de alta resolución (4x) y clases CSS temáticas
 * - Generar descripciones accesibles para lectores de pantalla
 * - Principio GRASP: Information Expert
 */
class IconService {
  /**
   * Obtiene la URL de OpenWeatherMap en alta resolución
   * @param {string} iconCode - Código de OpenWeatherMap (ej. '01d', '10n')
   * @param {string} size - '2x' o '4x'
   * @returns {string}
   */
  getIconUrl(iconCode = '01d', size = '4x') {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  /**
   * Mapea el código de icono a una clase temática CSS para la tarjeta
   * @param {string} iconCode 
   * @returns {string}
   */
  getThemeClass(iconCode = '01d') {
    const code = iconCode.slice(0, 2);
    switch (code) {
      case '01': return 'weather--sunny';
      case '02': return 'weather--partly-cloudy';
      case '03':
      case '04': return 'weather--cloudy';
      case '09':
      case '10': return 'weather--rainy';
      case '11': return 'weather--stormy';
      case '13': return 'weather--snowy';
      case '50': return 'weather--foggy';
      default: return 'weather--default';
    }
  }

  /**
   * Retorna un emoji representativo según la condición climática
   * @param {string} iconCode 
   * @returns {string}
   */
  getEmoji(iconCode = '01d') {
    const code = iconCode.slice(0, 2);
    const isDay = iconCode.endsWith('d');

    const map = {
      '01': isDay ? '☀️' : '🌙',
      '02': isDay ? '⛅' : '☁️',
      '03': '☁️',
      '04': '☁️',
      '09': '🌧️',
      '10': '🌦️',
      '11': '⛈️',
      '13': '❄️',
      '50': '🌫️',
    };

    return map[code] || '🌡️';
  }

  /**
   * Genera texto accesible para atributos aria-label
   * @param {string} description 
   * @param {string} iconCode 
   * @returns {string}
   */
  getAccessibleLabel(description = '', iconCode = '01d') {
    const timeOfDay = iconCode.endsWith('d') ? 'durante el día' : 'durante la noche';
    return `${description}, ${timeOfDay}`;
  }
}

export default IconService;
