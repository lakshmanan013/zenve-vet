import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Bookmark, Share2, Play, Pause, Send, Stethoscope } from 'lucide-react';
import { Avatar } from './Avatar';
import { api } from '../services/api';
import likePuppy from '../assets/reactions/like_puppy.png';

export function VideoPlayerModal({ video, onClose, currentUser, doctors = [] }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load dynamic comments for this specific video
  useEffect(() => {
    if (!video?.id) {
      setComments([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const loadComments = async () => {
      try {
        const remoteComments = await api.videos.getComments(video.id);
        if (isMounted && remoteComments && remoteComments.length > 0) {
          setComments(remoteComments);
          return;
        }
      } catch (err) {
        // quiet fallback
      }

      // Check local storage backup
      try {
        const local = localStorage.getItem(`zenve_video_comments_${video.id}`);
        if (local && isMounted) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setComments(parsed);
            return;
          }
        }
      } catch (e) {}

      if (isMounted) {
        setComments([]);
      }
    };

    loadComments().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [video?.id]);

  if (!video) return null;

  // Resolve video author avatar
  const authorDoc = (doctors || []).find(d => 
    d.id === video.doctorId || 
    (d.name && video.doctorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === video.doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
  );
  const videoAuthorAvatar = authorDoc?.avatar || video.authorAvatar || '';

  const handleAddComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    const authorName = currentUser?.name || 'Dr. You (Verified)';
    const authorAvatar = currentUser?.avatar || '';
    const authorSpecialty = currentUser?.specialty || 'Veterinary Practitioner';
    const authorId = currentUser?.id ? Number(String(currentUser.id).replace('doc-', '')) : 1;

    const newComment = {
      id: Date.now(),
      authorId,
      authorName,
      authorAvatar,
      authorSpecialty,
      content: text,
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update
    setComments(prev => [...prev, newComment]);
    setCommentText('');

    try {
      const saved = await api.videos.addComment(video.id, {
        authorId,
        authorName,
        authorAvatar,
        authorSpecialty,
        content: text
      });
      if (saved && saved.id) {
        setComments(prev => prev.map(c => c.id === newComment.id ? { ...c, id: saved.id } : c));
      }
    } catch (err) {
      console.warn('Video comment server persistence note:', err);
    }

    // Persist to local cache
    try {
      const updated = [...comments, newComment];
      localStorage.setItem(`zenve_video_comments_${video.id}`, JSON.stringify(updated));
    } catch (e) {}

    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        style={{
          width: '780px',
          maxWidth: '95vw',
          height: '560px',
          backgroundColor: '#0E1410',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          animation: 'modalPop 0.25s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Video Player Area */}
        <div style={{ flex: '1.2', position: 'relative', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {video.videoUrl ? (
            <video 
              src={video.videoUrl} 
              controls 
              autoPlay 
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
            />
          ) : (
            <img 
              src={video.thumbnail} 
              alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Video Overlay Info */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Avatar src={videoAuthorAvatar} name={video.doctorName} size={38} style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '14.5px', fontWeight: '700', margin: '0 0 3px 0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                {video.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#C8DEC9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {video.doctorName} · {video.doctorSpecialty}
              </p>
            </div>
          </div>

          {/* Quick Floating Action Icons */}
          <div style={{ position: 'absolute', right: 14, bottom: 85, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
            <button 
              onClick={() => setIsLiked(!isLiked)} 
              style={{
                background: isLiked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isLiked ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Like"
            >
              <img
                src={likePuppy}
                alt="Like"
                style={{
                  width: 22,
                  height: 22,
                  objectFit: 'contain',
                  filter: isLiked ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.5))' : 'grayscale(100%) opacity(0.75)',
                  transform: isLiked ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </button>
            <button 
              onClick={() => setIsSaved(!isSaved)} 
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', width: 38, height: 38, borderRadius: '50%', color: isSaved ? '#C5A059' : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
              title="Bookmark"
            >
              <Bookmark size={18} fill={isSaved ? '#C5A059' : 'none'} />
            </button>
          </div>
        </div>

        {/* Right Discussion Area */}
        <div style={{ flex: '1', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={16} color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#0D472B' }}>
                Clinical Discussion
              </span>
              <span style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px' }}>
                {comments.length}
              </span>
            </div>
            <button onClick={onClose} className="btn-close-modal" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 12px', color: '#9CA3AF' }}>
                <MessageSquare size={36} color="#D1D5DB" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#374151', margin: '0 0 4px 0' }}>
                  No Clinical Comments Yet
                </h4>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>
                  Be the first veterinarian to ask a question, share peer feedback, or comment on this technique.
                </p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Avatar 
                    src={c.authorAvatar} 
                    name={c.authorName || c.author || 'Doctor'} 
                    size={32} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#111827', fontSize: '12.5px', fontWeight: '700' }}>
                        {c.authorName || c.author}
                      </strong>
                      <span style={{ color: '#059669', fontSize: '11px', fontWeight: '600' }}>
                        {c.authorSpecialty || 'Veterinary Practitioner'}
                      </span>
                    </div>
                    <p style={{ color: '#374151', fontSize: '12.5px', margin: 0, lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {c.content || c.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddComment} style={{ padding: '12px 16px', borderTop: '1px solid #E5E9E5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
              src={currentUser?.avatar} 
              name={currentUser?.name || 'Dr. You'} 
              size={28} 
            />
            <input 
              type="text" 
              placeholder="Add your veterinary feedback..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="custom-filter-select"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px' }}
            />
            <button 
              type="submit" 
              className="btn-submit-post" 
              disabled={!commentText.trim() || submitting}
              style={{ 
                padding: '8px 14px', 
                fontSize: '12px', 
                opacity: (!commentText.trim() || submitting) ? 0.6 : 1,
                cursor: (!commentText.trim() || submitting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Post</span>
              <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

