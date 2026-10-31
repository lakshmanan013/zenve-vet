import React, { useState, useRef } from 'react';
import {
  LIKE_REACTIONS,
  DISLIKE_REACTIONS,
  REACTION_MAP,
  DEFAULT_LIKE_ICON,
  DEFAULT_DISLIKE_ICON
} from '../data/reactions';

export function ReactionPicker({
  activeReaction, // e.g. 'like_puppy', 'sad_kitty', or null/undefined
  likesCount = 0,
  dislikesCount = 0,
  onSelectReaction, // (reactionIdOrNull) => void
  compact = false,
  className = ''
}) {
  const [hoveringLike, setHoveringLike] = useState(false);
  const [hoveringDislike, setHoveringDislike] = useState(false);
  const [tooltipReaction, setTooltipReaction] = useState(null);

  const likeTimerRef = useRef(null);
  const dislikeTimerRef = useRef(null);

  const isLiked = activeReaction && activeReaction.startsWith('like_');
  const isDisliked = activeReaction && activeReaction.startsWith('sad_');

  const currentLikeObj = isLiked ? REACTION_MAP[activeReaction] : null;
  const currentDislikeObj = isDisliked ? REACTION_MAP[activeReaction] : null;

  // Graceful hover handlers for Like dock
  const handleLikeMouseEnter = () => {
    if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    likeTimerRef.current = setTimeout(() => {
      setHoveringLike(true);
      setHoveringDislike(false);
    }, 180);
  };

  const handleLikeMouseLeave = () => {
    if (likeTimerRef.current) clearTimeout(likeTimerRef.current);
    likeTimerRef.current = setTimeout(() => {
      setHoveringLike(false);
      setTooltipReaction(null);
    }, 320);
  };

  // Graceful hover handlers for Dislike dock
  const handleDislikeMouseEnter = () => {
    if (dislikeTimerRef.current) clearTimeout(dislikeTimerRef.current);
    dislikeTimerRef.current = setTimeout(() => {
      setHoveringDislike(true);
      setHoveringLike(false);
    }, 180);
  };

  const handleDislikeMouseLeave = () => {
    if (dislikeTimerRef.current) clearTimeout(dislikeTimerRef.current);
    dislikeTimerRef.current = setTimeout(() => {
      setHoveringDislike(false);
      setTooltipReaction(null);
    }, 320);
  };

  const handleQuickLikeClick = () => {
    if (isLiked) {
      onSelectReaction(null);
    } else {
      onSelectReaction('like_puppy');
    }
  };

  const handleQuickDislikeClick = () => {
    if (isDisliked) {
      onSelectReaction(null);
    } else {
      onSelectReaction('sad_puppy');
    }
  };

  return (
    <div
      className={`reaction-picker-cluster ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative'
      }}
    >
      {/* 1. LIKE BUTTON & HOVER DOCK */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={handleLikeMouseEnter}
        onMouseLeave={handleLikeMouseLeave}
      >
        <button
          type="button"
          className={`post-action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleQuickLikeClick}
          title={isLiked ? `Reacted with ${currentLikeObj?.label || 'Like'}. Click to remove.` : 'Like (hover for all options)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isLiked ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
            padding: '5px 9px',
            borderRadius: '16px',
            border: isLiked ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <img
            src={currentLikeObj ? currentLikeObj.icon : DEFAULT_LIKE_ICON}
            alt={currentLikeObj?.label || 'Like'}
            style={{
              width: 22,
              height: 22,
              objectFit: 'contain',
              filter: isLiked
                ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.55))'
                : 'grayscale(100%) opacity(0.65)',
              transform: isLiked ? 'scale(1.18)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          />
          <span
            style={{
              fontWeight: isLiked ? 700 : 500,
              fontSize: '13px',
              color: isLiked ? (currentLikeObj?.color || '#d97706') : '#6b7280'
            }}
          >
            {likesCount}
          </span>
        </button>

        {/* Floating Like Options Dock */}
        {hoveringLike && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '26px',
              border: '1px solid rgba(220, 226, 220, 0.85)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
              animation: 'reactionDockSlideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {LIKE_REACTIONS.map((item, idx) => {
              const isSelected = activeReaction === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReaction(isSelected ? null : item.id);
                    setHoveringLike(false);
                  }}
                  onMouseEnter={() => setTooltipReaction(item.label)}
                  onMouseLeave={() => setTooltipReaction(null)}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    border: isSelected ? '1.5px solid #F59E0B' : '1px solid transparent',
                    borderRadius: '50%',
                    padding: 3,
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  className="reaction-dock-item"
                  title={item.label}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    style={{
                      width: 28,
                      height: 28,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                    }}
                  />
                </button>
              );
            })}
            {tooltipReaction && (
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}
              >
                {tooltipReaction}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. DISLIKE BUTTON & HOVER DOCK */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={handleDislikeMouseEnter}
        onMouseLeave={handleDislikeMouseLeave}
      >
        <button
          type="button"
          className={`post-action-btn ${isDisliked ? 'disliked' : ''}`}
          onClick={handleQuickDislikeClick}
          title={isDisliked ? `Reacted with ${currentDislikeObj?.label || 'Dislike'}. Click to remove.` : 'Dislike (hover for all options)'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isDisliked ? 'rgba(239, 68, 68, 0.12)' : 'transparent',
            padding: '5px 9px',
            borderRadius: '16px',
            border: isDisliked ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <img
            src={currentDislikeObj ? currentDislikeObj.icon : DEFAULT_DISLIKE_ICON}
            alt={currentDislikeObj?.label || 'Dislike'}
            style={{
              width: 22,
              height: 22,
              objectFit: 'contain',
              filter: isDisliked
                ? 'drop-shadow(0 2px 6px rgba(239, 68, 68, 0.55))'
                : 'grayscale(100%) opacity(0.65)',
              transform: isDisliked ? 'scale(1.18)' : 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          />
          <span
            style={{
              fontWeight: isDisliked ? 700 : 500,
              fontSize: '13px',
              color: isDisliked ? '#ef4444' : '#6b7280'
            }}
          >
            {dislikesCount}
          </span>
        </button>

        {/* Floating Dislike Options Dock */}
        {hoveringDislike && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '26px',
              border: '1px solid rgba(220, 226, 220, 0.85)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)',
              animation: 'reactionDockSlideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {DISLIKE_REACTIONS.map((item, idx) => {
              const isSelected = activeReaction === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectReaction(isSelected ? null : item.id);
                    setHoveringDislike(false);
                  }}
                  onMouseEnter={() => setTooltipReaction(item.label)}
                  onMouseLeave={() => setTooltipReaction(null)}
                  style={{
                    background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    border: isSelected ? '1.5px solid #EF4444' : '1px solid transparent',
                    borderRadius: '50%',
                    padding: 3,
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                  className="reaction-dock-item"
                  title={item.label}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    style={{
                      width: 28,
                      height: 28,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))'
                    }}
                  />
                </button>
              );
            })}
            {tooltipReaction && (
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}
              >
                {tooltipReaction}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReactionPicker;

