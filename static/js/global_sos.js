// ===== RED PULSE — GLOBAL SOS ALERTS =====

(function initGlobalSOS() {
  // Inject HTML for the SOS overlay into the body if it doesn't exist
  if (!document.getElementById('global-sos-overlay')) {
    const overlayHTML = `
      <div class="sos-overlay" id="global-sos-overlay">
        <div class="sos-card">
          <div class="sos-icon">🆘</div>
          <div class="sos-title">SOS ALERT</div>
          <div class="sos-hospital" id="global-sos-hospital-name">Hospital Name</div>
          <div class="sos-detail" id="global-sos-detail">Blood type • Units needed</div>
          <div class="sos-timer" id="global-sos-timer">02:00:00</div>
          <div class="sos-timer-label">TIME REMAINING</div>
          <div class="sos-counter">
            <strong id="global-sos-response-count">0</strong>
            Donors Responded
          </div>
          <div class="sos-actions">
            <button class="btn btn-success" onclick="closeGlobalSOS()">✓ Coordinate Response</button>
            <button class="btn btn-outline" onclick="closeGlobalSOS()">Dismiss</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
  }

  let globalSosTimerInterval = null;

  // Initialize socket.io globally if not already available
  // Assume window.socket might be initialized by dashboard.js, but let's use our own for isolation if needed
  const globalSocket = window.socket || io();

  globalSocket.on('sos_alert', (data) => {
    openGlobalSOS(data);
    
    // Attempt to show banner if it exists (like in dashboard)
    const banner = document.getElementById('sos-banner');
    const bannerText = document.getElementById('sos-banner-text');
    if (banner && bannerText) {
      banner.classList.add('show');
      bannerText.textContent = `🆘 SOS: ${data.units} units of ${data.blood_type} needed at ${data.hospital_name}`;
    }

    // Play an emergency ping (optional enhancement)
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // short alert beep
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch(e) {}
  });

  window.openGlobalSOS = function(data) {
    document.getElementById('global-sos-hospital-name').textContent = data.hospital_name || 'Emergency Hospital';
    document.getElementById('global-sos-detail').textContent = `${data.blood_type} blood • ${data.units} units needed`;
    document.getElementById('global-sos-overlay').classList.add('visible');
    
    if (globalSosTimerInterval) clearInterval(globalSosTimerInterval);
    startGlobalSOSTimer(7200); // 2-hour countdown
  };

  window.closeGlobalSOS = function() {
    document.getElementById('global-sos-overlay').classList.remove('visible');
    if (globalSosTimerInterval) clearInterval(globalSosTimerInterval);
  };

  function startGlobalSOSTimer(seconds) {
    const el = document.getElementById('global-sos-timer');
    let remaining = seconds;
    globalSosTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) { clearInterval(globalSosTimerInterval); el.textContent = '00:00:00'; return; }
      const h = String(Math.floor(remaining / 3600)).padStart(2, '0');
      const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }
})();

