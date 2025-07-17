function UserProfileCard({ userData }) {
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {userData?.name?.charAt(0) || 'U'}
          </div>
          <h3>{userData?.name || 'User'}</h3>
          <p className="profile-email">{userData?.email}</p>
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{userData?.chalet_count || 0}</span>
            <span className="stat-label">Chalets</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userData?.booking_count || 0}</span>
            <span className="stat-label">Bookings</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{userData?.rating || '5.0'}</span>
            <span className="stat-label">Rating</span>
          </div>
        </div>
        
        <button className="edit-profile-btn">
          Edit Profile
        </button>
      </div>
    );
  }
  
  export default UserProfileCard;