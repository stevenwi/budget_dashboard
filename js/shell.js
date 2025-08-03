const microFrontends = {
  dashboard: 'dashboard-home',
  budgets: 'budgets-list',
  transactions: 'transactions-table',
  recurring: 'recurring-manager',
  presets: 'presets-manager',
  trends: 'trends-view'
};
const allowedSections = Object.keys(microFrontends);
function setActiveNav(section) {
  document.querySelectorAll('#nav-mobile li').forEach(li => li.classList.remove('active'));
  if (section === 'dashboard') document.getElementById('nav-dashboard').classList.add('active');
  if (section === 'trends') document.getElementById('nav-trends').classList.add('active');
  if (section === 'presets') document.getElementById('nav-presets').classList.add('active');
}
function navigate(section) {
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
    const el = document.createElement(elementName);
    root.appendChild(el);
    setActiveNav(section);
  } catch (error) {
    console.error('Navigation failed:', error);
    root.innerHTML = '<div class="card red lighten-4"><div class="card-content"><span class="red-text">Failed to load component. Please refresh the page.</span></div></div>';
  }
}
// Default to dashboard
navigate('dashboard');
