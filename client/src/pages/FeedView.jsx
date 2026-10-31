import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Plus,
  Image as ImageIcon,
  Briefcase,
  Video,
  Sparkles,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  CheckCircle2,
  Stethoscope,
  Users,
  PawPrint,
  Send,
  Trash2,
  Flag,
  MoreHorizontal,
  Megaphone,
  ExternalLink,
  Clock,
  Copy,
  Check,
  X,
  CornerDownRight
} from 'lucide-react';
import heroVetImg from '../assets/hero_vet_dog.jpg';
import likePuppy from '../assets/reactions/like_puppy.png';
import sadPuppy from '../assets/reactions/sad_puppy.png';
import { ReactionPicker } from '../components/ReactionPicker';
import { REACTION_MAP } from '../data/reactions';
import { SPECIALTIES, STATES_INDIA } from '../data/mockData';
import { api } from '../services/api';
import { Avatar } from '../components/Avatar';

const isVideoMedia = (url) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.ogg') || clean.endsWith('.mkv');
};

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `http://localhost:8080${url}`;
  return url;
};

export function FeedView({
  posts = [],
  stories = [],
  doctors = [],
  liveCampaigns = [],
  onExpireCampaign,
  onOpenStory,
  onOpenCreatePost,
  onOpenAiAssistant,
  onOpenClinicalCase,
  onLikePost,
  onAddComment,
  onDeletePost,
  onBookmarkPost,
  onReportPost,
  currentUser,
  onOpenDoctorProfile,
  onSendMessage,
  onDeleteStory
}) {
  const [activeTab, setActiveTab] = useState('for_you');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All specialties');
  const [selectedState, setSelectedState] = useState('All states');
  const [selectedType, setSelectedType] = useState('All posts');

  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [fetchedCommentsMap, setFetchedCommentsMap] = useState({});
  const loggedViewsRef = useRef({});
  const [, setTimerTick] = useState(0);

  // Social interaction states
  const lastTapMap = useRef({});
  const [doubleTapHearts, setDoubleTapHearts] = useState({});
  const [postReactions, setPostReactions] = useState({});
  const [animatingLikes, setAnimatingLikes] = useState({});
  const [sharingPost, setSharingPost] = useState(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sentShareDoctors, setSentShareDoctors] = useState({});
  const [feedToast, setFeedToast] = useState('');

  const handleSelectPostReaction = (postId, reactionId) => {
    const post = posts.find(p => p.id === postId);
    const prevReaction = postReactions[postId] !== undefined ? postReactions[postId] : (post?.isLiked ? 'like_puppy' : null);

    setPostReactions(prev => ({
      ...prev,
      [postId]: reactionId
    }));

    const wasLike = prevReaction && prevReaction.startsWith('like_');
    const isNowLike = reactionId && reactionId.startsWith('like_');
    if (wasLike !== isNowLike && onLikePost) {
      onLikePost(postId);
    }
  };

  const getPostLikes = (post) => {
    const r = postReactions[post.id];
    if (r === undefined) return post.likes || 0;
    const base = post.likes || 0;
    const isLike = r && r.startsWith('like_');
    if (post.isLiked) {
      return isLike ? base : Math.max(0, base - 1);
    } else {
      return isLike ? base + 1 : base;
    }
  };

  const getPostDislikes = (post) => {
    const r = postReactions[post.id];
    const isDislike = r && r.startsWith('sad_');
    const base = post.dislikes || 0;
    return isDislike ? base + 1 : base;
  };

  const triggerLikeWithAnim = (postId) => {
    handleSelectPostReaction(postId, 'like_puppy');
  };

  const handleMediaDoubleTap = (e, post) => {
    const now = Date.now();
    const last = lastTapMap.current[post.id] || 0;
    if (now - last < 320) {
      // Double tap triggered
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX ? ((e.clientX - rect.left) / rect.width) * 100 : 50;
      const y = e.clientY ? ((e.clientY - rect.top) / rect.height) * 100 : 50;

      setDoubleTapHearts(prev => ({
        ...prev,
        [post.id]: { id: now, x, y }
      }));

      setTimeout(() => {
        setDoubleTapHearts(prev => {
          const next = { ...prev };
          delete next[post.id];
          return next;
        });
      }, 900);

      if (!post.isLiked) {
        triggerLikeWithAnim(post.id);
      }
    }
    lastTapMap.current[post.id] = now;
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await api.feed.deleteComment(postId, commentId, currentUser?.id || 1);
    } catch (e) { }
    setFetchedCommentsMap(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
    }));
  };

  const handleReplyToComment = (postId, authorName) => {
    setOpenComments(prev => ({ ...prev, [postId]: true }));
    const cleanDocName = authorName ? authorName.replace(/^dr\.?\s*/i, 'Dr. ') : 'Doctor';
    setCommentInputs(prev => ({
      ...prev,
      [postId]: `@${cleanDocName} `
    }));
  };

  const handleOpenShare = (post) => {
    setSharingPost(post);
    setCopiedShareLink(false);
    setSentShareDoctors({});
  };

  const handleCopyPostLink = (post) => {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => { });
    }
    setCopiedShareLink(true);
    api.feed.recordShare(post.id).catch(() => { });
    setFeedToast('Post link copied to clipboard!');
    setTimeout(() => {
      setCopiedShareLink(false);
      setFeedToast('');
    }, 2500);
  };

  const handleNativePostShare = async (post) => {
    const url = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dr. ${post.authorName}'s Clinical Post on Zenve Vet`,
          text: post.content || 'Check out this veterinary clinical case on Zenve Vet',
          url
        });
        api.feed.recordShare(post.id).catch(() => { });
      } catch (e) { }
    } else {
      handleCopyPostLink(post);
    }
  };

  const handleShareToStory = (post) => {
    setSharingPost(null);
    if (onOpenCreatePost) {
      onOpenCreatePost('STORY');
    }
  };

  const handleSendPostToDoctor = (doc, post) => {
    if (sentShareDoctors[doc.id]) return;
    setSentShareDoctors(prev => ({ ...prev, [doc.id]: true }));

    const postUrl = `${window.location.origin}/#post-${post.id}`;
    const shareText = `Shared Dr. ${post.authorName}'s post:\n"${post.content?.slice(0, 80)}..."\n${postUrl}`;

    if (onSendMessage) {
      onSendMessage({
        receiverId: doc.id ? Number(String(doc.id).replace('doc-', '')) : null,
        text: shareText,
        attachmentUrl: post.videoUrl || post.imageUrl || (Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : post.mediaUrl) || null,
        attachmentType: (post.videoUrl || isVideoMedia(post.imageUrl || post.mediaUrl)) ? 'VIDEO' : 'IMAGE'
      });
    }

    api.feed.recordShare(post.id).catch(() => { });
    setFeedToast(`Sent to Dr. ${doc.name.replace(/^dr\.?\s*/i, '')}!`);
    setTimeout(() => setFeedToast(''), 3000);
  };

  // Auto-record views for active live campaigns in feed
  useEffect(() => {
    if (!liveCampaigns || liveCampaigns.length === 0) return;
    liveCampaigns.forEach(c => {
      if (!loggedViewsRef.current[c.id]) {
        loggedViewsRef.current[c.id] = true;
        api.campaigns.recordEvent(c.id, 'VIEW').catch(() => { });
      }
    });
  }, [liveCampaigns]);

  // Live Auto-Expire check:
  // When endDateTime or endDate has passed, immediately delete/remove from live feed!
  useEffect(() => {
    if (!liveCampaigns || liveCampaigns.length === 0) return;

    const checkExpiration = () => {
      const now = new Date();
      liveCampaigns.forEach(c => {
        let isEnded = false;
        if (c.endDateTime) {
          isEnded = now.getTime() >= new Date(c.endDateTime).getTime();
        } else if (c.endDate) {
          isEnded = now.getTime() >= new Date(`${c.endDate}T23:59:59`).getTime();
        }

        if (isEnded) {
          if (onExpireCampaign) {
            onExpireCampaign(c.id);
          }
        }
      });
    };

    checkExpiration();
    const interval = setInterval(() => {
      checkExpiration();
      setTimerTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [liveCampaigns, onExpireCampaign]);

  const getRemainingTime = (camp) => {
    if (!camp.endDateTime && !camp.endDate) return 'Live';
    const target = camp.endDateTime ? new Date(camp.endDateTime) : new Date(`${camp.endDate}T23:59:59`);
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return 'Ending now';
    const totalSecs = Math.floor(diff / 1000);
    if (totalSecs < 60) return `${Math.max(1, totalSecs)}s left`;
    const mins = Math.floor(totalSecs / 60);
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h left`;
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  };

  const toggleComments = async (postId) => {
    const willOpen = !openComments[postId];
    setOpenComments(prev => ({ ...prev, [postId]: willOpen }));
    if (willOpen && !fetchedCommentsMap[postId]) {
      try {
        const comments = await api.feed.getComments(postId);
        if (comments && comments.length > 0) {
          setFetchedCommentsMap(prev => ({ ...prev, [postId]: comments }));
        }
      } catch (e) {
        // quiet fallback
      }
    }
  };

  const handleCommentSubmit = (e, postId) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    if (onAddComment) {
      onAddComment(postId, text);
    }
    const myComment = {
      id: Date.now(),
      authorName: currentUser?.name || 'Dr. You',
      authorAvatar: currentUser?.avatar || null,
      content: text,
      createdAt: new Date().toISOString()
    };
    setFetchedCommentsMap(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), myComment]
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts.filter(post => {
    if (selectedSpecialty !== 'All specialties' && post.authorSpecialty !== selectedSpecialty) return false;
    const pType = post.postType || post.type;
    if (selectedType === 'Clinical cases' && pType !== 'CLINICAL_CASE') return false;
    if (selectedType === 'Short videos' && pType !== 'SHORT_VIDEO' && !post.videoUrl && !(post.imageUrl && (post.imageUrl.endsWith('.mp4') || post.imageUrl.endsWith('.mov')))) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Hero Banner with Veterinarian & Golden Retriever */}
      <div className="feed-hero-banner">
        <div className="hero-banner-inner">
          <div className="hero-text-content">
            <h1 className="hero-headline">
              A world of care<br />
              <span className="hero-headline-highlight">Connected</span>
            </h1>
            <p className="hero-subtext">
              Meet your peers. Share your clinical cases. Move veterinary practice forward.
            </p>
            <button
              className="btn-make-mark"
              onClick={() => onOpenCreatePost('CLINICAL_CASE')}
            >
              <span>Make your mark</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="hero-photo-wrap">
            <PawPrint size={90} className="hero-paw-watermark" />
            <img
              src={heroVetImg}
              alt="Veterinarian with dog"
              className="hero-photo-img"
            />
          </div>
        </div>
      </div>

      {/* 2. Moments from the community (Stories Carousel) */}
      <div className="stories-section-container">
        <div className="stories-section-header">
          <div className="stories-header-left">
            <Users size={17} color="#059669" />
            <span>Moments from the community</span>
          </div>

          <button
            className="stories-view-all-link"
            onClick={() => stories.length > 0 && onOpenStory(stories[0])}
          >
            <span>STORIES</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="stories-avatar-track">
          {/* Your Story Button */}
          <button className="story-circle-item" onClick={() => onOpenCreatePost('STORY')}>
            <div className="story-ring-circle add-your-story">
              <Plus size={20} />
            </div>
            <span className="story-doc-label">Your story</span>
          </button>

          {/* Doctor Community Stories */}
          {stories.map((story, index) => {
            const hasActiveDot = index === stories.length - 1;
            const isOwnStory = Boolean(currentUser && (
              (story.doctorId != null && (
                story.doctorId === currentUser.id ||
                String(story.doctorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '')
              )) ||
              (story.doctorName && currentUser.name && (
                story.doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim()
              )) ||
              (story.doctorName && story.doctorName.toLowerCase().includes('you')) ||
              story.doctorId === 'doc-me'
            ));
            const storyDoc = (doctors || []).find(d =>
              d.id === story.doctorId ||
              String(d.id).replace('doc-', '') === String(story.doctorId).replace('doc-', '') ||
              (d.name && story.doctorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === story.doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
            );
            const resolvedStoryAvatar = (storyDoc && storyDoc.avatar && !storyDoc.avatar.includes('unsplash.com'))
              ? storyDoc.avatar
              : (story.avatar || '');

            return (
              <button
                key={story.id}
                className="story-circle-item"
                onClick={() => onOpenStory({ ...story, avatar: resolvedStoryAvatar })}
                style={{ position: 'relative' }}
              >
                <div className="story-ring-circle" style={{ position: 'relative' }}>
                  <Avatar src={resolvedStoryAvatar} name={story.doctorName} size={48} className="story-avatar-photo" />
                  {hasActiveDot && !isOwnStory && <span className="story-active-dot" />}
                </div>
                <span className="story-doc-label">{story.doctorName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Post Composer Card */}
      <div className="feed-post-composer">
        <div className="composer-input-row">
          <div className="composer-stethoscope-badge">
            <Stethoscope size={21} />
          </div>
          <div
            className="composer-fake-input-pill"
            onClick={() => onOpenCreatePost('CLINICAL_CASE')}
          >
            <span>Share a clinical discovery, diagnosis, surgical technique, or little inspiration...</span>
            <ImageIcon size={17} color="#9ca3af" />
          </div>
        </div>

        <div className="composer-tools-row">
          <div className="composer-action-pills">
            <button className="btn-composer-pill" onClick={() => onOpenCreatePost('GENERAL_POST')}>
              <ImageIcon size={15} color="#059669" />
              <span>Photo / Zenv</span>
            </button>

            <button className="btn-composer-pill" onClick={() => onOpenCreatePost('CLINICAL_CASE')}>
              <Briefcase size={15} color="#059669" />
              <span>Clinical case</span>
            </button>

            <button className="btn-composer-pill" onClick={() => onOpenCreatePost('STORY')}>
              <Plus size={15} color="#059669" />
              <span>Story</span>
            </button>

            <button className="btn-composer-pill" onClick={() => onOpenCreatePost('SHORT_VIDEO')}>
              <Video size={15} color="#059669" />
              <span>Short video</span>
            </button>

            <button className="btn-composer-pill ai-assistant-pill" onClick={onOpenAiAssistant}>
              <Sparkles size={15} color="#059669" />
              <span>AI case assistant</span>
            </button>
          </div>

          <button className="btn-post-submit-dark" onClick={() => onOpenCreatePost('CLINICAL_CASE')}>
            <span>Zenv</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Filter Tabs & Controls Row */}
      <div className="feed-filter-bar">
        <div className="feed-tabs-row">
          <div className="feed-tabs-group">
            <button
              className={`feed-tab-btn ${activeTab === 'for_you' ? 'active' : ''}`}
              onClick={() => setActiveTab('for_you')}
            >
              For you
            </button>
            <button
              className={`feed-tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
            <button
              className={`feed-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
          </div>

          <div className="community-feed-badge">
            <span className="status-dot-green"></span>
            <span>Community Feed</span>
          </div>
        </div>

        <div className="filter-dropdowns-strip">
          <select
            className="pill-select-control"
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
          >
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="pill-select-control"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {STATES_INDIA.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            className="pill-select-control"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All posts">All posts</option>
            <option value="Clinical cases">Clinical cases</option>
            <option value="Short videos">Short videos</option>
          </select>

          <span className="results-count-label">{filteredPosts.length} RESULTS</span>
        </div>
      </div>

      {/* 5. Feed Posts Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Live Sponsored Campaigns from Zenve Ecosystem Partners */}
        {liveCampaigns && liveCampaigns.length > 0 && liveCampaigns.map((camp) => (
          <article
            key={`live-campaign-${camp.id}`}
            className="feed-post-card"
            style={{
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(240, 253, 244, 0.5) 0%, rgba(255, 255, 255, 0.95) 100%)'
            }}
          >
            {/* Top decorative accent bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)'
            }} />

            {/* Sponsored Header */}
            <div className="post-card-header" style={{ marginBottom: '12px', paddingTop: '4px' }}>
              <div className="post-author-block">
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #003822 0%, #064e3b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 56, 34, 0.15)'
                }}>
                  <Megaphone size={20} color="#a7f3d0" />
                </div>
                <div>
                  <div className="post-author-name-row" style={{ alignItems: 'center', gap: '6px' }}>
                    <h3 className="post-author-name" style={{ fontSize: '15px', color: '#064e3b' }}>
                      Zenve Clinical Partner
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: '#dcfce7',
                      border: '1px solid #bbf7d0',
                      color: '#047857',
                      fontSize: '11px',
                      fontWeight: '800',
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase'
                    }}>
                      <Sparkles size={11} color="#059669" />
                      Sponsored
                    </span>
                  </div>
                  <span className="post-author-meta" style={{ color: '#059669', fontWeight: '600' }}>
                    {camp.campaignType || 'Veterinary Clinical Partner'}
                  </span>
                </div>
              </div>

              {/* Expiration live badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#065f46'
              }}>
                <Clock size={12} color="#059669" />
                <span>{getRemainingTime(camp)}</span>
              </div>
            </div>

            {/* Campaign Content */}
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#111827', marginBottom: '8px', lineHeight: 1.35 }}>
                {camp.title}
              </h2>

              {camp.description && (
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-line', marginBottom: '14px' }}>
                  {camp.description}
                </p>
              )}

              {camp.posterUrl && (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  marginBottom: '14px',
                  background: '#090d16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isVideoMedia(camp.posterUrl) ? (
                    <video
                      src={resolveMediaUrl(camp.posterUrl)}
                      controls
                      playsInline
                      autoPlay
                      muted
                      loop
                      style={{
                        width: '100%',
                        maxHeight: '460px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(camp.posterUrl)}
                      alt={camp.title}
                      loading="lazy"
                      onError={(e) => {
                        // Prevent broken image icon if file missing
                        e.target.style.display = 'none';
                      }}
                      style={{
                        width: '100%',
                        maxHeight: '460px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Campaign Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(16, 185, 129, 0.15)'
            }}>
              <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                Verified partnership initiative for India's veterinary practitioners
              </span>

              <a
                href={camp.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  try {
                    api.campaigns.recordEvent(camp.id, 'CLICK');
                  } catch (e) { }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #003822 0%, #064e3b 100%)',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0, 56, 34, 0.2)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>Learn More / Register</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </article>
        ))}

        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <PawPrint size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Your Feed is Clear</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '380px', margin: '0 auto 16px' }}>
              Publish a clinical observation, case report, or share a clinical update to start the discussion with peers.
            </p>
            <button
              className="btn-make-mark"
              onClick={() => onOpenCreatePost('GENERAL_POST')}
              style={{ margin: '0 auto' }}
            >
              <span>Create First Zenv</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isOwnPost = currentUser && (
              post.authorId === currentUser.id ||
              post.authorName === currentUser.name ||
              post.authorId === 'doc-me' ||
              (post.authorName && currentUser.name && post.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
            );
            const postDoc = doctors?.find(d =>
              d.id === post.authorId ||
              (d.name && post.authorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === post.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
            );
            const authorAvatar = (isOwnPost && currentUser?.avatar) ? currentUser.avatar : (postDoc?.avatar || post.authorAvatar);

            return (
              <article key={post.id} className="feed-post-card" id={`post-${post.id}`}>
                <div className="post-card-header">
                  <div
                    className="post-author-block"
                    style={{ cursor: onOpenDoctorProfile ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (onOpenDoctorProfile) {
                        onOpenDoctorProfile(postDoc || { id: post.authorId, name: post.authorName, avatar: authorAvatar, specialty: post.authorSpecialty, city: post.authorCity });
                      }
                    }}
                    title={`View ${post.authorName}'s Profile`}
                  >
                    <Avatar
                      src={authorAvatar}
                      name={post.authorName}
                      size={40}
                      className="post-avatar-img"
                    />
                    <div>
                      <div className="post-author-name-row">
                        <h3 className="post-author-name">{post.authorName}</h3>
                        <CheckCircle2 size={15} color="#00a86b" />
                      </div>
                      <span className="post-author-meta">{post.authorSpecialty} · {post.authorCity}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                    <button
                      onClick={() => onBookmarkPost && onBookmarkPost(post.id)}
                      style={{ background: 'none', border: 'none', color: post.isBookmarked ? '#C5A059' : '#9ca3af', cursor: 'pointer', padding: '4px' }}
                      title={post.isBookmarked ? 'Bookmarked' : 'Save post'}
                    >
                      <Bookmark size={18} fill={post.isBookmarked ? '#C5A059' : 'none'} />
                    </button>

                    <button
                      onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}
                      title="Options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {/* Post Options Dropdown */}
                    {activeMenuPostId === post.id && (
                      <div style={{
                        position: 'absolute',
                        top: '28px',
                        right: 0,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        border: '1px solid #E5E7EB',
                        padding: '4px',
                        zIndex: 30,
                        width: '140px'
                      }}>
                        {isOwnPost && onDeletePost && (
                          <button
                            onClick={() => {
                              setActiveMenuPostId(null);
                              onDeletePost(post.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: '100%',
                              padding: '6px 10px',
                              border: 'none',
                              background: 'none',
                              color: '#DC2626',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={13} />
                            <span>Delete Post</span>
                          </button>
                        )}
                        {onReportPost && (
                          <button
                            onClick={() => {
                              setActiveMenuPostId(null);
                              onReportPost(post.id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: '100%',
                              padding: '6px 10px',
                              border: 'none',
                              background: 'none',
                              color: '#4B5563',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Flag size={13} />
                            <span>Report Post</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {post.badgeLabel && (
                  <div className="post-badge-pill">
                    <Stethoscope size={13} />
                    <span>{post.badgeLabel}</span>
                  </div>
                )}

                <p className="post-body-text">{post.content}</p>

                {/* Video Player or Image Preview */}
                {(() => {
                  const isVideo = post.videoUrl || (post.imageUrl && (post.imageUrl.endsWith('.mp4') || post.imageUrl.endsWith('.webm') || post.imageUrl.endsWith('.mov') || post.imageUrl.includes('data:video')));
                  const videoSrc = post.videoUrl || (isVideo ? post.imageUrl : null);

                  if (videoSrc) {
                    return (
                      <div
                        style={{
                          borderRadius: '14px',
                          overflow: 'hidden',
                          backgroundColor: '#0a0a0a',
                          maxHeight: '440px',
                          width: '100%',
                          marginBottom: '14px',
                          position: 'relative',
                          boxShadow: '0 4px 18px rgba(0,0,0,0.14)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => handleMediaDoubleTap(e, post)}
                      >
                        <video
                          src={videoSrc}
                          controls
                          playsInline
                          preload="metadata"
                          style={{
                            width: '100%',
                            maxHeight: '440px',
                            objectFit: 'contain',
                            display: 'block',
                            backgroundColor: '#000'
                          }}
                        />
                        {doubleTapHearts[post.id] && (
                          <div style={{
                            position: 'absolute',
                            top: `${doubleTapHearts[post.id].y}%`,
                            left: `${doubleTapHearts[post.id].x}%`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 30,
                            animation: 'feedHeartBurst 0.85s ease-out forwards',
                            filter: 'drop-shadow(0 8px 24px rgba(245, 158, 11, 0.65))'
                          }}>
                            <img
                              src={REACTION_MAP[postReactions[post.id]]?.icon || likePuppy}
                              alt="Liked"
                              style={{ width: 92, height: 92, objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (post.imageUrl) {
                    return (
                      <div
                        className="post-image-preview-container"
                        style={{ cursor: 'pointer', position: 'relative' }}
                        title="Double-tap to like, or click to review clinical details"
                        onClick={(e) => {
                          const now = Date.now();
                          const last = lastTapMap.current[post.id] || 0;
                          if (now - last < 320) {
                            handleMediaDoubleTap(e, post);
                          } else {
                            lastTapMap.current[post.id] = now;
                            if (onOpenClinicalCase) {
                              onOpenClinicalCase({
                                title: post.badgeLabel || "Clinical Case Finding",
                                authorName: post.authorName,
                                authorSpecialty: post.authorSpecialty,
                                species: post.species || "Canine",
                                presentingComplaint: post.content,
                                clinicalFindings: "Presented for routine follow-up and specialized examination.",
                                diagnostics: "Microscopic cytology and diagnostic imaging evaluated.",
                                diagnosis: "Presumptive / Confirmed Clinical Case",
                                treatmentProtocol: "Medical management with targeted therapeutics.",
                                outcome: "Full clinical remission observed at follow-up.",
                                mediaUrl: post.imageUrl
                              });
                            }
                          }
                        }}
                      >
                        <img src={post.imageUrl} alt="Clinical case" className="post-image-preview" loading="lazy" />
                        {doubleTapHearts[post.id] && (
                          <div style={{
                            position: 'absolute',
                            top: `${doubleTapHearts[post.id].y}%`,
                            left: `${doubleTapHearts[post.id].x}%`,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 30,
                            animation: 'feedHeartBurst 0.85s ease-out forwards',
                            filter: 'drop-shadow(0 8px 24px rgba(245, 158, 11, 0.65))'
                          }}>
                            <img
                              src={REACTION_MAP[postReactions[post.id]]?.icon || likePuppy}
                              alt="Liked"
                              style={{ width: 92, height: 92, objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Action Buttons */}
                <div className="post-card-footer">
                  <div className="post-actions-group">
                    <ReactionPicker
                      activeReaction={postReactions[post.id] !== undefined ? postReactions[post.id] : (post.isLiked ? 'like_puppy' : null)}
                      likesCount={getPostLikes(post)}
                      dislikesCount={getPostDislikes(post)}
                      onSelectReaction={(reactionId) => handleSelectPostReaction(post.id, reactionId)}
                    />

                    <button
                      className="post-action-btn"
                      onClick={() => toggleComments(post.id)}
                      title="View discussion"
                    >
                      <MessageSquare size={17} color={openComments[post.id] ? '#059669' : '#6b7280'} />
                      <span>{post.commentsCount || (post.comments ? post.comments.length : 0)}</span>
                    </button>

                    <button
                      className="post-action-btn"
                      onClick={() => handleOpenShare(post)}
                      title="Share post"
                    >
                      <Share2 size={17} />
                      <span>{post.shares > 0 ? post.shares : 'Share'}</span>
                    </button>
                  </div>

                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{post.timeAgo || 'Recent'}</span>
                </div>

                {/* Expandable Comments Drawer */}
                {openComments[post.id] && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #F3F4F6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {/* Comments Stream */}
                    {(() => {
                      const postComments = (fetchedCommentsMap[post.id] && fetchedCommentsMap[post.id].length > 0)
                        ? fetchedCommentsMap[post.id]
                        : (post.comments || []);
                      return postComments.length > 0 ? (
                        postComments.map((c, idx) => {
                          const isOwnComment = currentUser && (
                            c.authorId === currentUser.id ||
                            c.authorName === currentUser.name ||
                            (c.authorName && currentUser.name && c.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
                          );
                          const commentDoc = doctors?.find(d =>
                            d.id === c.authorId ||
                            (d.name && c.authorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === c.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
                          );
                          const commentAvatar = (isOwnComment && currentUser?.avatar) ? currentUser.avatar : (commentDoc?.avatar || c.authorAvatar);

                          return (
                            <div key={c.id || idx} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', alignItems: 'flex-start' }}>
                              <Avatar
                                src={commentAvatar}
                                name={c.authorName}
                                size={28}
                                style={{ flexShrink: 0 }}
                              />
                              <div style={{
                                backgroundColor: '#F9FAFB',
                                borderRadius: '10px',
                                padding: '7px 12px',
                                flex: 1,
                                border: '1px solid #F3F4F6'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                  <strong style={{ color: '#111827', fontSize: '12px' }}>{c.authorName}</strong>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => handleReplyToComment(post.id, c.authorName)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#059669',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        padding: 0
                                      }}
                                    >
                                      <CornerDownRight size={11} />
                                      <span>Reply</span>
                                    </button>
                                    {isOwnComment && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post.id, c.id)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#9CA3AF',
                                          cursor: 'pointer',
                                          padding: 0,
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        title="Delete comment"
                                      >
                                        <Trash2 size={12} color="#EF4444" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <span style={{ color: '#374151', lineHeight: 1.4 }}>
                                  {c.content?.split(' ').map((word, wIdx) => {
                                    if (word.startsWith('@')) {
                                      return (
                                        <span key={wIdx} style={{ color: '#059669', fontWeight: 700 }}>
                                          {word}{' '}
                                        </span>
                                      );
                                    }
                                    return word + ' ';
                                  })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                          No comments yet. Start the clinical discussion!
                        </p>
                      );
                    })()}

                    {/* Add Comment Input Form */}
                    <form
                      onSubmit={(e) => handleCommentSubmit(e, post.id)}
                      style={{ display: 'flex', gap: '8px', marginTop: '6px' }}
                    >
                      <input
                        type="text"
                        placeholder="Add a clinical comment or inquiry..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        style={{
                          flex: 1,
                          padding: '8px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#F9FAFB',
                          fontSize: '12.5px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        style={{
                          backgroundColor: commentInputs[post.id]?.trim() ? '#003822' : '#E5E7EB',
                          color: commentInputs[post.id]?.trim() ? '#FFFFFF' : '#9CA3AF',
                          border: 'none',
                          borderRadius: '9999px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: commentInputs[post.id]?.trim() ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>Send</span>
                        <Send size={12} />
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes feedHeartBurst {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
          75% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.05); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        @keyframes feedLikeBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.35); }
          75% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes feedToastSlide {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>

      {/* Floating Toast Notification */}
      {feedToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '9px 18px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 15000,
          animation: 'feedToastSlide 2.8s ease forwards'
        }}>
          <Sparkles size={15} color="#10B981" />
          <span>{feedToast}</span>
        </div>
      )}

      {/* Post Share Modal */}
      {sharingPost && (
        <div className="modal-overlay" onClick={() => setSharingPost(null)} style={{ zIndex: 14000 }}>
          <div
            style={{
              width: '440px',
              maxWidth: '92vw',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'modalPop 0.22s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                  Share Post
                </h3>
              </div>
              <button
                onClick={() => setSharingPost(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Post Preview Card */}
            <div style={{
              display: 'flex',
              gap: 12,
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              alignItems: 'center'
            }}>
              {sharingPost.imageUrl && (
                <img
                  src={sharingPost.imageUrl}
                  alt="Post preview"
                  style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                  {sharingPost.authorName}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sharingPost.content}
                </p>
              </div>
            </div>

            {/* Action Buttons: Add to Story, Copy Link, Native Share */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Add to Story */}
              <button
                onClick={() => handleShareToStory(sharingPost)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <Plus size={16} color="#059669" />
                <span>Add Post to Your Story</span>
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {/* Copy Link */}
                <button
                  onClick={() => handleCopyPostLink(sharingPost)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: copiedShareLink ? '#ECFDF5' : '#F3F4F6',
                    border: `1px solid ${copiedShareLink ? '#10B981' : '#E5E7EB'}`,
                    color: copiedShareLink ? '#059669' : '#374151',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {copiedShareLink ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                  <span>{copiedShareLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                {/* Device Share */}
                <button
                  onClick={() => handleNativePostShare(sharingPost)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#003822',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Share2 size={15} />
                  <span>Share Via...</span>
                </button>
              </div>
            </div>

            {/* Direct Message Colleague Doctors */}
            <div>
              <span style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#6B7280',
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
                overflowY: 'auto'
              }}>
                {doctors.slice(0, 6).map(doc => {
                  const isSent = !!sentShareDoctors[doc.id];
                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #F3F4F6'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar src={doc.avatar} name={doc.name} size={32} />
                        <div>
                          <p style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827', margin: 0 }}>
                            {doc.name}
                          </p>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>
                            {doc.specialty || 'Veterinary Practitioner'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendPostToDoctor(doc, sharingPost)}
                        disabled={isSent}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '8px',
                          backgroundColor: isSent ? '#ECFDF5' : '#003822',
                          border: `1px solid ${isSent ? '#10B981' : 'transparent'}`,
                          color: isSent ? '#059669' : '#FFFFFF',
                          fontSize: '11.5px',
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
        </div>
      )}
    </div>
  );
}
