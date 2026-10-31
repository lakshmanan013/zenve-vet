import React, { useState } from 'react';
import {
  ArrowRight,
  Plus,
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  CheckCircle2,
  MoreHorizontal,
  PawPrint,
  Stethoscope,
  Trash2
} from 'lucide-react';
import heroVetImg from '../assets/hero_vet_dog.jpg';
import likePuppy from '../assets/reactions/like_puppy.png';
import sadPuppy from '../assets/reactions/sad_puppy.png';
import { ReactionPicker } from '../components/ReactionPicker';

import { Avatar } from '../components/Avatar';

export function ClinicalCasesView({
  clinicalCases = [],
  stories = [],
  doctors = [],
  currentUser,
  onOpenStory,
  onOpenCreateCase,
  onSelectCase,
  onDeleteCase
}) {
  const [likedMap, setLikedMap] = useState({});
  const [caseReactions, setCaseReactions] = useState({});

      const handleSelectCaseReaction = (id, reactionId) => {
        setCaseReactions(prev => ({
          ...prev,
          [id]: reactionId
        }));
      };



      return(
    <div style = {{ display: 'flex', flexDirection: 'column', gap: '20px' }} >
      {/* 1. Light Hero Banner matching reference image */ }
      < div className = "cases-hero-banner-light" >
      <div className="hero-banner-inner">
        <div className="hero-text-content">
          <h1 className="hero-headline">Every case. A new perspective.</h1>
          <p className="hero-subtext">
            Explore the knowledge and experiences of your community.
          </p>
          <button
            className="btn-make-mark-link"
            onClick={() => onOpenCreateCase('CLINICAL_CASE')}
          >
            <span>Make your mark</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="hero-photo-wrap">
          <PawPrint size={90} className="hero-paw-watermark" style={{ color: 'rgba(0, 56, 34, 0.15)' }} />
          <img
            src={heroVetImg}
            alt="Doctor and golden retriever"
            className="hero-photo-img"
          />
        </div>
      </div>
      </div >

    {/* 2. Moments from the community (Stories Carousel) */ }
    < div className = "stories-section-container" >
        <div className="stories-section-header">
          <div className="stories-header-left">
            <MessageSquare size={17} color="#059669" />
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
          <button className="story-circle-item" onClick={() => onOpenCreateCase('STORY')}>
            <div className="story-ring-circle add-your-story">
              <Plus size={20} />
            </div>
            <span className="story-doc-label">Your story</span>
          </button>

          {/* Doctor Community Stories */}
          {stories.map((story) => {
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
                </div>
                <span className="story-doc-label">{story.doctorName}</span>
              </button>
            );
          })}
        </div>
      </div >

    {/* 3. Clinical Cases Feed Stream */ }
    < div style = {{ display: 'flex', flexDirection: 'column', gap: '18px' }
}>
{
  clinicalCases.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
      <PawPrint size={36} color="#059669" style={{ margin: '0 auto 10px' }} />
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>No Clinical Cases Published Yet</h3>
      <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '380px', margin: '0 auto 14px' }}>
        Publish an interesting clinical observation, surgical procedure, or diagnostic report.
      </p>
      <button
        className="btn-make-mark"
        onClick={() => onOpenCreateCase('CLINICAL_CASE')}
        style={{ margin: '0 auto' }}
      >
        <span>Publish First Clinical Case</span>
        <ArrowRight size={15} />
      </button>
    </div>
  ) : (
    clinicalCases.map(c => {
      const isOwnCase = Boolean(currentUser && (
        (c.authorId != null && (
          c.authorId === currentUser.id ||
          String(c.authorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '')
        )) ||
        (c.authorName && currentUser.name && (
          c.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim()
        )) ||
        (c.authorName && c.authorName.toLowerCase().includes('you')) ||
        c.authorId === 'doc-me'
      ));
      const caseDoc = doctors?.find(d =>
        d.id === c.authorId ||
        (d.name && c.authorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === c.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
      );
      const resolvedAvatar = (isOwnCase && currentUser?.avatar) ? currentUser.avatar : (caseDoc?.avatar || c.authorAvatar || '');

      const images = [];
      if (Array.isArray(c.mediaUrls) && c.mediaUrls.length > 0) {
        images.push(...c.mediaUrls.filter(Boolean));
      } else if (c.mediaUrl) {
        if (typeof c.mediaUrl === 'string' && c.mediaUrl.includes(',')) {
          images.push(...c.mediaUrl.split(',').map(s => s.trim()).filter(Boolean));
        } else if (typeof c.mediaUrl === 'string' && c.mediaUrl.trim()) {
          images.push(c.mediaUrl.trim());
        }
      }

      return {
        id: c.id,
        authorName: c.authorName || 'Dr. Practitioner',
        authorSpecialty: c.authorSpecialty || 'Veterinary Surgeon',
        authorCity: 'Bengaluru',
        authorAvatar: resolvedAvatar,
        timeAgo: 'Case Study',
        content: c.presentingComplaint ? `${c.title} — ${c.presentingComplaint}` : c.title,
        images,
        likes: c.views || 1,
        comments: 0,
        fullCase: c,
        isOwnCase: isOwnCase
      };
    }).map((post) => {
      const currentLikes = likedMap[post.id] !== undefined ? likedMap[post.id] : post.likes;
      const isLiked = likedMap[post.id] !== undefined;

      return (
        <article key={post.id} className="feed-post-card" id={`case-post-${post.id}`}>
          {/* Card Header: Avatar, Name, Verified Badge, Time, Options */}
          <div className="post-card-header">
            <div className="post-author-block">
              <Avatar
                src={post.authorAvatar}
                name={post.authorName}
                size={40}
                className="post-avatar-img"
              />
              <div>
                <div className="post-author-name-row">
                  <h3 className="post-author-name">{post.authorName}</h3>
                  <CheckCircle2 size={15} fill="#059669" color="#ffffff" />
                </div>
                <span className="post-author-meta">{post.authorSpecialty} · {post.authorCity}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{post.timeAgo}</span>
              {post.isOwnCase && onDeleteCase && (
                <button
                  type="button"
                  onClick={() => onDeleteCase(post.fullCase?.id || post.id)}
                  title="Delete clinical case"
                  style={{
                    border: '1px solid #fee2e2',
                    backgroundColor: '#fff5f5',
                    color: '#dc2626',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    fontWeight: 600
                  }}
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Text */}
          <p className="post-body-text" style={{ fontSize: '14.5px', marginBottom: '14px' }}>
            {post.content}
          </p>

          {/* Single Media Container if 1 image */}
          {post.images && post.images.length === 1 && (
            <div
              className="post-image-preview-container"
              onClick={() => onSelectCase && onSelectCase(post.fullCase)}
              style={{
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid #e5e7eb',
                maxHeight: '260px',
                backgroundColor: '#f8fafc',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Click to review complete case study"
            >
              <img
                src={post.images[0]}
                alt="Clinical case visual"
                className="post-image-preview"
                style={{
                  width: '100%',
                  maxHeight: '260px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                loading="lazy"
              />
            </div>
          )}

          {/* Dual Media Grid only if >= 2 images */}
          {post.images && post.images.length >= 2 && (
            <div
              className="case-dual-media-grid"
              onClick={() => onSelectCase && onSelectCase(post.fullCase)}
              style={{ cursor: 'pointer' }}
              title="Click to review complete case study"
            >
              <div className="case-split-img-box">
                <img src={post.images[0]} alt="Clinical case visual 1" className="case-split-img" />
              </div>
              <div className="case-split-img-box">
                <img src={post.images[1]} alt="Clinical case visual 2" className="case-split-img" />
              </div>
            </div>
          )}

          {/* Card Footer Actions: Heart, Comment, Share, Bookmark */}
          <div className="post-card-footer">
            <div className="post-actions-group">
              <ReactionPicker
                activeReaction={caseReactions[post.id] !== undefined ? caseReactions[post.id] : (likedMap[post.id] ? 'like_puppy' : null)}
                likesCount={(() => {
                  const r = caseReactions[post.id];
                  if (r === undefined) return likedMap[post.id] ? post.likes + 1 : post.likes;
                  const isLike = r && r.startsWith('like_');
                  return isLike ? post.likes + 1 : post.likes;
                })()}
                dislikesCount={(() => {
                  const r = caseReactions[post.id];
                  const isDislike = r && r.startsWith('sad_');
                  return isDislike ? 1 : 0;
                })()}
                onSelectReaction={(reactionId) => handleSelectCaseReaction(post.id, reactionId)}
              />

              <button
                className="post-action-btn"
                onClick={() => onSelectCase && onSelectCase(post.fullCase)}
              >
                <MessageSquare size={17} />
                <span>{post.comments}</span>
              </button>

              <button className="post-action-btn">
                <Share2 size={17} />
                <span>Share</span>
              </button>
            </div>

            <button style={{ color: '#9ca3af' }}>
              <Bookmark size={18} />
            </button>
          </div>
        </article>
      );
    })
  )
}
      </div >
    </div >
  );
}
