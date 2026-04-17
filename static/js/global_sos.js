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

// ===== RED PULSE — AI CHATBOT SYSTEM =====
(function initAIChatbot() {
  if (document.getElementById('ai-chatbot-widget')) return;

  const chatHTML = `
    <div id="ai-chatbot-widget">
      <div class="ai-chat-btn" onclick="toggleChatWindow()">
        <span>✚</span>
      </div>
      <div class="ai-chat-window" id="ai-chat-window">
        <div class="ai-chat-header">
          <div>Red Pulse AI Assistant</div>
          <button onclick="toggleChatWindow()" style="background:none;border:none;color:white;cursor:pointer;font-size:16px;">✕</button>
        </div>
        <div class="ai-chat-messages" id="ai-chat-messages">
          <div class="chat-msg bot">Hello! I am the Red Pulse AI Assistant. I can help you register donors, request blood transfusions, or explain the SOS emergency system. How can I help you?</div>
        </div>
        <div class="ai-chat-input">
          <input type="text" id="ai-chat-input-text" placeholder="Type your question..." onkeypress="if(event.key === 'Enter') sendChatMessage()" />
          <button class="btn btn-primary" onclick="sendChatMessage()">Send</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  window.toggleChatWindow = function() {
    document.getElementById('ai-chat-window').classList.toggle('open');
  };

  window.sendChatMessage = function() {
    const inputEL = document.getElementById('ai-chat-input-text');
    const msg = inputEL.value.trim();
    if (!msg) return;

    appendMsg(msg, 'user');
    inputEL.value = '';

    // Simulated AI Processing
    setTimeout(() => {
      const lower = msg.toLowerCase();
      let reply = "I'm sorry, I don't understand that. You can ask me how to register a donor, request blood, or trigger an SOS alert.";
      
      if (lower.includes('register') || lower.includes('donor')) {
        reply = "To register a donor, navigate to the **Donor Base** tab. You'll need their Full Name, Phone, and Blood Type. Wait for the GPS scan to detect their location automatically for better SOS routing!";
      } else if (lower.includes('request') || lower.includes('need blood') || lower.includes('transfusion')) {
        reply = "You can request blood via the **Transfusions** page. For severe cases, ensure you select 'Critical' urgency so the system prioritizes it in the global queue.";
      } else if (lower.includes('sos') || lower.includes('emergency')) {
        reply = "The **Emergency SOS** system bypasses standard procedures! Triggering an SOS will immediately broadcast a live ping to all active users displaying a countdown timer and alerting nearby matching donors.";
      } else if (lower.includes('forecast') || lower.includes('ai')) {
        reply = "The Demand Forecast on the dashboard uses predictive algorithms to tell you how many units of a specific blood type you might need in the upcoming weeks.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        reply = "Greetings! How can I assist you with the Red Pulse medical network today?";
      }

      appendMsg(reply, 'bot');
    }, 600);
  };

  function appendMsg(text, sender) {
    const box = document.getElementById('ai-chat-messages');
    const el = document.createElement('div');
    el.className = `chat-msg ${sender}`;
    el.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
  }
})();
