// ===== RED PULSE — LIVE MAP =====

let map = null;
let donorMarkers = [];
let bankMarkers = [];

function initMap() {
  // Default center: New Delhi
  map = L.map('live-map', { zoomControl: true, attributionControl: false }).setView([28.6139, 77.2090], 11);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CartoDB', maxZoom: 19
  }).addTo(map);

  loadBankMarkers();
  loadDonorMarkers();
}

// Custom icons
function makeIcon(color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color}; width:32px; height:32px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:14px; border:2px solid white;
      box-shadow: 0 0 10px ${color}88;">
      ${emoji}
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

async function loadBankMarkers() {
  try {
    const [banks, inventory] = await Promise.all([
      fetch('/api/banks').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
    ]);

    // Aggregate inventory totals per bank
    const bankTotals = {};
    inventory.forEach(i => {
      bankTotals[i.bank_id] = (bankTotals[i.bank_id] || 0) + i.units_available;
    });

    // Clear old markers
    bankMarkers.forEach(m => m.remove());
    bankMarkers = [];

    banks.forEach(bank => {
      if (!bank.latitude || !bank.longitude) return;
      const total = bankTotals[bank.id] || 0;
      const color = total < 20 ? '#e63946' : total < 60 ? '#f4a261' : '#2dc653';
      const marker = L.marker([bank.latitude, bank.longitude], {
        icon: makeIcon(color, '🏥')
      }).addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px;">
            <strong style="font-size:14px;">${bank.name}</strong><br>
            <span style="color:#8b93a8;font-size:12px;">${bank.city}</span><br>
            <span style="color:${color};font-weight:700;font-size:13px;">Total Stock: ${total} units</span><br>
            <span style="font-size:12px;">${bank.contact_number || ''}</span>
          </div>`);
      bankMarkers.push(marker);
    });
  } catch (e) { console.error('Bank markers error:', e); }
}

async function loadDonorMarkers() {
  try {
    const donors = await fetch('/api/donors').then(r => r.json());

    donorMarkers.forEach(m => m.remove());
    donorMarkers = [];

    donors.forEach(donor => {
      if (!donor.latitude || !donor.longitude) return;
      const marker = L.marker([donor.latitude, donor.longitude], {
        icon: makeIcon('#4895ef', '🩸')
      }).addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;">
            <strong>${donor.name}</strong><br>
            <span style="font-size:13px;color:#e63946;font-weight:700;">${donor.blood_type}</span><br>
            <span style="font-size:12px;color:#8b93a8;">${donor.city || ''}</span>
          </div>`);
      donorMarkers.push(marker);
    });
  } catch (e) { console.error('Donor markers error:', e); }
}

// Refresh donor locations every 30s
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  setInterval(loadDonorMarkers, 30000);
  setInterval(loadBankMarkers, 60000);
});
