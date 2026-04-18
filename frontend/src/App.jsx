import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import RegisterDonor from './RegisterDonor';
import BloodRequest from './BloodRequest';
import SOSSystem from './SOSSystem';
import Forecast from './Forecast';
import GlobalSOS from './GlobalSOS';
import './index.css';

const tabs = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/register', icon: '👤', label: 'Register' },
  { to: '/request', icon: '💉', label: 'Request' },
  { to: '/sos', icon: '🆘', label: 'SOS' },
  { to: '/forecast', icon: '🔮', label: 'Forecast' },
];

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Red Pulse" className="brand-logo" />
        <div className="brand-text">RED <span>PULSE</span></div>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <Link key={tab.to} to={tab.to} className={`sidebar-link ${path === tab.to ? 'active' : ''}`}>
            <span className="sidebar-icon">{tab.icon}</span>
            <span className="sidebar-label">{tab.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-dot"></div> System Online
      </div>
    </aside>
  );
};

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
      <div className="mobile-brand-wrapper">
        <img src="/logo.png" alt="Logo" className="mobile-logo" />
        <div className="brand">
          Red <span>Pulse</span>
        </div>
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
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-area">
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
        </div>
        <GlobalSOS />
      </div>
    </Router>
  );
}

export default App;
