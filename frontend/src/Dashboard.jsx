import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_units: 0,
    critical_types: 0,
    available_donors: 0,
    active_requests: 0
  });

  const [inventory, setInventory] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Attempt to fetch initial data
    const fetchData = async () => {
      try {
        const invRes = await fetch('/api/inventory');
        let useFallback = true;
        
        if (invRes.ok) {
          const invData = await invRes.json();
          const items = Array.isArray(invData) ? invData : [];
          if (items.length > 0) {
            useFallback = false;
            setInventory(items.map(i => ({...i, total_units: i.units_available, status: i.units_available < 5 ? 'Critical' : 'OK'})));
            const total = items.reduce((acc, curr) => acc + (curr.units_available || 0), 0);
            setStats(prev => ({ ...prev, total_units: total, critical_types: items.filter(i => i.units_available < 5).length }));
          }
        }
        
        const reqRes = await fetch('/api/requests/active');
        if(reqRes.ok) {
           const reqData = await reqRes.json();
           const reqs = Array.isArray(reqData) ? reqData : [];
           if (reqs.length > 0 || !useFallback) {
             setStats(prev => ({...prev, active_requests: reqs.length}));
           }
        }

        if (useFallback) throw new Error("Database empty or API error, using visual fallbacks.");
      } catch (err) {
        console.log("Using visual fallback data:", err.message);
        // Fallback demo data
        setInventory([
          { blood_type: 'O-', total_units: 5, status: 'Critical' },
          { blood_type: 'O+', total_units: 32, status: 'OK' },
          { blood_type: 'A-', total_units: 12, status: 'OK' },
          { blood_type: 'A+', total_units: 45, status: 'OK' },
          { blood_type: 'B-', total_units: 2, status: 'Critical' },
          { blood_type: 'B+', total_units: 20, status: 'OK' }
        ]);
        setActivities([
          { icon: '🔴', title: 'SOS: Central Hospital', meta: 'Just now', type: 'urgent' },
          { icon: '🟢', title: 'Donor Registered', meta: '5 mins ago', type: 'fulfilled' }
        ]);
      }
    };

    fetchData();

    // Socket
    const socket = io('http://localhost:5000');
    socket.on('stats_update', (data) => {
      if (data.total_units !== undefined) setStats(prev => ({ ...prev, total_units: data.total_units }));
      if (data.active_requests !== undefined) setStats(prev => ({ ...prev, active_requests: data.active_requests }));
      if (data.available_donors !== undefined) setStats(prev => ({ ...prev, available_donors: data.available_donors }));
    });

    socket.on('inventory_update', (data) => {
      if(data.type === 'SINGLE_TYPE') {
        setInventory(prev => {
          const next = [...prev];
          const idx = next.findIndex(i => i.blood_type === data.blood_type);
          if(idx > -1) next[idx].total_units = data.total_units;
          return next;
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <>
      <div className="ecg-banner">
        <div className="ecg-title">Live System Rhythm</div>
        <div className="ecg-waveform">
          <svg className="ecg-svg" preserveAspectRatio="none" viewBox="0 0 1000 40">
            <path className="ecg-line" d="M0,20 L200,20 L210,10 L220,30 L230,20 L400,20 L420,-10 L440,50 L460,20 L650,20 L660,10 L670,30 L680,20 L850,20 L870,0 L890,40 L910,20 L1000,20" />
          </svg>
        </div>
        <div className="bpm-display">
          BPM <span className="bpm-val">72</span>
        </div>
      </div>

      <div className="dashboard-container">
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Units</div>
            <div className="stat-value">{stats.total_units}</div>
          </div>
          <div className="stat-card crimson">
            <div className="stat-label">Critical Protocols</div>
            <div className="stat-value" style={{color: 'var(--crimson)'}}>{stats.critical_types}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ready Donors</div>
            <div className="stat-value">{stats.available_donors}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Transfusions</div>
            <div className="stat-value">{stats.active_requests}</div>
          </div>
        </div>

        <div className="section-head">
          <div>Blood Inventory</div>
          <div className="section-meta">LIVE STOCK</div>
        </div>
        
        <div className="inventory-grid">
          {inventory.map((item, index) => (
            <div key={index} className={`blood-card ${item.status?.toLowerCase() || 'ok'}`}>
              <div className="pulse-ring"></div>
              <div className="blood-type">{item.blood_type}</div>
              <div className="blood-units-txt"><strong>{item.total_units}</strong> UNITS</div>
              <div className="fill-bar-bg">
                <div className="fill-bar-progress" style={{width: `${Math.min(100, item.total_units * 2)}%`}}></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bottom-grid">
          <div className="panel">
            <div className="section-head" style={{fontSize: '18px', paddingBottom: '12px', marginBottom: '16px'}}>
              <div>Live Activity</div>
              <div className="section-meta">FEED</div>
            </div>
            <div className="feed-list">
               {activities.map((act, i) => (
                 <div className="feed-item" key={i}>
                   <div className={`feed-icon ${act.type}`}>{act.icon}</div>
                   <div>
                     <div className="feed-title">{act.title}</div>
                     <div className="feed-meta">
                       <span className={`status-badge ${act.type}`}>{act.type}</span>
                       <span>{act.meta}</span>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="panel">
            <div className="section-head" style={{fontSize: '18px', paddingBottom: '12px', marginBottom: '16px', border: 'none', justifyContent: 'space-between', alignItems: 'center'}}>
               <span>Demand Forecast</span>
            </div>
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>
               [AI Forecast Chart - Placeholder]
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
