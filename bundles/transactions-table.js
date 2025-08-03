class TransactionsTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `<section><h2>Transactions</h2><p>Transaction history will appear here.</p></section>`;
  }
}
customElements.define('transactions-table', TransactionsTable);
