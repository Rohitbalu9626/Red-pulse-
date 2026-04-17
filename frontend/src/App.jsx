import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import RegisterDonor from './RegisterDonor';
import BloodRequest from './BloodRequest';
import SOSSystem from './SOSSystem';
import Forecast from './Forecast';
import './index.css';

const tabs = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/register', icon: '👤', label: 'Register' },
  { to: '/request', icon: '💉', label: 'Request' },
  { to: '/sos', icon: '🆘', label: 'SOS' },
  { to: '/forecast', icon: '🔮', label: 'Forecast' },
];

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="bottom-tab-nav" id="bottom-nav">
      {tabs.map(tab => (
        <Link key={tab.to} to={tab.to} className={`tab-link ${path === tab.to ? 'active' : ''}`}>
          <div className="tab-icon">{tab.icon}</div>
          <div className="tab-label">{tab.label}</div>
        </Link>
      ))}
    </nav>
  );
};

const Header = () => {
  const [time, setTime] = useState('');
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const timer = setInterval(tick, 1000);

    fetch('/api/inventory/low-stock?threshold=5')
      .then(res => res.json())
      .then(data => setCriticalCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="luxury-navbar" id="top-navbar">
      <div className="brand">
        <div className="brand-pulse"></div>
        Red <span>Pulse</span>
      </div>
      <div className="navbar-right">
        <div className="real-time-clock">
          {time} <span className="clock-pulse"></span>
        </div>
        <div className="emergency-indicator">
          🔴 <span>{criticalCount}</span> CRITICAL
        </div>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <Header />
      <main className="main-wrapper" id="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<RegisterDonor />} />
          <Route path="/request" element={<BloodRequest />} />
          <Route path="/sos" element={<SOSSystem />} />
          <Route path="/forecast" element={<Forecast />} />
        </Routes>
      </main>
      <BottomNav />
    </Router>
  );
}

export default App;
