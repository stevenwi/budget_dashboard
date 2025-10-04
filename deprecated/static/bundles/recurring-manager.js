class RecurringManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<section><h2>Recurring</h2><p>Manage recurring transactions here.</p></section>`;
  }
}
customElements.define('recurring-manager', RecurringManager);
