class ViewBudget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.month = null;
    this.data = null;
    this.error = null;
  }

  static get observedAttributes() {
    return ['month'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'month' && newVal !== oldVal) {
      this.month = newVal;
      this.fetchData();
    }
  }

  connectedCallback() {
    if (!this.month) {
      this.month = this.getAttribute('month');
    }
    this.fetchData();
  }

  async fetchData() {
    if (!this.month) return;
    this.renderLoading();
    try {
      const res = await fetch(`/api/view_budget/${encodeURIComponent(this.month)}`);
      if (!res.ok) throw new Error('Failed to fetch budget data');
      this.data = await res.json();
      this.error = null;
      this.render();
    } catch (err) {
      this.error = err;
      this.renderError();
    }
  }

  renderLoading() {
    this.shadowRoot.innerHTML = `<div class="card"><div class="card-content">Loading budget...</div></div>`;
  }

  renderError() {
    this.shadowRoot.innerHTML = `<div class="card red lighten-4"><div class="card-content"><span class="red-text">Failed to load budget. Please try again later.</span></div></div>`;
  }

  render() {
    if (!this.data) return;
    const { month, budget, spent, total_budget, total_spent, total_diff } = this.data;
    let html = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <div class="container">
        <div class="row">
          <div class="col s12 m8 offset-m2">
            <div class="card z-depth-3">
              <div class="card-content">
                <span class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Budget vs Spending for ${month}</span>
                </span>
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:8px 0;">
                  <span><strong>$${total_budget.toFixed(2)}</strong></span>
                  <i class="material-icons">remove</i>
                  <span><strong>$${total_spent.toFixed(2)}</strong></span>
                  <i class="material-icons">drag_handle</i>
                  <span><strong>$${total_diff.toFixed(2)}</strong></span>
                </div>
                <div style="margin-bottom:1em;"></div>
                ${(!budget || Object.keys(budget).length === 0)
                  ? `<p>No budget defined for this month.</p>`
                  : `<table class="highlight responsive-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Subcategory</th>
                          <th>Budget</th>
                          <th>Actual</th>
                          <th>Difference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${Object.entries(budget).map(([cat, subs]) =>
                          Object.entries(subs).map(([sub, budget_amt]) => {
                            const actual_amt = (spent[cat] && spent[cat][sub]) ? spent[cat][sub] : 0;
                            const diff = budget_amt - actual_amt;
                            const status = diff >= 0 ? 'Under' : 'Over';
                            return `<tr>
                              <td>${cat}</td>
                              <td>${sub}</td>
                              <td>$${budget_amt.toFixed(2)}</td>
                              <td>$${actual_amt.toFixed(2)}</td>
                              <td>$${diff.toFixed(2)}</td>
                              <td><span class="chip ${status === 'Under' ? 'green lighten-4 green-text' : 'red lighten-4 red-text'}">${status} Budget</span></td>
                            </tr>`;
                          }).join('')
                        ).join('')}
                      </tbody>
                    </table>`}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.innerHTML = html;
  }
}
customElements.define('view-budget', ViewBudget);
