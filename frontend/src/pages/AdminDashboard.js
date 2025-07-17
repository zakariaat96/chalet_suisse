import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiBarChart2, 
  FiPieChart, 
  FiSettings,
  FiActivity,
  FiDollarSign,
  FiCalendar,
  FiCheckSquare,
  FiLogOut,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiBell
} from 'react-icons/fi';
import '../styles/AdminDashboard.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DashboardOverview from '../components/DashboardOverview';
import UserManagement from '../components/UserManagement';
import PropertyManagement from '../components/PropertyManagement';
import ReportsSection from '../components/ReportsSection';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Check if user is admin
  useEffect(() => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If not admin, redirect to login
    if (!user.is_admin) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Function to handle navigation click
  const handleNavClick = (sectionId, e) => {
    e.preventDefault(); // Prevent default link behavior
    setActiveSection(sectionId);
    
    // Scroll to top of content
    const mainContent = document.querySelector('.admin-main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  };
  
  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  // Get admin name from localStorage
  const getAdminName = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  return (
    <div className="admin-dashboard-container">
      <Navbar />
      <div className="admin-dashboard">
        
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              <span className="gradient-text">Admin</span> Panel
            </h2>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <a 
                  href="#dashboard" 
                  className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('dashboard', e)}
                >
                  <FiBarChart2 className="nav-icon" /> Dashboard
                </a>
              </li>
              <li>
                <a 
                  href="#users" 
                  className={`nav-link ${activeSection === 'users' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('users', e)}
                >
                  <FiUsers className="nav-icon" /> Users
                </a>
              </li>
              <li>
                <a 
                  href="#properties" 
                  className={`nav-link ${activeSection === 'properties' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('properties', e)}
                >
                  <FiHome className="nav-icon" /> Properties
                </a>
              </li>
              <li>
                <a 
                  href="#reports" 
                  className={`nav-link ${activeSection === 'reports' ? 'active' : ''}`}
                  onClick={(e) => handleNavClick('reports', e)}
                >
                  <FiPieChart className="nav-icon" /> Reports
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <div className="header-content">
              <h1 className="admin-greeting">Welcome back, <span className="gradient-text">{getAdminName()}</span></h1>
            </div>
          </header>

          <div className="admin-content">
            {/* Dashboard Section */}
              {activeSection === 'dashboard' && <DashboardOverview />}
            {/* Users Section */}
              {activeSection === 'users' && <UserManagement />}
            {/* Properties Section */}
              {activeSection === 'properties' && <PropertyManagement />}
            {/* Reports Section */}
              {activeSection === 'reports' && <ReportsSection />}

            
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default AdminDashboard;