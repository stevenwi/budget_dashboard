import { Component, h, State } from '@stencil/core';

interface MonthItem {
  month: string;
  budget_total: number;
  spent_total: number;
  earnings: number;
  diff: number;
  status: 'under' | 'over';
}

@Component({
  tag: 'dashboard-home',
  styleUrls: [
    'dashboard-home.css'
  ],
  shadow: true
})
export class DashboardHome {
  @State() months: MonthItem[] = [];
  @State() currentPage: number = 1;
  @State() showModal: boolean = false;
  @State() selectedMonth: string = '';

  private pageSize = 6;

  async componentWillLoad() {
    await this.loadMonths();
    // Set default month to current month
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  async loadMonths() {
    try {
      const response = await fetch('http://localhost:5000/api/months');
      this.months = await response.json();
    } catch (error) {
      console.error('Failed to load months:', error);
    }
  }

  openAddMonthModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  handleMonthChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedMonth = target.value;
  }

  async handleAddMonth(event: Event) {
    event.preventDefault();
    if (this.selectedMonth) {
      // Navigate to edit budget for new month using Angular Router
      window.location.href = `/edit-budget/${this.selectedMonth}`;
      this.closeModal();
      this.showToast('Budget created successfully!', 'success');
    } else {
      this.showToast('Please select a month', 'error');
    }
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    const backgroundColor = type === 'error' ? '#f44336' : '#26a69a';

    toast.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${backgroundColor};
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
    const toastElement = toast.firstElementChild as HTMLElement;

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


  get totalPages() {
    return Math.ceil(this.months.length / this.pageSize);
  }

  get paginatedMonths() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.months.slice(startIndex, startIndex + this.pageSize);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  render() {
    return (
      <div class="container">
        <div class="row" style={{'margin-bottom': '0'}}>
          <div class="col s12" style={{display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', padding: '20px 0'}}>
            <h1 style={{margin: '0'}}>Budget Dashboard</h1>
            <div
              class="chip teal lighten-2 white-text chip-action"
              style={{cursor: 'pointer', 'font-weight': '600'}}
              onClick={() => this.openAddMonthModal()}
            >
              <i class="material-icons left" style={{'margin-right': '8px'}}>add</i>
              Add New Month
            </div>
          </div>
        </div>

        <div class="row">
          {this.paginatedMonths.map(item => (
            <div class="col s12 m6 l4">
              <div class="card z-depth-3">
                <div class="card-content">
                  <span class="card-title" style={{display: 'flex', 'justify-content': 'space-between', 'align-items': 'center'}}>
                    <span>{item.month}</span>
                    <div style={{display: 'flex', 'align-items': 'center', gap: '8px'}}>
                      <div class="chip blue lighten-4 black-text">Earnings: ${item.earnings.toFixed(2)}</div>
                      {item.status === 'under' ?
                        <div class="chip teal lighten-2 white-text">Under Budget</div> :
                        <div class="chip red white-text">Over Budget</div>
                      }
                    </div>
                  </span>
                  <div style={{display: 'flex', 'justify-content': 'space-between'}}>
                    <p><strong>Budget:</strong> ${item.budget_total.toFixed(2)}</p>
                    <p><strong>Earnings:</strong> ${item.earnings.toFixed(2)}</p>
                  </div>
                  <div style={{display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: '8px', margin: '8px 0'}}>
                    <span><strong>{item.budget_total.toFixed(2)}</strong></span>
                    <i class="material-icons">remove</i>
                    <span><strong>{item.spent_total.toFixed(2)}</strong></span>
                    <i class="material-icons">drag_handle</i>
                    <span><strong>{item.diff.toFixed(2)}</strong></span>
                  </div>
                </div>
                <div class="card-action">
                  <a href={`/view-budget/${item.month}`} class="chip chip-action">View</a>
                  <a href={`/edit-budget/${item.month}`} class="chip chip-action">Edit</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {this.totalPages > 1 && (
          <div class="row center-align">
            <a class="btn-floating btn-small waves-effect waves-light"
               style={{opacity: this.currentPage > 1 ? '1' : '0.3'}}
               onClick={() => this.previousPage()}>
              <i class="material-icons">chevron_left</i>
            </a>
            <span style={{margin: '0 1em'}}>
              {this.totalPages > 0 ? `Page ${this.currentPage} of ${this.totalPages}` : 'No months yet'}
            </span>
            <a class="btn-floating btn-small waves-effect waves-light"
               style={{opacity: this.currentPage < this.totalPages ? '1' : '0.3'}}
               onClick={() => this.nextPage()}>
              <i class="material-icons">chevron_right</i>
            </a>
          </div>
        )}

        {this.showModal && (
          <div class="modal-overlay" onClick={() => this.closeModal()}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <div class="modal-header">
                <h5>Add New Month</h5>
                <i class="material-icons close-icon" onClick={() => this.closeModal()}>close</i>
              </div>

              <form onSubmit={(e) => this.handleAddMonth(e)}>
                <div class="input-field">
                  <input
                    type="month"
                    value={this.selectedMonth}
                    onInput={(e) => this.handleMonthChange(e)}
                    class="browser-default month-input"
                    required
                  />
                  <label class="month-label">Select Month</label>
                </div>

                <div class="modal-actions">
                  <button type="button" class="btn-flat waves-effect waves-teal" onClick={() => this.closeModal()}>
                    Cancel
                  </button>
                  <button type="submit" class="btn waves-effect waves-light teal">
                    <i class="material-icons left">add</i>Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
}

declare global {
  interface Window {
    navigate: (route: string, param?: string) => void;
  }
}