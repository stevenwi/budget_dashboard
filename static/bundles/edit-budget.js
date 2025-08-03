class EditBudget extends HTMLElement {
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
      const res = await fetch(`/api/edit_budget/${encodeURIComponent(this.month)}`);
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
    this.shadowRoot.innerHTML = `<div class="card"><div class="card-content">Loading budget editor...</div></div>`;
  }

  renderError() {
    this.shadowRoot.innerHTML = `<div class="card red lighten-4"><div class="card-content"><span class="red-text">Failed to load budget. Please try again later.</span></div></div>`;
  }

  render() {
    if (!this.data) return;
    const { month, budget } = this.data;
    let html = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <link rel="stylesheet" href="/static/css/shell.css">
      <style>
        /* Other component-specific styles can remain here if needed */
      </style>
      <div class="container">
        <div class="row">
          <div class="col s12 m8 offset-m2">
            <div class="card z-depth-3">
              <div class="card-content">
                <span class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>Edit Budget for ${month}</span>
                </span>
                <form id="edit-budget-form">
                  <div id="budget-fields">
                    ${['Shopping', 'Utilities', 'Home', 'Earnings'].map(cat => {
                      const subs = budget[cat] || {};
                      return `<fieldset><legend>${cat}</legend>` +
                        (Object.keys(subs).length > 0 ?
                          `<table class="highlight responsive-table"><tr><th>Subcategory</th><th>Amount</th></tr>` +
                          Object.entries(subs).map(([sub, amt]) =>
                            `<tr><td>${sub}</td><td><input name="${cat}__${sub}" value="${amt}" /></td></tr>`
                          ).join('') +
                          `</table>` : '') +
                        `<p>Add / edit subcategory:</p>
                        <div id="${cat}-inputs">
                          <input placeholder="Name" class="sub-name">
                          <input placeholder="Amount" class="sub-amt">
                          <button type="button" class="chip chip-action" data-cat="${cat}"><i class="material-icons left">add</i>Add</button>
                        </div></fieldset><hr/>`;
                    }).join('')}
                  </div>
                  <button type="submit" class="chip chip-action"><i class="material-icons left">save</i>Save Budget</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.shadowRoot.innerHTML = html;
    this.addEventListeners();
  }

  addEventListeners() {
    const form = this.shadowRoot.getElementById('edit-budget-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
          const res = await fetch(`/api/edit_budget/${encodeURIComponent(this.month)}`, {
            method: 'POST',
            body: formData
          });
          if (!res.ok) throw new Error('Failed to save budget');
          this.fetchData(); // reload after save
        } catch (err) {
          this.error = err;
          this.renderError();
        }
      };
    }
    // Add subcategory buttons
    for (const cat of ['Shopping', 'Utilities', 'Home', 'Earnings']) {
      const btn = this.shadowRoot.querySelector(`#${cat}-inputs button`);
      if (btn) {
        btn.onclick = () => {
          const container = this.shadowRoot.getElementById(`${cat}-inputs`);
          const nameInput = container.querySelector('.sub-name');
          const amtInput = container.querySelector('.sub-amt');
          if (nameInput.value.trim() && amtInput.value.trim()) {
            // Add new input row to the table
            let table = container.parentElement.querySelector('table');
            if (!table) {
              table = document.createElement('table');
              table.innerHTML = '<tr><th>Subcategory</th><th>Amount</th></tr>';
              container.parentElement.insertBefore(table, container);
            }
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${nameInput.value}</td><td><input name="${cat}__${nameInput.value}" value="${amtInput.value}" /></td>`;
            table.appendChild(tr);
            nameInput.value = '';
            amtInput.value = '';
          }
        };
      }
    }
  }
}
customElements.define('edit-budget', EditBudget);
