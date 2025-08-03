class PresetsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<section><h2>Presets</h2><p>Manage presets here.</p></section>`;
  }
}
customElements.define('presets-manager', PresetsManager);
