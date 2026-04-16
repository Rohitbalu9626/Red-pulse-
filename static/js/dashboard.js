// ===== RED PULSE — DASHBOARD JS =====

const API = '';   // same origin
let forecastChart = null;

// ===== WEBSOCKET SETUP =====
const socket = io();

socket.on('connect', () => {
  document.getElementById('ws-dot').classList.add('connected');
  document.getElementById('ws-label').textContent = 'Live';
  showToast('Connected to Red Pulse server', 'success');
});

socket.on('disconnect', () => {
  document.getElementById('ws-dot').classList.remove('connected');
  document.getElementById('ws-label').textContent = 'Disconnected';
  showToast('Connection lost — retrying…', 'error');
});

socket.on('inventory_update', (data) => {
  showToast(`Inventory updated: ${data.blood_type} → ${data.units_available} units at bank #${data.bank_id}`, 'warning');
  loadInventory();
});

socket.on('new_request', (data) => {
  showToast(`New ${data.urgency_level} request: ${data.blood_type} at ${data.hospital_name}`, 'warning');
  loadActiveRequests();
  loadStats();
});

// sos_alert is now handled globally in global_sos.js

// ===== LOAD STATS =====
async function loadStats() {
  try {
    const [donors, requests, lowStock, banks] = await Promise.all([
      fetch(`${API}/api/donors`).then(r => r.json()),
      fetch(`${API}/api/requests/active`).then(r => r.json()),
      fetch(`${API}/api/inventory/low-stock`).then(r => r.json()),
      fetch(`${API}/api/banks`).then(r => r.json()),
    ]);
    document.getElementById('available-donors-count').textContent = donors.length;
    document.getElementById('active-requests-count').textContent = requests.length;
    document.getElementById('low-stock-count').textContent = lowStock.length;
    document.getElementById('banks-count').textContent = banks.length;
  } catch (e) {
    console.error('Stats load error:', e);
  }
}

// ===== LOAD INVENTORY =====
async function loadInventory() {
  try {
    const inv = await fetch(`${API}/api/inventory`).then(r => r.json());
    const grid = document.getElementById('blood-inventory-grid');
    
    // Aggregate all units by blood type across banks
    const totals = {};
    inv.forEach(item => {
      totals[item.blood_type] = (totals[item.blood_type] || 0) + item.units_available;
    });

    const types = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    grid.innerHTML = types.map(bt => {
      const units = totals[bt] || 0;
      const cls = units < 5 ? 'critical' : units <= 10 ? 'low' : 'ok';
      const emoji = units < 5 ? '🔴' : units <= 10 ? '🟡' : '🟢';
      return `
        <div class="blood-cell ${cls}">
          <div class="blood-type-label">${bt}</div>
          <div class="blood-units">
            ${emoji}<strong>${units}</strong>units
          </div>
        </div>`;
    }).join('');

    document.getElementById('last-updated-label').textContent =
      'Updated ' + new Date().toLocaleTimeString();
  } catch (e) {
    console.error('Inventory load error:', e);
  }
}

// ===== LOAD ACTIVE REQUESTS =====
async function loadActiveRequests() {
  try {
    const requests = await fetch(`${API}/api/requests/active`).then(r => r.json());
    const list = document.getElementById('active-requests-list');
    
    if (!requests.length) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No active requests.</p>';
      return;
    }

    list.innerHTML = requests.map(r => `
      <div class="request-item">
        <div class="req-blood-badge">${r.blood_type}</div>
        <div class="req-info">
          <div class="req-patient">${r.patient_name}</div>
          <div class="req-hospital">${r.hospital_name || 'Unknown Hospital'} • ${r.units_needed} units</div>
        </div>
        <span class="req-urgency urgency-${r.urgency_level}">${r.urgency_level}</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('Requests load error:', e);
  }
}

// ===== LOAD FORECAST =====
async function loadForecast(bloodType = 'O+') {
  try {
    const data = await fetch(`${API}/api/forecast/${encodeURIComponent(bloodType)}?days=7`).then(r => r.json());
    const labels = ['Day 1','Day 2','Day 3','Day 4','Day 5','Day 6','Day 7'];
    const values = data[`next_7_days`] || [];

    document.getElementById('forecast-recommendation').textContent = data.recommendation || '';

    const ctx = document.getElementById('forecast-chart').getContext('2d');
    if (forecastChart) forecastChart.destroy();

    forecastChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: `${bloodType} Demand Forecast`,
          data: values,
          backgroundColor: values.map(v => v >= 15 ? 'rgba(230,57,70,0.7)' : 'rgba(72,149,239,0.6)'),
          borderColor:  values.map(v => v >= 15 ? '#e63946' : '#4895ef'),
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f0f2f8', font: { family: 'Inter' } } },
          tooltip: { mode: 'index' }
        },
        scales: {
          x: { ticks: { color: '#8b93a8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#8b93a8' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
        }
      }
    });
  } catch (e) {
    console.error('Forecast load error:', e);
  }
}

// Local SOS overlay removed (handled globally)

// ===== TOAST UTILITY =====
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadInventory();
  loadActiveRequests();
  loadForecast('O+');

  // Refresh every 30s
  setInterval(() => {
    loadStats();
    loadInventory();
    loadActiveRequests();
  }, 30000);
});
