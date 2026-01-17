import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://radiolite.onrender.com/api/v1' 
  : 'http://127.0.0.1:8000/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Data State
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [timeRange, setTimeRange] = useState('7d');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_BASE_URL}/auth/token`, formData);
      const accessToken = response.data.access_token;
      
      localStorage.setItem('adminToken', accessToken);
      setToken(accessToken);
      setIsAuthenticated(true);
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setIsAuthenticated(false);
    setOverview(null);
    setUsername('');
    setPassword('');
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const config = { 
        headers: { 'Authorization': `Bearer ${token}` },
        params: { range: timeRange }
      };
      
      const response = await axios.get(`${API_BASE_URL}/admin/overview`, config);
      setOverview(response.data);

    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Session expired. Please login again.');
        logout();
      } else {
        setError('Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchData();
    }
  }, [isAuthenticated, token, timeRange]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ maxWidth: '400px', margin: '140px auto', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '40px' }}>Radiolite Admin</h1>
        <form onSubmit={handleLogin} className="card">
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOG IN'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '40px auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ margin: 0 }}>Analytics</h1>
        <button onClick={logout} className="secondary">Log out</button>
      </header>

      <div className="controls">
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          style={{ padding: '10px', fontSize: '14px' }}
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && !overview && <div>Loading...</div>}

      {overview && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>App Opens</h3>
              <p className="stat-value">{overview.total_app_opens.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <h3>Station Plays</h3>
              <p className="stat-value">{overview.total_plays.toLocaleString()}</p>
            </div>
          </div>

          <div style={{ marginTop: '40px' }}>
            <div className="tabs">
              <button 
                className={activeTab === 'overview' ? 'active' : ''} 
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={activeTab === 'stations' ? 'active' : ''} 
                onClick={() => setActiveTab('stations')}
              >
                Top Stations
              </button>
              <button 
                className={activeTab === 'countries' ? 'active' : ''} 
                onClick={() => setActiveTab('countries')}
              >
                Top Countries
              </button>
            </div>

            {activeTab === 'overview' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>App Opens</th>
                    <th>Total Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent_daily_stats.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{day.app_opens.toLocaleString()}</td>
                      <td>{day.total_plays.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'stations' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Station ID</th>
                    <th>Play Count</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.top_stations.map((station, index) => (
                    <tr key={station.station_id}>
                      <td>{index + 1}</td>
                      <td>{station.station_id}</td>
                      <td>{station.play_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'countries' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Country Code</th>
                    <th>App Opens</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.top_countries.map((country, index) => (
                    <tr key={country.country_code}>
                      <td>{index + 1}</td>
                      <td>{country.country_code}</td>
                      <td>{country.open_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
