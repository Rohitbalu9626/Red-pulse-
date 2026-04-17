import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Forecast = () => {
  const [bloodType, setBloodType] = useState('O+');
  const [days, setDays] = useState(7);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forecast/${encodeURIComponent(bloodType)}?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setForecastData(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to load forecast');
      }
    } catch (err) {
      setError('Network error — is the backend running?');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadForecast();
  }, [bloodType, days]);

  const chartData = forecastData ? {
    labels: forecastData[`next_${days}_days`]?.map((_, i) => `Day ${i + 1}`) || [],
    datasets: [{
      label: `${bloodType} Predicted Demand`,
      data: forecastData[`next_${days}_days`] || [],
      borderColor: '#E63946',
      backgroundColor: 'rgba(230, 57, 70, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#E63946',
      pointBorderColor: '#FFF',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 8
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { family: 'Inter', weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#151923',
        titleColor: '#F8FAFC',
        bodyColor: '#94A3B8',
        borderColor: '#1E293B',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      x: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(30, 41, 59, 0.5)' }
      },
      y: {
        ticks: { color: '#94A3B8' },
        grid: { color: 'rgba(30, 41, 59, 0.5)' },
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <div className="dashboard-container">
        {/* Controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
            <label>Blood Type</label>
            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
              {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
            <label>Forecast Days</label>
            <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        {forecastData && (
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-label">Blood Type</div>
              <div className="stat-value" style={{ color: 'var(--brand-pulse)', fontSize: '36px' }}>{forecastData.blood_type}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Predicted</div>
              <div className="stat-value">{Math.round(forecastData[`next_${days}_days`]?.reduce((a, b) => a + b, 0) || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Confidence</div>
              <div className="stat-value" style={{ color: 'var(--ok-color)' }}>{Math.round(forecastData.confidence * 100)}%</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="panel" style={{ height: '400px', padding: '24px' }}>
          <div className="section-head" style={{ fontSize: '18px', paddingBottom: '12px', marginBottom: '16px' }}>
            <span>Demand Forecast</span>
            <span className="section-meta">AI PREDICTION</span>
          </div>
          <div style={{ flex: 1, position: 'relative', height: 'calc(100% - 60px)' }}>
            {loading && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>⏳ Loading forecast...</div>}
            {error && <div style={{ textAlign: 'center', padding: '60px', color: 'var(--critical-color)' }}>⚠ {error}</div>}
            {chartData && !loading && !error && <Line data={chartData} options={chartOptions} />}
          </div>
        </div>

        {/* Recommendation */}
        {forecastData?.recommendation && (
          <div style={{
            marginTop: '24px', padding: '20px', borderRadius: '16px',
            background: 'linear-gradient(145deg, var(--bg-card), #1A1F2B)',
            border: '1px solid #2A3143', fontSize: '15px', lineHeight: 1.6,
            color: 'var(--text-muted)'
          }}>
            <span style={{ fontWeight: 800, color: 'var(--pending-color)', marginRight: '8px' }}>💡 AI Recommendation:</span>
            {forecastData.recommendation}
          </div>
        )}
      </div>
    </div>
  );
};

export default Forecast;
