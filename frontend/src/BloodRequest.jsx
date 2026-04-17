import React, { useState } from 'react';

const BloodRequest = () => {
  const [form, setForm] = useState({
    patient_name: '', blood_type: 'O+', units_needed: 1,
    hospital_name: '', urgency_level: 'medium', requester_phone: '',
    hospital_latitude: null, hospital_longitude: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/requests/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', msg: `✅ ${data.message} (Request #${data.request_id})` });
        setForm({ patient_name: '', blood_type: 'O+', units_needed: 1, hospital_name: '', urgency_level: 'medium', requester_phone: '', hospital_latitude: null, hospital_longitude: null });
      } else {
        setResult({ type: 'error', msg: `❌ ${data.error}` });
      }
    } catch (err) {
      setResult({ type: 'error', msg: '❌ Network error.' });
    }
    setSubmitting(false);
  };

  const urgencyColors = {
    low: 'var(--ok-color)',
    medium: 'var(--pending-color)',
    critical: 'var(--critical-color)',
    SOS: '#FF0000'
  };

  return (
    <div className="main-wrapper" style={{ overflowY: 'auto' }}>
      <div className="dashboard-container">
        <div className="form-card">
          <div className="form-title">🩸 Blood Transfusion Request</div>
          <div className="form-subtitle">Submit a blood request for a patient. Critical requests are prioritized in the global queue.</div>

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
                <label>Patient Name</label>
                <input name="patient_name" value={form.patient_name} onChange={handleChange} placeholder="Full name of patient" required />
              </div>
              <div className="form-group">
                <label>Blood Type Required</label>
                <select name="blood_type" value={form.blood_type} onChange={handleChange}>
                  {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Units Needed</label>
                <input name="units_needed" type="number" min="1" max="20" value={form.units_needed} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Urgency Level</label>
                <select name="urgency_level" value={form.urgency_level} onChange={handleChange} style={{ borderLeft: `4px solid ${urgencyColors[form.urgency_level]}` }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="SOS">🆘 SOS Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label>Hospital Name</label>
                <input name="hospital_name" value={form.hospital_name} onChange={handleChange} placeholder="e.g. City General Hospital" />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input name="requester_phone" value={form.requester_phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div className="form-group full" style={{ paddingTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}
                  style={{
                    width: '100%', padding: '16px', fontSize: '16px',
                    background: form.urgency_level === 'SOS' ? '#FF0000' : form.urgency_level === 'critical' ? 'var(--critical-color)' : 'var(--brand-pulse)'
                  }}>
                  {submitting ? '⏳ Submitting...' : form.urgency_level === 'SOS' ? '🆘 TRIGGER SOS REQUEST' : '💉 Submit Blood Request'}
                </button>
              </div>
            </div>
          </form>

          {/* Active Requests Table */}
          <ActiveRequests />
        </div>
      </div>
    </div>
  );
};

const ActiveRequests = () => {
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/requests/active')
      .then(res => res.json())
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading requests...</div>;
  if (requests.length === 0) return null;

  return (
    <div style={{ marginTop: '32px' }}>
      <div className="section-head" style={{ fontSize: '16px' }}>
        <div>Active Requests</div>
        <div className="section-meta">{requests.length} PENDING</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.map(r => (
          <div key={r.id} className="feed-item" style={{ padding: '16px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div className={`feed-icon ${r.urgency_level === 'critical' || r.urgency_level === 'SOS' ? 'urgent' : 'pending'}`}>
              {r.urgency_level === 'SOS' ? '🆘' : '💉'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="feed-title">{r.patient_name} — {r.blood_type}</div>
              <div className="feed-meta">
                <span>{r.hospital_name || 'No hospital'} • {r.units_needed} units</span>
                <span className={`status-badge ${r.urgency_level === 'critical' || r.urgency_level === 'SOS' ? 'urgent' : 'pending'}`}>
                  {r.urgency_level}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BloodRequest;
