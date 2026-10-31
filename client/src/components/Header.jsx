import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  ChevronDown,
  Bell,
  LogIn,
  Home,
  Users,
  FolderHeart,
  Video,
  MessageSquare,
  PawPrint,
  Check,
  X,
  User,
  LogOut,
  Settings,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Globe,
  UserPen,
  FileText,
  BellRing
} from 'lucide-react';
import { Avatar } from './Avatar';
import zenveLogo from '../assets/zenve_logo.png';
import {
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  simulateDirectMessageNotification
} from '../services/notificationService';

export function Header({
  searchQuery,
  onSearchChange,
  selectedCountry = 'INDIA',
  activeTab,
  onTabSelect,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenCreateProfile,
  onOpenDoctorProfile,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  pendingRequestsCount = 0,
  notifications = [],
  onAcceptRequest,
  onIgnoreRequest,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenCreatePost,
  onOpenDirectChat,
  onSelectCase,
  onSelectVideo,
  onAcceptCommunityInvite,
  onDeclineCommunityInvite,
  onOpenTerms
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'unread'

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'network', label: 'My Network', icon: Users, badge: pendingRequestsCount },
    { id: 'communities', label: 'Communities', icon: Globe },
    { id: 'cases', label: 'Clinical Cases', icon: FolderHeart },
    { id: 'videos', label: 'Reels', icon: Video },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
  ];

  const filteredNotifs = notifications.filter(n => notifFilter === 'all' || !n.read);

  return (
    <header className="top-header" style={{ position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
      {/* 1. Brand Logo & Emblem */}
      <div className="header-brand-search-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => onTabSelect && onTabSelect('feed')}
          className="header-brand-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '10px',
            transition: 'opacity 0.2s ease',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          title="Zenve Vet Community Home"
        >
          {/* Logo Emblem Box (instead of paw symbol, Zenve logo is here) */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: '#FFFFFF',
            border: '1.5px solid #E5E7EB',
            boxShadow: '0 3px 10px rgba(0, 56, 34, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '5px',
            boxSizing: 'border-box',
            flexShrink: 0
          }}>
            <img
              src={zenveLogo}
              alt="Zenve Vet"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Typography: Zenve Vet + COMMUNITY */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
            <span style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#003822',
              letterSpacing: '-0.4px',
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)'
            }}>
              Zenve Vet
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#00A86B',
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              marginTop: '1px'
            }}>
              COMMUNITY
            </span>
          </div>
        </button>

        {/* Global Search Bar */}
        <div className="header-search-container" style={{ marginLeft: '6px' }}>
          <div className="header-search-bar" style={{ maxWidth: '260px', width: '100%' }}>
            <Search size={15} color="#6b7280" />
            <input
              type="text"
              placeholder="Search doctors, cases, skills..."
              className="header-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* 2. Center Navigation Icons */}
      <nav className="header-center-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabSelect && onTabSelect(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: isActive ? '#003822' : '#6B7280',
                borderBottom: isActive ? '2.5px solid #003822' : '2.5px solid transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#6B7280';
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.9} />
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '1px 5px',
                    lineHeight: 1.2
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500, marginTop: '2px' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 3. Header Right Actions & Profile */}
      <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Post Shortcut Button */}
        {onOpenCreatePost && (
          <button
            onClick={() => onOpenCreatePost('CLINICAL_CASE')}
            className="header-create-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D1FAE5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ECFDF5'}
          >
            <Sparkles size={14} color="#059669" />
            <span className="header-create-btn-label">Zenv</span>
          </button>
        )}

        {/* Notifications Bell Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="header-bell-btn"
            title="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <Bell size={19} color={isNotificationsOpen ? '#003822' : '#4B5563'} />
            {unreadNotificationsCount > 0 && (
              <span className="bell-badge-count">{unreadNotificationsCount}</span>
            )}
          </button>

          {/* Interactive Notifications Modal Dropdown */}
          {isNotificationsOpen && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '360px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              zIndex: 100,
              animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Notification Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FAFAFA'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                    Notifications
                  </h4>
                  {unreadNotificationsCount > 0 && (
                    <span style={{ fontSize: '11px', backgroundColor: '#ECFDF5', color: '#047857', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                {onMarkAllNotificationsRead && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    style={{ background: 'none', border: 'none', fontSize: '11.5px', color: '#059669', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Device Notifications Banner (Laptop, Android, iOS) */}
              <div className="header-notif-permission-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BellRing size={15} color="#059669" />
                  <span style={{ fontSize: '11.5px', color: '#065F46', fontWeight: 600 }}>
                    {getNotificationPermission() === 'granted' ? 'Outside Device Alerts Active' : 'Enable Laptop & Phone Alerts'}
                  </span>
                </div>
                <button
                  type="button"
                  className="header-notif-permission-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (getNotificationPermission() === 'granted') {
                      simulateDirectMessageNotification(onOpenDirectChat);
                    } else {
                      await requestNotificationPermission();
                    }
                  }}
                >
                  {getNotificationPermission() === 'granted' ? 'Test Alert' : 'Enable'}
                </button>
              </div>

              {/* Notification Filters */}
              <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <button
                  onClick={() => setNotifFilter('all')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: notifFilter === 'all' ? '#003822' : '#F3F4F6',
                    color: notifFilter === 'all' ? '#FFFFFF' : '#4B5563'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setNotifFilter('unread')}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: notifFilter === 'unread' ? '#003822' : '#F3F4F6',
                    color: notifFilter === 'unread' ? '#FFFFFF' : '#4B5563'
                  }}
                >
                  Unread
                </button>
              </div>

              {/* Notifications List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {filteredNotifs.length === 0 ? (
                  <div style={{ padding: '30px 16px', textAlign: 'center', color: '#9CA3AF' }}>
                    <Bell size={28} color="#D1D5DB" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No notifications right now.</p>
                  </div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onMarkNotificationRead) onMarkNotificationRead(n.id);
                        setIsNotificationsOpen(false);

                        if (n.type === 'REEL_UPLOAD' || n.type === 'VIDEO_UPLOAD' || n.type === 'SHORT_VIDEO') {
                          if (onSelectVideo && n.targetId) {
                            onSelectVideo({ id: n.targetId, title: n.message });
                          }
                          if (onTabSelect) onTabSelect('videos');
                        } else if (n.type === 'CLINICAL_CASE_SHARED' || n.type === 'CASE' || n.type === 'CLINICAL_CASE') {
                          if (onSelectCase && n.targetId) {
                            onSelectCase({ id: n.targetId, title: n.message });
                          }
                          if (onTabSelect) onTabSelect('cases');
                        } else if (n.type === 'NEW_MESSAGE' || n.type === 'MESSAGE' || n.type === 'DIRECT_MESSAGE') {
                          if (onOpenDirectChat && (n.senderId || n.senderName)) {
                            onOpenDirectChat({ id: n.senderId, name: n.senderName, avatar: n.senderAvatar });
                          } else if (onTabSelect) {
                            onTabSelect('messages');
                          }
                        } else if (n.type === 'CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED') {
                          if (onTabSelect) onTabSelect('network');
                        } else {
                          if (onTabSelect) onTabSelect('feed');
                        }
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: n.read ? '#FFFFFF' : '#F0FDF4',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.read ? '#FFFFFF' : '#F0FDF4'}
                    >
                      <Avatar
                        src={n.senderAvatar}
                        name={n.senderName}
                        size={38}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#1F2937', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: '10.5px', color: '#9CA3AF', marginTop: '2px', display: 'block' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>

                        {/* Interactive Connection Request Accept/Reject Buttons */}
                        {n.type === 'CONNECTION_REQUEST' && onAcceptRequest && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcceptRequest(n.targetId || n.id);
                                setIsNotificationsOpen(false);
                              }}
                              style={{
                                backgroundColor: '#003822',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={12} />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onIgnoreRequest && onIgnoreRequest(n.targetId || n.id);
                              }}
                              style={{
                                backgroundColor: '#F3F4F6',
                                color: '#4B5563',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Ignore
                            </button>
                          </div>
                        )}

                        {/* Interactive Community Invite Accept/Decline Buttons */}
                        {n.type === 'COMMUNITY_INVITE' && onAcceptCommunityInvite && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcceptCommunityInvite(n.targetId || n.id);
                                setIsNotificationsOpen(false);
                              }}
                              style={{
                                backgroundColor: '#003822',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={12} />
                              <span>Join Group</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeclineCommunityInvite && onDeclineCommunityInvite(n.targetId || n.id);
                              }}
                              style={{
                                backgroundColor: '#F3F4F6',
                                color: '#4B5563',
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Doctor Profile Menu */}
        {currentUser ? (
          <div style={{ position: 'relative' }} ref={profileRef}>
            <div
              className="header-user-profile-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              title={`${currentUser.name} (Verified Doctor)`}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '9999px', border: '1px solid #E5E7EB' }}
            >
              <Avatar
                src={currentUser.avatar}
                name={currentUser.name}
                size={28}
                fontSize={12}
              />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#111827', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name.replace('Dr. ', '')}
              </span>
              <ChevronDown size={13} color="#4b5563" />
            </div>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '46px',
                right: 0,
                width: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB',
                padding: '12px',
                zIndex: 100
              }}>
                <div
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    if (onTabSelect) onTabSelect('profile');
                    if (onOpenDoctorProfile) onOpenDoctorProfile(currentUser, true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer' }}
                  title="View Full Profile"
                >
                  <Avatar
                    src={currentUser.avatar}
                    name={currentUser.name}
                    size={42}
                    fontSize={17}
                  />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>{currentUser.name}</h4>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>{currentUser.specialty || 'Veterinary Surgeon'}</span>
                  </div>
                </div>

                <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onTabSelect) onTabSelect('profile');
                      if (onOpenDoctorProfile) onOpenDoctorProfile(currentUser, true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#1F2937',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User size={15} color="#059669" />
                    <span>View Full Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenCreateProfile && onOpenCreateProfile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#1F2937',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <UserPen size={15} color="#059669" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      if (onOpenTerms) onOpenTerms();
                      else if (onTabSelect) onTabSelect('terms');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#1F2937',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="View Zenve Pets Healthcare Pvt. Ltd. Terms & Conditions"
                  >
                    <FileText size={15} color="#059669" />
                    <span>Terms & Conditions</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout && onLogout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: '#DC2626',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      marginTop: '4px',
                      borderTop: '1px solid #F3F4F6'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={15} color="#DC2626" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="header-signin-btn"
            onClick={onOpenLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#003822',
              color: '#ffffff',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0, 56, 34, 0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
