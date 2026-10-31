import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Link,
  Copy,
  Check,
  Share2,
  Lock,
  Globe,
  Sparkles,
  MessageSquare,
  Video,
  FolderHeart,
  Send,
  Image as ImageIcon,
  Heart,
  UserPlus,
  Shield,
  ArrowRight,
  Search,
  X,
  Play,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  FileText,
  Pin,
  ThumbsUp,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Award,
  Compass,
  Filter,
  Camera,
  MessageCircle,
  Layers,
  Clock,
  Mail,
  Trash2,
  Upload,
  Film
} from 'lucide-react';
import { Avatar } from './Avatar';
import { api } from '../services/api';
import likePuppy from '../assets/reactions/like_puppy.png';
import sadPuppy from '../assets/reactions/sad_puppy.png';
import { ReactionPicker } from './ReactionPicker';
import { REACTION_MAP } from '../data/reactions';

export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return (
    url.startsWith('data:video') ||
    /\.(mp4|webm|mov|ogg|m4v)($|\?)/i.test(url) ||
    url.includes('/video/') ||
    url.includes('videos/preview')
  );
};

const PRESET_COVERS = [
  {
    name: 'Surgical Theater',
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Veterinary Diagnostics',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Companion Animal Care',
    url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1400&q=80'
  },
  {
    name: 'Modern Hospital',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1400&q=80'
  }
];

const SPECIALTY_CATEGORIES = [
  'All Specialties',
  'Surgery & Orthopedics',
  'Cardiology & Diagnostics',
  'Emergency & Critical Care',
  'Exotics, Avian & Wildlife',
  'Dermatology & Allergy',
  'Oncology & Pathology',
  'Small Animal General'
];

const DEFAULT_GROUP_RULES = [
  {
    num: 1,
    title: 'Evidence-Based Veterinary Medicine',
    desc: 'Share verified protocols, clinical trials, and clinical rationale. Peer discussions should be grounded in evidence-based animal healthcare.'
  },
  {
    num: 2,
    title: 'Protect Patient & Client Confidentiality',
    desc: 'De-identify all case reports. Remove client names, contact details, and clinic-confidential identifiers from radiographs and photos.'
  },
  {
    num: 3,
    title: 'Constructive Peer Consultations',
    desc: 'Treat fellow veterinarians with professional courtesy. Respect differing diagnostic modalities and clinical perspectives.'
  },
  {
    num: 4,
    title: 'Zero Commercial Spam',
    desc: 'Direct marketing or unapproved pharmaceutical solicitation is prohibited. Product discussions must be relevant to clinical cases.'
  }
];

export function CommunityView({
  communities = [],
  activeCommunityId,
  onSelectCommunity,
  onCreateCommunity,
  onJoinCommunity,
  onLeaveCommunity,
  onInviteDoctor,
  onAcceptInvite,
  onRejectInvite,
  onAddPost,
  onAddComment,
  onTogglePostLike,
  onAddCase,
  onAddReel,
  onSendMessage,
  onJoinWithCode,
  currentUser,
  doctors = [],
  connectedDoctors = [],
  onOpenDoctorProfile,
  onOpenDirectChat,
  onDeleteCommunity,
  onDeletePost,
  onDeleteCase,
  onDeleteReel,
  onUpdateCover
}) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'cases' | 'reels' | 'chat' | 'members' | 'about'
  const [feedSort, setFeedSort] = useState('relevant'); // 'relevant' | 'recent'
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Specialties');

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [isShareCaseModalOpen, setIsShareCaseModalOpen] = useState(false);
  const [isShareReelModalOpen, setIsShareReelModalOpen] = useState(false);
  const [selectedReelVideo, setSelectedReelVideo] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [localCoverImage, setLocalCoverImage] = useState(null);
  const coverInputRef = useRef(null);
  const modalCoverInputRef = useRef(null);

  // Invite state
  const [inviteSearch, setInviteSearch] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinCodeError, setJoinCodeError] = useState('');

  // Create community form
  const [newCommName, setNewCommName] = useState('');
  const [newCommCategory, setNewCommCategory] = useState('Surgery & Orthopedics');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommPrivacy, setNewCommPrivacy] = useState('Public Group');
  const [newCommGradient, setNewCommGradient] = useState('linear-gradient(135deg, #064e3b 0%, #0d9488 100%)');
  const [newCommCoverUrl, setNewCommCoverUrl] = useState('');

  // Post form state
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postTag, setPostTag] = useState('Clinical Discussion');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isUploadingPostMedia, setIsUploadingPostMedia] = useState(false);
  const postPhotoInputRef = useRef(null);
  const postVideoInputRef = useRef(null);

  // Case form state
  const [caseTitle, setCaseTitle] = useState('');
  const [caseSpecies, setCaseSpecies] = useState('Canine');
  const [caseAge, setCaseAge] = useState('');
  const [caseDiagnosis, setCaseDiagnosis] = useState('');
  const [caseTreatment, setCaseTreatment] = useState('');
  const [caseImage, setCaseImage] = useState('');
  const [isUploadingCaseMedia, setIsUploadingCaseMedia] = useState(false);
  const casePhotoInputRef = useRef(null);
  const caseVideoInputRef = useRef(null);

  // Reel form state
  const [reelTitle, setReelTitle] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelThumbnail, setReelThumbnail] = useState('');
  const [reelDuration, setReelDuration] = useState('0:45');
  const [isUploadingReelVideo, setIsUploadingReelVideo] = useState(false);
  const [isUploadingReelThumb, setIsUploadingReelThumb] = useState(false);
  const reelVideoInputRef = useRef(null);
  const reelThumbInputRef = useRef(null);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCommunityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Active community resolution
  const activeCommunity = useMemo(() => {
    if (!communities || communities.length === 0) return null;
    if (activeCommunityId) {
      const found = communities.find(c => c.id === activeCommunityId || String(c.id) === String(activeCommunityId) || String(c.id).replace('comm-', '') === String(activeCommunityId).replace('comm-', ''));
      if (found) return found;
    }
    return communities[0];
  }, [communities, activeCommunityId]);

  // Check if current user is a member
  const isMember = useMemo(() => {
    if (!activeCommunity || !currentUser) return false;
    const currentId = currentUser.id || 'current';
    return activeCommunity.members?.some(m =>
      m.id === currentId ||
      String(m.id).replace('doc-', '') === String(currentId).replace('doc-', '') ||
      (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  }, [activeCommunity, currentUser]);

  // Check if current user is founder/admin
  const isAdmin = useMemo(() => {
    if (!activeCommunity || !currentUser) return false;
    const currentId = currentUser.id || 'current';
    return activeCommunity.creatorId === currentId ||
      String(activeCommunity.creatorId).replace('doc-', '') === String(currentId).replace('doc-', '') ||
      activeCommunity.members?.some(m =>
        (m.id === currentId || String(m.id).replace('doc-', '') === String(currentId).replace('doc-', '')) &&
        (m.role?.includes('Admin') || m.role?.includes('Founder'))
      );
  }, [activeCommunity, currentUser]);

  // Connected doctors that can be invited
  const invitableConnectedDoctors = useMemo(() => {
    const connectedList = (doctors || []).filter(doc => {
      if (!doc) return false;
      const docCleanId = String(doc.id).replace('doc-', '');
      const selfId = String(currentUser?.id || '').replace('doc-', '');
      if (selfId && docCleanId === selfId) return false;

      // Must be connected
      return connectedDoctors.some(c =>
        String(c.id).replace('doc-', '') === docCleanId
      );
    });

    if (!inviteSearch.trim()) return connectedList;
    return connectedList.filter(d =>
      d.name?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(inviteSearch.toLowerCase()) ||
      d.city?.toLowerCase().includes(inviteSearch.toLowerCase())
    );
  }, [doctors, connectedDoctors, currentUser, inviteSearch]);

  // Dynamically resolve a doctor's latest profile (avatar, name, specialty) from currentUser and doctors catalog
  const resolveDoctor = (docId, docName) => {
    if (!docId && !docName) return null;
    if (currentUser) {
      if (docId && (docId === currentUser.id || String(docId).replace('doc-', '') === String(currentUser.id).replace('doc-', ''))) {
        return currentUser;
      }
      if (docName && currentUser.name) {
        const n1 = docName.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        const n2 = currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        if (n1 === n2) return currentUser;
      }
    }
    const cleanId = docId ? String(docId).replace('doc-', '') : '';
    const cleanName = docName ? docName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() : '';

    return (doctors || []).find(d => {
      if (cleanId && (String(d.id) === cleanId || String(d.id).replace('doc-', '') === cleanId)) return true;
      if (cleanName && d.name) {
        const n = d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        if (n === cleanName) return true;
      }
      return false;
    }) || null;
  };

  // Connected doctors who are ALREADY members of activeCommunity
  const connectedMembersInGroup = useMemo(() => {
    if (!activeCommunity) return [];
    return (activeCommunity.members || []).filter(m => {
      const memberCleanId = String(m.id).replace('doc-', '');
      const selfId = String(currentUser?.id || '').replace('doc-', '');
      if (selfId && memberCleanId === selfId) return false;
      return connectedDoctors.some(c => String(c.id).replace('doc-', '') === memberCleanId);
    }).map(m => {
      const d = resolveDoctor(m.id, m.name);
      return d ? { ...m, ...d, avatar: d.avatar || m.avatar } : m;
    });
  }, [activeCommunity, connectedDoctors, currentUser, doctors]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === 'chat' && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, activeCommunity?.chatMessages]);

  // Copy community invite link
  const handleCopyInviteLink = () => {
    if (!activeCommunity) return;
    const inviteLink = `${window.location.origin}/community/join?code=${activeCommunity.inviteCode || activeCommunity.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Join via invite code
  const handleJoinViaCodeSubmit = async (e) => {
    e.preventDefault();
    setJoinCodeError('');
    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinCodeError('Please enter a valid invite code or link');
      return;
    }
    if (onJoinWithCode) {
      try {
        const joined = await onJoinWithCode(code);
        if (joined) {
          onSelectCommunity(joined.id);
          setIsJoinCodeModalOpen(false);
          setInviteCodeInput('');
          return;
        }
      } catch (err) {
        setJoinCodeError(err.message || 'Community not found for this invite code. Please verify.');
        return;
      }
    }
    const found = communities.find(c =>
      (c.inviteCode && c.inviteCode.toUpperCase() === code) ||
      String(c.id).toUpperCase() === code ||
      code.includes(String(c.id).toUpperCase())
    );
    if (found) {
      onJoinCommunity(found.id);
      onSelectCommunity(found.id);
      setIsJoinCodeModalOpen(false);
      setInviteCodeInput('');
    } else {
      setJoinCodeError('Community not found for this invite code. Please check the code.');
    }
  };

  // Create community submit
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    onCreateCommunity({
      name: newCommName.trim(),
      category: newCommCategory,
      description: newCommDesc.trim(),
      privacy: newCommPrivacy,
      coverGradient: newCommGradient,
      coverImage: newCommCoverUrl.trim() || undefined
    });

    setIsCreateModalOpen(false);
    setNewCommName('');
    setNewCommDesc('');
    setNewCommCoverUrl('');
  };

  // Post submit
  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!postText.trim() || !activeCommunity) return;

    onAddPost(activeCommunity.id, {
      content: postText.trim(),
      imageUrl: postImage.trim(),
      tag: postTag
    });

    setPostText('');
    setPostImage('');
    setShowImageInput(false);
  };

  // Case submit
  const handleCaseSubmit = (e) => {
    e.preventDefault();
    if (!caseTitle.trim() || !activeCommunity) return;

    onAddCase(activeCommunity.id, {
      title: caseTitle.trim(),
      species: caseSpecies.trim() || 'Canine',
      age: caseAge.trim() || 'Adult',
      diagnosis: caseDiagnosis.trim(),
      treatment: caseTreatment.trim(),
      imageUrl: caseImage.trim() || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80'
    });

    setIsShareCaseModalOpen(false);
    setCaseTitle('');
    setCaseSpecies('Canine');
    setCaseAge('');
    setCaseDiagnosis('');
    setCaseTreatment('');
    setCaseImage('');
  };

  // Reel submit
  const handleReelSubmit = (e) => {
    e.preventDefault();
    if (!reelTitle.trim() || !activeCommunity) return;

    onAddReel(activeCommunity.id, {
      title: reelTitle.trim(),
      videoUrl: reelVideoUrl.trim() || 'https://assets.mixkit.co/videos/preview/mixkit-veterinarian-operating-on-a-dog-42672-large.mp4',
      thumbnail: reelThumbnail.trim() || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
      duration: reelDuration.trim() || '0:45'
    });

    setIsShareReelModalOpen(false);
    setReelTitle('');
    setReelVideoUrl('');
    setReelThumbnail('');
  };

  // Chat message submit
  const handleSendMessageSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeCommunity) return;

    onSendMessage(activeCommunity.id, chatInput.trim());
    setChatInput('');
  };

  // Group Cover Photo upload & update
  const handleCoverFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeCommunity) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadMediaFile(file);
      if (url) {
        setLocalCoverImage(url);
        if (onUpdateCover) {
          await onUpdateCover(activeCommunity.id, url);
        }
        setIsCoverModalOpen(false);
      }
    } catch (err) {
      console.warn('Cover upload failed:', err);
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleApplyCoverUrl = async (url) => {
    if (!url || !url.trim() || !activeCommunity) return;
    setIsUploadingCover(true);
    setLocalCoverImage(url.trim());
    try {
      if (onUpdateCover) {
        await onUpdateCover(activeCommunity.id, url.trim());
      }
      setIsCoverModalOpen(false);
      setCustomCoverUrl('');
    } catch (err) {
      console.error('Failed to set cover url:', err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Generic Media Upload Helper (Server Upload with FileReader DataURL fallback)
  const uploadMediaFile = async (file) => {
    if (!file) return null;
    try {
      const res = await api.media.upload(file);
      if (res && res.url) {
        return res.url;
      }
    } catch (err) {
      console.warn('API upload failed, attempting fallback to DataURL:', err);
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Post Photo & Video Upload Handlers
  const handlePostPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPostMedia(true);
    setShowImageInput(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setPostImage(url);
    }
    setIsUploadingPostMedia(false);
    if (e.target) e.target.value = '';
  };

  const handlePostVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPostMedia(true);
    setShowImageInput(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setPostImage(url);
    }
    setIsUploadingPostMedia(false);
    if (e.target) e.target.value = '';
  };

  // Case Photo & Video Upload Handlers
  const handleCasePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCaseMedia(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setCaseImage(url);
    }
    setIsUploadingCaseMedia(false);
    if (e.target) e.target.value = '';
  };

  const handleCaseVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCaseMedia(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setCaseImage(url);
    }
    setIsUploadingCaseMedia(false);
    if (e.target) e.target.value = '';
  };

  // Reel Video & Thumbnail Upload Handlers
  const handleReelVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReelVideo(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setReelVideoUrl(url);
    }
    setIsUploadingReelVideo(false);
    if (e.target) e.target.value = '';
  };

  const handleReelThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingReelThumb(true);
    const url = await uploadMediaFile(file);
    if (url) {
      setReelThumbnail(url);
    }
    setIsUploadingReelThumb(false);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="fb-community-page">
      {/* 1. TOP SWITCHER & GLOBAL GROUP BAR */}
      <div className="fb-comm-global-bar">
        <div className="fb-comm-bar-left" ref={dropdownRef}>
          <div className="fb-comm-badge-icon">
            <Users size={18} color="#ffffff" />
          </div>

          <button
            type="button"
            className="fb-comm-selector-btn"
            onClick={() => setIsCommunityDropdownOpen(!isCommunityDropdownOpen)}
            title="Switch between veterinary communities"
          >
            <div className="fb-comm-selector-info">
              <span className="fb-comm-selector-kicker">COMMUNITY</span>
              <strong className="fb-comm-selector-name">
                {activeCommunity?.name || 'Veterinary Groups'}
              </strong>
            </div>
            <ChevronDown size={16} className={`fb-comm-chevron ${isCommunityDropdownOpen ? 'rotated' : ''}`} />
          </button>

          {/* Communities Dropdown Drawer */}
          {isCommunityDropdownOpen && (
            <div className="fb-comm-dropdown-menu">
              <div className="fb-comm-dd-header">
                <span>ALL VET COMMUNITIES ({communities.length})</span>
              </div>
              <div className="fb-comm-dd-list">
                {communities.map((comm) => {
                  const isSelected = activeCommunity?.id === comm.id;
                  const isUserMember = comm.members?.some(m =>
                    m.id === currentUser?.id ||
                    String(m.id).replace('doc-', '') === String(currentUser?.id).replace('doc-', '')
                  );

                  return (
                    <div
                      key={comm.id}
                      className={`fb-comm-dd-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        onSelectCommunity(comm.id);
                        setIsCommunityDropdownOpen(false);
                      }}
                    >
                      <div
                        className="fb-comm-dd-avatar"
                        style={{ background: comm.coverGradient || '#064e3b' }}
                      >
                        <Users size={15} color="#ffffff" />
                      </div>
                      <div className="fb-comm-dd-meta">
                        <div className="fb-comm-dd-name">{comm.name}</div>
                        <div className="fb-comm-dd-sub">
                          {comm.category} · {comm.members?.length || 1} members
                        </div>
                      </div>
                      {isUserMember && (
                        <span className="fb-comm-dd-joined-badge">Joined</span>
                      )}
                      {onDeleteCommunity && (
                        <button
                          type="button"
                          className="fb-comm-dd-delete-btn"
                          title={`Delete ${comm.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCommunityToDelete(comm);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={13} color="#dc2626" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="fb-comm-dd-footer">
                <button
                  type="button"
                  className="fb-comm-dd-action-btn"
                  onClick={() => {
                    setIsCommunityDropdownOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Start New Community</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="fb-comm-bar-actions">
          <button
            type="button"
            className="fb-comm-btn-ghost"
            onClick={() => setIsJoinCodeModalOpen(true)}
            title="Have an invitation link or code? Join here"
          >
            <Link size={14} />
            <span>Join with Code</span>
          </button>

          <button
            type="button"
            className="fb-comm-btn-brand"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={15} />
            <span>Start Community</span>
          </button>
        </div>
      </div>

      {activeCommunity ? (
        <div className="fb-group-canvas">
          {/* Pending Invitation Banner for Non-Members */}
          {activeCommunity.hasPendingInviteForMe && !isMember && (
            <div className="fb-invite-banner">
              <div className="fb-invite-banner-left">
                <div className="fb-invite-banner-icon">
                  <Mail size={20} />
                </div>
                <div className="fb-invite-banner-text">
                  <h4>You've been invited to join {activeCommunity.name}</h4>
                  <p>A fellow veterinarian invited you to participate in clinical case discussions, surgical videos, and peer consultations.</p>
                </div>
              </div>
              <div className="fb-invite-banner-actions">
                <button
                  type="button"
                  className="fb-btn-accept-invite"
                  onClick={() => onAcceptInvite && onAcceptInvite(activeCommunity.id)}
                >
                  <Check size={14} />
                  <span>Accept Invitation</span>
                </button>
                <button
                  type="button"
                  className="fb-btn-decline-invite"
                  onClick={() => onRejectInvite && onRejectInvite(activeCommunity.id)}
                >
                  <X size={14} />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. COMMUNITY GROUP COVER & HEADER BLOCK */}
          <div className="fb-group-header-card">
            {/* Panoramic Cover Photo */}
            <div
              className="fb-group-cover-wrapper"
              style={{
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#003822',
                borderRadius: '12px 12px 0 0'
              }}
            >
              {(localCoverImage || activeCommunity.coverImage) ? (
                <img
                  src={localCoverImage || activeCommunity.coverImage}
                  alt={activeCommunity.name}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: activeCommunity.coverGradient || 'linear-gradient(135deg, #003822 0%, #00a86b 100%)',
                    zIndex: 0
                  }}
                />
              )}
              {/* Overlay gradient for contrast and readability */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.65))',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />
              <input
                type="file"
                ref={coverInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverFileUpload}
              />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="fb-group-cover-badge"
                  onClick={() => {
                    if (coverInputRef.current) {
                      coverInputRef.current.click();
                    }
                  }}
                  title="Upload cover photo directly from your device"
                  disabled={isUploadingCover}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    backgroundColor: 'rgba(0, 56, 34, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                  }}
                >
                  <Upload size={14} color="#a7f3d0" />
                  <span>{isUploadingCover ? 'Uploading...' : 'Upload Cover Photo'}</span>
                </button>

                <button
                  type="button"
                  className="fb-group-cover-badge"
                  onClick={() => setIsCoverModalOpen(true)}
                  title="More cover options & clinical themes"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    backgroundColor: 'rgba(0, 0, 0, 0.68)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                  }}
                >
                  <Camera size={14} />
                  <span>Cover Themes & URL</span>
                </button>
              </div>
            </div>

            {/* Header Content Bar */}
            <div className="fb-group-header-body">
              <div className="fb-group-main-meta">
                <div className="fb-group-title-row">
                  <h1 className="fb-group-title">{activeCommunity.name}</h1>
                  {activeCommunity.privacy === 'Invite-Only' ? (
                    <span className="fb-privacy-pill private">
                      <Lock size={12} />
                      <span>Private Group</span>
                    </span>
                  ) : (
                    <span className="fb-privacy-pill public">
                      <Globe size={12} />
                      <span>Public Group</span>
                    </span>
                  )}
                  <span className="fb-category-pill">{activeCommunity.category}</span>
                </div>

                <div className="fb-group-sub-meta">
                  <span className="fb-sub-meta-item">
                    <strong>{activeCommunity.members?.length || 1} doctor members</strong>
                  </span>
                  <span>·</span>
                  <span className="fb-sub-meta-item">
                    {activeCommunity.posts?.length || 0} discussion posts
                  </span>
                  <span>·</span>
                  <span className="fb-sub-meta-item">
                    {activeCommunity.cases?.length || 0} clinical cases
                  </span>
                </div>

                {/* Overlapping Doctor Avatars Row */}
                <div className="fb-group-member-faces-row">
                  <div className="fb-member-stack">
                    {(activeCommunity.members || []).slice(0, 5).map((m, idx) => {
                      const resolvedDoc = resolveDoctor(m.id, m.name);
                      return (
                        <Avatar
                          key={m.id || idx}
                          src={resolvedDoc?.avatar || m.avatar}
                          name={resolvedDoc?.name || m.name}
                          size={28}
                          className="fb-stack-avatar"
                        />
                      );
                    })}
                  </div>
                  <span className="fb-faces-text">
                    {connectedMembersInGroup.length > 0 ? (
                      <>
                        <strong>{connectedMembersInGroup[0].name}</strong>
                        {connectedMembersInGroup.length > 1 && ` and ${connectedMembersInGroup.length - 1} other connected doctor${connectedMembersInGroup.length > 2 ? 's' : ''}`}
                        {' are in this group'}
                      </>
                    ) : (
                      <>Founded by <strong>{activeCommunity.creatorName || 'Founder'}</strong></>
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons Right Side */}
              <div className="fb-group-header-actions">
                {isMember ? (
                  <>
                    <button
                      type="button"
                      className="fb-btn-invite"
                      onClick={() => setIsInviteModalOpen(true)}
                    >
                      <UserPlus size={15} />
                      <span>+ Invite Doctors</span>
                    </button>

                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={handleCopyInviteLink}
                      title="Copy shareable invite link"
                    >
                      {copiedLink ? <Check size={14} color="#10b981" /> : <Link size={14} />}
                      <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
                    </button>

                    <button
                      type="button"
                      className="fb-btn-joined"
                      onClick={() => onLeaveCommunity(activeCommunity.id)}
                      title="Click to leave this group"
                    >
                      <CheckCircle2 size={14} />
                      <span>Joined</span>
                    </button>
                  </>
                ) : activeCommunity.hasPendingInviteForMe ? (
                  <>
                    <button
                      type="button"
                      className="fb-btn-accept-invite"
                      onClick={() => onAcceptInvite && onAcceptInvite(activeCommunity.id)}
                    >
                      <Check size={14} />
                      <span>Accept Invitation</span>
                    </button>

                    <button
                      type="button"
                      className="fb-btn-decline-invite"
                      onClick={() => onRejectInvite && onRejectInvite(activeCommunity.id)}
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </>
                ) : activeCommunity.privacy === 'Invite-Only' ? (
                  <>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => setIsJoinCodeModalOpen(true)}
                    >
                      <Lock size={14} />
                      <span>Invite Only · Enter Code</span>
                    </button>

                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={handleCopyInviteLink}
                    >
                      {copiedLink ? <Check size={14} color="#10b981" /> : <Link size={14} />}
                      <span>Share Link</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="fb-btn-join-main"
                      onClick={() => onJoinCommunity(activeCommunity.id)}
                    >
                      <Plus size={15} />
                      <span>Join Group</span>
                    </button>

                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={handleCopyInviteLink}
                    >
                      {copiedLink ? <Check size={14} color="#10b981" /> : <Link size={14} />}
                      <span>Share Link</span>
                    </button>
                  </>
                )}

                {onDeleteCommunity && (
                  <button
                    type="button"
                    className="fb-btn-secondary fb-btn-delete-trigger"
                    onClick={() => {
                      setCommunityToDelete(activeCommunity);
                      setIsDeleteModalOpen(true);
                    }}
                    title="Delete this community group"
                  >
                    <Trash2 size={14} />
                    <span>Delete Group</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs (Group Tab Bar) */}
            <div className="fb-group-tabs-bar">
              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <FileText size={16} />
                <span>Discussion</span>
              </button>

              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
                onClick={() => setActiveTab('cases')}
              >
                <FolderHeart size={16} />
                <span>Featured Cases</span>
                <span className="fb-tab-pill">{activeCommunity.cases?.length || 0}</span>
              </button>

              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
                onClick={() => setActiveTab('reels')}
              >
                <Video size={16} />
                <span>Reels & Clips</span>
                <span className="fb-tab-pill">{activeCommunity.reels?.length || 0}</span>
              </button>

              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={16} />
                <span>Group Chat</span>
                <span className="fb-tab-live-badge">Live</span>
              </button>

              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                <Users size={16} />
                <span>Members</span>
                <span className="fb-tab-pill">{activeCommunity.members?.length || 1}</span>
              </button>

              <button
                type="button"
                className={`fb-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >
                <Shield size={16} />
                <span>About & Rules</span>
              </button>
            </div>
          </div>

          {/* 3. MAIN BODY: 2-COLUMN LAYOUT */}
          {activeTab === 'feed' && (
            <div className="fb-two-column-wall">
              {/* Left Column: Discussion Wall (~68%) */}
              <div className="fb-feed-main-wall">
                {/* Group Post Composer */}
                {isMember ? (
                  <div className="fb-post-composer-card">
                    <div className="fb-composer-top-row">
                      <Avatar
                        src={currentUser?.avatar}
                        name={currentUser?.name || 'Doctor'}
                        size={42}
                        className="fb-composer-avatar"
                      />
                      <textarea
                        placeholder={`Share a clinical case, surgical question, or update to ${activeCommunity.name}...`}
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        className="fb-composer-textarea"
                        rows={2}
                      />
                    </div>

                    {/* Hidden device file inputs for post photo and video upload */}
                    <input
                      type="file"
                      ref={postPhotoInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePostPhotoUpload}
                    />
                    <input
                      type="file"
                      ref={postVideoInputRef}
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      style={{ display: 'none' }}
                      onChange={handlePostVideoUpload}
                    />

                    {/* Media upload/preview panel if opened or media selected */}
                    {(showImageInput || postImage || isUploadingPostMedia) && (
                      <div className="fb-composer-media-panel" style={{
                        marginTop: '10px',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ImageIcon size={14} color="#059669" />
                            <span>Attach Clinical Media (Photo or Video)</span>
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {postImage && (
                              <button
                                type="button"
                                onClick={() => setPostImage('')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setShowImageInput(false);
                                if (!postImage) setPostImage('');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Upload buttons from device */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="fb-composer-btn"
                            onClick={() => postPhotoInputRef.current?.click()}
                            disabled={isUploadingPostMedia}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#0f172a'
                            }}
                          >
                            <Upload size={13} color="#10b981" />
                            <span>Upload Photo from Device</span>
                          </button>

                          <button
                            type="button"
                            className="fb-composer-btn"
                            onClick={() => postVideoInputRef.current?.click()}
                            disabled={isUploadingPostMedia}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#0f172a'
                            }}
                          >
                            <Film size={13} color="#059669" />
                            <span>Upload Video from Device</span>
                          </button>
                        </div>

                        {/* Direct URL input */}
                        <div className="fb-composer-extra-bar" style={{ margin: 0 }}>
                          <Link size={14} color="#64748b" />
                          <input
                            type="url"
                            placeholder="Or paste direct image / video URL..."
                            value={postImage}
                            onChange={(e) => setPostImage(e.target.value)}
                            className="fb-composer-img-input"
                          />
                        </div>

                        {/* Upload spinner */}
                        {isUploadingPostMedia && (
                          <div style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div className="fb-spinner" style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid #065f46',
                              borderTopColor: 'transparent',
                              borderRadius: '50%'
                            }} />
                            <span>Uploading media file from device...</span>
                          </div>
                        )}

                        {/* Media preview */}
                        {postImage && !isUploadingPostMedia && (
                          <div style={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#020617',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            maxHeight: '260px'
                          }}>
                            {isVideoUrl(postImage) ? (
                              <video
                                src={postImage}
                                controls
                                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
                              />
                            ) : (
                              <img
                                src={postImage}
                                alt="Post media preview"
                                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="fb-composer-divider" />

                    <div className="fb-composer-actions-bar">
                      <div className="fb-composer-quick-actions">
                        <button
                          type="button"
                          className={`fb-composer-btn ${showImageInput ? 'active' : ''}`}
                          onClick={() => {
                            setShowImageInput(true);
                            postPhotoInputRef.current?.click();
                          }}
                        >
                          <ImageIcon size={16} color="#10b981" />
                          <span>Photo</span>
                        </button>

                        <button
                          type="button"
                          className="fb-composer-btn"
                          onClick={() => {
                            setShowImageInput(true);
                            postVideoInputRef.current?.click();
                          }}
                        >
                          <Video size={16} color="#059669" />
                          <span>Video</span>
                        </button>

                        <button
                          type="button"
                          className="fb-composer-btn"
                          onClick={() => setIsShareCaseModalOpen(true)}
                        >
                          <FolderHeart size={16} color="#3b82f6" />
                          <span>Clinical Case</span>
                        </button>

                        <button
                          type="button"
                          className="fb-composer-btn"
                          onClick={() => setIsShareReelModalOpen(true)}
                        >
                          <Film size={16} color="#ec4899" />
                          <span>Reel Video</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="fb-composer-publish-btn"
                        disabled={!postText.trim()}
                        onClick={handlePostSubmit}
                      >
                        <span>Zenv to Group</span>
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                ) : activeCommunity.hasPendingInviteForMe ? (
                  <div className="fb-join-invitation-card" style={{ borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' }}>
                    <div className="fb-join-card-icon" style={{ backgroundColor: '#003822' }}>
                      <Mail size={24} color="#ffffff" />
                    </div>
                    <div className="fb-join-card-text">
                      <h3 style={{ color: '#064e3b' }}>Invitation Pending</h3>
                      <p style={{ color: '#047857' }}>You have an invitation waiting to join {activeCommunity.name}. Accept the invitation to publish posts, share clinical cases, and chat.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="fb-btn-accept-invite"
                        onClick={() => onAcceptInvite && onAcceptInvite(activeCommunity.id)}
                      >
                        <Check size={14} />
                        <span>Accept Invitation</span>
                      </button>
                      <button
                        type="button"
                        className="fb-btn-decline-invite"
                        onClick={() => onRejectInvite && onRejectInvite(activeCommunity.id)}
                      >
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ) : activeCommunity.privacy === 'Invite-Only' ? (
                  <div className="fb-join-invitation-card" style={{ borderColor: '#fde68a', backgroundColor: '#fffbeb' }}>
                    <div className="fb-join-card-icon" style={{ backgroundColor: '#92400e' }}>
                      <Lock size={24} color="#ffffff" />
                    </div>
                    <div className="fb-join-card-text">
                      <h3 style={{ color: '#78350f' }}>Invite-Only Community</h3>
                      <p style={{ color: '#92400e' }}>This is a private veterinary group. Membership is by invitation from an existing member or by entering an invite code.</p>
                    </div>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => setIsJoinCodeModalOpen(true)}
                    >
                      <Link size={14} />
                      <span>Join with Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="fb-join-invitation-card">
                    <div className="fb-join-card-icon">
                      <Users size={24} color="#003822" />
                    </div>
                    <div className="fb-join-card-text">
                      <h3>Join {activeCommunity.name}</h3>
                      <p>Connect with specialist peers, share clinical radiographs, post cases, and join daily discussions.</p>
                    </div>
                    <button
                      type="button"
                      className="fb-btn-join-main"
                      onClick={() => onJoinCommunity(activeCommunity.id)}
                    >
                      Join Community
                    </button>
                  </div>
                )}

                {/* Pinned Featured Announcement Card */}
                <div className="fb-pinned-post-card">
                  <div className="fb-pinned-header">
                    <div className="fb-pinned-label">
                      <Pin size={13} color="#d97706" />
                      <span>PINNED BY FOUNDER</span>
                    </div>
                    <span className="fb-pinned-badge">Group Guidelines</span>
                  </div>
                  <h4 className="fb-pinned-title">Welcome to the {activeCommunity.name}</h4>
                  <p className="fb-pinned-desc">
                    This peer-moderated group is dedicated to collaborative veterinary excellence. Feel free to present second-opinion cases, discuss diagnostic dilemmas, and share surgical loops. Please ensure all radiographs and clinical images are de-identified.
                  </p>
                </div>

                {/* Posts Sorting Bar */}
                <div className="fb-posts-filter-bar">
                  <span className="fb-filter-title">Group Discussions</span>
                  <div className="fb-filter-options">
                    <button
                      type="button"
                      className={`fb-filter-btn ${feedSort === 'relevant' ? 'active' : ''}`}
                      onClick={() => setFeedSort('relevant')}
                    >
                      Most Relevant
                    </button>
                    <button
                      type="button"
                      className={`fb-filter-btn ${feedSort === 'recent' ? 'active' : ''}`}
                      onClick={() => setFeedSort('recent')}
                    >
                      Recent Activity
                    </button>
                  </div>
                </div>

                {/* Stream of Group Post Cards */}
                <div className="fb-posts-stream">
                  {(activeCommunity.posts || []).length > 0 ? (
                    activeCommunity.posts.map((post) => (
                      <CommunityGroupPostCard
                        key={post.id}
                        post={post}
                        communityId={activeCommunity.id}
                        onToggleLike={onTogglePostLike}
                        onAddComment={onAddComment}
                        onDeletePost={onDeletePost}
                        onOpenDoctorProfile={onOpenDoctorProfile}
                        currentUser={currentUser}
                        isMember={isMember}
                        isAdmin={isAdmin}
                        doctors={doctors}
                      />
                    ))
                  ) : (
                    <div className="fb-empty-stream-card">
                      <FileText size={36} color="#9ca3af" />
                      <h4>No discussions posted yet</h4>
                      <p>Start the conversation! Post an interesting clinical case or surgical question above.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Group Info & Sticky Widgets (~32%) */}
              <aside className="fb-group-sidebar">
                {/* Widget 1: About This Group */}
                <div className="fb-sidebar-widget">
                  <h3 className="fb-widget-heading">About This Group</h3>
                  <p className="fb-widget-desc">{activeCommunity.description}</p>

                  <div className="fb-about-items-list">
                    <div className="fb-about-item">
                      {activeCommunity.privacy === 'Invite-Only' ? (
                        <Lock size={18} className="fb-about-item-icon" />
                      ) : (
                        <Globe size={18} className="fb-about-item-icon" />
                      )}
                      <div>
                        <strong>{activeCommunity.privacy || 'Public Group'}</strong>
                        <p>{activeCommunity.privacy === 'Invite-Only' ? 'Only members can view cases and participate.' : 'Any registered veterinarian on Zenve Vet can join and see posts.'}</p>
                      </div>
                    </div>

                    <div className="fb-about-item">
                      <Eye size={18} className="fb-about-item-icon" />
                      <div>
                        <strong>Visible</strong>
                        <p>Anyone on Zenve Vet can find this specialty group.</p>
                      </div>
                    </div>

                    <div className="fb-about-item">
                      <Calendar size={18} className="fb-about-item-icon" />
                      <div>
                        <strong>History</strong>
                        <p>Group founded on {activeCommunity.createdAt || 'March 2024'}</p>
                      </div>
                    </div>

                    <div className="fb-about-item">
                      <Award size={18} className="fb-about-item-icon" />
                      <div>
                        <strong>Specialty Focus</strong>
                        <p>{activeCommunity.category}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="fb-widget-full-btn"
                    onClick={() => setActiveTab('about')}
                  >
                    <span>View Group Rules & Governance</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Widget 2: Connected Doctors in Group */}
                <div className="fb-sidebar-widget">
                  <div className="fb-widget-header-row">
                    <h3 className="fb-widget-heading">Connected Colleagues</h3>
                    <span className="fb-badge-count">{connectedMembersInGroup.length}</span>
                  </div>

                  {connectedMembersInGroup.length > 0 ? (
                    <div className="fb-connected-preview-list">
                      {connectedMembersInGroup.slice(0, 4).map((doc) => {
                        const resolved = resolveDoctor(doc.id, doc.name) || doc;
                        return (
                          <div key={doc.id} className="fb-connected-doc-row">
                            <Avatar src={resolved.avatar || doc.avatar} name={resolved.name || doc.name} size={34} />
                            <div className="fb-connected-meta">
                              <strong
                                className="fb-connected-name"
                                onClick={() => onOpenDoctorProfile && onOpenDoctorProfile(resolved)}
                              >
                                {resolved.name || doc.name}
                              </strong>
                              <span>{resolved.specialty || doc.specialty || 'Veterinary Practitioner'}</span>
                            </div>
                            <button
                              type="button"
                              className="fb-btn-msg-circle"
                              onClick={() => onOpenDirectChat && onOpenDirectChat(resolved)}
                              title={`Chat with ${resolved.name || doc.name}`}
                            >
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="fb-widget-empty-note">
                      None of your directly connected doctors are members yet. Invite them below!
                    </p>
                  )}

                  {isMember && (
                    <button
                      type="button"
                      className="fb-widget-invite-btn"
                      onClick={() => setIsInviteModalOpen(true)}
                    >
                      <UserPlus size={14} />
                      <span>Invite Connected Doctors</span>
                    </button>
                  )}
                </div>

                {/* Widget 3: Group Rules Highlights */}
                <div className="fb-sidebar-widget">
                  <h3 className="fb-widget-heading">Group Rules from Admins</h3>
                  <div className="fb-rules-preview-list">
                    {DEFAULT_GROUP_RULES.slice(0, 3).map((r) => (
                      <div key={r.num} className="fb-rule-preview-item">
                        <span className="fb-rule-num">{r.num}</span>
                        <div>
                          <strong className="fb-rule-title">{r.title}</strong>
                          <p className="fb-rule-snippet">{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="fb-widget-link-btn"
                    onClick={() => setActiveTab('about')}
                  >
                    See all rules
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* TAB 2: CLINICAL CASES */}
          {activeTab === 'cases' && (
            <div className="fb-tab-body-pane">
              <div className="fb-subtab-toolbar">
                <div>
                  <h2 className="fb-subtab-heading">Featured Clinical Cases</h2>
                  <p className="fb-subtab-sub">Peer-submitted case reports, diagnostic imaging, and surgical approach reviews.</p>
                </div>
                {isMember && (
                  <button
                    type="button"
                    className="fb-btn-brand-action"
                    onClick={() => setIsShareCaseModalOpen(true)}
                  >
                    <Plus size={15} />
                    <span>Share Case to Group</span>
                  </button>
                )}
              </div>

              <div className="fb-cases-wall-grid">
                {(activeCommunity.cases || []).length > 0 ? (
                  activeCommunity.cases.map((c) => {
                    const isCaseAuthor = currentUser && (
                      c.authorId === currentUser.id ||
                      String(c.authorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '') ||
                      (c.authorName && currentUser.name && c.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
                    );
                    const canDeleteCase = isCaseAuthor || isAdmin;

                    return (
                      <div key={c.id} className="fb-case-card">
                        {c.imageUrl && (
                          <div className="fb-case-image-holder">
                            {isVideoUrl(c.imageUrl) ? (
                              <video src={c.imageUrl} controls className="fb-case-img" style={{ maxHeight: '180px', width: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img src={c.imageUrl} alt={c.title} className="fb-case-img" />
                            )}
                            <span className="fb-case-species-tag">{c.species || 'Canine'}</span>
                          </div>
                        )}
                        <div className="fb-case-card-body">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                            <h4 className="fb-case-title" style={{ flex: 1, margin: 0 }}>{c.title}</h4>
                            {canDeleteCase && onDeleteCase && (
                              <button
                                type="button"
                                onClick={() => onDeleteCase(activeCommunity.id, c.id)}
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
                                  fontWeight: 600,
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                          <div className="fb-case-field" style={{ marginTop: '8px' }}>
                            <strong>Diagnosis:</strong>
                            <span>{c.diagnosis}</span>
                          </div>
                          <div className="fb-case-field">
                            <strong>Treatment:</strong>
                            <span>{c.treatment}</span>
                          </div>
                          <div className="fb-case-footer">
                            <span>Shared by {resolveDoctor(c.authorId, c.authorName)?.name || c.authorName}</span>
                            <span>{c.timestamp || 'Recent'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="fb-empty-stream-card">
                    <FolderHeart size={36} color="#9ca3af" />
                    <h4>No clinical cases shared in this group yet</h4>
                    <p>Share interesting radiographic or surgical findings for peer consultation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REELS & CLIPS */}
          {activeTab === 'reels' && (
            <div className="fb-tab-body-pane">
              <div className="fb-subtab-toolbar">
                <div>
                  <h2 className="fb-subtab-heading">Clinical Reels & Procedure Clips</h2>
                  <p className="fb-subtab-sub">Short surgical walkthroughs, ultrasound cine loops, and clinical procedure demonstrations.</p>
                </div>
                {isMember && (
                  <button
                    type="button"
                    className="fb-btn-brand-action"
                    onClick={() => setIsShareReelModalOpen(true)}
                  >
                    <Plus size={15} />
                    <span>Upload Reel to Group</span>
                  </button>
                )}
              </div>

              <div className="fb-reels-wall-grid">
                {(activeCommunity.reels || []).length > 0 ? (
                  activeCommunity.reels.map((reel) => {
                    const isReelAuthor = currentUser && (
                      reel.authorId === currentUser.id ||
                      String(reel.authorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '') ||
                      (reel.authorName && currentUser.name && reel.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
                    );
                    const canDeleteReel = isReelAuthor || isAdmin;

                    return (
                      <div
                        key={reel.id}
                        className="fb-reel-card"
                        onClick={() => setSelectedReelVideo(reel)}
                      >
                        <div className="fb-reel-thumb-box">
                          <img src={reel.thumbnail} alt={reel.title} className="fb-reel-img" />
                          <div className="fb-reel-overlay">
                            <div className="fb-reel-play-circle">
                              <Play size={20} fill="#ffffff" color="#ffffff" />
                            </div>
                          </div>
                          <span className="fb-reel-duration-badge">{reel.duration || '0:45'}</span>
                          {canDeleteReel && onDeleteReel && (
                            <button
                              type="button"
                              title="Delete reel video"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteReel(activeCommunity.id, reel.id);
                              }}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#f87171',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div className="fb-reel-meta">
                          <h4 className="fb-reel-title">{reel.title}</h4>
                          <p className="fb-reel-author">
                            <span>{resolveDoctor(reel.authorId, reel.authorName)?.name || reel.authorName}</span>
                            <span>·</span>
                            <span>{reel.views || 150} views</span>
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="fb-empty-stream-card">
                    <Video size={36} color="#9ca3af" />
                    <h4>No video reels uploaded yet</h4>
                    <p>Post 30-90 second procedure clips and surgical videos for group discussion.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE COMMUNITY GROUP CHAT */}
          {activeTab === 'chat' && (
            <div className="fb-tab-body-pane">
              <div className="fb-chat-container">
                <div className="fb-chat-header-bar">
                  <div className="fb-chat-header-left">
                    <div className="fb-live-dot" />
                    <div>
                      <h3 className="fb-chat-title">{activeCommunity.name} — Live Consultation Room</h3>
                      <p className="fb-chat-sub">Real-time messaging with {activeCommunity.members?.length || 1} joined veterinary specialists</p>
                    </div>
                  </div>
                  {isMember && (
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => setIsInviteModalOpen(true)}
                    >
                      <UserPlus size={13} />
                      <span>Invite Doctor</span>
                    </button>
                  )}
                </div>

                <div className="fb-chat-scroll-area">
                  {(activeCommunity.chatMessages || []).length > 0 ? (
                    activeCommunity.chatMessages.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id ||
                        String(msg.senderId).replace('doc-', '') === String(currentUser?.id).replace('doc-', '');
                      const senderDoc = isMe ? currentUser : resolveDoctor(msg.senderId, msg.senderName);
                      const sAvatar = isMe ? currentUser?.avatar : (senderDoc?.avatar || msg.senderAvatar);
                      const sName = isMe ? (currentUser?.name || 'You') : (senderDoc?.name || msg.senderName);

                      return (
                        <div
                          key={msg.id}
                          className={`fb-chat-row ${isMe ? 'me' : 'other'}`}
                        >
                          {!isMe && (
                            <Avatar
                              src={sAvatar}
                              name={sName}
                              size={32}
                              className="fb-chat-avatar"
                            />
                          )}
                          <div className="fb-chat-msg-wrap">
                            {!isMe && (
                              <span className="fb-chat-author-name">{sName}</span>
                            )}
                            <div className={`fb-chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                              <p>{msg.text}</p>
                            </div>
                            <span className="fb-chat-timestamp">{msg.timestamp || 'Now'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="fb-empty-stream-card">
                      <MessageSquare size={32} color="#9ca3af" />
                      <p>No messages yet. Send a message to start real-time consultation!</p>
                    </div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {isMember ? (
                  <form onSubmit={handleSendMessageSubmit} className="fb-chat-input-row">
                    <input
                      type="text"
                      placeholder={`Send a real-time message to ${activeCommunity.name}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="fb-chat-input"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="fb-chat-send-btn"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                ) : (
                  <div className="fb-chat-join-alert">
                    <span>You must be an accepted member of this community to send messages in the group room.</span>
                    {activeCommunity.hasPendingInviteForMe ? (
                      <button
                        type="button"
                        className="fb-btn-accept-invite"
                        onClick={() => onAcceptInvite && onAcceptInvite(activeCommunity.id)}
                      >
                        <Check size={14} />
                        <span>Accept Invite to Chat</span>
                      </button>
                    ) : activeCommunity.privacy === 'Invite-Only' ? (
                      <button
                        type="button"
                        className="fb-btn-secondary"
                        onClick={() => setIsJoinCodeModalOpen(true)}
                      >
                        <Link size={14} />
                        <span>Enter Invite Code</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="fb-btn-join-main"
                        onClick={() => onJoinCommunity(activeCommunity.id)}
                      >
                        Join Group
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MEMBERS DIRECTORY */}
          {activeTab === 'members' && (
            <div className="fb-tab-body-pane">
              <div className="fb-subtab-toolbar">
                <div>
                  <h2 className="fb-subtab-heading">Group Members ({activeCommunity.members?.length || 1})</h2>
                  <p className="fb-subtab-sub">All registered veterinarians and specialists participating in this community.</p>
                </div>
                {isMember && (
                  <button
                    type="button"
                    className="fb-btn-brand-action"
                    onClick={() => setIsInviteModalOpen(true)}
                  >
                    <UserPlus size={15} />
                    <span>Invite Connected Doctors</span>
                  </button>
                )}
              </div>

              <div className="fb-members-grid">
                {(activeCommunity.members || []).map((member) => {
                  const isFounder = member.role?.includes('Founder') || member.role?.includes('Admin');
                  const isCurrentDoc = member.id === currentUser?.id ||
                    String(member.id).replace('doc-', '') === String(currentUser?.id).replace('doc-', '');
                  const resolved = isCurrentDoc ? currentUser : (resolveDoctor(member.id, member.name) || member);
                  const mAvatar = resolved.avatar || member.avatar;
                  const mName = resolved.name || member.name;
                  const mSpec = resolved.specialty || member.specialty || 'Veterinary Practitioner';
                  const mCity = resolved.city || member.city || 'India';

                  return (
                    <div key={member.id} className="fb-member-card">
                      <Avatar
                        src={mAvatar}
                        name={mName}
                        size={48}
                        className="fb-member-card-avatar"
                      />
                      <div className="fb-member-card-info">
                        <div className="fb-member-name-row">
                          <strong
                            className="fb-member-name"
                            onClick={() => onOpenDoctorProfile && onOpenDoctorProfile(resolved)}
                          >
                            {mName}
                          </strong>
                          {isFounder && <span className="fb-admin-badge">Admin</span>}
                        </div>
                        <p className="fb-member-spec">{mSpec}</p>
                        <p className="fb-member-city">{mCity}</p>
                      </div>

                      {!isCurrentDoc && (
                        <button
                          type="button"
                          className="fb-btn-icon-circle"
                          onClick={() => onOpenDirectChat && onOpenDirectChat(member)}
                          title={`Message ${member.name}`}
                        >
                          <MessageSquare size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT & RULES */}
          {activeTab === 'about' && (
            <div className="fb-tab-body-pane">
              <div className="fb-about-full-card">
                <h2 className="fb-subtab-heading">Community Governance & Rules</h2>
                <p className="fb-subtab-sub" style={{ marginBottom: '20px' }}>
                  Rules created by the community administrators to maintain clinical excellence, patient privacy, and evidence-based collaboration.
                </p>

                <div className="fb-full-rules-list">
                  {DEFAULT_GROUP_RULES.map((rule) => (
                    <div key={rule.num} className="fb-full-rule-box">
                      <div className="fb-rule-number-badge">{rule.num}</div>
                      <div className="fb-full-rule-content">
                        <h3>{rule.title}</h3>
                        <p>{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="fb-admin-charter-box">
                  <Shield size={22} color="#003822" />
                  <div>
                    <h4>Admin Moderation & Standards</h4>
                    <p>Community administrators have the authority to remove non-compliant content, unverified commercial solicitations, or un-anonymized client records. To report a post, contact <strong>{activeCommunity.creatorName || 'Community Admin'}</strong>.</p>
                  </div>
                </div>

                {onDeleteCommunity && (
                  <div className="fb-admin-danger-box">
                    <div className="fb-admin-danger-info">
                      <div className="fb-admin-danger-icon">
                        <Trash2 size={20} color="#dc2626" />
                      </div>
                      <div>
                        <h4>Delete Community</h4>
                        <p>Permanently remove this community, including all discussion posts, clinical cases, reels, and chat messages. This action cannot be undone.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="fb-btn-delete-community"
                      onClick={() => {
                        setCommunityToDelete(activeCommunity);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Delete Community</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="fb-empty-state-canvas">
          <div className="fb-empty-icon-shield">
            <Users size={44} color="#003822" />
          </div>
          <h2 className="fb-empty-title">Veterinary Specialty Communities</h2>
          <p className="fb-empty-subtitle">
            Dynamic, evidence-based peer groups for surgical techniques, cardiology evaluations, critical care consults, and case discussions.
          </p>
          <div className="fb-empty-actions-row">
            <button
              type="button"
              className="fb-comm-btn-brand"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ padding: '10px 22px', fontSize: '14px' }}
            >
              <Plus size={16} />
              <span>Start the First Community</span>
            </button>
            <button
              type="button"
              className="fb-comm-btn-ghost"
              onClick={() => setIsJoinCodeModalOpen(true)}
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              <Link size={15} />
              <span>Join with Invite Code</span>
            </button>
          </div>
          <div className="fb-empty-features-grid">
            <div className="fb-empty-feature-item">
              <strong>Evidence-Based Groups</strong>
              <span>Public or invite-only circles governed by veterinary medical standards</span>
            </div>
            <div className="fb-empty-feature-item">
              <strong>Clinical Cases & Reels</strong>
              <span>Share diagnostic imaging, surgical clips, and follow-ups with peers</span>
            </div>
            <div className="fb-empty-feature-item">
              <strong>Group Consultations</strong>
              <span>Real-time instant clinical discussion room for rapid second opinions</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: Invite Connected Doctors Through Invite Link */}
      {isInviteModalOpen && activeCommunity && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#003822" />
                <h3 className="fb-modal-title">Invite to {activeCommunity.name}</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="fb-modal-scroll-body">
              {/* Shareable Invite Link Section */}
              <div className="fb-invite-link-banner">
                <label className="fb-modal-field-label">Shareable Community Link</label>
                <p className="fb-modal-hint-text">
                  Share this link with veterinarians via direct link, Email, or SMS to let them join this group instantly:
                </p>
                <div className="fb-link-copy-container">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/community/join?code=${activeCommunity.inviteCode || activeCommunity.id}`}
                    className="fb-link-readonly-input"
                  />
                  <button
                    type="button"
                    className="fb-copy-btn"
                    onClick={handleCopyInviteLink}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} color="#10b981" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Connected Doctors Selection List */}
              <div className="fb-invite-colleagues-block">
                <label className="fb-modal-field-label">Invite Your Connected Doctors</label>
                <div className="fb-invite-search-wrap">
                  <Search size={14} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Search connected doctors by name or specialty..."
                    value={inviteSearch}
                    onChange={(e) => setInviteSearch(e.target.value)}
                    className="fb-invite-search-field"
                  />
                </div>

                <div className="fb-invite-results-scroll">
                  {invitableConnectedDoctors.length > 0 ? (
                    invitableConnectedDoctors.map((doc) => {
                      const isAlreadyMember = activeCommunity.members?.some(m =>
                        String(m.id).replace('doc-', '') === String(doc.id).replace('doc-', '')
                      );
                      const isInvitePending = activeCommunity.pendingInviteDoctorIds?.some(id =>
                        String(id).replace('doc-', '') === String(doc.id).replace('doc-', '')
                      );

                      return (
                        <div key={doc.id} className="fb-invite-doc-card">
                          <Avatar
                            src={doc.avatar}
                            name={doc.name}
                            size={38}
                          />
                          <div className="fb-invite-doc-details">
                            <h4 className="fb-invite-doc-name">{doc.name}</h4>
                            <p className="fb-invite-doc-spec">
                              {doc.specialty || 'Veterinary Practitioner'} · {doc.city || 'India'}
                            </p>
                          </div>

                          <div className="fb-invite-doc-action">
                            {isAlreadyMember ? (
                              <span className="fb-pill-member">
                                <Check size={11} />
                                <span>Member</span>
                              </span>
                            ) : isInvitePending ? (
                              <span className="fb-pill-pending">
                                <Clock size={11} />
                                <span>Invite Sent</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="fb-btn-send-invite"
                                onClick={() => onInviteDoctor(activeCommunity.id, doc)}
                              >
                                <UserPlus size={13} />
                                <span>Invite</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="fb-no-connected-state">
                      <Users size={22} color="#9ca3af" />
                      <p>No connected doctors found. Connect with more doctors from the <strong>Vet Network</strong> to invite them directly, or copy the invite link above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="fb-modal-foot">
              <button
                type="button"
                className="fb-btn-brand-action"
                onClick={() => setIsInviteModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Create New Community */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#003822" />
                <h3 className="fb-modal-title">Create a Veterinary Community</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="fb-modal-scroll-body">
                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Community Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Veterinary Surgery & Orthopedics Network"
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    className="fb-form-input"
                  />
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Specialty Category *</label>
                  <select
                    value={newCommCategory}
                    onChange={(e) => setNewCommCategory(e.target.value)}
                    className="fb-form-select"
                  >
                    {SPECIALTY_CATEGORIES.filter(c => c !== 'All Specialties').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">About & Purpose</label>
                  <textarea
                    rows={3}
                    placeholder="What will members discuss and share in this community? (e.g. operative cases, ECG interpretations)..."
                    value={newCommDesc}
                    onChange={(e) => setNewCommDesc(e.target.value)}
                    className="fb-form-textarea"
                  />
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Privacy Setting</label>
                  <div className="fb-privacy-radio-group">
                    <label className={`fb-privacy-box ${newCommPrivacy === 'Public Group' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="privacy"
                        value="Public Group"
                        checked={newCommPrivacy === 'Public Group'}
                        onChange={(e) => setNewCommPrivacy(e.target.value)}
                      />
                      <div>
                        <strong>Public Group</strong>
                        <p>Any registered veterinarian on Zenve Vet can discover and view cases.</p>
                      </div>
                    </label>

                    <label className={`fb-privacy-box ${newCommPrivacy === 'Invite-Only' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="privacy"
                        value="Invite-Only"
                        checked={newCommPrivacy === 'Invite-Only'}
                        onChange={(e) => setNewCommPrivacy(e.target.value)}
                      />
                      <div>
                        <strong>Private (Invite-Only)</strong>
                        <p>Only doctors invited by members or joining via invite link can view and post.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Cover Banner Style</label>
                  <div className="fb-theme-picker">
                    {[
                      { label: 'Emerald Deep', grad: 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)' },
                      { label: 'Indigo Night', grad: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)' },
                      { label: 'Forest Mint', grad: 'linear-gradient(135deg, #022c22 0%, #059669 100%)' },
                      { label: 'Amber Gold', grad: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)' },
                      { label: 'Surgical Blue', grad: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)' }
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        className={`fb-color-chip ${newCommGradient === item.grad ? 'active' : ''}`}
                        style={{ background: item.grad }}
                        onClick={() => setNewCommGradient(item.grad)}
                        title={item.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="fb-modal-foot">
                <button
                  type="button"
                  className="fb-btn-ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fb-btn-brand-action"
                  disabled={!newCommName.trim()}
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Join with Invite Code */}
      {isJoinCodeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsJoinCodeModalOpen(false)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link size={18} color="#003822" />
                <h3 className="fb-modal-title">Join with Invite Link / Code</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                onClick={() => setIsJoinCodeModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleJoinViaCodeSubmit}>
              <div className="fb-modal-scroll-body">
                <p className="fb-modal-hint-text">
                  Paste the invite link or invitation code (e.g. <code>ZENVE-SURG-8821</code>) you received from a connected doctor:
                </p>

                <div className="fb-form-field">
                  <input
                    type="text"
                    required
                    placeholder="Paste invite link or code..."
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    className="fb-form-input"
                    autoFocus
                  />
                  {joinCodeError && (
                    <p className="fb-form-error">{joinCodeError}</p>
                  )}
                </div>
              </div>

              <div className="fb-modal-foot">
                <button
                  type="button"
                  className="fb-btn-ghost"
                  onClick={() => setIsJoinCodeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fb-btn-brand-action"
                  disabled={!inviteCodeInput.trim()}
                >
                  Join Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Share Clinical Case to Group */}
      {isShareCaseModalOpen && activeCommunity && (
        <div className="modal-overlay" onClick={() => setIsShareCaseModalOpen(false)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderHeart size={18} color="#003822" />
                <h3 className="fb-modal-title">Share Clinical Case to {activeCommunity.name}</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                onClick={() => setIsShareCaseModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCaseSubmit}>
              <div className="fb-modal-scroll-body">
                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Case Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comminuted Femoral Fracture Repair using MIPO"
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    className="fb-form-input"
                  />
                </div>

                <div className="fb-two-col-grid">
                  <div className="fb-form-field">
                    <label className="fb-modal-field-label">Species & Breed</label>
                    <input
                      type="text"
                      placeholder="e.g. Canine (German Shepherd)"
                      value={caseSpecies}
                      onChange={(e) => setCaseSpecies(e.target.value)}
                      className="fb-form-input"
                    />
                  </div>
                  <div className="fb-form-field">
                    <label className="fb-modal-field-label">Patient Age</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 Years"
                      value={caseAge}
                      onChange={(e) => setCaseAge(e.target.value)}
                      className="fb-form-input"
                    />
                  </div>
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Diagnosis *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Clinical findings, imaging interpretation, and definitive diagnosis..."
                    value={caseDiagnosis}
                    onChange={(e) => setCaseDiagnosis(e.target.value)}
                    className="fb-form-textarea"
                  />
                </div>

                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Treatment & Outcome</label>
                  <textarea
                    rows={2}
                    placeholder="Surgical approach, pharmacotherapy, post-operative progress..."
                    value={caseTreatment}
                    onChange={(e) => setCaseTreatment(e.target.value)}
                    className="fb-form-textarea"
                  />
                </div>

                <div className="fb-form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="fb-modal-field-label" style={{ margin: 0 }}>
                      Case Visual Media (Photo, Radiograph, or Video Loop)
                    </label>
                    {caseImage && (
                      <button
                        type="button"
                        onClick={() => setCaseImage('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Trash2 size={12} /> Remove Media
                      </button>
                    )}
                  </div>

                  {/* Hidden file pickers for case photo & video */}
                  <input
                    type="file"
                    ref={casePhotoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCasePhotoUpload}
                  />
                  <input
                    type="file"
                    ref={caseVideoInputRef}
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    style={{ display: 'none' }}
                    onChange={handleCaseVideoUpload}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => casePhotoInputRef.current?.click()}
                      disabled={isUploadingCaseMedia}
                      style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    >
                      <ImageIcon size={14} color="#10b981" />
                      <span>Upload Photo / X-Ray</span>
                    </button>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => caseVideoInputRef.current?.click()}
                      disabled={isUploadingCaseMedia}
                      style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    >
                      <Video size={14} color="#059669" />
                      <span>Upload Video Clip</span>
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste direct image / video URL..."
                    value={caseImage}
                    onChange={(e) => setCaseImage(e.target.value)}
                    className="fb-form-input"
                  />

                  {isUploadingCaseMedia && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="fb-spinner" style={{ width: '14px', height: '14px', border: '2px solid #166534', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span>Uploading case media from device...</span>
                    </div>
                  )}

                  {caseImage && !isUploadingCaseMedia && (
                    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: '200px' }}>
                      {isVideoUrl(caseImage) ? (
                        <video src={caseImage} controls style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      ) : (
                        <img src={caseImage} alt="Case visual attachment preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="fb-modal-foot">
                <button
                  type="button"
                  className="fb-btn-ghost"
                  onClick={() => setIsShareCaseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fb-btn-brand-action"
                  disabled={!caseTitle.trim() || !caseDiagnosis.trim()}
                >
                  Publish Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: Share Reel to Group */}
      {isShareReelModalOpen && activeCommunity && (
        <div className="modal-overlay" onClick={() => setIsShareReelModalOpen(false)}>
          <div className="fb-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color="#003822" />
                <h3 className="fb-modal-title">Share Reel Video to {activeCommunity.name}</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                onClick={() => setIsShareReelModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReelSubmit}>
              <div className="fb-modal-scroll-body">
                <div className="fb-form-field">
                  <label className="fb-modal-field-label">Reel Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arthroscopic Coronoid Inspection"
                    value={reelTitle}
                    onChange={(e) => setReelTitle(e.target.value)}
                    className="fb-form-input"
                  />
                </div>

                <div className="fb-form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="fb-modal-field-label" style={{ margin: 0 }}>Video Clip (MP4 / WebM) *</label>
                    {reelVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setReelVideoUrl('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Trash2 size={12} /> Remove Video
                      </button>
                    )}
                  </div>

                  {/* Hidden video file input */}
                  <input
                    type="file"
                    ref={reelVideoInputRef}
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    style={{ display: 'none' }}
                    onChange={handleReelVideoUpload}
                  />

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => reelVideoInputRef.current?.click()}
                      disabled={isUploadingReelVideo}
                      style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '12px' }}
                    >
                      <Upload size={14} color="#ec4899" />
                      <span>Upload Video File from Device</span>
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste direct video URL (https://...)"
                    value={reelVideoUrl}
                    onChange={(e) => setReelVideoUrl(e.target.value)}
                    className="fb-form-input"
                  />

                  {isUploadingReelVideo && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', color: '#9d174d', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="fb-spinner" style={{ width: '14px', height: '14px', border: '2px solid #9d174d', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span>Uploading video file from device...</span>
                    </div>
                  )}

                  {reelVideoUrl && !isUploadingReelVideo && (
                    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#000000', maxHeight: '180px' }}>
                      <video src={reelVideoUrl} controls style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>

                <div className="fb-two-col-grid">
                  <div className="fb-form-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="fb-modal-field-label" style={{ margin: 0 }}>Cover Thumbnail</label>
                      {reelThumbnail && (
                        <button
                          type="button"
                          onClick={() => setReelThumbnail('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>

                    {/* Hidden thumbnail file input */}
                    <input
                      type="file"
                      ref={reelThumbInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleReelThumbUpload}
                    />

                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => reelThumbInputRef.current?.click()}
                      disabled={isUploadingReelThumb}
                      style={{ width: '100%', justifyContent: 'center', padding: '6px 10px', fontSize: '11.5px', marginBottom: '8px' }}
                    >
                      <ImageIcon size={13} color="#10b981" />
                      <span>Upload Photo Thumbnail</span>
                    </button>

                    <input
                      type="url"
                      placeholder="Or paste thumbnail URL..."
                      value={reelThumbnail}
                      onChange={(e) => setReelThumbnail(e.target.value)}
                      className="fb-form-input"
                    />

                    {isUploadingReelThumb && (
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="fb-spinner" style={{ width: '10px', height: '10px', border: '2px solid #166534', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        <span>Uploading thumbnail...</span>
                      </div>
                    )}

                    {reelThumbnail && !isUploadingReelThumb && (
                      <div style={{ marginTop: '8px', borderRadius: '6px', overflow: 'hidden', height: '60px', backgroundColor: '#f1f5f9' }}>
                        <img src={reelThumbnail} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>

                  <div className="fb-form-field">
                    <label className="fb-modal-field-label">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 0:45"
                      value={reelDuration}
                      onChange={(e) => setReelDuration(e.target.value)}
                      className="fb-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="fb-modal-foot">
                <button
                  type="button"
                  className="fb-btn-ghost"
                  onClick={() => setIsShareReelModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fb-btn-brand-action"
                  disabled={!reelTitle.trim()}
                >
                  Upload Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: Video Player for Reels */}
      {selectedReelVideo && (
        <div className="modal-overlay" onClick={() => setSelectedReelVideo(null)}>
          <div className="fb-reel-player-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fb-reel-player-header">
              <h4>{selectedReelVideo.title}</h4>
              <button
                className="fb-modal-close-btn"
                onClick={() => setSelectedReelVideo(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fb-reel-player-body">
              <video
                src={selectedReelVideo.videoUrl}
                poster={selectedReelVideo.thumbnail}
                controls
                autoPlay
                className="fb-reel-video-element"
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: Delete Community Confirmation */}
      {isDeleteModalOpen && activeCommunity && (
        <div className="modal-overlay" onClick={() => !isDeleting && setIsDeleteModalOpen(false)}>
          <div className="fb-modal-window" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head" style={{ borderBottom: '1px solid #fee2e2', backgroundColor: '#fff5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Trash2 size={18} color="#dc2626" />
                </div>
                <h3 className="fb-modal-title" style={{ color: '#991b1b' }}>Delete Community</h3>
              </div>
              <button
                className="fb-modal-close-btn"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const targetComm = communityToDelete || activeCommunity;
              if (!targetComm) return null;
              return (
                <>
                  <div className="fb-modal-scroll-body" style={{ padding: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                      Are you sure you want to permanently delete <strong>{targetComm.name}</strong>?
                    </p>

                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      gap: '10px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '12.5px', color: '#991b1b', lineHeight: 1.45 }}>
                        This action <strong>cannot be undone</strong>. All discussion posts ({targetComm.posts?.length || 0}), clinical cases ({targetComm.cases?.length || 0}), reels ({targetComm.reels?.length || 0}), and chat room messages will be permanently deleted from the database.
                      </div>
                    </div>

                    <div className="fb-form-field">
                      <label className="fb-modal-field-label" style={{ color: '#6b7280' }}>
                        Community To Delete:
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={targetComm.name}
                        className="fb-form-input"
                        style={{ backgroundColor: '#f9fafb', color: '#111827', fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <div className="fb-modal-foot" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      className="fb-btn-ghost"
                      disabled={isDeleting}
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setCommunityToDelete(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="fb-btn-brand-action"
                      style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                      disabled={isDeleting}
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await onDeleteCommunity(targetComm.id);
                          setIsDeleteModalOpen(false);
                          setCommunityToDelete(null);
                        } catch (e) {
                          alert('Error deleting community: ' + (e.message || 'Please try again'));
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Change Group Cover Photo Modal */}
      {isCoverModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCoverModalOpen(false)}>
          <div className="fb-modal-window" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#003822" />
                <h3 className="fb-modal-title">Change Group Cover Photo</h3>
              </div>
              <button
                type="button"
                className="fb-modal-close-btn"
                onClick={() => setIsCoverModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="fb-modal-scroll-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Option 1: Upload from Computer */}
              <div>
                <label className="fb-modal-field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700 }}>
                  Option 1: Upload Image File from Device
                </label>
                <input
                  type="file"
                  ref={modalCoverInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleCoverFileUpload}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (modalCoverInputRef.current) {
                      modalCoverInputRef.current.click();
                    }
                  }}
                  disabled={isUploadingCover}
                  className="fb-btn-brand-action"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#003822'
                  }}
                >
                  <Upload size={16} />
                  <span>{isUploadingCover ? 'Uploading Cover Photo...' : 'Choose Image File from Computer'}</span>
                </button>
                {isUploadingCover && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div className="fb-spinner" style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid #065f46',
                      borderTopColor: 'transparent',
                      borderRadius: '50%'
                    }} />
                    <span>Uploading and applying new cover photo...</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700 }}>OR SELECT A CLINICAL THEME</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              </div>

              {/* Option 2: Veterinary Preset Covers */}
              <div>
                <label className="fb-modal-field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700 }}>
                  Option 2: Select a Medical Theme
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {PRESET_COVERS.map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() => handleApplyCoverUrl(preset.url)}
                      style={{
                        position: 'relative',
                        height: '80px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '6px 8px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {preset.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700 }}>OR PASTE IMAGE URL</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              </div>

              {/* Option 3: Image URL input */}
              <div className="fb-form-field">
                <label className="fb-modal-field-label" style={{ marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                  Option 3: Paste Custom Cover URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or direct image URL"
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    className="fb-form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="fb-btn-brand-action"
                    disabled={!customCoverUrl.trim() || isUploadingCover}
                    onClick={() => handleApplyCoverUrl(customCoverUrl)}
                    style={{ flexShrink: 0, backgroundColor: '#003822' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="fb-modal-foot" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="fb-btn-ghost"
                onClick={() => setIsCoverModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Community Group Post Card with Authentic Reactions & Threading
function CommunityGroupPostCard({
  post,
  communityId,
  onToggleLike,
  onAddComment,
  onDeletePost,
  onOpenDoctorProfile,
  currentUser,
  isMember,
  isAdmin,
  doctors = []
}) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [chosenReaction, setChosenReaction] = useState(null);

  const handleCommunityReaction = (reactionId) => {
    setChosenReaction(reactionId);
    const wasLike = chosenReaction ? chosenReaction.startsWith('like_') : post.likedByMe;
    const isNowLike = reactionId ? reactionId.startsWith('like_') : false;
    if (wasLike !== isNowLike) {
      onToggleLike(communityId, post.id);
    }
  };

  // Dynamic doctor lookup so user avatar & details always stay live
  const resolveDoc = (docId, docName) => {
    if (!docId && !docName) return null;
    const cleanId = String(docId || '').replace('doc-', '');
    const cleanCurrentId = String(currentUser?.id || '').replace('doc-', '');
    const cleanName = (docName || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
    const currentName = (currentUser?.name || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();

    if ((docId && (docId === currentUser?.id || cleanId === cleanCurrentId)) ||
      (cleanName && currentName && cleanName === currentName)) {
      return currentUser;
    }

    if (Array.isArray(doctors)) {
      const match = doctors.find(d => {
        if (!d) return false;
        const dId = String(d.id || '').replace('doc-', '');
        if (docId && (d.id === docId || dId === cleanId)) return true;
        const dName = (d.name || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        return cleanName && dName && cleanName === dName;
      });
      if (match) return match;
    }
    return null;
  };

  const resolvedAuthor = resolveDoc(post.authorId, post.authorName);
  const authorAvatar = resolvedAuthor?.avatar || post.authorAvatar;
  const authorName = resolvedAuthor?.name || post.authorName;
  const authorSpecialty = resolvedAuthor?.specialty || post.authorSpecialty || 'Veterinary Practitioner';

  const isAuthor = currentUser && (
    post.authorId === currentUser.id ||
    String(post.authorId).replace('doc-', '') === String(currentUser.id).replace('doc-', '') ||
    (post.authorName && currentUser.name && post.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
  );
  const canDelete = isAuthor || isAdmin;

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(communityId, post.id, commentText.trim());
    setCommentText('');
    setShowComments(true);
  };

  return (
    <article className="fb-post-card">
      {/* Post Top Row: Author, Verification, Timestamp, Privacy */}
      <div className="fb-post-top">
        <Avatar
          src={authorAvatar}
          name={authorName}
          size={42}
          className="fb-post-avatar"
          onClick={() => {
            const targetDoc = resolvedAuthor || { name: authorName, id: post.authorId, avatar: authorAvatar, specialty: authorSpecialty };
            onOpenDoctorProfile && onOpenDoctorProfile(targetDoc);
          }}
          style={{ cursor: 'pointer' }}
        />
        <div className="fb-post-author-meta">
          <div className="fb-post-author-line">
            <h4
              className="fb-post-author-name"
              onClick={() => {
                const targetDoc = resolvedAuthor || { name: authorName, id: post.authorId, avatar: authorAvatar, specialty: authorSpecialty };
                onOpenDoctorProfile && onOpenDoctorProfile(targetDoc);
              }}
              style={{ cursor: 'pointer' }}
            >
              {authorName}
            </h4>
            <CheckCircle2 size={13} color="#059669" className="fb-post-verify-icon" />
            {post.tag && <span className="fb-post-tag-badge">{post.tag}</span>}
          </div>
          <p className="fb-post-sub-line">
            <span>{authorSpecialty}</span>
            <span>·</span>
            <span>{post.timestamp || 'Recent'}</span>
            <span>·</span>
            <Users size={11} color="#9ca3af" />
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canDelete && onDeletePost && (
            <button
              type="button"
              className="fb-post-delete-btn"
              onClick={() => onDeletePost(communityId, post.id)}
              title="Delete discussion post"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #fee2e2',
                backgroundColor: '#fff5f5',
                color: '#dc2626',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Post Body Content */}
      <div className="fb-post-body">
        <p>{post.content}</p>
      </div>

      {/* Post Attached Clinical Media (Photo or Video) */}
      {(post.imageUrl || post.videoUrl) && (
        <div className="fb-post-media-frame">
          {isVideoUrl(post.videoUrl || post.imageUrl) ? (
            <video
              src={post.videoUrl || post.imageUrl}
              controls
              className="fb-post-img"
              style={{ maxHeight: '420px', width: '100%', objectFit: 'contain', backgroundColor: '#000000' }}
            />
          ) : (
            <img src={post.imageUrl} alt="Case visual attachment" className="fb-post-img" />
          )}
        </div>
      )}

      {/* Reactions & Engagement Summary Bar */}
      <div className="fb-post-engagement-line">
        <div className="fb-reactions-group" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <img
            src={REACTION_MAP[chosenReaction]?.icon || (post.likedByMe ? likePuppy : (chosenReaction ? sadPuppy : likePuppy))}
            alt="Reaction"
            style={{ width: 18, height: 18, objectFit: 'contain' }}
          />
          <span className="fb-reactions-count">
            {(post.likes || 0) + (chosenReaction ? (chosenReaction.startsWith('like_') ? 1 : 0) : (post.likedByMe ? 1 : 0))}
          </span>
        </div>
        <div className="fb-comments-count-text" onClick={() => setShowComments(!showComments)}>
          <span>{(post.comments || []).length} comments</span>
        </div>
      </div>

        {/* Community Interaction Action Buttons */}
        <div className="fb-post-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ReactionPicker
            activeReaction={chosenReaction !== null ? chosenReaction : (post.likedByMe ? 'like_puppy' : null)}
            likesCount={(post.likes || 0) + (chosenReaction ? (chosenReaction.startsWith('like_') ? 1 : 0) : (post.likedByMe ? 1 : 0))}
            dislikesCount={chosenReaction?.startsWith('sad_') ? 1 : 0}
            onSelectReaction={handleCommunityReaction}
          />

          <button
            type="button"
            className="fb-action-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={16} />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="fb-action-btn"
            onClick={() => {
              if (navigator?.clipboard?.writeText) {
                navigator.clipboard.writeText(window.location.href);
                alert('Post link copied to clipboard!');
              }
            }}
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>

        {/* Comments Section */}
        {(showComments || (post.comments && post.comments.length > 0)) && (
          <div className="fb-comments-stream">
            {(post.comments || []).map((comm) => {
              const commentDoc = resolveDoc(comm.authorId, comm.authorName);
              const commAvatar = commentDoc?.avatar || comm.authorAvatar;
              const commName = commentDoc?.name || comm.authorName;

              return (
                <div key={comm.id} className="fb-comment-row">
                  <Avatar
                    src={commAvatar}
                    name={commName}
                    size={30}
                    onClick={() => {
                      const targetDoc = commentDoc || { name: comm.authorName, id: comm.authorId, avatar: commAvatar };
                      onOpenDoctorProfile && onOpenDoctorProfile(targetDoc);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="fb-comment-bubble">
                    <div
                      className="fb-comment-author-name"
                      onClick={() => {
                        const targetDoc = commentDoc || { name: comm.authorName, id: comm.authorId, avatar: commAvatar };
                        onOpenDoctorProfile && onOpenDoctorProfile(targetDoc);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {commName}
                    </div>
                    <p className="fb-comment-text">{comm.text}</p>
                    <div className="fb-comment-time">{comm.timestamp || 'Just now'}</div>
                  </div>
                </div>
              );
            })}

            {isMember && (
              <form onSubmit={handleCommentSubmit} className="fb-comment-input-form">
                <Avatar
                  src={currentUser?.avatar}
                  name={currentUser?.name || 'Doctor'}
                  size={30}
                />
                <div className="fb-comment-input-box">
                  <input
                    type="text"
                    placeholder="Write a clinical observation or comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="fb-comment-text-field"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="fb-comment-reply-btn"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
    </article>
  );
}
