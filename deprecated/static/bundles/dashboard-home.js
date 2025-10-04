class DashboardHome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    
    // Create shared stylesheet for chip actions
    if (!window.sharedChipStyles) {
      window.sharedChipStyles = new CSSStyleSheet();
      window.sharedChipStyles.replaceSync(`
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
      `);
    }
    
    // Use constructed stylesheet for custom styles
    this.shadowRoot.adoptedStyleSheets = [window.sharedChipStyles];
    
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <div class="container">
        <div class="row" style="margin-bottom: 0;">
          <div class="col s12" style="display: flex; align-items: center; justify-content: space-between; padding: 20px 0;">
            <h1 style="margin: 0;">Budget Dashboard</h1>
            <div class="chip teal lighten-2 white-text chip-action" id="add-month-chip" style="cursor: pointer; font-weight: 600;">
              <i class="material-icons left" style="margin-right: 8px;">add</i>Add New Month
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
    this.bindEvents();
  }
  
  bindEvents() {
    // Add click handler for the Add New Month chip
    this.shadowRoot.getElementById('add-month-chip').addEventListener('click', () => {
      this.openAddMonthModal();
    });
  }
  
  openAddMonthModal() {
    // Create modal HTML
    const modalHTML = `
      <div id="add-month-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          position: relative;
          box-shadow: 0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.2);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <h5 style="margin: 0; color: #26a69a;">Add New Month</h5>
            <i class="material-icons" id="close-modal" style="cursor: pointer; color: #757575; font-size: 24px;">close</i>
          </div>
          
          <form id="add-month-form">
            <div class="input-field">
              <input type="month" id="month-picker" class="browser-default" required style="
                padding: 8px 0;
                border: none;
                border-bottom: 1px solid #9e9e9e;
                background: transparent;
                font-size: 1rem;
                width: 100%;
                outline: none;
                margin-bottom: 8px;
              ">
              <label for="month-picker" style="position: absolute; top: -20px; font-size: 12px; color: #26a69a;">Select Month</label>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px;">
              <button type="button" id="cancel-btn" class="btn-flat waves-effect waves-teal">Cancel</button>
              <button type="submit" class="btn waves-effect waves-light teal">
                <i class="material-icons left">add</i>Create
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Create modal element and add to document body (outside Shadow DOM)
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
    
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthPicker = modalElement.querySelector('#month-picker');
    monthPicker.value = currentMonth;
    
    // Add event listeners
    const closeModal = () => {
      document.body.removeChild(modalElement);
    };
    
    modalElement.querySelector('#close-modal').addEventListener('click', closeModal);
    modalElement.querySelector('#cancel-btn').addEventListener('click', closeModal);
    modalElement.querySelector('#add-month-modal').addEventListener('click', (e) => {
      if (e.target.id === 'add-month-modal') {
        closeModal();
      }
    });
    
    modalElement.querySelector('#add-month-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedMonth = monthPicker.value;
      if (selectedMonth) {
        // Use micro-frontend navigation
        if (window.navigate) {
          window.navigate('editBudget', selectedMonth);
        } else {
          window.location.href = `/edit/${selectedMonth}`;
        }
        closeModal();
        // Show success toast
        this.showToast('Budget created successfully!', 'teal');
      } else {
        // Show error toast instead of alert
        this.showToast('Please select a month', 'red');
      }
    });
  }
  
  showToast(message, colorClass = 'teal') {
    // Create toast element with Material Design styling
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${colorClass === 'red' ? '#f44336' : '#26a69a'};
        color: white;
        padding: 16px 24px;
        border-radius: 4px;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
        z-index: 10000;
        font-size: 14px;
        min-width: 288px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      ">${message}</div>
    `;
    
    document.body.appendChild(toast);
    const toastElement = toast.firstElementChild;
    
    // Animate in
    setTimeout(() => {
      toastElement.style.opacity = '1';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toastElement.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  renderDashboard() {
    fetch('/api/months')
      .then(res => res.json())
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
                <a href="#" class="chip chip-action" data-action="view" data-month="${item.month}">View</a>
                <a href="#" class="chip chip-action" data-action="edit" data-month="${item.month}">Edit</a>
              </div>
            </div>
          `;
          row.appendChild(col);
        });
        cardsContainer.appendChild(row);
        // Add event listeners for View/Edit chips
        row.querySelectorAll('.chip-action').forEach(btn => {
          btn.addEventListener('click', e => {
            e.preventDefault();
            const month = btn.getAttribute('data-month');
            const action = btn.getAttribute('data-action');
            if (window.navigate) {
              if (action === 'view') {
                window.navigate('viewBudget', month);
              } else if (action === 'edit') {
                window.navigate('editBudget', month);
              }
            }
          });
        });
        // Pagination logic
        const cards = Array.from(row.querySelectorAll('.month-card'));
        const pageSize = window.DASHBOARD_PAGE_SIZE || 6; // Fallback to 6 if not defined
        const totalPages = Math.ceil(cards.length / pageSize);
        let currentPage = 1;
        const pageInfo = this.shadowRoot.getElementById('page-info');
        const prevBtn = this.shadowRoot.getElementById('prev-page');
        const nextBtn = this.shadowRoot.getElementById('next-page');
        
        const showPage = (page) => {
          cards.forEach((card, idx) => {
            const pageIndex = Math.floor(idx / pageSize) + 1;
            card.style.display = (pageIndex === page) ? '' : 'none';
          });
          pageInfo.textContent = totalPages > 0 ? `Page ${page} of ${totalPages}` : 'No months yet';
          
          // Show/hide pagination controls based on total pages
          if (totalPages <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
          } else {
            prevBtn.style.display = '';
            nextBtn.style.display = '';
            prevBtn.style.opacity = currentPage > 1 ? '1' : '0.3';
            nextBtn.style.opacity = currentPage < totalPages ? '1' : '0.3';
          }
        };
        
        prevBtn.onclick = () => {
          if (currentPage > 1) { currentPage--; showPage(currentPage); }
        };
        nextBtn.onclick = () => {
          if (currentPage < totalPages) { currentPage++; showPage(currentPage); }
        };
        
        showPage(currentPage);
      });
  }
}
customElements.define('dashboard-home', DashboardHome);
