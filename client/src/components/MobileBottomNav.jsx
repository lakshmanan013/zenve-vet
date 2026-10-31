import React from 'react';
import {
  Home,
  Users,
  Plus,
  FolderHeart,
  Video,
  MessageSquare
} from 'lucide-react';

export function MobileBottomNav({
  activeTab,
  onTabSelect,
  unreadMessagesCount = 0,
  pendingRequestsCount = 0,
  onOpenCreatePost
}) {
  const navItems = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'network', label: 'Network', icon: Users, badge: pendingRequestsCount },
    { id: 'cases', label: 'Cases', icon: FolderHeart },
    { id: 'videos', label: 'Reels', icon: Video },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-bottom-nav-inner">
        {/* Left items: Home & Network */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabSelect && onTabSelect(item.id)}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                {item.badge > 0 && (
                  <span className="mobile-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {isActive && <span className="mobile-nav-active-pill" />}
            </button>
          );
        })}

        {/* Center Floating Action Button (Create Post / Case) */}
        <button
          type="button"
          onClick={() => onOpenCreatePost && onOpenCreatePost('CLINICAL_CASE')}
          className="mobile-nav-fab"
          aria-label="Create Post or Clinical Case"
          title="Share Clinical Case or Post"
        >
          <div className="mobile-nav-fab-circle">
            <Plus size={22} strokeWidth={2.6} color="#FFFFFF" />
          </div>
          <span className="mobile-nav-label fab-label">Zenv</span>
        </button>

        {/* Right items: Cases, Reels, Messages */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabSelect && onTabSelect(item.id)}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="mobile-nav-icon-wrap">
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                {item.badge > 0 && (
                  <span className="mobile-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {isActive && <span className="mobile-nav-active-pill" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
