import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD 
  ? 'https://radiolite.onrender.com/api/v1' 
  : 'http://127.0.0.1:8000/api/v1');

function App() {
  // Authentication & User State
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [currentUser, setCurrentUser] = useState(null);
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
  const [timeRange, setTimeRange] = useState('all');

  // Blog State
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState({
    title: '', slug: '', content: '', image_url: '', 
    image_source: '', image_link: '',
    seo_title: '', meta_description: '', is_published: false
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' });

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
      fetchMe(accessToken);
    } catch (err) {
      console.error(err);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async (authToken) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken || token}` }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error("Failed to fetch user details", err);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setIsAuthenticated(false);
    setCurrentUser(null);
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

  const fetchPosts = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/blog/?published_only=false`, config);
      setPosts(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch posts');
    }
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    const updates = { title: val };
    
    // Only auto-fill if the user hasn't manually changed slug/seo_title or if they are empty
    if (!currentPost.id || !currentPost.slug) {
      updates.slug = generateSlug(val);
    }
    if (!currentPost.id || !currentPost.seo_title) {
      updates.seo_title = val;
    }
    
    setCurrentPost({...currentPost, ...updates});
  };

  const insertTag = (tagStart, tagEnd = '') => {
    const textarea = document.getElementById('content-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentPost.content;
    const selected = text.substring(start, end);
    
    // Correctly handle symmetrical vs asymmetrical tags
    const endTag = (tagEnd === '' || tagEnd) ? tagEnd : tagStart;
    
    const newContent = text.substring(0, start) + tagStart + selected + endTag + text.substring(end);
    setCurrentPost({ ...currentPost, content: newContent });
    
    // Maintain focus and selection (roughly)
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, end + tagStart.length);
    }, 0);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      insertTag('[', `](${url})`);
    }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      if (currentPost.id) {
        await axios.patch(`${API_BASE_URL}/blog/${currentPost.id}`, currentPost, config);
      } else {
        await axios.post(`${API_BASE_URL}/blog/`, currentPost, config);
      }
      setIsEditing(false);
      fetchPosts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save post');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/blog/${id}`, config);
      fetchPosts();
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const fetchUsers = async () => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/admin/users`, config);
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/admin/users`, newUser, config);
      setIsAddingUser(false);
      setNewUser({ username: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/admin/users/${id}`, config);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchMe();
      fetchData();
      fetchPosts();
    }
  }, [isAuthenticated, token, timeRange]);

  useEffect(() => {
    if (currentUser?.role === 'superadmin' && activeTab === 'users') {
      fetchUsers();
    }
  }, [currentUser, activeTab]);

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1 style={{ marginBottom: '10px' }}>Radiolite</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Control Center</p>
        <div className="card">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
          {error && <p className="error-msg" style={{ marginTop: '20px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Radio<span style={{ fontWeight: 300, opacity: 0.8 }}>Lite</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => setActiveTab('blog')}
          >
            Editorial
          </button>
          {currentUser?.role === 'superadmin' && (
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Admins
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Logged as <strong>{currentUser?.username}</strong>
          </div>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%' }}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <h1 style={{ margin: 0 }}>
            {activeTab === 'overview' && 'Analytics Overview'}
            {activeTab === 'blog' && 'Editorial Content'}
            {activeTab === 'users' && 'Admin Management'}
          </h1>
          
          {activeTab === 'overview' && (
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={{ width: 'auto', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="1d">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          )}
        </header>

        {error && <div className="error-msg">{error}</div>}

        {activeTab === 'overview' && overview && (
          <>
            <div className="stats-grid">
              <div className="card stat-card">
                <h3>App Opens</h3>
                <p className="stat-value">{overview.total_app_opens.toLocaleString()}</p>
              </div>
              <div className="card stat-card">
                <h3>Unique Users</h3>
                <p className="stat-value">{overview.total_unique_users.toLocaleString()}</p>
              </div>
              <div className="card stat-card">
                <h3>Station Hits</h3>
                <p className="stat-value">{overview.total_plays.toLocaleString()}</p>
              </div>
            </div>

            <section>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Global Performance</h4>
              <div className="card" style={{ padding: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opens</th>
                      <th>Plays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_daily_stats.slice(0, 10).map((day) => (
                      <tr key={day.date}>
                        <td>{day.date}</td>
                        <td>{day.app_opens.toLocaleString()}</td>
                        <td>{day.total_plays.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'blog' && (
          <div className="card" style={{ padding: isEditing ? '24px' : '0' }}>
            {isEditing ? (
              <form onSubmit={handleSavePost}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                     <div className="form-group" style={{ flex: 2 }}>
                        <label>Title</label>
                        <input 
                          type="text" 
                          value={currentPost.title} 
                          onChange={handleTitleChange} 
                          required 
                        />
                     </div>
                     <div className="form-group" style={{ flex: 1 }}>
                        <label>Slug</label>
                        <input 
                          type="text" 
                          value={currentPost.slug} 
                          onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})} 
                          required 
                        />
                     </div>
                  </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Content (Markdown)</label>
                    <div className="editor-toolbar" style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('**')} title="Bold"><strong>B</strong></button>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('*')} title="Italic"><em>I</em></button>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('<u>', '</u>')} title="Underline"><span style={{ textDecoration: 'underline' }}>U</span></button>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('# ', '')} title="Heading 1">H1</button>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('## ', '')} title="Heading 2">H2</button>
                      <button type="button" className="toolbar-btn" onClick={() => insertTag('- ', '')} title="List">• List</button>
                      <button type="button" className="toolbar-btn" onClick={insertLink} title="Link">Link</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <textarea 
                      id="content-textarea"
                      rows="20" 
                      value={currentPost.content} 
                      onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})} 
                      required 
                      style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    />
                    <div className="markdown-preview" style={{ 
                      padding: '14px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border)',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>Preview</div>
                      <div dangerouslySetInnerHTML={{ __html: currentPost.content.replace(/\n/g, '<br/>') }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '20px' }}>(Full formatting will appear on public site)</p>
                    </div>
                  </div>
                </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                       <label>Image URL</label>
                       <input 
                         type="text" 
                         value={currentPost.image_url || ''} 
                         onChange={(e) => setCurrentPost({...currentPost, image_url: e.target.value})} 
                         placeholder="https://..."
                       />
                    </div>
                    <div className="form-group">
                       <label>Meta Description</label>
                       <input 
                         type="text" 
                         value={currentPost.meta_description || ''} 
                         onChange={(e) => setCurrentPost({...currentPost, meta_description: e.target.value})} 
                       />
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '10px' }}>
                    <div className="form-group">
                       <label>Image Source (Optional)</label>
                       <input 
                         type="text" 
                         value={currentPost.image_source || ''} 
                         onChange={(e) => setCurrentPost({...currentPost, image_source: e.target.value})} 
                         placeholder="Photographed by..."
                       />
                    </div>
                    <div className="form-group">
                       <label>Image Link (Optional)</label>
                       <input 
                         type="text" 
                         value={currentPost.image_link || ''} 
                         onChange={(e) => setCurrentPost({...currentPost, image_link: e.target.value})} 
                         placeholder="https://..."
                       />
                    </div>
                    <div className="form-group">
                       <label>Is Published?</label>
                       <select 
                         value={currentPost.is_published}
                         onChange={(e) => setCurrentPost({...currentPost, is_published: e.target.value === 'true'})}
                       >
                         <option value="false">Draft</option>
                         <option value="true">Published</option>
                       </select>
                    </div>
                 </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <button type="submit" className="btn-primary">Save Content</button>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Dismiss</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Articles</h4>
                  <button className="btn-primary" onClick={() => {
                    setCurrentPost({ 
                      title: '', slug: '', content: '', image_url: '', 
                      image_source: '', image_link: '',
                      seo_title: '', meta_description: '', is_published: false 
                    });
                    setIsEditing(true);
                  }}>Create New</button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id}>
                        <td style={{ color: 'var(--text-primary)' }}>{post.title}</td>
                        <td>{post.author?.username || 'System'}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: post.is_published ? 'rgba(29, 185, 84, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: post.is_published ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {post.is_published ? 'LIVE' : 'DRAFT'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-secondary" style={{ marginRight: '8px' }} onClick={() => {
                            setCurrentPost(post);
                            setIsEditing(true);
                          }}>Edit</button>
                          <button className="btn-secondary" style={{ color: '#ff4444' }} onClick={() => handleDeletePost(post.id)}>Trash</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card" style={{ padding: 0 }}>
             <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>System Admins</h4>
                {!isAddingUser && (
                  <button className="btn-primary" onClick={() => setIsAddingUser(true)}>Add User</button>
                )}
             </div>
             
             {isAddingUser && (
               <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                     <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label>Username</label>
                        <input 
                          type="text" 
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          required
                        />
                     </div>
                     <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label>Password</label>
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          required
                        />
                     </div>
                     <div className="form-group" style={{ margin: 0 }}>
                        <label>Role</label>
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          style={{ minWidth: '120px' }}
                        >
                           <option value="admin">Editor</option>
                           <option value="superadmin">Superadmin</option>
                        </select>
                     </div>
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn-primary">Create</button>
                        <button type="button" className="btn-secondary" onClick={() => setIsAddingUser(false)}>Cancel</button>
                     </div>
                  </form>
               </div>
             )}

             <table className="data-table">
                <thead>
                   <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                   </tr>
                </thead>
                <tbody>
                   {users.map(u => (
                     <tr key={u.id}>
                        <td style={{ color: 'var(--text-primary)' }}>{u.username}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: u.role === 'superadmin' ? 'var(--accent)' : 'inherit' }}>{u.role}</td>
                        <td style={{ textAlign: 'right' }}>
                           <button 
                             className="btn-secondary" 
                             style={{ color: '#ff4444' }} 
                             onClick={() => handleDeleteUser(u.id)}
                             disabled={u.username === currentUser?.username}
                           >Remove</button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
