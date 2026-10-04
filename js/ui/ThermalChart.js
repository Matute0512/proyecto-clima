/**
 * ThermalChart
 * 
 * Responsabilidad:
 * - Renderizado en Canvas 2D nativo de la curva térmica horaria (próximas 24 horas)
 * - Trazado de curvas Bézier suaves con resplandor neón holográfico
 * - Visualización de temperaturas, horarios y probabilidad de precipitación
 * - Soporte para pantallas Retina / High-DPI y cambio dinámico de escala (°C / °F)
 * - Principio GRASP: Pure Fabrication
 */
class ThermalChart {
  /**
   * @param {HTMLCanvasElement} canvasElement 
   */
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.hourlyData = [];
    this.currentUnit = 'metric';

    if (this.canvas) {
      this.initResizeListener();
    }
  }

  initResizeListener() {
    window.addEventListener('resize', () => {
      if (this.hourlyData.length > 0) {
        this.render(this.hourlyData, this.currentUnit);
      }
    });
  }

  /**
   * Renderiza los puntos de la curva térmica en el lienzo
   * @param {HourlyPoint[]} hourlyData - Array de 8 puntos (próximas 24 horas)
   * @param {string} unit - 'metric' (°C) o 'imperial' (°F)
   */
  render(hourlyData = [], unit = 'metric') {
    if (!this.canvas || !this.ctx || hourlyData.length === 0) return;

    this.hourlyData = hourlyData;
    this.currentUnit = unit;

    // Configuración High-DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 700;
    const height = 180;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    // Padding de márgenes internos
    const paddingLeft = 35;
    const paddingRight = 35;
    const paddingTop = 35;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Obtener valores de temperatura según la unidad
    const temps = hourlyData.map(h => unit === 'imperial' ? h.tempF : h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = Math.max(1, maxTemp - minTemp);

    // Calcular coordenadas (x, y) de cada punto
    const stepX = chartWidth / (hourlyData.length - 1);
    const points = hourlyData.map((item, index) => {
      const val = unit === 'imperial' ? item.tempF : item.temp;
      const x = paddingLeft + index * stepX;
      // Normalizamos y (invertido en canvas)
      const normalized = (val - minTemp) / tempRange;
      const y = paddingTop + chartHeight - (normalized * (chartHeight - 15));
      return { x, y, temp: val, item };
    });

    // 1. Dibujar líneas de referencia horizontales (Grid telemétrico)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < 3; i++) {
      const gridY = paddingTop + (chartHeight / 2) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft - 10, gridY);
      ctx.lineTo(width - paddingRight + 10, gridY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Relleno con degradado bajo la curva
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    gradient.addColorStop(0.6, 'rgba(0, 119, 254, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      ctx.bezierCurveTo(cpX, curr.y, cpX, next.y, next.x, next.y);
    }

    ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
    ctx.lineTo(points[0].x, height - paddingBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Trazado de la curva neón principal
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX = (curr.x + next.x) / 2;
      ctx.bezierCurveTo(cpX, curr.y, cpX, next.y, next.x, next.y);
    }

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0; // Restaurar sombra

    // 4. Dibujar puntos de datos, temperaturas y horarios
    points.forEach((pt) => {
      // Círculo exterior neón
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#060b17';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Texto de Temperatura (arriba)
      ctx.font = '600 12px "Orbitron", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.temp}°`, pt.x, pt.y - 12);

      // Texto de Hora (abajo)
      ctx.font = '500 11px "Rajdhani", sans-serif';
      ctx.fillStyle = '#64f4ff';
      ctx.fillText(pt.item.timeString, pt.x, height - paddingBottom + 16);

      // Probabilidad de lluvia (si es > 0)
      if (pt.item.pop > 0) {
        ctx.font = '600 10px "Space Grotesk", sans-serif';
        ctx.fillStyle = '#00ff9d';
        ctx.fillText(`💧${pt.item.pop}%`, pt.x, height - paddingBottom + 30);
      }
    });
  }
}

export default ThermalChart;
