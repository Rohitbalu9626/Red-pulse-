import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const GlobalSOS = () => {
  const [triggered, setTriggered] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [timer, setTimer] = useState(7200);
  const timerRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO and listen for global sos_alert
    socketRef.current = io();
    
    socketRef.current.on('sos_alert', (data) => {
      setTriggered(true);
      setAlertData(data);
      startTimer();
      // Optional: Play a sound here or trigger system notification
      if (Notification.permission === "granted") {
        new Notification("🆘 URGENT SOS ALERT", {
          body: `${data.hospital_name || 'Emergency'} requires ${data.units || '?'} units of ${data.blood_type} blood!`,
          icon: '/logo.png' 
        });
      }
    });

    // Request notification permission if needed
    if (Notification.permission !== "denied") {
       Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = 7200;
    setTimer(remaining);
    timerRef.current = setInterval(() => {
      remaining--;
      setTimer(remaining);
      if (remaining <= 0) clearInterval(timerRef.current);
    }, 1000);
  };

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const dismissSOS = () => {
    setTriggered(false);
    setAlertData(null);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(7200);
  };

  if (!triggered) return null;

  return (
    <div className="sos-overlay visible" style={{ zIndex: 9999 }}>
      <div className="sos-card">
        <div className="sos-icon" style={{ animation: 'pulse-badge 1.5s infinite' }}>🆘</div>
        <div className="sos-title">GLOBAL SOS ALERT</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          {alertData?.hospital_name || 'Emergency Hospital'}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <span style={{ color: 'var(--critical-color)', fontWeight: 'bold' }}>{alertData?.blood_type}</span> blood • {alertData?.units} units needed
        </div>
        <div className="sos-timer">{formatTime(timer)}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>TIME REMAINING</div>
        
        {alertData?.distance && (
          <div style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--warning-color)' }}>
            Distance: {alertData.distance}
          </div>
        )}
        
        {alertData?.donors_alerted !== undefined && (
          <div style={{ fontSize: '16px', marginBottom: '20px' }}>
            <strong style={{ fontSize: '28px', color: 'var(--brand-pulse)' }}>{alertData.donors_alerted}</strong><br/>
            Donors Alerted
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" style={{ background: 'var(--ok-color)', color: '#FFF' }} onClick={dismissSOS}>✓ Can Donate NOW</button>
          <button className="btn btn-outline" onClick={dismissSOS}>Dismiss / Not Near</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSOS;
