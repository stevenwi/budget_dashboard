class TrendsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<section><h2>Trends</h2><p>Trends and analytics will appear here.</p></section>`;
  }
}
customElements.define('trends-view', TrendsView);
