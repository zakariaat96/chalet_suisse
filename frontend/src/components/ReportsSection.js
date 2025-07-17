import React from 'react';
import { FiBarChart2, FiUsers, FiHome, FiDollarSign } from 'react-icons/fi';

function ReportsSection() {
  return (
    <section id="reports" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Reports</h2>
        <p className="section-subtitle">View and generate reports</p>
      </div>
      <div className="section-content">
        <div className="reports-grid">
          <div className="report-card">
            <div className="report-icon"><FiBarChart2 /></div>
            <div className="report-title">Sales Report</div>
            <p className="report-desc">Monthly sales and revenue statistics</p>
            <button className="report-btn">Generate</button>
          </div>
          <div className="report-card">
            <div className="report-icon"><FiUsers /></div>
            <div className="report-title">User Activity</div>
            <p className="report-desc">User registrations and engagement</p>
            <button className="report-btn">Generate</button>
          </div>
          <div className="report-card">
            <div className="report-icon"><FiHome /></div>
            <div className="report-title">Property Listings</div>
            <p className="report-desc">Property listing analytics</p>
            <button className="report-btn">Generate</button>
          </div>
          <div className="report-card">
            <div className="report-icon"><FiDollarSign /></div>
            <div className="report-title">Financial Summary</div>
            <p className="report-desc">Financial performance overview</p>
            <button className="report-btn">Generate</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReportsSection;