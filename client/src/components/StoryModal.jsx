import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  Share2,
  Send,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Stethoscope,
  Sparkles,
  Eye,
  Search,
  Users,
  Smile,
  Trash2
} from 'lucide-react';
import { Avatar } from './Avatar';
import likePuppy from '../assets/reactions/like_puppy.png';
import { LIKE_REACTIONS, DISLIKE_REACTIONS } from '../data/reactions';
import { api } from '../services/api';

const resolveMediaUrl = (url) => {
  if (!url) return '';
  const str = String(url).trim();
  if (str.startsWith('data:') || str.startsWith('blob:')) return str;
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  if (str.startsWith('/uploads/')) return `http://localhost:8080${str}`;
  if (str.startsWith('uploads/')) return `http://localhost:8080/${str}`;
  return str;
};

const QUICK_REACTIONS = ['❤️', '🔥', '👏', '😮', '😂', '🩺', '🐾'];

export function StoryModal({
  story,
  stories = [],
  onSelectStory,
  onClose,
  currentUser,
  doctors = [],
  onSendMessage,
  onUpdateStory,
  onDeleteStory
}) {
  // Active story index in the stories list
  const activeStories = (stories && stories.length > 0) ? stories : (story ? [story] : []);
  const activeIndex = story ? activeStories.findIndex(s => s.id === story.id || String(s.id) === String(story.id)) : -1;
  const currentStory = (activeIndex !== -1 ? activeStories[activeIndex] : story) || {};

  const isVideo = Boolean(
    currentStory.videoUrl ||
    currentStory.mediaType === 'VIDEO' ||
    (currentStory.image && (
      /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(currentStory.image) ||
      currentStory.image.startsWith('data:video')
    )) ||
    (currentStory.mediaUrl && (
      /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(currentStory.mediaUrl) ||
      currentStory.mediaUrl.startsWith('data:video')
    ))
  );

  // Check if current user is the owner of this story
  const isStoryOwner = Boolean(currentUser && (
    (currentStory.doctorId != null && (
      currentStory.doctorId === currentUser.id ||
      String(currentStory.doctorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '')
    )) ||
    (currentStory.doctorName && currentUser.name && (
      currentStory.doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim()
    )) ||
    (currentStory.doctorName && currentStory.doctorName.toLowerCase().includes('you')) ||
    currentStory.doctorId === 'doc-me'
  ));

  // Story playback states
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const lastTapRef = useRef(0);
  const viewedStoriesRef = useRef(new Set());

  // Like states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [heartAnim, setHeartAnim] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [doubleTapHeart, setDoubleTapHeart] = useState(null);

  // Share states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharesCount, setSharesCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentDoctors, setSentDoctors] = useState({});

  // Viewers states (Story viewer count and list)
  const [viewsCount, setViewsCount] = useState(0);
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewerSearch, setViewerSearch] = useState('');
  const [loadingViewers, setLoadingViewers] = useState(false);

  // Reactions & Reply states
  const [replyText, setReplyText] = useState('');
  const [replyToast, setReplyToast] = useState('');
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  // Story navigation handlers
  const handleNextStory = () => {
    if (activeIndex < activeStories.length - 1) {
      if (onSelectStory) onSelectStory(activeStories[activeIndex + 1]);
    } else {
      if (onClose) onClose();
    }
  };

  const handlePrevStory = () => {
    if (activeIndex > 0) {
      if (onSelectStory) onSelectStory(activeStories[activeIndex - 1]);
    }
  };

  // Sync state whenever active story changes
  useEffect(() => {
    if (!currentStory?.id) return;
    setIsLiked(!!currentStory.isLiked);
    setLikesCount(currentStory.likes || 0);
    setSharesCount(currentStory.shares || 0);
    setViewsCount(currentStory.views || 0);
    setProgress(0);
    setIsPaused(false);
    setIsShareOpen(false);
    setIsViewersOpen(false);
    setCopiedLink(false);
    setSentDoctors({});
    setReplyText('');
    setFloatingHearts([]);
    setDoubleTapHeart(null);
    setShowReactionsBar(false);

    // Record view in backend automatically (only once per story per session)
    if (!viewedStoriesRef.current.has(currentStory.id)) {
      viewedStoriesRef.current.add(currentStory.id);
      const viewerDoctorId = currentUser?.id ? Number(String(currentUser.id).replace('doc-', '')) : 1;
      const viewerDoctorName = currentUser?.name || 'Dr. Colleague';
      const viewerDoctorAvatar = currentUser?.avatar || '';
      const viewerSpecialty = currentUser?.specialty || 'Veterinary Practitioner';

      api.stories.recordView(currentStory.id, viewerDoctorId, viewerDoctorName, viewerDoctorAvatar, viewerSpecialty)
        .then(res => {
          if (res && res.views != null) {
            setViewsCount(res.views);
          }
        })
        .catch(() => { });
    }
  }, [currentStory?.id]);

  // Story progress timer (pure state update without calling parent setState inside updater)
  const STORY_DURATION_MS = 6000;
  useEffect(() => {
    if (!story || isPaused || isShareOpen || isViewersOpen) return;

    const intervalMs = 50;
    const increment = (intervalMs / STORY_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [story, isPaused, isShareOpen, isViewersOpen, currentStory?.id]);

  // When progress finishes 100%, advance to next story cleanly
  useEffect(() => {
    if (progress >= 100) {
      setProgress(0);
      handleNextStory();
    }
  }, [progress]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNextStory();
      } else if (e.key === 'ArrowLeft') {
        handlePrevStory();
      } else if (e.key === 'Escape') {
        if (isViewersOpen) {
          setIsViewersOpen(false);
          setIsPaused(false);
        } else if (isShareOpen) {
          setIsShareOpen(false);
          setIsPaused(false);
        } else if (onClose) {
          onClose();
        }
      } else if (e.key === ' ' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, activeStories, isShareOpen, isViewersOpen]);

  // Spawn floating emoji/heart particle
  const spawnFloatingParticles = (itemOrSymbol = '❤️', x = null, y = null) => {
    const id = Date.now() + Math.random();
    const isObj = typeof itemOrSymbol === 'object' && itemOrSymbol !== null;
    const newParticle = {
      id,
      symbol: isObj ? itemOrSymbol.label : itemOrSymbol,
      icon: isObj ? itemOrSymbol.icon : null,
      x: x !== null ? x : 50 + (Math.random() * 20 - 10),
      size: isObj ? 32 : (itemOrSymbol === '❤️' ? (18 + Math.floor(Math.random() * 12)) : 24),
      rotation: Math.floor(Math.random() * 36 - 18)
    };
    setFloatingHearts(prev => [...prev.slice(-6), newParticle]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1200);
  };

    // Like / Unlike action
    const handleToggleLike = async (e) => {
      if (e) e.stopPropagation();
      const nextLiked = !isLiked;
      const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);

      setIsLiked(nextLiked);
      setLikesCount(nextCount);
      setHeartAnim(true);
      setTimeout(() => setHeartAnim(false), 450);

      if (nextLiked) {
        spawnFloatingParticles('❤️');
      }

      if (onUpdateStory) {
        onUpdateStory({ id: currentStory.id, likes: nextCount, isLiked: nextLiked });
      }

      const doctorId = currentUser?.id ? Number(String(currentUser.id).replace('doc-', '')) : 1;
      const doctorName = currentUser?.name || 'Dr. You';

      try {
        await api.stories.toggleLike(currentStory.id, doctorId, doctorName);
      } catch (err) {
        console.warn('Story like remote sync notice:', err);
      }
    };

    // Double tap to like on story media
    const handleMediaTouchOrClick = (e) => {
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap triggered
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX ? ((e.clientX - rect.left) / rect.width) * 100 : 50;
        const y = e.clientY ? ((e.clientY - rect.top) / rect.height) * 100 : 50;

        setDoubleTapHeart({ x, y, id: now });
        setTimeout(() => setDoubleTapHeart(null), 900);

        if (!isLiked) {
          handleToggleLike();
        } else {
          spawnFloatingParticles('❤️', x, y);
        }
      }
      lastTapRef.current = now;
    };

    // Story Reactions
    const handleSendReaction = (emoji) => {
      spawnFloatingParticles(emoji);
      const handleSendReaction = (item) => {
        spawnFloatingParticles(item);
        setShowReactionsBar(false);

        const label = item?.label || (typeof item === 'string' ? item : 'Reaction');
        const receiverId = currentStory.doctorId ? Number(String(currentStory.doctorId).replace('doc-', '')) : null;
        const rawMedia = currentStory.videoUrl || currentStory.image || currentStory.mediaUrl || '';
        const media = resolveMediaUrl(rawMedia);
        const isVid = Boolean(currentStory.videoUrl || currentStory.mediaType === 'VIDEO' || isVideo || (media && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(media)));
        if (onSendMessage && receiverId) {
          onSendMessage({
            receiverId,
            text: `Reacted with ${emoji} to your story`,
            text: `Reacted with ${label} to your story`,
            attachmentUrl: media,
            attachmentType: isVid ? 'VIDEO' : 'IMAGE'
          });
        }

        setReplyToast(`Sent ${emoji} reaction!`);
        setReplyToast(`Sent ${label}!`);
        setTimeout(() => setReplyToast(''), 2500);
      };

      // Story Viewers Drawer
      const handleOpenViewers = async () => {
        setIsViewersOpen(true);
        setIsPaused(true);
        setLoadingViewers(true);
        try {
          const data = await api.stories.getViewers(currentStory.id);
          setViewersList(data || []);
        } catch (e) {
          setViewersList([]);
        } finally {
          setLoadingViewers(false);
        }
      };

      // Share story: copy link
      const handleCopyStoryLink = () => {
        const url = `${window.location.origin}/?story=${currentStory.id}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).catch(() => { });
        }
        setCopiedLink(true);
        setSharesCount(prev => prev + 1);
        if (onUpdateStory) onUpdateStory({ id: currentStory.id, shares: sharesCount + 1 });
        api.stories.recordShare(currentStory.id).catch(() => { });
        setTimeout(() => setCopiedLink(false), 2400);
      };

      // Share story: native device share
      const handleNativeShare = async () => {
        const url = `${window.location.origin}/?story=${currentStory.id}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Dr. ${currentStory.doctorName}'s Story on Zenve Vet`,
              text: currentStory.caption || 'Moments from clinical veterinary practice on Zenve Vet',
              url
            });
            setSharesCount(prev => prev + 1);
            if (onUpdateStory) onUpdateStory({ id: currentStory.id, shares: sharesCount + 1 });
            api.stories.recordShare(currentStory.id).catch(() => { });
          } catch (err) {
            // User cancelled share
          }
        } else {
          handleCopyStoryLink();
        }
      };

      // Direct share to a colleague doctor
      const handleSendToDoctor = async (doc) => {
        if (sentDoctors[doc.id]) return;

        setSentDoctors(prev => ({ ...prev, [doc.id]: true }));
        setSharesCount(prev => prev + 1);
        if (onUpdateStory) onUpdateStory({ id: currentStory.id, shares: sharesCount + 1 });
        api.stories.recordShare(currentStory.id).catch(() => { });

        const receiverId = doc.id ? Number(String(doc.id).replace('doc-', '')) : null;
        const shareMessage = `Shared a 24h story by Dr. ${currentStory.doctorName}:\n"${currentStory.caption || 'Clinical update'}"\n${window.location.origin}/?story=${currentStory.id}`;
        const rawMedia = currentStory.videoUrl || currentStory.image || currentStory.mediaUrl || '';
        const media = resolveMediaUrl(rawMedia);
        const isVid = Boolean(currentStory.videoUrl || currentStory.mediaType === 'VIDEO' || isVideo || (media && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(media)));

        if (onSendMessage) {
          onSendMessage({
            receiverId,
            text: shareMessage,
            attachmentUrl: media,
            attachmentType: isVid ? 'VIDEO' : 'IMAGE'
          });
        }

        setReplyToast(`Story shared with Dr. ${doc.name.replace(/^dr\.?\s*/i, '')}!`);
        setTimeout(() => setReplyToast(''), 3000);
      };

      // Submit reply message
      const handleSendReply = (e) => {
        if (e) e.preventDefault();
        const text = replyText.trim();
        if (!text) return;

        const receiverId = currentStory.doctorId ? Number(String(currentStory.doctorId).replace('doc-', '')) : null;
        const rawMedia = currentStory.videoUrl || currentStory.image || currentStory.mediaUrl || '';
        const media = resolveMediaUrl(rawMedia);
        const isVid = Boolean(currentStory.videoUrl || currentStory.mediaType === 'VIDEO' || isVideo || (media && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(media)));

        if (onSendMessage) {
          onSendMessage({
            receiverId,
            text: `Replied to your story: "${text}"`,
            attachmentUrl: media,
            attachmentType: isVid ? 'VIDEO' : 'IMAGE'
          });
        }

        setReplyText('');
        setReplyToast(`Reply sent to Dr. ${currentStory.doctorName}!`);
        setTimeout(() => setReplyToast(''), 3000);
      };

      // Delete current story
      const handleDeleteCurrentStory = async (e) => {
        if (e) e.stopPropagation();
        setIsPaused(true);
        if (!window.confirm('Are you sure you want to delete this 24h story? It will be permanently removed.')) {
          setIsPaused(false);
          return;
        }
        const storyIdToDelete = currentStory.id;
        if (onDeleteStory) {
          await onDeleteStory(storyIdToDelete);
        }
        if (activeStories.length > 1) {
          if (activeIndex < activeStories.length - 1) {
            handleNextStory();
          } else if (activeIndex > 0) {
            handlePrevStory();
          } else {
            if (onClose) onClose();
          }
        } else {
          if (onClose) onClose();
        }
      };

      const filteredViewers = viewersList.filter(v => {
        if (!viewerSearch.trim()) return true;
        const q = viewerSearch.toLowerCase();
        return (
          (v.viewerDoctorName && v.viewerDoctorName.toLowerCase().includes(q)) ||
          (v.viewerSpecialty && v.viewerSpecialty.toLowerCase().includes(q))
        );
      });

      if (!story || !currentStory?.id) return null;

      return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 12000 }}>
          <style>{`
        @keyframes heartPulse {
          0% { transform: scale(1); }
          45% { transform: scale(1.35); }
          75% { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(0.8) rotate(0deg); }
          50% { opacity: 0.95; transform: translateY(-70px) scale(1.15) rotate(-10deg); }
          100% { opacity: 0; transform: translateY(-140px) scale(1.35) rotate(15deg); }
        }
        @keyframes bigHeartBurst {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
          75% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        @keyframes toastFade {
          0% { opacity: 0; transform: translate(-50%, 15px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

          {/* Left Desktop Nav Button */}
          {activeIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
              style={{
                position: 'absolute',
                left: 'calc(50% - 240px)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 12010,
                transition: 'all 0.2s ease'
              }}
              title="Previous story (Left arrow)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Desktop Nav Button */}
          {activeIndex < activeStories.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
              style={{
                position: 'absolute',
                right: 'calc(50% - 240px)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 12010,
                transition: 'all 0.2s ease'
              }}
              title="Next story (Right arrow)"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Main Story Phone Simulator Card */}
          <div
            style={{
              width: '390px',
              maxWidth: '94vw',
              height: '670px',
              maxHeight: '92vh',
              backgroundColor: '#000000',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.12)',
              animation: 'modalPop 0.25s ease',
              userSelect: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Story Multi-Segment Progress Bars */}
            <div style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              display: 'flex',
              gap: 4,
              zIndex: 30
            }}>
              {activeStories.map((s, idx) => {
                let fillPercent = 0;
                if (idx < activeIndex) fillPercent = 100;
                else if (idx === activeIndex) fillPercent = progress;

                return (
                  <div
                    key={s.id || idx}
                    style={{
                      height: 3,
                      flex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.32)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectStory) onSelectStory(s);
                    }}
                  >
                    <div style={{
                      height: '100%',
                      width: `${fillPercent}%`,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 2,
                      transition: idx === activeIndex ? 'width 50ms linear' : 'none'
                    }} />
                  </div>
                );
              })}
            </div>

            {/* Story Top Header Bar */}
            <div style={{
              position: 'absolute',
              top: 26,
              left: 14,
              right: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 30
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar
                  src={currentStory.avatar}
                  name={currentStory.doctorName || currentStory.fullDoctorName}
                  size={38}
                  style={{ border: '2px solid #10B981', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 13.5,
                      margin: 0,
                      textShadow: '0 1px 3px rgba(0,0,0,0.85)'
                    }}>
                      {currentStory.fullDoctorName || currentStory.doctorName}
                    </p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(16, 185, 129, 0.25)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(16, 185, 129, 0.6)',
                      color: '#a7f3d0',
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 6
                    }}>
                      VET
                    </span>
                  </div>
                  <span style={{
                    color: 'rgba(255,255,255,0.78)',
                    fontSize: 11,
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                  }}>
                    {currentStory.time || '24h Story'} · Tap to pause
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Play / Pause Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPaused(p => !p); }}
                  style={{
                    color: '#FFFFFF',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isPaused ? "Play story" : "Pause story"}
                >
                  {isPaused ? <Play size={14} fill="#FFF" /> : <Pause size={14} fill="#FFF" />}
                </button>

                {/* Video Mute Toggle */}
                {isVideo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(m => !m);
                      if (videoRef.current) videoRef.current.muted = !isMuted;
                    }}
                    style={{
                      color: '#FFFFFF',
                      background: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title={isMuted ? "Unmute audio" : "Mute audio"}
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                )}

                {/* Owner Story Delete Button */}
                {isStoryOwner && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrentStory}
                    style={{
                      color: '#FFFFFF',
                      background: 'rgba(220, 38, 38, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(254, 202, 202, 0.45)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.45)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Delete your story"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
                  style={{
                    color: '#FFFFFF',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Close story"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Story Media with Tap Zone */}
            <div
              style={{ width: '100%', height: '100%', position: 'relative', cursor: 'pointer' }}
              onClick={handleMediaTouchOrClick}
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={resolveMediaUrl(currentStory.videoUrl || currentStory.image || currentStory.mediaUrl)}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <img
                  src={resolveMediaUrl(currentStory.image || currentStory.mediaUrl)}
                  alt={currentStory.caption || 'Clinical story'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}

              {/* Left / Right Tap Navigation Hotspots */}
              <div
                style={{ position: 'absolute', top: 80, bottom: 120, left: 0, width: '25%', zIndex: 15 }}
                onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
                title="Previous story"
              />
              <div
                style={{ position: 'absolute', top: 80, bottom: 120, right: 0, width: '25%', zIndex: 15 }}
                onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
                title="Next story"
              />

              {/* Double-tap large pulsing heart burst */}
              {doubleTapHeart && (
                <div
                  style={{
                    position: 'absolute',
                    top: `${doubleTapHeart.y}%`,
                    left: `${doubleTapHeart.x}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                    pointerEvents: 'none',
                    animation: 'bigHeartBurst 0.85s ease-out forwards',
                    filter: 'drop-shadow(0 6px 20px rgba(239,68,68,0.7))'
                  }}
                >
                  <img src={likePuppy} alt="Liked" style={{ width: 88, height: 88, objectFit: 'contain' }} />
                </div>
              )}

              {/* Floating heart/emoji particles on like or reaction */}
              {floatingHearts.map(h => (
                <div
                  key={h.id}
                  style={{
                    position: 'absolute',
                    bottom: 85,
                    right: 56,
                    zIndex: 35,
                    pointerEvents: 'none',
                    animation: 'floatUp 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                    fontSize: h.size
                  }}
                >
                  {h.icon ? (
                    <img src={h.icon} alt={h.symbol} style={{ width: h.size, height: h.size, objectFit: 'contain' }} />
                  ) : h.symbol === '❤️' ? (
                    <img src={likePuppy} alt="Like" style={{ width: h.size, height: h.size, objectFit: 'contain' }} />
                  ) : (
                    <span>{h.symbol}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Temporary Feedback Notification Toast */}
            {replyToast && (
              <div style={{
                position: 'absolute',
                top: 76,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(16, 185, 129, 0.95)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                padding: '7px 16px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                zIndex: 45,
                animation: 'toastFade 3s ease forwards'
              }}>
                <Sparkles size={14} />
                <span>{replyToast}</span>
              </div>
            )}

            {/* Story Viewers Bar (for Story Owner) */}
            {isStoryOwner && (
              <div style={{
                position: 'absolute',
                bottom: 74,
                left: 14,
                right: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                zIndex: 35
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenViewers();
                  }}
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#FFFFFF',
                    borderRadius: 20,
                    padding: '5px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s ease'
                  }}
                  title="See who viewed your story"
                >
                  <Eye size={15} color="#34D399" />
                  <span>{viewsCount} {viewsCount === 1 ? 'Viewer' : 'Viewers'}</span>
                </button>
              </div>
            )}

            {/* Quick Reactions Bar Popup */}
        {/* Quick Reactions Bar Popup with all 6 Like and 6 Dislike options */}
        {showReactionsBar && (
          <div
            style={{
              position: 'absolute',
              bottom: 74,
              left: 12,
              right: 12,
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.22)',
              borderRadius: 22,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 38,
              animation: 'modalPop 0.2s ease',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Likes Row */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                    Likes & Hearts
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {LIKE_REACTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSendReaction(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 3,
                          transition: 'transform 0.15s ease'
                        }}
                        title={item.label}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img src={item.icon} alt={item.label} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dislikes Row */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 6 }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
                    Dislikes & Grumpy
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {DISLIKE_REACTIONS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSendReaction(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 3,
                          transition: 'transform 0.15s ease'
                        }}
                        title={item.label}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img src={item.icon} alt={item.label} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Story Action & Engagement Bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 14px 18px 14px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0) 100%)',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              zIndex: 30
            }}>
              {/* Story Caption */}
              {currentStory.caption && (
                <p style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  margin: 0,
                  lineHeight: 1.45,
                  color: '#F9FAFB',
                  textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                  maxHeight: '60px',
                  overflowY: 'auto'
                }}>
                  {currentStory.caption}
                </p>
              )}

              {/* Controls: Reply Input + Smile Reaction + Like + Share */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Direct Message / Reply Form */}
                <form
                  onSubmit={handleSendReply}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 24,
                    padding: '4px 6px 4px 12px'
                  }}
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => !isShareOpen && !isViewersOpen && setIsPaused(false)}
                    placeholder={`Reply to Dr. ${currentStory.doctorName}...`}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactionsBar(b => !b);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.7)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="React with emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    style={{
                      background: replyText.trim() ? '#10B981' : 'transparent',
                      border: 'none',
                      color: replyText.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: replyText.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    title="Send reply"
                  >
                    <Send size={15} />
                  </button>
                </form>

                {/* Like Button */}
                <button
                  onClick={handleToggleLike}
                  style={{
                    background: isLiked ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isLiked ? '#F59E0B' : 'rgba(255, 255, 255, 0.35)'}`,
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isLiked ? '#EF4444' : '#FFFFFF',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animation: heartAnim ? 'heartPulse 0.4s ease' : 'none',
                    position: 'relative'
                  }}
                  title={isLiked ? "Unlike story" : "Like story"}
                >
                  <img
                    src={likePuppy}
                    alt="Like"
                    style={{
                      width: 24,
                      height: 24,
                      objectFit: 'contain',
                      filter: isLiked
                        ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.5))'
                        : 'grayscale(100%) opacity(0.75)',
                      transform: isLiked ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                  {likesCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -6,
                      right: -4,
                      background: '#EF4444',
                      color: '#FFFFFF',
                      fontSize: 9.5,
                      fontWeight: 800,
                      borderRadius: 10,
                      padding: '1px 5px',
                      boxShadow: '0 2px 5px rgba(239,68,68,0.5)'
                    }}>
                      {likesCount}
                    </span>
                  )}
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareOpen(true);
                    setIsPaused(true);
                  }}
                  style={{
                    background: isShareOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isShareOpen ? '#10B981' : 'rgba(255, 255, 255, 0.35)'}`,
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isShareOpen ? '#34D399' : '#FFFFFF',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  title="Share story"
                >
                  <Share2 size={19} />
                  {sharesCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -6,
                      right: -4,
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontSize: 9.5,
                      fontWeight: 800,
                      borderRadius: 10,
                      padding: '1px 5px',
                      boxShadow: '0 2px 5px rgba(16,185,129,0.5)'
                    }}>
                      {sharesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* ====================================================================== */}
            {/* Story Viewers Sheet Modal ("User view how many people view story") */}
            {/* ====================================================================== */}
            {isViewersOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#0F172A',
                  borderTop: '1px solid rgba(255,255,255,0.18)',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: '18px 16px 20px 16px',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: '68%',
                  boxShadow: '0 -15px 50px rgba(0,0,0,0.8)',
                  animation: 'slideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Eye size={18} color="#10B981" />
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                      Story Viewers ({viewersList.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsViewersOpen(false);
                      setIsPaused(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#FFFFFF',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Viewer Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '6px 10px'
                }}>
                  <Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Search viewers..."
                    value={viewerSearch}
                    onChange={(e) => setViewerSearch(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                </div>

                {/* Viewers List */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 140,
                  maxHeight: 250,
                  paddingRight: 4
                }}>
                  {loadingViewers ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: 13 }}>
                      Loading story viewers...
                    </div>
                  ) : filteredViewers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 12px', color: '#94A3B8' }}>
                      <Users size={32} color="#64748B" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                        {viewerSearch ? 'No viewers matching your search' : 'No viewers yet'}
                      </p>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>
                        Veterinarians who view your 24h story will appear here.
                      </span>
                    </div>
                  ) : (
                    filteredViewers.map(v => (
                      <div
                        key={v.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar
                            src={v.viewerDoctorAvatar}
                            name={v.viewerDoctorName}
                            size={34}
                          />
                          <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                              {v.viewerDoctorName}
                            </p>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              {v.viewerSpecialty || 'Veterinary Practitioner'}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                          Viewed
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Zenve Vet Interactive Share Sheet Drawer */}
            {isShareOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#0F172A',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  borderTopLeftRadius: 22,
                  borderTopRightRadius: 22,
                  padding: '18px 16px 20px 16px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 -10px 40px rgba(0,0,0,0.6)',
                  animation: 'slideUp 0.22s ease-out'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Share Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Share2 size={17} color="#10B981" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                      Share 24h Story
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsShareOpen(false);
                      setIsPaused(false);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      color: '#FFFFFF',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Quick Actions: Copy Link & Native Share */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCopyStoryLink}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: copiedLink ? '#065F46' : 'rgba(255,255,255,0.08)',
                      border: `1px solid ${copiedLink ? '#10B981' : 'rgba(255,255,255,0.15)'}`,
                      color: copiedLink ? '#A7F3D0' : '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedLink ? <Check size={15} color="#34D399" /> : <Copy size={15} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: '#10B981',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Share2 size={15} />
                    <span>Share Via...</span>
                  </button>
                </div>

                {/* Send Directly to Colleague Doctors */}
                <div>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'block',
                    marginBottom: 8
                  }}>
                    Send to Veterinarian Colleagues
                  </span>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 180,
                    overflowY: 'auto',
                    paddingRight: 4
                  }}>
                    {doctors.slice(0, 6).map(doc => {
                      const isSent = !!sentDoctors[doc.id];
                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 10,
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar
                              src={doc.avatar}
                              name={doc.name}
                              size={32}
                            />
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
                                {doc.name}
                              </p>
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                {doc.specialty || 'Veterinary Practitioner'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSendToDoctor(doc)}
                            disabled={isSent}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 8,
                              backgroundColor: isSent ? 'rgba(16, 185, 129, 0.2)' : '#10B981',
                              border: `1px solid ${isSent ? '#10B981' : 'transparent'}`,
                              color: isSent ? '#34D399' : '#FFFFFF',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: isSent ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {isSent ? (
                              <>
                                <Check size={12} />
                                <span>Sent</span>
                              </>
                            ) : (
                              <span>Send</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
}

