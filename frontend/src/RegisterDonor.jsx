import React, { useState, useEffect } from 'react';

const RegisterDonor = () => {
  const [form, setForm] = useState({
    name: '', blood_type: 'O+', phone: '', email: '', city: '',
    latitude: null, longitude: null
  });
  const [gpsStatus, setGpsStatus] = useState('Waiting for GPS...');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus('Scanning GPS...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          setGpsStatus(`📍 Located: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => setGpsStatus('⚠ GPS unavailable — enter location manually')
      );
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/donors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `✅ ${data.message} (ID: ${data.donor_id})` });
        setForm({ name: '', blood_type: 'O+', phone: '', email: '', city: '', latitude: form.latitude, longitude: form.longitude });
      } else {
        setResult({ type: 'error', msg: `❌ ${data.error}` });
      }
    } catch (err) {
      setResult({ type: 'error', msg: '❌ Network error. Is the backend running?' });
    }
    setSubmitting(false);
  };

  return (
    <div className="main-wrapper" style={{ overflowY: 'auto' }}>
      <div className="dashboard-container">
        <div className="form-card">
          <div className="form-title">Register New Donor</div>
          <div className="form-subtitle">Join the Red Pulse network and save lives. Your data is encrypted and secure.</div>
          
          <div className="gps-status" style={{
            background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '28px',
            fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ok-color)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ animation: form.latitude ? 'none' : 'pulse-dot 1.5s infinite alternate', width: 8, height: 8, borderRadius: '50%', background: form.latitude ? 'var(--ok-color)' : 'var(--pending-color)', display: 'inline-block' }}></span>
            {gpsStatus}
          </div>

          {result && (
            <div style={{
              padding: '14px 18px', borderRadius: '12px', marginBottom: '24px',
              background: result.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.type === 'success' ? 'var(--ok-color)' : 'var(--critical-color)'}`,
              color: result.type === 'success' ? 'var(--ok-color)' : 'var(--critical-color)',
              fontWeight: 600, fontSize: '14px'
            }}>
              {result.msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rohit Kumar" required />
              </div>
              <div className="form-group">
                <label>Blood Type</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange}>
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX" required />
              </div>
              <div className="form-group">
                <label>Email (Optional)</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
              </div>
              <div className="form-group full">
                <label>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Bengaluru" />
              </div>
              <div className="form-group full" style={{ paddingTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
                  {submitting ? '⏳ Registering...' : '🩸 Register Donor'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterDonor;
