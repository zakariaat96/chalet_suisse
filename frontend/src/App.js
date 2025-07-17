import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import AllPropertiesPage from './pages/AllPropertiesPage';
import ChaletDetailPage from './pages/ChaletDetailPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import DashboardOverview from './components/DashboardOverview';
import UserManagement from './components/UserManagement';
import PropertyManagement from './components/PropertyManagement';
import ReportsSection from './components/ReportsSection';
import ComingSoon from './pages/ComingSoon';

// Define the protected route components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/user-dashboard" replace />;
  return children;
};

const UserRoute = ({ children }) => {
  const { isAuthenticated, isUser } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isUser) return <Navigate to="/admin-dashboard" replace />;
  return children;
};

// Page wrapper component to set titles
const PageWrapper = ({ title, children }) => (
  <>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    {children}
  </>
);

// Main App component with routes
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PageWrapper title="Chalets Suisses">
          <Home scrollTo="hero" />
        </PageWrapper>
      } />
      
      <Route path="/home" element={
        <PageWrapper title="Home">
          <Home scrollTo="hero" />
        </PageWrapper>
      } />
      
      <Route path="/chalets" element={
        <PageWrapper title="All Chalets">
          <AllPropertiesPage />
        </PageWrapper>
      } />
      
      <Route path="/about" element={
        <PageWrapper title="About Us">
          <Home scrollTo="about" />
        </PageWrapper>
      } />
      
      <Route path="/contact" element={
        <PageWrapper title="Contact Us">
          <Home scrollTo="contact" />
        </PageWrapper>
      } />
      
      <Route path="/coming-soon" element={
        <PageWrapper title="Coming Soon">
          <ComingSoon />
        </PageWrapper>
      } />
      
      <Route path="/login" element={
        <PageWrapper title="Login">
          <Login />
        </PageWrapper>
      } />
      
      <Route path="/register" element={
        <PageWrapper title="Register">
          <Register />
        </PageWrapper>
      } />
      
      <Route path="/ChaletDetailPage" element={
        <PageWrapper title="Chalet Details">
          <ChaletDetailPage />
        </PageWrapper>
      } />
      
      <Route path="/chalet/:slug" element={
        <PageWrapper title="Chalet Details">
          <ChaletDetailPage />
        </PageWrapper>
      } />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <AdminRoute>
          <PageWrapper title="Admin Dashboard">
            <AdminDashboard />
          </PageWrapper>
        </AdminRoute>
      } />

      {/* User Routes */}
      <Route path="/user-dashboard" element={
        <UserRoute>
          <PageWrapper title="User Dashboard">
            <UserDashboard />
          </PageWrapper>
        </UserRoute>
      } />

      {/* 404 Route */}
      <Route path="*" element={
        <PageWrapper title="Page Not Found">
          <Navigate to="/" replace />
        </PageWrapper>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Default title for the entire app */}
          <Helmet>
            <title>Alpine Chalets - Luxury Mountain Retreats</title>
            <meta name="description" content="Discover luxury chalets in the Swiss Alps. Book your perfect mountain retreat with stunning views and premium amenities." />
          </Helmet>
          
          <main>
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;