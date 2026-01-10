import React, { useState, useEffect } from 'react';
import {
  Key,
  Mail,
  Calendar,
  Heart,
  Download,
  Globe,
  Flag,
  Moon,
  User,
  Star,
  Bell,
  Settings,
  PlusCircle,
  LogOut,
  ChevronDown,
  Ticket,
  Shield,
  History
} from 'lucide-react';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from 'next/router';
import { getStorageImageUrl } from '@utils/imageUtils';
import ResetPasswordModal from '@components/ResetPasswordModal';

interface ProfileSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  const router = useRouter();
	const { data: session, status } = useSession();

  const [loggedInName, setLoggedInName] = useState('');
	const [loggedInUserRole, setLoggedInUserRole] = useState('');
	const [loggedInUserUsername, setLoggedInUserUsername] = useState('');
  const [loggedInUserProfilePicture, setLoggedInUserProfilePicture] = useState('');
  const [loggedInUserUserType, setLoggedInUserUserType] = useState('');
  const [loggedInUserCountry, setLoggedInUserCountry] = useState('');

	useEffect(() => {
		if (status !=="loading" && session) {
		  if (typeof window !== "undefined") {
		    setLoggedInName(session.user.name || '');
		    setLoggedInUserUsername(session.user.username || '');
		    setLoggedInUserRole(session.user.role || '');
        setLoggedInUserProfilePicture(session.user?.profile_picture || '');
        setLoggedInUserUserType(session.user.user_type || '');
        setLoggedInUserCountry(session.user.country || '');
		  }
		}
	    }, [ status, session]);

  // Get profile image URL, only if valid (not null, undefined, or empty string)
  const profileImageUrl = loggedInUserProfilePicture 
    ? (getStorageImageUrl(loggedInUserProfilePicture) || null)
    : null;

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .profile-sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          z-index: 1040;
          display: none;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }

        .profile-sidebar-overlay.show {
          display: block;
          opacity: 1;
        }

        .profile-sidebar {
          position: fixed;
          top: 85px;
          right: 0;
          width: 320px;
          height: calc(100vh - 76px);
          background: #ffffff;
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
        }

        .profile-sidebar.show {
          transform: translateX(0);
        }

        .profile-sidebar-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .profile-sidebar-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .profile-sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .profile-sidebar-body::-webkit-scrollbar {
          width: 6px;
        }

        .profile-sidebar-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .profile-sidebar-body::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .profile-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .profile-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .profile-user-info {
          flex: 1;
          min-width: 0;
        }

        .profile-user-name {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-user-email {
          font-size: 14px;
          color: #3b82f6;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: none;
        }

        .profile-user-email:hover {
          text-decoration: underline;
        }

        .profile-badge {
          background: #3b82f6;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .profile-menu {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .profile-menu-section {
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .profile-menu-divider {
          display: none;
        }

        .profile-menu-item {
          margin-bottom: 0;
        }

        .profile-menu-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-align: left;
        }

        .profile-menu-button:hover {
          background: #f8f9fa;
        }

        .profile-menu-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .profile-menu-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          flex-shrink: 0;
          font-size: 20px;
        }

        .profile-menu-text {
          font-size: 14px;
          color: #495057;
          font-weight: 400;
        }

        .profile-menu-badge {
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
        }

        .profile-menu-badge.new {
          background: #10b981;
        }

        .profile-menu-avatars {
          display: flex;
          align-items: center;
          margin-left: auto;
        }

        .profile-menu-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          margin-left: -8px;
        }

        .profile-menu-avatar:first-child {
          margin-left: 0;
        }

        .profile-menu-avatar-1 {
          background: #3b82f6;
        }

        .profile-menu-avatar-2 {
          background: #10b981;
        }

        .profile-menu-avatar-3 {
          background: #f59e0b;
        }

        .profile-menu-select {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          color: #6b7280;
          font-size: 14px;
        }

        .profile-menu-select .chevron {
          width: 16px;
          height: 16px;
        }

        .profile-toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s;
          margin-left: auto;
        }

        .profile-toggle-switch.active {
          background: #3b82f6;
        }

        .profile-toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s;
        }

        .profile-toggle-switch.active .profile-toggle-slider {
          transform: translateX(20px);
        }

        .profile-menu-item.upgrade .profile-menu-icon {
          color: #ffc107;
        }

        .profile-menu-item.upgrade .profile-menu-text {
          color: #495057;
          font-weight: 400;
        }
        
        .profile-menu-button .profile-menu-icon svg {
          width: 20px;
          height: 20px;
        }

        @media (max-width: 768px) {
          .profile-sidebar {
            width: 100%;
            max-width: 320px;
          }
        }
      `}</style>

      {/* Overlay */}
      {isOpen && onClose && (
        <div 
          className={`profile-sidebar-overlay ${isOpen ? 'show' : ''}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`profile-sidebar ${isOpen ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {/* <div className="profile-sidebar-header">
          <h3 className="profile-sidebar-title">Profile</h3>
        </div> */}

        {/* Body */}
        <div className="profile-sidebar-body">
          {/* User Card */}
          <div className="profile-user-card">
            <div className="profile-avatar">
              {profileImageUrl && <img src={profileImageUrl} alt={loggedInName || ''} />}
            </div>
            <div className="profile-user-info">
              <h5 className="profile-user-name">{loggedInName}</h5>
              <small className="text-muted">
                  {loggedInUserRole !== '' ? (
                      <span>{loggedInUserRole}</span>
                    ) : (
                      <span>{loggedInUserUsername}</span>
                    )}
                    
                </small>
            </div>
            {loggedInUserUserType && (
              <span className="profile-badge">
                {loggedInUserUserType}
              </span>
            )}
          </div>

          {/* Menu */}
          <ul className="profile-menu">
            {/* Section 1 */}
            
            <div className="profile-menu-section">
              
            {session?.user?.permissions?.includes('reset-password-users') && (
              <li className="profile-menu-item">
                <button 
                  className="profile-menu-button"
                  onClick={() => {
                    if (loggedInUserUsername) {
                      setShowResetPasswordModal(true);
                    }
                    onClose?.();
                  }}
                >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Key size={20} />
                    </div>
                    <span className="profile-menu-text">Change password</span>
                  </div>
                </button>
              </li>
              )}
              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => onClose?.()}>
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Shield size={20} />
                    </div>
                    <span className="profile-menu-text">2FA / MFA</span>
                  </div>
                </button>
              </li>

              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => onClose?.()}>
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <History size={20} />
                    </div>
                    <span className="profile-menu-text">Login History</span>
                  </div>
                </button>
              </li>
            </div>

            {/* Section 2 */}
            

            {/* Section 3 */}
            <div className="profile-menu-section">
              

              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => onClose?.()}>
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Flag size={20} />
                    </div>
                    <span className="profile-menu-text">{loggedInUserCountry ? loggedInUserCountry : 'Unknown'}</span>
                  </div>
                </button>
              </li>

{session?.user?.permissions?.includes('view-crm-tasks') && (
              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => {
                  router.push('/crm/tasks');
                  onClose?.();
                }} >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Calendar size={20} />
                    </div>
                    <span className="profile-menu-text">Tasks</span>
                  </div>
                </button>
              </li>
              )}

              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => onClose?.()}>
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Calendar size={20} />
                    </div>
                    <span className="profile-menu-text">Schedule meetings</span>
                  </div>
                </button>
              </li>

             
            </div>

            {/* Section 4 */}
            <div className="profile-menu-section">
              <li className="profile-menu-item">
                <button className="profile-menu-button" onClick={() => {
                  router.push('/profile');
                  onClose?.();
                }} >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <User size={20} />
                    </div>
                    <span className="profile-menu-text">Edit profile</span>
                  </div>
                </button>
              </li>


              {session?.user?.permissions?.includes('view-ticket-tickets') && (
              <li className="profile-menu-item">
                <button className="profile-menu-button"
                  onClick={() => {
                    router.push('/tickets/list');
                    onClose?.();
                  }}
                >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Ticket size={20} />
                    </div>
                    <span className="profile-menu-text">Raise a Ticket</span>
                  </div>
                </button>
              </li>
              )}
              <li className="profile-menu-item">
                <button className="profile-menu-button"
                  onClick={() => {
                    router.push('/settings');
                    onClose?.();
                  }}
                >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <Settings size={20} />
                    </div>
                    <span className="profile-menu-text">Settings</span>
                  </div>
                </button>
              </li>
            </div>

            {/* Section 5 */}
            <div className="profile-menu-section">
              {/* <li className="profile-menu-item">
                <button className="profile-menu-button">
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <PlusCircle size={20} />
                    </div>
                    <span className="profile-menu-text">Add account</span>
                  </div>
                </button>
              </li> */}

              <li className="profile-menu-item">
                <button className="profile-menu-button"
                  onClick={() => {
                    onClose?.();
                    signOut({ callbackUrl: '/auth/signin',redirect: true });
                  }}
                >
                  <div className="profile-menu-content">
                    <div className="profile-menu-icon">
                      <LogOut size={20} />
                    </div>
                    <span className="profile-menu-text">Logout</span>
                  </div>
                </button>
              </li>
            </div>
          </ul>
        </div>
      </div>
      
      <ResetPasswordModal
        show={showResetPasswordModal}
        onHide={() => setShowResetPasswordModal(false)}
        username={loggedInUserUsername}
      />
    </>
  );
};

export default ProfileSidebar;
