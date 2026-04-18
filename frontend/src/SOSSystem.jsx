import React, { useState } from 'react';

const SOSSystem = () => {
  const [form, setForm] = useState({
    blood_type: 'O-', units: 3, hospital_name: '', patient_name: '',
    contact_phone: '', lat: null, lng: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    // GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        () => {}
      );
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const autoFill = () => {
    setForm(prev => ({
      ...prev,
      blood_type: 'O-',
      units: 5,
      hospital_name: 'City Emergency Hospital',
      patient_name: 'CRITICAL PATIENT',
      contact_phone: '+91 9876543210'
    }));
  };

  const triggerSOS = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/sos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `🆘 SOS TRIGGERED — ${data.donors_alerted} donors alerted!` });
      } else {
        setResult({ type: 'error', msg: `❌ ${data.error}` });
      }
    } catch (err) {
      setResult({ type: 'error', msg: '❌ Network error.' });
    }
    setSubmitting(false);
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>

      <div className="dashboard-container">
        <div className="form-card" style={{ borderColor: 'var(--critical-color)', borderWidth: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div className="form-title" style={{ color: 'var(--critical-color)', margin: 0 }}>🆘 Emergency SOS System</div>
            <button className="btn" onClick={autoFill}
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#FFF', fontSize: '13px', padding: '8px 16px' }}>
              ⚡ Auto-Fill Demo
            </button>
          </div>
          <div className="form-subtitle">
            Triggering an SOS will immediately broadcast a live ping to all active users and alert nearby matching donors.
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

          <form onSubmit={triggerSOS}>
            <div className="form-grid">
              <div className="form-group">
                <label>Blood Type Needed</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange}>
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Units Required</label>
                <input name="units" type="number" min="1" max="20" value={form.units} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Hospital Name</label>
                <input name="hospital_name" value={form.hospital_name} onChange={handleChange} placeholder="Emergency location" required />
              </div>
              <div className="form-group">
                <label>Patient Name</label>
                <input name="patient_name" value={form.patient_name} onChange={handleChange} placeholder="Patient identity" />
              </div>
              <div className="form-group full">
                <label>Emergency Contact Phone</label>
                <input name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div className="form-group full" style={{ paddingTop: '8px' }}>
                <button type="submit" className="btn" disabled={submitting}
                  style={{
                    width: '100%', padding: '18px', fontSize: '18px', fontWeight: 800,
                    background: 'linear-gradient(135deg, #DC2626, #B91C1C)', color: '#FFF',
                    boxShadow: '0 8px 30px rgba(220, 38, 38, 0.4)',
                    animation: 'pulse-badge 2s infinite'
                  }}>
                  {submitting ? '⏳ BROADCASTING...' : '🆘 TRIGGER EMERGENCY SOS'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SOSSystem;
