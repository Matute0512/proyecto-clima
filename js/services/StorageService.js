import CONFIG from '../config.js';

/**
 * StorageService
 * 
 * Responsabilidad:
 * - Abstraer el almacenamiento local con manejo seguro de excepciones
 * - Gestionar historial de búsquedas recientes, última ciudad y favoritos
 * - Resiliente ante modo incógnito, cuota excedida o almacenamiento deshabilitado
 * - Principio GRASP: Information Expert & Protected Variations
 */
class StorageService {
  constructor(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
    this.storage = this._validateStorage(storage);
    this.memoryFallback = new Map();
  }

  /**
   * Comprueba que localStorage esté realmente operativo
   * @private
   */
  _validateStorage(storage) {
    if (!storage) return null;
    try {
      const testKey = '__weather_storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return storage;
    } catch {
      console.warn('⚠️ Almacenamiento local bloqueado o no disponible. Usando memoria temporal.');
      return null;
    }
  }

  _getItem(key, defaultValue = null) {
    try {
      if (this.storage) {
        const item = this.storage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
      return this.memoryFallback.has(key) ? this.memoryFallback.get(key) : defaultValue;
    } catch (error) {
      console.warn(`Error al leer '${key}' de almacenamiento:`, error);
      return defaultValue;
    }
  }

  _setItem(key, value) {
    try {
      if (this.storage) {
        this.storage.setItem(key, JSON.stringify(value));
      } else {
        this.memoryFallback.set(key, value);
      }
      return true;
    } catch (error) {
      console.warn(`Error al guardar '${key}' en almacenamiento:`, error);
      return false;
    }
  }

  // ==================== ÚLTIMA CIUDAD ====================

  getLastCity() {
    return this._getItem(CONFIG.STORAGE_KEY_CITY, null);
  }

  saveLastCity(city) {
    if (!city || typeof city !== 'string') return;
    const cleanCity = city.trim();
    this._setItem(CONFIG.STORAGE_KEY_CITY, cleanCity);
    this.addToHistory(cleanCity);
  }

  // ==================== HISTORIAL DE BÚSQUEDAS ====================

  getHistory() {
    return this._getItem(CONFIG.STORAGE_KEY_HISTORY, []);
  }

  addToHistory(city, maxItems = 5) {
    if (!city || typeof city !== 'string') return this.getHistory();
    const cleanCity = city.trim();
    const current = this.getHistory();

    // Elimina duplicados sin importar mayúsculas/minúsculas
    const filtered = current.filter(item => item.toLowerCase() !== cleanCity.toLowerCase());
    const updated = [cleanCity, ...filtered].slice(0, maxItems);

    this._setItem(CONFIG.STORAGE_KEY_HISTORY, updated);
    return updated;
  }

  removeFromHistory(city) {
    if (!city) return this.getHistory();
    const cleanCity = city.trim();
    const current = this.getHistory();
    const updated = current.filter(item => item.toLowerCase() !== cleanCity.toLowerCase());
    this._setItem(CONFIG.STORAGE_KEY_HISTORY, updated);
    return updated;
  }

  clearHistory() {
    this._setItem(CONFIG.STORAGE_KEY_HISTORY, []);
  }

  // ==================== UNIDAD DE TEMPERATURA ====================

  getPreferredUnit() {
    return this._getItem('weatherApp_unit', CONFIG.UNITS || 'metric');
  }

  setPreferredUnit(unit) {
    if (unit === 'metric' || unit === 'imperial') {
      this._setItem('weatherApp_unit', unit);
    }
  }
}

export default StorageService;
