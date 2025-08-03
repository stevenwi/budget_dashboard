class BudgetsList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<section><h2>Budgets</h2><p>List of budgets will appear here.</p></section>`;
  }
}
customElements.define('budgets-list', BudgetsList);
