import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/UserDashboard.css';

function UserDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [chalets, setChalets] = useState([]);

  useEffect(() => {
    const isUser = true; // Replace with real auth check
    if (!isUser) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch user's chalets when section changes
  useEffect(() => {
    if (activeSection === 'my-chalets') {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/get_user_chalets.php`, {
            credentials: 'include'
          })          
        .then(res => {
          if (!res.ok) throw new Error('Unauthorized');
          return res.json();
        })
        .then(data => setChalets(data))
        .catch(err => {
          console.error(err);
          setChalets([]);
        });
    }
  }, [activeSection]);

  return (
    <div className="user-dashboard-container">
      <Navbar />
      <div className="user-dashboard">
        <aside className="user-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              <span className="gradient-text">User</span> Dashboard
            </h2>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li><button onClick={() => setActiveSection('home')} className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}>🏡 Home</button></li>
              <li><button onClick={() => setActiveSection('my-chalets')} className={`nav-link ${activeSection === 'my-chalets' ? 'active' : ''}`}>🏠 My Chalets</button></li>
              <li><button onClick={() => setActiveSection('liked-chalets')} className={`nav-link ${activeSection === 'liked-chalets' ? 'active' : ''}`}>❤️ Liked Chalets</button></li>
              <li><button onClick={() => setActiveSection('requests')} className={`nav-link ${activeSection === 'requests' ? 'active' : ''}`}>📩 Requests</button></li>
              <li><button onClick={() => setActiveSection('settings')} className={`nav-link ${activeSection === 'settings' ? 'active' : ''}`}>⚙️ Settings</button></li>
            </ul>
          </nav>
        </aside>

        <main className="user-main">
          <header className="user-header">
            <h1>Welcome, <span className="gradient-text">User</span></h1>
            <p>{new Date().toLocaleDateString()}</p>
          </header>

          <div className="user-content">
            {activeSection === 'home' && (
              <section className="dashboard-section">
                <h2>🏡 Home</h2>
                <p>This is your home section overview.</p>
              </section>
            )}

            {activeSection === 'my-chalets' && (
              <section className="dashboard-section">
                <h2>🏠 My Chalets</h2>
                {chalets.length === 0 ? (
                  <div className="chalet-list">No chalets found.</div>
                ) : (
                  <div className="chalet-list">
                    {chalets.map(chalet => (
                      <div key={chalet.id} className="chalet-card">
                        <img src={chalet.main_image} alt={chalet.title} className="chalet-img" />
                        <h3>{chalet.title}</h3>
                        <p>{chalet.description}</p>
                        <p><strong>Price:</strong> {chalet.price} MAD</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === 'liked-chalets' && (
              <section className="dashboard-section">
                <h2>❤️ Liked Chalets</h2>
                <p>Chalets you've liked.</p>
                <div className="chalet-list">No liked chalets.</div>
              </section>
            )}

            {activeSection === 'requests' && (
              <section className="dashboard-section">
                <h2>📩 Requests</h2>
                <p>Chalet booking or contact requests you've made.</p>
                <div className="request-list">No requests yet.</div>
              </section>
            )}

            {activeSection === 'settings' && (
              <section className="dashboard-section">
                <h2>⚙️ Settings</h2>
                <p>Manage your profile and preferences.</p>
              </section>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default UserDashboard;
