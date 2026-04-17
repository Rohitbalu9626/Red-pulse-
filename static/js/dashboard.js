// ===== RED PULSE — LUXURY DASHBOARD JS =====

const API = '';   // same origin
let forecastChart = null;
let currentBpm = 72;

// ===== CLOCK & ECG =====
function initRealtimeDetails() {
  const clockEl = document.getElementById('live-clock');
  setInterval(() => {
    const now = new Date();
    clockEl.innerHTML = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} <span class="clock-pulse"></span>`;
    
    // Randomize BPM slightly
    if (Math.random() > 0.7) {
      currentBpm = Math.max(60, Math.min(100, currentBpm + (Math.random() > 0.5 ? 1 : -1)));
      document.getElementById('bpm-val').textContent = currentBpm;
    }
  }, 1000);
}

// ===== WEBSOCKET SETUP =====
const socket = io();

socket.on('connect', () => {
  showToast('Connected to Red Pulse Heartbeat', 'success');
});

socket.on('disconnect', () => {
  showToast('Connection lost — checking vitals…', 'error');
});

socket.on('inventory_update', (data) => {
  loadInventory();
  addToFeed(`Inventory Updated: ${data.blood_type}`, `Bank #${data.bank_id} reported ${data.units_available} units`, 'fulfilled');
});

socket.on('new_request', (data) => {
  loadActiveRequests();
  loadStats();
  addToFeed(`Request: ${data.blood_type}`, `${data.hospital_name || 'Hospital'} needs ${data.units_needed} units`, 'urgent');
});

// ===== LOAD STATS =====
async function loadStats() {
  try {
    const [donors, requests, lowStock] = await Promise.all([
      fetch(`${API}/api/donors`).then(r => r.json()),
      fetch(`${API}/api/requests/active`).then(r => r.json()),
      fetch(`${API}/api/inventory/low-stock`).then(r => r.json())
    ]);
    
    document.getElementById('available-donors-count').textContent = donors.length;
    document.getElementById('active-requests-count').textContent = requests.length;
    
    // Calculate critical types from low stock count (deduplicating blood types)
    const criticalTypes = new Set(lowStock.map(l => l.blood_type)).size;
    document.getElementById('critical-types-count').textContent = criticalTypes;
    
    // Critical alert count in sidebar
    const urgentRequests = requests.filter(r => r.urgency_level.toLowerCase() === 'critical' || r.urgency_level.toLowerCase() === 'urgent').length;
    document.getElementById('critical-alert-count').textContent = urgentRequests;
    
  } catch (e) {
    console.error('Stats load error:', e);
  }
}

// ===== LOAD INVENTORY =====
async function loadInventory() {
  try {
    const inv = await fetch(`${API}/api/inventory`).then(r => r.json());
    const grid = document.getElementById('blood-inventory-grid');
    
    // Aggregate absolute total
    let totalUnits = 0;
    const totals = {};
    inv.forEach(item => {
      totals[item.blood_type] = (totals[item.blood_type] || 0) + item.units_available;
      totalUnits += item.units_available;
    });

    // Update total units stat card
    document.getElementById('total-units-count').textContent = totalUnits;

    const types = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    grid.innerHTML = types.map(bt => {
      const units = totals[bt] || 0;
      const cls = units < 5 ? 'critical' : units <= 15 ? 'low' : 'ok';
      let fillPct = (units / 50) * 100;
      if(fillPct > 100) fillPct = 100;
      if(fillPct < 5) fillPct = 5; // minimum visible level
      
      const pulseHtml = cls === 'critical' ? `<div class="pulse-ring"></div>` : '';
      
      return `
        <div class="blood-card ${cls}">
          ${pulseHtml}
          <div class="blood-type">${bt}</div>
          <div class="blood-units-txt"><strong>${units}</strong> UNITS</div>
          <div class="fill-bar-bg">
            <div class="fill-bar-progress" style="width: ${fillPct}%"></div>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    console.error('Inventory load error:', e);
  }
}

// ===== LOAD ACTIVITY FEED & ACTIVE REQUESTS =====
let initFeedLoaded = false;
async function loadActiveRequests() {
  try {
    const requests = await fetch(`${API}/api/requests/active`).then(r => r.json());
    
    if(!initFeedLoaded) {
      const feed = document.getElementById('activity-feed');
      feed.innerHTML = '';
      
      if (!requests.length) {
        feed.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No recent activity.</p>';
        return;
      }

      // Populate initial feed with active requests (cap to 5)
      requests.slice(0, 5).forEach(r => {
        let statusCls = 'pending';
        if(r.urgency_level === 'Critical' || r.urgency_level === 'urgent') statusCls = 'urgent';
        
        addToFeed(`Request: ${r.blood_type}`, `${r.hospital_name || 'Clinic'} • ${r.units_needed} units`, statusCls, false);
      });
      initFeedLoaded = true;
    }
  } catch (e) {
    console.error('Requests load error:', e);
  }
}

function addToFeed(title, subtitle, statusClass, prepend=true) {
  const feed = document.getElementById('activity-feed');
  const icons = { 'urgent': '🚨', 'pending': '⏳', 'fulfilled': '✅' };
  const icon = icons[statusClass] || '💉';
  
  const h = `
    <div class="feed-item">
      <div class="feed-icon ${statusClass}">${icon}</div>
      <div class="feed-content">
        <div class="feed-title">${title}</div>
        <div class="feed-meta">
          <span>${subtitle}</span>
          <span class="status-badge ${statusClass}">${statusClass}</span>
        </div>
      </div>
    </div>
  `;
  if(prepend) {
    feed.insertAdjacentHTML('afterbegin', h);
  } else {
    feed.insertAdjacentHTML('beforeend', h);
  }
}

// ===== LOAD FORECAST =====
async function loadForecast(bloodType = 'O+') {
  try {
    const data = await fetch(`${API}/api/forecast/${encodeURIComponent(bloodType)}?days=7`).then(r => r.json());
    const labels = ['D1','D2','D3','D4','D5','D6','D7'];
    const values = data[`next_7_days`] || [];

    const ctx = document.getElementById('forecast-chart').getContext('2d');
    if (forecastChart) forecastChart.destroy();

    forecastChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Demand Forecast (${bloodType})`,
          data: values,
          backgroundColor: 'rgba(210, 0, 26, 0.1)',
          borderColor: '#D2001A',
          borderWidth: 2,
          pointBackgroundColor: '#18181A',
          pointBorderColor: '#D2001A',
          pointBorderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index' }
        },
        scales: {
          x: { ticks: { color: '#A0A0A0', font: { family: 'DM Mono' } }, grid: { display: false } },
          y: { ticks: { color: '#A0A0A0', font: { family: 'DM Mono' } }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
        }
      }
    });
  } catch (e) {
    console.error('Forecast load error:', e);
  }
}

// ===== TOAST UTILITY =====
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  let color = type === 'error' || type === 'critical' ? '#FF2A2A' : type === 'success' ? '#00E676' : '#FFAB00';
  
  toast.style.cssText = `
    background: #18181A; border-left: 4px solid ${color};
    color: #F0F0F0; padding: 12px 20px; font-family: 'DM Mono', monospace; font-size: 13px;
    border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    animation: fade-in 0.3s ease;
  `;
  toast.innerHTML = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initRealtimeDetails();
  loadStats();
  loadInventory();
  loadActiveRequests();
  loadForecast('O+');

  // Background refresh
  setInterval(() => {
    loadStats();
    loadInventory();
  }, 30000); // 30s stat refresh
});
