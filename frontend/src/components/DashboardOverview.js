import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiHome, 
  FiDollarSign,
  FiActivity,
  FiBarChart2,
  FiPlus,
  FiHeart,
  FiMapPin,
  FiCalendar,
  FiPackage,
  FiRefreshCw,
  FiSend,
  FiClock
} from 'react-icons/fi';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ScatterChart,
  Scatter,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ZAxis 
} from 'recharts';
import '../styles/DashboardOverview.css';

function DashboardOverview() {
  // State for statistics
  const [stats, setStats] = useState({
    users: { total: 0, trend: 0 },
    properties: { total: 0, trend: 0 },
    revenue: { total: 0, trend: 0 },
    likes: { total: 0, trend: 0 }
  });
  
  // State for charts data
  const [chartData, setChartData] = useState({
    propertiesByType: [],
    propertiesByStatus: [],
    propertiesByCity: [],
    propertiesByYear: [],
    activePropertyOwners: [],
    topLikedProperties: [],
    propertyAgeVsPrice: []
  });
  
  // State for recent activity
  const [recentActivity, setRecentActivity] = useState([]);
  
  // State for loading and error status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch real data from the backend
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/dashboard_stats.php`, {
          withCredentials: true
        });
        
     //   console.log('API Response:', response.data); // Debug log
        
        const data = response.data;
        
        if (data.success) {
          // Set stats from API response
          setStats({
            users: data.stats.users || { total: 0, trend: 0 },
            properties: data.stats.properties || { total: 0, trend: 0 },
            revenue: data.stats.revenue || { total: 0, trend: 0 },
            likes: data.stats.likes || { total: 0, trend: 0 }
          });
          
          // Format property type data for the pie chart
          const typeData = data.propertyByType.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          }));
          
          // Format property status data for the bar chart
          const statusData = data.propertyByStatus.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          }));
          
          // Format properties by city data
          const cityData = data.propertiesByCity?.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          })) || [];
          
          // Format properties by year built data
          const yearData = data.propertiesByYear?.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          })) || [];
          
          // Format active property owners data
          const ownersData = data.activePropertyOwners?.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          })) || [];
          
          // Format top liked properties data
          const likedPropertiesData = data.topLikedProperties?.map(item => ({
            name: item.name || 'Unknown',
            value: item.count || 0
          })) || [];
          
          // Format property age vs price data (for scatter plot)
          const ageVsPriceData = data.propertyAgeVsPrice?.map(item => ({
            x: parseInt(item.age) || 0,
            y: parseFloat(item.price) || 0,
            name: item.title,
            type: item.property_type
          })) || [];
          
          setChartData({
            propertiesByType: typeData,
            propertiesByStatus: statusData,
            propertiesByCity: cityData,
            propertiesByYear: yearData,
            activePropertyOwners: ownersData,
            topLikedProperties: likedPropertiesData,
            propertyAgeVsPrice: ageVsPriceData
          });
          
          // Format recent activity data with icons
          const activityWithIcons = data.recentActivity.map(activity => {
            // Map action types to icons
            const getIcon = (action) => {
              if (action.includes('registered')) return FiUsers;
              if (action.includes('listed')) return FiHome;
              if (action.includes('liked')) return FiHeart;
              if (action.includes('purchase') || action.includes('sold')) return FiDollarSign;
              return FiActivity;
            };
            
            return {
              ...activity,
              icon: getIcon(activity.action)
            };
          });
          
          setRecentActivity(activityWithIcons);
        } else {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Format large numbers
  const formatNumber = (num) => {
  if (!num) return '₣0';
  
  if (num >= 1000000) {
    return `₣${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `₣${(num / 1000).toFixed(0)}K`;
  }
  return `₣${Number(num).toLocaleString()}`;
};
  
  // Custom colors for charts
  const COLORS = ['#e63946', '#457b9d', '#1d3557', '#f1faee', '#a8dadc', '#ffb703', '#fb8500', '#8ecae6', '#219ebc', '#023047'];
  const STATUS_COLORS = {
    'Available': '#4caf50',
    'Pending': '#ff9800',
    'Sold': '#2196f3'
  };
  
  const PROPERTY_TYPE_COLORS = {
    'Chalet': '#e63946', 
    'Apartment': '#457b9d', 
    'Villa': '#1d3557',
    'Penthouse': '#ffb703'
  };
  
  // Truncate long text for chart labels - responsive truncation
  const truncateText = (text, maxLength) => {
    if (!text) return 'Unknown';
    
    // Responsive text truncation based on screen size
    let responsiveMaxLength = maxLength || 15;
    
    if (window.innerWidth < 480) {
      responsiveMaxLength = 8;
    } else if (window.innerWidth < 768) {
      responsiveMaxLength = 12;
    } else if (window.innerWidth < 992) {
      responsiveMaxLength = 15;
    }
    
    return text.length > responsiveMaxLength ? text.substring(0, responsiveMaxLength) + '...' : text;
  };
  
  // Format year values for x-axis
  const formatYear = (year) => {
    if (!year || year === 'Unknown') return year;
    return year;
  };
  
  // Custom tooltip for property age vs price scatter plot
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="scatter-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-type">Type: {data.type}</p>
          <p className="tooltip-age">Age: {data.x} years</p>
          <p className="tooltip-price">Price: {formatNumber(data.y)}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <>
      <section id="dashboard" className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <FiBarChart2 className="section-icon" />
            Dashboard Overview
          </h2>
          <p className="section-subtitle">Key performance metrics and insights</p>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading dashboard data...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><FiUsers /></div>
                <div className="stat-value">{stats.users.total.toLocaleString()}</div>
                <div className="stat-label">Total Users</div>
                <div className={`stat-trend ${stats.users.trend >= 0 ? 'positive' : 'negative'}`}>
                  {stats.users.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.users.trend)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiHome /></div>
                <div className="stat-value">{stats.properties.total.toLocaleString()}</div>
                <div className="stat-label">Properties</div>
                <div className={`stat-trend ${stats.properties.trend >= 0 ? 'positive' : 'negative'}`}>
                  {stats.properties.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.properties.trend)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiDollarSign /></div>
                <div className="stat-value">{formatNumber(stats.revenue.total)}</div>
                <div className="stat-label">Total Property Value</div>
                <div className={`stat-trend ${stats.revenue.trend >= 0 ? 'positive' : 'negative'}`}>
                  {stats.revenue.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.revenue.trend)}%
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><FiHeart /></div>
                <div className="stat-value">{stats.likes.total.toLocaleString()}</div>
                <div className="stat-label">Total Likes</div>
                <div className={`stat-trend ${stats.likes.trend >= 0 ? 'positive' : 'negative'}`}>
                  {stats.likes.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.likes.trend)}%
                </div>
              </div>
            </div>
            
            {/* Charts Grid */}
            <div className="charts-grid">
              {/* 1. Properties by City Distribution */}
              <div className="chart-card">
                <h3 className="chart-title">Properties by City</h3>
                <div className="chart-container">
                  {chartData.propertiesByCity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.propertiesByCity}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={50}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(label) => truncateText(label, 8)}
                          interval={0}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} properties`, 
                            'Count'
                          ]}
                          labelFormatter={(label) => chartData.propertiesByCity.find(item => truncateText(item.name, 8) === label)?.name || label}
                        />
                        <Bar dataKey="value" name="Properties" fill="#457b9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No city distribution data available</div>
                  )}
                </div>
              </div>
              
              {/* 2. Properties by Year Built */}
              <div className="chart-card">
                <h3 className="chart-title">Properties by Year Built</h3>
                <div className="chart-container">
                  {chartData.propertiesByYear.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.propertiesByYear}
                        margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tickFormatter={formatYear}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip formatter={(value, name) => [value, 'Properties']} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name="Properties" 
                          stroke="#e63946" 
                          strokeWidth={2}
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No year built data available</div>
                  )}
                </div>
              </div>
              
              {/* 3. Most Active Property Owners */}
              <div className="chart-card">
                <h3 className="chart-title">Most Active Property Owners</h3>
                <div className="chart-container">
                  {chartData.activePropertyOwners.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.activePropertyOwners}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          width={50}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(label) => truncateText(label, 8)}
                          interval={0}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} properties`, 
                            'Count'
                          ]}
                          labelFormatter={(label) => chartData.activePropertyOwners.find(item => truncateText(item.name, 8) === label)?.name || label}
                        />
                        <Bar dataKey="value" name="Properties" fill="#1d3557" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No property owner data available</div>
                  )}
                </div>
              </div>
              
              {/* 4. Top Liked Properties */}
              <div className="chart-card">
                <h3 className="chart-title">Top Liked Properties</h3>
                <div className="chart-container">
                  {chartData.topLikedProperties.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.topLikedProperties}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 5, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          width={50}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(label) => truncateText(label, 8)}
                          interval={0}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} likes`, 
                            'Count'
                          ]}
                          labelFormatter={(label) => chartData.topLikedProperties.find(item => truncateText(item.name, 8) === label)?.name || label}
                        />
                        <Bar dataKey="value" name="Likes" fill="#e63946" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message">No liked properties data available</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default DashboardOverview;