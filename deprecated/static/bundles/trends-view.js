class TrendsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css">
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
      <div class="container">
        <h1 style="display:flex; align-items:center;">
          Spending Trends
          <div class="chip grey lighten-2 black-text" style="margin-left:8px; font-weight:600;">Trends</div>
        </h1>
        <div style="width: 100%; max-width: 800px; height: 400px; margin: 0 auto;">
          <canvas id="trendsChart"></canvas>
        </div>
        <div id="loading" style="text-align: center; margin: 2em;">
          <div class="preloader-wrapper small active">
            <div class="spinner-layer spinner-blue-only">
              <div class="circle-clipper left">
                <div class="circle"></div>
              </div>
              <div class="gap-patch">
                <div class="circle"></div>
              </div>
              <div class="circle-clipper right">
                <div class="circle"></div>
              </div>
            </div>
          </div>
          <p>Loading trends data...</p>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.loadTrends();
  }

  async loadTrends() {
    try {
      const response = await fetch('/api/trends');
      const trendsData = await response.json();
      
      this.shadowRoot.getElementById('loading').style.display = 'none';
      this.renderChart(trendsData);
    } catch (error) {
      console.error('Error loading trends:', error);
      this.shadowRoot.getElementById('loading').innerHTML = '<p style="color: red;">Error loading trends data</p>';
    }
  }

  renderChart(trendsData) {
    const canvas = this.shadowRoot.getElementById('trendsChart');
    const ctx = canvas.getContext('2d');
    
    const colors = {
      'Shopping': 'rgb(255, 99, 132)',
      'Utilities': 'rgb(54, 162, 235)', 
      'Home': 'rgb(255, 205, 86)',
      'Earnings': 'rgb(75, 192, 192)'
    };

    const datasets = Object.keys(trendsData.data).map(category => ({
      label: category,
      data: trendsData.data[category],
      borderColor: colors[category],
      backgroundColor: colors[category] + '40',
      tension: 0.1
    }));

    // Chart.js is available globally from the main document
    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: trendsData.months,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount ($)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Monthly Spending by Category'
          }
        }
      }
    });
  }
}
customElements.define('trends-view', TrendsView);
