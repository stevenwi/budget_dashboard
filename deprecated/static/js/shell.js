// Global configuration
const DASHBOARD_PAGE_SIZE = 6; // Number of budget cards per page

// Micro frontend mapping
const microFrontends = {
  dashboard: 'dashboard-home',
  budgets: 'budgets-list',
  transactions: 'transactions-table',
  recurring: 'recurring-manager',
  presets: 'presets-manager',
  trends: 'trends-view',
  viewBudget: 'view-budget',
  editBudget: 'edit-budget'
};
const allowedSections = Object.keys(microFrontends);
function setActiveNav(section) {
  document.querySelectorAll('#nav-mobile li').forEach(li => li.classList.remove('active'));
  if (section === 'dashboard') document.getElementById('nav-dashboard').classList.add('active');
  if (section === 'trends') document.getElementById('nav-trends').classList.add('active');
  if (section === 'presets') document.getElementById('nav-presets').classList.add('active');
}
function navigate(section, month) {
  // Input validation: whitelist only
  if (!allowedSections.includes(section)) {
    console.error('Invalid section:', section);
    section = 'dashboard'; // fallback to safe default
  }
  const root = document.getElementById('micro-frontend-root');
  root.innerHTML = '';
  try {
    const elementName = microFrontends[section];
    if (!customElements.get(elementName)) {
      throw new Error(`Component ${elementName} not loaded`);
    }
    let el;
    if (section === 'viewBudget' || section === 'editBudget') {
      // Month picker for budget view/edit
      const monthPicker = document.createElement('input');
      monthPicker.type = 'month';
      monthPicker.style = 'margin: 1em 0;';
      monthPicker.value = month || getCurrentMonth();
      root.appendChild(monthPicker);
      el = document.createElement(elementName);
      el.setAttribute('month', monthPicker.value);
      root.appendChild(el);
      monthPicker.addEventListener('change', () => {
        el.setAttribute('month', monthPicker.value);
      });
    } else {
      el = document.createElement(elementName);
      root.appendChild(el);
    }
    setActiveNav(section);
  } catch (error) {
    console.error('Navigation failed:', error);
    root.innerHTML = '<div class="card red lighten-4"><div class="card-content"><span class="red-text">Failed to load component. Please refresh the page.</span></div></div>';
  }
}

// Expose navigate globally
window.navigate = navigate;

// Load dashboard by default after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.navigate('dashboard');
});

function getCurrentMonth() {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}
