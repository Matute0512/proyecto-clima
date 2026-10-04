/**
 * SearchInput
 * 
 * Responsabilidad:
 * - Manejar el campo de búsqueda de la interfaz
 * - Validar texto ingresado y sanitizar espacios
 * - Gestionar eventos de teclado (tecla '/' para enfocar, Escape para limpiar)
 * - Controlar estado de deshabilitado durante cargas
 * - Principio GRASP: Information Expert de la entrada del usuario
 */
class SearchInput {
  /**
   * @param {Object} options
   * @param {HTMLFormElement} options.formElement 
   * @param {HTMLInputElement} options.inputElement 
   * @param {HTMLButtonElement} options.buttonElement 
   * @param {Function} options.onSearch - Callback al enviar búsqueda válida
   */
  constructor({ formElement, inputElement, buttonElement, onSearch }) {
    this.form = formElement;
    this.input = inputElement;
    this.button = buttonElement;
    this.onSearch = onSearch;

    this.init();
  }

  init() {
    if (!this.form || !this.input) return;

    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    this.attachShortcuts();
  }

  handleSubmit(event) {
    event.preventDefault();
    const city = this.getValue();

    if (this.onSearch) {
      this.onSearch(city);
    }
  }

  getValue() {
    return this.input ? this.input.value.trim() : '';
  }

  setValue(value) {
    if (this.input) {
      this.input.value = value;
    }
  }

  clear() {
    if (this.input) {
      this.input.value = '';
    }
  }

  focus() {
    if (this.input) {
      this.input.focus();
    }
  }

  setLoading(isLoading) {
    if (this.button) {
      this.button.disabled = isLoading;
      this.button.innerHTML = isLoading ? '⏳ Buscando...' : '🔍 Buscar';
    }
    if (this.input) {
      this.input.disabled = isLoading;
    }
  }

  /**
   * Atajos de teclado para mejorar la experiencia de usuario (UX):
   * - '/' enfoca el campo de búsqueda inmediatamente (estilo GitHub/Google)
   * - 'Escape' limpia el texto y quita el foco
   */
  attachShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Tecla '/' para enfocar el buscador si no estamos escribiendo en otro input
      if (event.key === '/' && document.activeElement !== this.input) {
        event.preventDefault();
        this.focus();
        this.input.select();
      }

      // Tecla 'Escape' para vaciar y quitar foco
      if (event.key === 'Escape' && document.activeElement === this.input) {
        this.clear();
        this.input.blur();
      }
    });
  }
}

export default SearchInput;
