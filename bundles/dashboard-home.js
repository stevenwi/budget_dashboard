class DashboardHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <style>
        .chip-action {
          background: #fff !important;
          color: #000 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.18) !important;
          font-weight: 600 !important;
          border: none !important;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
          cursor: pointer;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 32px !important;
          line-height: 32px !important;
          padding: 0 16px !important;
          border-radius: 16px !important;
          text-transform: none !important;
          text-decoration: none !important;
          vertical-align: middle !important;
        }
        .chip-action:hover {
          background: #f2f2f2 !important;
          color: #222 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.28) !important;
          transform: translateY(-2px) scale(1.04);
        }
      </style>
      <div class="container">
        <h1>Budget Dashboard</h1>
        <div class="row">
          <div class="col s12 m6 l4">
            <div class="card z-depth-3">
              <div class="card-content">
                <h5 style="display:flex; align-items:center;">
                  Add New Month
                  <div class="chip teal lighten-2 white-text" style="margin-left:8px; font-weight:600;">New</div>
                </h5>
                <form id="new-month-form">
                  <div class="input-field">
                    <input id="new_month" type="text" placeholder="YYYY-MM" required>
                  </div>
                  <button type="submit" class="btn">Create</button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="row" id="month-cards"></div>
        <div class="row center-align">
          <a id="prev-page" class="btn-floating btn-small waves-effect waves-light">
            <i class="material-icons">chevron_left</i>
          </a>
          <span id="page-info" style="margin: 0 1em;"></span>
          <a id="next-page" class="btn-floating btn-small waves-effect waves-light">
            <i class="material-icons">chevron_right</i>
          </a>
        </div>
      </div>
    `;
  }
  connectedCallback() {
    this.renderDashboard();
    // Always re-bind the new month form event
    this.shadowRoot.getElementById('new-month-form').addEventListener('submit', e => {
      e.preventDefault();
      const month = this.shadowRoot.getElementById('new_month').value;
      if (month) {
        window.location.href = `/edit_budget/${month}`;
      }
    });
  }

  renderDashboard() {
    fetch('/api/months')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch data');
        return res.json();
      })
      .then(months => {
        const cardsContainer = this.shadowRoot.getElementById('month-cards');
        cardsContainer.innerHTML = '';
        // Create a .row container for cards
        const row = document.createElement('div');
        row.className = 'row';
        months.forEach(item => {
          const col = document.createElement('div');
          col.className = 'col s12 m6 l4 month-card';
          col.innerHTML = `
            <div class="card z-depth-3">
              <div class="card-content">
                <span class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                  <span>${item.month}</span>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="chip blue lighten-4 black-text">Earnings: $${item.earnings.toFixed(2)}</div>
                    ${item.status === 'under' ? '<div class="chip teal lighten-2 white-text">Under Budget</div>' : '<div class="chip red white-text">Over Budget</div>'}
                  </div>
                </span>
                <div style="display: flex; justify-content: space-between;">
                  <p><strong>Budget:</strong> $${item.budget_total.toFixed(2)}</p>
                  <p><strong>Earnings:</strong> $${item.earnings.toFixed(2)}</p>
                </div>
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:8px 0;">
                  <span><strong>${item.budget_total.toFixed(2)}</strong></span>
                  <i class="material-icons">remove</i>
                  <span><strong>${item.spent_total.toFixed(2)}</strong></span>
                  <i class="material-icons">drag_handle</i>
                  <span><strong>${item.diff.toFixed(2)}</strong></span>
                </div>
              </div>
              <div class="card-action">
                <a href="/view/${item.month}" class="chip chip-action">View</a>
                <a href="/edit/${item.month}" class="chip chip-action">Edit</a>
              </div>
            </div>
          `;
          row.appendChild(col);
        });
        cardsContainer.appendChild(row);
        // Pagination logic
        const cards = Array.from(row.querySelectorAll('.month-card'));
        const pageSize = 3;
        const totalPages = Math.ceil(cards.length / pageSize);
        let currentPage = 1;
        const pageInfo = this.shadowRoot.getElementById('page-info');
        const showPage = (page) => {
          cards.forEach((card, idx) => {
            const pageIndex = Math.floor(idx / pageSize) + 1;
            card.style.display = (pageIndex === page) ? '' : 'none';
          });
          pageInfo.textContent = 'Page ' + page + ' of ' + totalPages;
        };
        this.shadowRoot.getElementById('prev-page').onclick = () => {
          if (currentPage > 1) { currentPage--; showPage(currentPage); }
        };
        this.shadowRoot.getElementById('next-page').onclick = () => {
          if (currentPage < totalPages) { currentPage++; showPage(currentPage); }
        };
        showPage(currentPage);
      })
      .catch(err => {
        const cardsContainer = this.shadowRoot.getElementById('month-cards');
        cardsContainer.innerHTML = '<p style="color: red;">Failed to load data. Please try again later.</p>';
        console.error(err);
      });
  }
}
customElements.define('dashboard-home', DashboardHome);
