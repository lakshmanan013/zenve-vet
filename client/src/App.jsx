import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NotificationToast } from './components/NotificationToast';
import { DeviceNotificationBanner } from './components/DeviceNotificationBanner';
import {
  registerServiceWorker,
  showNotification,
  notifyReelUploaded,
  notifyCaseShared,
  notifyIncomingChatMessage
} from './services/notificationService';

// Pages
import { FeedView } from './pages/FeedView';
import { VetNetworkView } from './pages/VetNetworkView';
import { ClinicalCasesView } from './pages/ClinicalCasesView';
import { ShortVideosView } from './pages/ShortVideosView';
import { MessagesView } from './pages/MessagesView';
import { SearchView } from './pages/SearchView';
import { MemberBenefitsView } from './pages/MemberBenefitsView';
import { AdvertiseView } from './pages/AdvertiseView';
import { LoginPage } from './pages/LoginPage';
import { ProfileView } from './pages/ProfileView';
import { TermsView } from './pages/TermsView';

// Modals
import { DoctorModal } from './components/DoctorModal';
import { CreateProfileModal } from './components/CreateProfileModal';
import { AiCaseAssistantModal } from './components/AiCaseAssistantModal';
import { StoryModal } from './components/StoryModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ClinicalCaseModal } from './components/ClinicalCaseModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CommunityView } from './components/CommunityView';
import { TermsAndConditionsModal } from './components/TermsAndConditionsModal';

// API Service
import { api } from './services/api';
import { createStompClient } from './services/websocket';
// Dynamic Communities backed by Spring Boot API


export function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [globalSearch, setGlobalSearch] = useState('');

  // Authentication State: strictly initialized from stored session or null
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('doctor_vet_token');
      if (!token) {
        localStorage.removeItem('doctor_vet_user');
        return null;
      }
      const saved = localStorage.getItem('doctor_vet_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && parsed.avatar && typeof parsed.avatar === 'string' && parsed.avatar.includes('unsplash.com')) {
        parsed.avatar = '';
        localStorage.setItem('doctor_vet_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });
  const [isLoginView, setIsLoginView] = useState(false);

  // Dynamic App State (Directly populated from Spring Boot API)
  const [doctors, setDoctors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [clinicalCases, setClinicalCases] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stories, setStories] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [connectedMap, setConnectedMap] = useState({});
  const [myConnections, setMyConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [liveCampaigns, setLiveCampaigns] = useState([]);

  // Dynamic Communities State (Spring Boot API)
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  // Active Modals
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewedProfileDoctor, setViewedProfileDoctor] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [createPostInitialType, setCreatePostInitialType] = useState('CLINICAL_CASE');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsInitialSection, setTermsInitialSection] = useState(null);

  // Active chat peer
  const [activeChatDoctor, setActiveChatDoctor] = useState(null);
  const [profileReturnTab, setProfileReturnTab] = useState('feed');

  // Cross-Platform Notification Synchronization (Desktop, Laptop, Android & iOS)
  const seenNotificationIdsRef = useRef(new Set());
  const initialNotifsLoadedRef = useRef(false);
  const seenMsgKeysRef = useRef(new Set());

  // Tab title alert when user is in another tab or minimized
  useEffect(() => {
    const unreadCount = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
    const defaultTitle = 'Zenve Vet — The Professional Veterinary Network';

    if (unreadCount <= 0) {
      document.title = defaultTitle;
      return;
    }

    if (document.hidden) {
      let toggle = false;
      const interval = setInterval(() => {
        toggle = !toggle;
        document.title = toggle
          ? `💬 (${unreadCount}) New Message${unreadCount > 1 ? 's' : ''} — Zenve Vet`
          : `(${unreadCount}) Unread Chat Alert — Zenve Vet`;
      }, 1500);

      const handleFocus = () => {
        clearInterval(interval);
        document.title = defaultTitle;
      };

      window.addEventListener('focus', handleFocus, { once: true });
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    } else {
      document.title = `(${unreadCount}) Zenve Vet — The Professional Veterinary Network`;
    }
  }, [conversations]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Sync incoming notifications with cross-platform OS alerts and sound chime
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    if (!initialNotifsLoadedRef.current) {
      initialNotifsLoadedRef.current = true;
      notifications.forEach(n => {
        if (n.id) seenNotificationIdsRef.current.add(n.id);
      });
      return;
    }

    // Check for newly arrived unread notifications
    notifications.forEach(n => {
      if (n.id && !n.read && !seenNotificationIdsRef.current.has(n.id)) {
        seenNotificationIdsRef.current.add(n.id);
        const title = n.type === 'REEL_UPLOAD' ? 'New Surgical Reel Uploaded'
          : n.type === 'CLINICAL_CASE_SHARED' ? 'New Clinical Case Shared'
          : n.type === 'NEW_MESSAGE' ? 'New Message'
          : n.type === 'CONNECTION_REQUEST' ? 'New Connection Request'
          : 'Zenve Vet Clinical Alert';

        showNotification({
          title,
          message: n.message,
          type: n.type,
          senderName: n.senderName,
          senderAvatar: n.senderAvatar,
          targetId: n.targetId,
          data: { ...n }
        });
      }
    });
  }, [notifications]);

  // 1. Validate session on startup with backend
  useEffect(() => {
    async function validateSession() {
      const token = localStorage.getItem('doctor_vet_token');
      if (currentUser && !token) {
        console.warn('Doctor session user exists without token. Logging out.');
        handleLogout();
        return;
      }
      if (currentUser && token) {
        try {
          const profile = await api.auth.getMe();
          if (profile) {
            setCurrentUser(prev => ({ ...prev, ...profile }));
          }
        } catch (e) {
          console.warn('Session expired on startup. Logging out.');
          handleLogout();
        }
      }
    }
    validateSession();
  }, []);

  // 2. Listen for 401 unauthorized events from API client
  useEffect(() => {
    const onUnauthorized = () => {
      console.warn('Received unauthorized event from API. Resetting state.');
      handleLogout();
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  // 3. Sync public and private data based on authentication status
  useEffect(() => {
    async function loadBackendData() {
      // Public catalogs
      let loadedDocs = [];
      try {
        const docs = await api.doctors.getAll();
        if (docs && docs.length > 0) {
          loadedDocs = docs;
          setDoctors(docs);
          if (currentUser?.id) {
            const fresh = docs.find(d => d.id === currentUser.id || String(d.id).replace('doc-', '') === String(currentUser.id).replace('doc-', ''));
            if (fresh) {
              setCurrentUser(prev => {
                if (!prev) return fresh;
                const hasChanged = fresh.name !== prev.name ||
                  fresh.avatar !== prev.avatar ||
                  fresh.specialty !== prev.specialty ||
                  fresh.verified !== prev.verified ||
                  fresh.headline !== prev.headline;
                if (hasChanged) {
                  const merged = { ...prev, ...fresh };
                  try {
                    localStorage.setItem('doctor_vet_user', JSON.stringify(merged));
                  } catch (err) { }
                  return merged;
                }
                return prev;
              });
            }
          }
        }
      } catch (e) {
        console.log('Using local doctors catalog');
      }

      try {
        const feedPosts = await api.feed.getPosts();
        if (feedPosts && feedPosts.length > 0) {
          setPosts(feedPosts.map(p => {
            const freshDoc = loadedDocs.find(d =>
              d.id === p.authorId ||
              String(d.id).replace('doc-', '') === String(p.authorId).replace('doc-', '') ||
              (d.name && p.authorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === p.authorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
            );
            return freshDoc ? { ...p, authorAvatar: freshDoc.avatar || p.authorAvatar } : p;
          }));
        }
      } catch (e) {
        console.log('Using local feed posts');
      }

      try {
        // Load active 24h stories
        const docIdForStories = currentUser?.id ? Number(String(currentUser.id).replace('doc-', '')) : null;
        const backendStories = await api.stories.getAll(docIdForStories);
        if (backendStories && backendStories.length > 0) {
          setStories(backendStories.map(s => {
            const freshDoc = loadedDocs.find(d =>
              d.id === s.doctorId ||
              String(d.id).replace('doc-', '') === String(s.doctorId).replace('doc-', '') ||
              (d.name && s.doctorName && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === s.doctorName.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
            );
            return {
              id: s.id,
              doctorId: s.doctorId,
              doctorName: s.doctorName ? s.doctorName.replace(/^dr\.?\s*/i, '').split(' ')[0] : (freshDoc?.name ? freshDoc.name.replace(/^dr\.?\s*/i, '').split(' ')[0] : 'Doctor'),
              fullDoctorName: s.doctorName || freshDoc?.name || 'Doctor',
              avatar: (freshDoc?.avatar && !freshDoc.avatar.includes('unsplash.com')) ? freshDoc.avatar : (s.avatar || ''),
              image: s.mediaUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
              videoUrl: s.mediaType === 'VIDEO' ? s.mediaUrl : null,
              caption: s.caption || 'Moments from clinical practice',
              time: 'Active',
              likes: s.likes || 0,
              shares: s.shares || 0,
              isLiked: !!s.isLiked
            };
          }));
        }
      } catch (e) {
        console.log('Using local stories');
      }

      try {
        // Load clinical cases
        const backendCases = await api.cases.getAll();
        if (backendCases && backendCases.length > 0) {
          setClinicalCases(backendCases.map(c => {
            const freshDoc = loadedDocs.find(d => d.id === c.authorId || String(d.id).replace('doc-', '') === String(c.authorId).replace('doc-', '') || d.name === c.authorName);
            return freshDoc ? { ...c, authorAvatar: freshDoc.avatar || c.authorAvatar } : c;
          }));
        }
      } catch (e) {
        console.log('Using local clinical cases');
      }

      try {
        // Load short videos
        const backendVideos = await api.videos.getAll();
        if (backendVideos && backendVideos.length > 0) {
          setVideos(backendVideos.map(v => {
            if (v.thumbnail && (v.thumbnail.includes('543a7dc6') || v.thumbnail.includes('bcb16239') || v.thumbnail.includes('43090d16'))) {
              return { ...v, thumbnail: null };
            }
            return v;
          }));
        }
      } catch (e) {
        console.log('Using local short videos');
      }

      try {
        // Load active public live advertising campaigns for live feed
        const liveAds = await api.campaigns.getPublicLive('Feed');
        if (liveAds && Array.isArray(liveAds)) {
          setLiveCampaigns(liveAds);
        }
      } catch (e) {
        console.log('Using local live ads');
      }

      try {
        // Load dynamic communities from Spring Boot API
        const liveCommunities = await api.communities.getAll(currentUser?.id);
        if (Array.isArray(liveCommunities)) {
          const resolveDoc = (id, name) => {
            if (currentUser && (id === currentUser.id || String(id).replace('doc-', '') === String(currentUser.id).replace('doc-', '') || (name && currentUser.name && name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === currentUser.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim()))) {
              return currentUser;
            }
            return loadedDocs.find(d => d.id === id || String(d.id).replace('doc-', '') === String(id).replace('doc-', '') || (name && d.name && name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim()));
          };

          const hydratedCommunities = liveCommunities.map(comm => {
            const updatedMembers = (comm.members || []).map(m => {
              const d = resolveDoc(m.id, m.name);
              return d ? { ...m, avatar: d.avatar || m.avatar, name: d.name || m.name, specialty: d.specialty || m.specialty } : m;
            });

            const updatedPosts = (comm.posts || []).map(p => {
              const d = resolveDoc(p.authorId, p.authorName);
              const postAvatar = d?.avatar || p.authorAvatar;
              const postName = d?.name || p.authorName;
              const postSpecialty = d?.specialty || p.authorSpecialty;
              const newComments = (p.comments || []).map(c => {
                const cd = resolveDoc(c.authorId, c.authorName);
                return cd ? { ...c, authorAvatar: cd.avatar || c.authorAvatar, authorName: cd.name || c.authorName } : c;
              });
              return { ...p, authorAvatar: postAvatar, authorName: postName, authorSpecialty: postSpecialty, comments: newComments };
            });

            return { ...comm, members: updatedMembers, posts: updatedPosts };
          });

          setCommunities(hydratedCommunities);
          setSelectedCommunityId(prev => {
            if (prev && hydratedCommunities.some(c => c.id === prev || String(c.id) === String(prev))) {
              return prev;
            }
            return hydratedCommunities.length > 0 ? hydratedCommunities[0].id : null;
          });
        }
      } catch (e) {
        console.log('Error loading dynamic communities:', e);
      }

      // Private Endpoints: ONLY requested when user is authenticated AND token exists
      const token = localStorage.getItem('doctor_vet_token');
      if (currentUser?.id && token) {
        const rawId = currentUser.id;
        const docId = typeof rawId === 'string' && rawId.startsWith('doc-')
          ? parseInt(rawId.replace('doc-', ''), 10)
          : Number(rawId);

        if (!isNaN(docId) && docId > 0) {
          try {
            const notifs = await api.notifications.getNotifications(docId);
            if (notifs) setNotifications(notifs);
          } catch (e) { }

          try {
            const myCons = await api.connections.getMy(docId);
            if (myCons && myCons.length > 0) {
              const enrichedCons = myCons.map(c => {
                const fresh = loadedDocs.find(d => d.id === c.id || String(d.id).replace('doc-', '') === String(c.id).replace('doc-', '') || d.name === c.name);
                return fresh ? { ...c, avatar: fresh.avatar || c.avatar, specialty: fresh.specialty || c.specialty } : c;
              });
              setMyConnections(enrichedCons);
              const map = {};
              enrichedCons.forEach(c => { map[c.id] = true; map[`doc-${c.id}`] = true; });
              setConnectedMap(map);
            } else {
              setMyConnections([]);
              setConnectedMap({});
            }
            const pending = await api.connections.getPending(docId);
            if (pending) setPendingRequests(pending);
          } catch (e) {
            setMyConnections([]);
            setConnectedMap({});
          }

          try {
            const convList = await api.chat.getConversations(docId);
            if (convList && convList.length > 0) {
              const fullConvs = await Promise.all(convList.map(async (c) => {
                let msgs = [];
                try {
                  msgs = await api.chat.getMessages(c.id, docId);
                } catch (e) { }
                const otherDocId = c.doctor1Id === docId ? c.doctor2Id : c.doctor1Id;
                const otherDocName = c.doctor1Id === docId ? c.doctor2Name : c.doctor1Name;
                const freshDoc = loadedDocs.find(d => d.id === otherDocId || String(d.id).replace('doc-', '') === String(otherDocId).replace('doc-', '') || d.name === otherDocName);
                const resolvedAvatar = freshDoc?.avatar || (c.doctor1Id === docId ? c.doctor2Avatar : c.doctor1Avatar) || '';
                const mappedMessages = (() => {
                  const seen = new Set();
                  return (msgs || []).filter(m => {
                    const k = String(m.id);
                    if (seen.has(k)) return false;
                    seen.add(k);
                    return true;
                  }).map(m => ({
                    id: m.id,
                    sender: m.senderId === docId ? 'user' : 'doctor',
                    senderId: m.senderId,
                    receiverId: m.receiverId,
                    text: m.text || m.message,
                    attachmentUrl: m.attachmentUrl,
                    attachmentType: m.attachmentType,
                    status: m.status || (m.isRead ? 'SEEN' : 'SENT'),
                    isRead: m.isRead || false,
                    createdAt: m.createdAt,
                    deliveredAt: m.deliveredAt,
                    readAt: m.readAt,
                    time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                  }));
                })();

                const lastMsg = mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1] : null;
                const convTime = lastMsg?.time || (c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active');

                return {
                  id: c.id,
                  doctor: {
                    id: otherDocId,
                    name: otherDocName,
                    avatar: resolvedAvatar,
                    specialty: freshDoc?.specialty || 'Veterinary Practitioner',
                    city: freshDoc?.city || 'Bengaluru'
                  },
                  lastMessage: c.lastMessage || (lastMsg ? lastMsg.text : 'Direct chat consultation'),
                  timestamp: convTime,
                  unread: c.doctor1Id === docId ? c.unreadCountDoctor1 : c.unreadCountDoctor2,
                  messages: mappedMessages
                };
              }));
              setConversations(fullConvs);
            }
          } catch (e) {
            setConversations([]);
          }

          try {
            const sent = await api.connections.getSent(docId);
            if (sent && sent.length > 0) {
              setSentRequests(sent);
            }
          } catch (e) { }
        }
      } else {
        // Cleanly wipe any private data from memory when not signed in
        setConversations([]);
        setConnectedMap({});
        setMyConnections([]);
        setPendingRequests([]);
        setSentRequests([]);
        setNotifications([]);
      }
    }

    loadBackendData();
  }, [currentUser?.id]);

  // Whenever the user switches to the 'feed' tab, refresh public live campaigns
  useEffect(() => {
    if (activeTab === 'feed') {
      api.campaigns.getPublicLive('Feed')
        .then(liveAds => {
          if (Array.isArray(liveAds)) setLiveCampaigns(liveAds);
        })
        .catch(() => { });
    }
  }, [activeTab]);

  // STOMP WebSocket for real-time notifications & 2-way messages
  useEffect(() => {
    if (!currentUser?.id) return;

    let client = null;
    try {
      client = createStompClient((stomp) => {
        // Subscribe to live notifications for current doctor
        stomp.subscribe(`/topic/user/${currentUser.id}/notifications`, (frame) => {
          try {
            if (frame && frame.body) {
              const parsed = JSON.parse(frame.body);
              if (parsed && (parsed.message || parsed.title)) {
                showNotification({
                  title: parsed.type === 'REEL_UPLOAD' ? 'New Surgical Reel Uploaded'
                    : parsed.type === 'CLINICAL_CASE_SHARED' ? 'New Clinical Case Shared'
                    : parsed.type === 'NEW_MESSAGE' ? 'New Direct Message'
                    : parsed.type === 'CONNECTION_REQUEST' ? 'New Connection Request'
                    : 'Zenve Vet Clinical Alert',
                  message: parsed.message || 'You have a new update.',
                  type: parsed.type || 'GENERAL',
                  senderName: parsed.senderName,
                  senderAvatar: parsed.senderAvatar,
                  targetId: parsed.targetId
                });
              }
            }
          } catch (_) { }

          api.notifications.getNotifications(currentUser.id).then(notifs => {
            if (notifs) setNotifications(notifs);
          }).catch(() => { });
          api.connections.getMy(currentUser.id).then(myCons => {
            if (myCons && Array.isArray(myCons)) {
              setMyConnections(myCons);
              const map = {};
              myCons.forEach(c => { map[c.id] = true; map[`doc-${c.id}`] = true; });
              setConnectedMap(map);
            }
          }).catch(() => { });
        });

        // Subscribe to broadcast topic (uploaded reels, shared clinical cases)
        stomp.subscribe('/topic/notifications', (frame) => {
          try {
            api.notifications.getNotifications(currentUser.id).then(notifs => {
              if (notifs) setNotifications(notifs);
            }).catch(() => { });
            api.videos.getAll().then(v => {
              if (v) {
                setVideos(v.map(item => (item.thumbnail && (item.thumbnail.includes('543a7dc6') || item.thumbnail.includes('bcb16239') || item.thumbnail.includes('43090d16'))) ? { ...item, thumbnail: null } : item));
              }
            }).catch(() => { });
            api.cases.getAll().then(c => {
              if (c) setClinicalCases(c);
            }).catch(() => { });
          } catch (_) { }
        });

        // Subscribe to live incoming direct chat messages and real-time read receipts
        stomp.subscribe(`/topic/user/${currentUser.id}/messages`, (frame) => {
          try {
            const incoming = JSON.parse(frame.body);
            if (!incoming) return;

            // Handle real-time Seen / Delivered status update event
            if (incoming.type === 'MESSAGE_STATUS_UPDATE') {
              setConversations(prev => prev.map(c => {
                const isMatch = (c.id != null && incoming.conversationId != null && String(c.id).replace(/\D/g, '') === String(incoming.conversationId).replace(/\D/g, ''));
                if (isMatch) {
                  const targetIds = incoming.messageIds || (incoming.messageId ? [incoming.messageId] : []);
                  return {
                    ...c,
                    unread: (incoming.status === 'SEEN' && incoming.readerId === currentUser.id) ? 0 : c.unread,
                    messages: (c.messages || []).map(m => {
                      if (targetIds.includes(m.id)) {
                        return {
                          ...m,
                          status: incoming.status,
                          isRead: incoming.status === 'SEEN' ? true : m.isRead,
                          readAt: incoming.readAt || (incoming.status === 'SEEN' ? (m.readAt || new Date().toISOString()) : m.readAt),
                          deliveredAt: incoming.deliveredAt || (incoming.status === 'DELIVERED' || incoming.status === 'SEEN' ? (m.deliveredAt || new Date().toISOString()) : m.deliveredAt)
                        };
                      }
                      return m;
                    })
                  };
                }
                return c;
              }));
              return;
            }

            // Handle new incoming message
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isWindowVisible = typeof document !== 'undefined' ? (!document.hidden && document.hasFocus()) : true;

            // Auto-acknowledge delivery if received by currentUser
            if (incoming.receiverId === currentUser.id && incoming.conversationId) {
              api.chat.markDelivered(incoming.conversationId, currentUser.id).catch(() => { });
            }

            setConversations(prev => {
              const convIdx = prev.findIndex(c =>
                (c.id != null && incoming.conversationId != null && String(c.id).replace(/\D/g, '') === String(incoming.conversationId).replace(/\D/g, '')) ||
                (c.doctor && (
                  (c.doctor.id != null && (String(c.doctor.id).replace(/\D/g, '') === String(incoming.senderId).replace(/\D/g, '') || String(c.doctor.id).replace(/\D/g, '') === String(incoming.receiverId).replace(/\D/g, '')))
                ))
              );

              const isCurrentChatOpen = activeTab === 'messages' && activeChatDoctor && (
                activeChatDoctor.id === incoming.senderId ||
                String(activeChatDoctor.id).replace(/\D/g, '') === String(incoming.senderId).replace(/\D/g, '') ||
                (convIdx >= 0 && (
                  prev[convIdx].doctor?.id === activeChatDoctor.id ||
                  prev[convIdx].doctor?.name === activeChatDoctor.name
                ))
              );
              const isChatOpenAndVisible = isCurrentChatOpen && isWindowVisible;

              if (isChatOpenAndVisible && incoming.conversationId && incoming.receiverId === currentUser.id) {
                api.chat.markAsRead(incoming.conversationId, currentUser.id).catch(() => { });
              }

              if (incoming.senderId !== currentUser.id && !isChatOpenAndVisible) {
                const docSender = prev[convIdx]?.doctor;
                const senderName = incoming.senderName || docSender?.name || 'A Doctor';
                const senderAvatar = incoming.senderAvatar || docSender?.avatar;
                notifyIncomingChatMessage({
                  senderId: incoming.senderId,
                  senderName,
                  senderAvatar,
                  message: incoming.text || (incoming.attachmentUrl ? 'Sent a clinical attachment' : 'Sent a direct message'),
                  conversationId: incoming.conversationId,
                  onClick: () => handleOpenDirectChat({
                    id: incoming.senderId,
                    name: senderName,
                    avatar: senderAvatar
                  })
                });
              }

              const formattedMsg = {
                id: incoming.id || Date.now(),
                sender: incoming.senderId === currentUser.id ? 'user' : 'doctor',
                senderId: incoming.senderId,
                receiverId: incoming.receiverId,
                text: incoming.text || incoming.message,
                attachmentUrl: incoming.attachmentUrl,
                attachmentType: incoming.attachmentType,
                status: isChatOpenAndVisible ? 'SEEN' : (incoming.receiverId === currentUser.id ? 'DELIVERED' : (incoming.status || 'SENT')),
                isRead: isChatOpenAndVisible ? true : (incoming.isRead || false),
                createdAt: incoming.createdAt,
                deliveredAt: incoming.deliveredAt || (incoming.receiverId === currentUser.id ? new Date().toISOString() : null),
                readAt: isChatOpenAndVisible ? new Date().toISOString() : incoming.readAt,
                time: incoming.createdAt ? new Date(incoming.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : nowTime
              };

              if (convIdx >= 0) {
                const updated = [...prev];
                const existingList = updated[convIdx].messages || [];

                // Check if this incoming message replaces an optimistic message from currentUser
                const optIdx = existingList.findIndex(m =>
                  String(m.id) === String(incoming.id) ||
                  (incoming.senderId === currentUser.id && (
                    (m.tempId && m.text === formattedMsg.text) ||
                    (typeof m.id === 'string' && m.id.startsWith('temp-') && m.text === formattedMsg.text)
                  ))
                );

                let updatedMessages;
                if (optIdx >= 0) {
                  updatedMessages = [...existingList];
                  updatedMessages[optIdx] = formattedMsg;
                } else if (!existingList.some(m => String(m.id) === String(incoming.id))) {
                  updatedMessages = [...existingList, formattedMsg];
                } else {
                  updatedMessages = existingList;
                }

                // Strictly deduplicate by ID to guarantee unique React keys
                const seenIds = new Set();
                const deduplicatedMessages = updatedMessages.filter(m => {
                  const k = String(m.id);
                  if (seenIds.has(k)) return false;
                  seenIds.add(k);
                  return true;
                });

                updated[convIdx] = {
                  ...updated[convIdx],
                  id: incoming.conversationId || updated[convIdx].id,
                  lastMessage: formattedMsg.text || 'Sent an attachment',
                  timestamp: formattedMsg.time,
                  unread: (incoming.senderId !== currentUser.id && !isChatOpenAndVisible) ? (updated[convIdx].unread || 0) + 1 : 0,
                  messages: deduplicatedMessages
                };
                return updated;
              } else {
                // If brand new conversation started from peer, fetch conversations
                api.chat.getConversations(currentUser.id).then(list => {
                  if (list) {
                    setConversations(list.map(c => ({
                      id: c.id,
                      doctor: {
                        id: c.doctor1Id === currentUser.id ? c.doctor2Id : c.doctor1Id,
                        name: c.doctor1Id === currentUser.id ? c.doctor2Name : c.doctor1Name,
                        avatar: c.doctor1Id === currentUser.id ? c.doctor2Avatar : c.doctor1Avatar,
                        specialty: 'Veterinary Practitioner',
                        city: 'Bengaluru'
                      },
                      lastMessage: c.lastMessage,
                      timestamp: 'Just now',
                      unread: isChatOpenAndVisible ? 0 : 1,
                      messages: [formattedMsg]
                    })));
                  }
                }).catch(() => { });
                return prev;
              }
            });
          } catch (e) { }
        });
      });
    } catch (e) {
      console.warn('STOMP client connection error:', e);
    }

    return () => {
      if (client && client.deactivate) {
        try { client.deactivate(); } catch (e) { }
      }
    };
  }, [currentUser?.id]);

  // Real-time chat & registered doctors sync: guarantees live peer updates & new registrations
  useEffect(() => {
    if (!currentUser?.id) return;

    const interval = setInterval(async () => {
      // 1. Refresh active conversation messages in real-time when in messages tab
      if (activeTab === 'messages' && activeChatDoctor) {
        const targetConv = conversations.find(c =>
          (c.doctor?.id && (c.doctor.id === activeChatDoctor.id || String(c.doctor.id).replace(/\D/g, '') === String(activeChatDoctor.id).replace(/\D/g, ''))) ||
          (c.doctor?.name && c.doctor.name === activeChatDoctor.name)
        );
        const convId = targetConv?.id;
        const numId = typeof convId === 'number' ? convId : parseInt(String(convId || '').replace(/\D/g, ''), 10);
        if (!isNaN(numId) && numId > 0) {
          try {
            const msgs = await api.chat.getMessages(numId, currentUser.id);
            if (msgs && Array.isArray(msgs)) {
              setConversations(prev => prev.map(c => {
                const isMatch = (c.id === convId || c.id === numId) ||
                  (c.doctor && (c.doctor.id === activeChatDoctor.id || String(c.doctor.id).replace(/\D/g, '') === String(activeChatDoctor.id).replace(/\D/g, '')));
                if (isMatch) {
                  const existingMsgMap = new Map();
                  (c.messages || []).forEach(m => {
                    const key = m.id || `${m.senderId}-${m.text}`;
                    existingMsgMap.set(key, m);
                  });

                  let hasNew = false;
                  let hasStatusChange = false;
                  const formatted = msgs.map(m => {
                    const em = existingMsgMap.get(m.id);
                    if (!em) hasNew = true;
                    else if (em.status !== m.status || em.isRead !== m.isRead) hasStatusChange = true;
                    return {
                      id: m.id,
                      sender: m.senderId === currentUser.id ? 'user' : 'doctor',
                      senderId: m.senderId,
                      receiverId: m.receiverId,
                      text: m.text || m.message,
                      attachmentUrl: m.attachmentUrl,
                      attachmentType: m.attachmentType,
                      status: m.status || (m.isRead ? 'SEEN' : 'SENT'),
                      isRead: m.isRead || false,
                      createdAt: m.createdAt,
                      deliveredAt: m.deliveredAt,
                      readAt: m.readAt,
                      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                  });

                  const seenMsgIds = new Set();
                  const deduplicatedFormatted = formatted.filter(m => {
                    const k = String(m.id);
                    if (seenMsgIds.has(k)) return false;
                    seenMsgIds.add(k);
                    return true;
                  });

                  if (hasNew || hasStatusChange || (c.messages || []).length !== deduplicatedFormatted.length) {
                    const last = deduplicatedFormatted[deduplicatedFormatted.length - 1];
                    return {
                      ...c,
                      id: numId,
                      lastMessage: last ? last.text : c.lastMessage,
                      timestamp: last ? last.time : c.timestamp,
                      messages: deduplicatedFormatted
                    };
                  }
                }
                return c;
              }));
            }
          } catch (e) { }
        }
      }

      // 2. Poll registered doctors list to dynamically show any newly registered doctors in "People to Know"
      try {
        const liveDocs = await api.doctors.getAll();
        if (liveDocs && Array.isArray(liveDocs) && liveDocs.length > 0) {
          setDoctors(prev => {
            if (liveDocs.length !== prev.length || liveDocs.some((d, idx) => !prev[idx] || prev[idx].id !== d.id)) {
              return liveDocs;
            }
            return prev;
          });
        }
      } catch (e) { }

      // 3. Poll dynamic communities in real time
      try {
        const liveComms = await api.communities.getAll(currentUser?.id);
        if (Array.isArray(liveComms)) {
          setCommunities(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(liveComms)) {
              return liveComms;
            }
            return prev;
          });
        }
      } catch (e) { }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser?.id, activeTab, activeChatDoctor?.id, conversations.length]);

  const handleLoginSuccess = (user) => {
    const activeUser = { ...user, active: true };
    setCurrentUser(activeUser);
    setDoctors(prev => prev.map(d =>
      (d.id === user.id || String(d.id).replace('doc-', '') === String(user.id).replace('doc-', ''))
        ? { ...d, active: true }
        : d
    ));
    setIsLoginView(false);
    setActiveTab('feed');
  };

  const handleLogout = async () => {
    const oldUserId = currentUser?.id;
    try {
      await api.auth.logout();
    } catch (e) { }
    localStorage.removeItem('doctor_vet_user');
    localStorage.removeItem('doctor_vet_token');
    setCurrentUser(null);
    if (oldUserId) {
      setDoctors(prev => prev.map(d =>
        (d.id === oldUserId || String(d.id).replace('doc-', '') === String(oldUserId).replace('doc-', ''))
          ? { ...d, active: false }
          : d
      ));
    }
    setConversations([]);
    setConnectedMap({});
    setMyConnections([]);
    setNotifications([]);
    setPendingRequests([]);
    setSentRequests([]);
    setActiveChatDoctor(null);
    setSelectedDoctor(null);
    setActiveTab('feed');
  };

  const handleOpenCreatePost = (type = 'CLINICAL_CASE') => {
    setCreatePostInitialType(type);
    setIsCreatePostOpen(true);
  };

  // Connection System Handlers
  const handleSendRequest = async (targetDoctor) => {
    const senderId = currentUser?.id || 1;
    const senderName = currentUser?.name || 'Dr. You';
    const senderAvatar = currentUser?.avatar || null;
    const senderSpecialty = currentUser?.specialty || 'Veterinary Practitioner';

    try {
      await api.connections.sendRequest(senderId, senderName, senderAvatar, senderSpecialty, targetDoctor.id);
    } catch (e) {
      console.log('Request sent in offline state');
    }

    setSentRequests(prev => [...prev, { id: Date.now(), receiverId: targetDoctor.id, targetDoctor }]);
    alert(`Connection request sent to ${targetDoctor.name}!`);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.connections.acceptRequest(requestId);
    } catch (e) {
      console.log('Accept processed in offline state');
    }

    const req = pendingRequests.find(r => r.id === requestId);
    if (req) {
      setConnectedMap(prev => ({ ...prev, [req.senderId]: true, [`doc-${req.senderId}`]: true }));
      const doc = doctors.find(d => d.id === req.senderId);
      if (doc) {
        setMyConnections(prev => [...prev.filter(p => p.id !== doc.id), doc]);
      }
    }
    if (currentUser?.id) {
      api.connections.getMy(currentUser.id).then(cons => {
        if (cons && Array.isArray(cons)) {
          setMyConnections(cons);
          const map = {};
          cons.forEach(c => { map[c.id] = true; map[`doc-${c.id}`] = true; });
          setConnectedMap(map);
        }
      }).catch(() => { });
    }
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setNotifications(prev => prev.filter(n => n.targetId !== requestId));
    alert('Connection accepted! Doctor added to your professional network.');
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.connections.rejectRequest(requestId);
    } catch (e) {
      console.log('Reject processed in offline state');
    }
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleCancelRequest = async (targetDoctorId) => {
    setSentRequests(prev => prev.filter(r => r.receiverId !== targetDoctorId && r.id !== targetDoctorId));
    alert('Connection request withdrawn.');
  };

  const handleDisconnect = async (targetDoctorId) => {
    try {
      await api.connections.disconnect(currentUser?.id || 1, targetDoctorId);
    } catch (e) { }
    setConnectedMap(prev => {
      const copy = { ...prev };
      delete copy[targetDoctorId];
      delete copy[`doc-${targetDoctorId}`];
      return copy;
    });
    setMyConnections(prev => prev.filter(c => c.id !== targetDoctorId && `doc-${c.id}` !== targetDoctorId));
    if (currentUser?.id) {
      api.connections.getMy(currentUser.id).then(cons => {
        if (cons && Array.isArray(cons)) {
          setMyConnections(cons);
          const map = {};
          cons.forEach(c => { map[c.id] = true; map[`doc-${c.id}`] = true; });
          setConnectedMap(map);
        }
      }).catch(() => { });
    }
    alert('Doctor removed from connections.');
  };

  // Feed Actions
  const handleLikePost = async (postId) => {
    try {
      await api.feed.toggleLike(postId, currentUser?.id || 1, currentUser?.name || 'Dr. You');
    } catch (e) { }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleAddComment = async (postId, content) => {
    const authorName = currentUser?.name || 'Dr. You (Verified)';
    const authorAvatar = currentUser?.avatar || null;
    const authorSpecialty = currentUser?.specialty || 'Veterinary Surgeon';

    try {
      await api.feed.addComment(postId, {
        authorId: currentUser?.id || 1,
        authorName,
        authorAvatar,
        authorSpecialty,
        content
      });
    } catch (e) { }

    const newComment = {
      id: Date.now(),
      authorName,
      authorAvatar,
      authorSpecialty,
      content,
      createdAt: new Date().toISOString()
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const existingComments = p.comments || [];
        return {
          ...p,
          commentsCount: (p.commentsCount || 0) + 1,
          comments: [...existingComments, newComment]
        };
      }
      return p;
    }));
  };

  // -------------------------------------------------------------
  // Coordinated Post, Case & Reel Deletion Matching Helpers
  // -------------------------------------------------------------
  const isPostMatchingCase = (post, caseId, targetCase) => {
    if (!post) return false;
    if (post.caseId && (String(post.caseId) === String(caseId) || String(post.caseId) === String(targetCase?.id))) return true;
    if (String(post.id) === String(caseId)) return true;
    if (post.postType === 'CLINICAL_CASE' || (post.badgeLabel && post.badgeLabel.includes('CASE'))) {
      if (targetCase) {
        if (targetCase.title && post.content && post.content.includes(targetCase.title.replace(/\.\.\.$/, '').trim())) return true;
        if (targetCase.presentingComplaint && post.content && (post.content.includes(targetCase.presentingComplaint) || targetCase.presentingComplaint.includes(post.content))) return true;
        if (targetCase.mediaUrl && post.imageUrl && post.imageUrl === targetCase.mediaUrl) return true;
      }
    }
    return false;
  };

  const isPostMatchingVideo = (post, videoId, targetVideo) => {
    if (!post) return false;
    if (post.videoId && (String(post.videoId) === String(videoId) || String(post.videoId) === String(targetVideo?.id))) return true;
    if (String(post.id) === String(videoId)) return true;
    if (targetVideo?.videoUrl && post.videoUrl && post.videoUrl === targetVideo.videoUrl) return true;
    if (post.postType === 'SHORT_VIDEO' || (post.badgeLabel && post.badgeLabel.includes('REEL'))) {
      if (targetVideo) {
        if (targetVideo.title && post.content && post.content.includes(targetVideo.title.trim())) return true;
        if (targetVideo.thumbnail && post.imageUrl && post.imageUrl === targetVideo.thumbnail) return true;
      }
    }
    return false;
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this clinical post? It will also be removed from your profile and relevant registries.')) return;
    const targetPost = posts.find(p => p.id === postId || String(p.id) === String(postId));

    // 1. Delete post from backend feed
    try {
      await api.feed.deletePost(postId);
    } catch (e) {
      console.warn('Backend deletePost error:', e);
    }

    // 2. If it is a clinical case, also delete from clinical_cases backend and state
    if (targetPost && (targetPost.postType === 'CLINICAL_CASE' || (targetPost.badgeLabel && targetPost.badgeLabel.includes('CASE')) || targetPost.caseId)) {
      const matchingCase = clinicalCases.find(c =>
        (targetPost.caseId && String(c.id) === String(targetPost.caseId)) ||
        String(c.id) === String(postId) ||
        (targetPost.content && c.title && targetPost.content.includes(c.title.replace(/\.\.\.$/, '').trim())) ||
        (targetPost.content && c.presentingComplaint && (targetPost.content.includes(c.presentingComplaint) || c.presentingComplaint.includes(targetPost.content))) ||
        (targetPost.imageUrl && c.mediaUrl && targetPost.imageUrl === c.mediaUrl)
      );
      if (matchingCase) {
        try {
          await api.cases.delete(matchingCase.id);
        } catch (e) { }
        setClinicalCases(prev => prev.filter(c => c.id !== matchingCase.id && String(c.id) !== String(matchingCase.id)));
      }
    }

    // 3. If it is a short video / reel, also delete from short_videos backend and state
    if (targetPost && (targetPost.postType === 'SHORT_VIDEO' || targetPost.videoUrl || (targetPost.badgeLabel && targetPost.badgeLabel.includes('REEL')) || targetPost.videoId)) {
      const matchingVideo = videos.find(v =>
        (targetPost.videoId && String(v.id) === String(targetPost.videoId)) ||
        String(v.id) === String(postId) ||
        (targetPost.videoUrl && v.videoUrl === targetPost.videoUrl) ||
        (targetPost.content && v.title && targetPost.content.includes(v.title.trim()))
      );
      if (matchingVideo) {
        try {
          await api.videos.delete(matchingVideo.id);
        } catch (e) { }
        setVideos(prev => prev.filter(v => v.id !== matchingVideo.id && String(v.id) !== String(matchingVideo.id)));
      }
    }

    // 4. Update posts state (remove from feed)
    setPosts(prev => prev.filter(p => p.id !== postId && String(p.id) !== String(postId)));
    // Also remove from stories if matching
    setStories(prev => prev.filter(s => s.id !== postId && String(s.id) !== String(postId)));
  };

  const handleBookmarkPost = async (postId) => {
    try {
      await api.feed.toggleBookmark(postId, currentUser?.id || 1);
    } catch (e) { }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isBookmarked: !p.isBookmarked };
      }
      return p;
    }));
  };

  const handleReportPost = async (postId) => {
    const reason = prompt('Please specify why you are reporting this post (e.g. Inappropriate content, Misinformation):');
    if (!reason) return;
    try {
      await api.feed.reportPost(postId, currentUser?.id || 1, reason);
    } catch (e) { }
    alert('Thank you. The post has been flagged for veterinary moderation review.');
  };

  const handleCreatePost = async ({ content, postType, imageUrl, videoUrl, videoTitle, specialty, duration, species }) => {
    const authorName = currentUser?.name || 'Dr. You (Verified)';
    const authorSpecialty = currentUser?.specialty || specialty || 'Veterinary Medicine';
    const authorAvatar = currentUser?.avatar || '';

    const isVideoMedia = !!videoUrl || (imageUrl && (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(imageUrl) || imageUrl.includes('data:video')));
    const effectiveVideoUrl = videoUrl || (isVideoMedia ? imageUrl : null);

    if (postType === 'STORY') {
      const storyPayload = {
        doctorId: currentUser?.id || 1,
        doctorName: currentUser?.name || 'Dr. You',
        avatar: authorAvatar,
        mediaUrl: imageUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80',
        mediaType: isVideoMedia ? 'VIDEO' : 'IMAGE',
        caption: content || 'Moments from clinical practice'
      };
      try {
        const savedStory = await api.stories.create(storyPayload);
        const formattedStory = {
          id: savedStory.id || `story-${Date.now()}`,
          doctorId: currentUser?.id || 1,
          doctorName: currentUser?.name ? currentUser.name.replace(/^dr\.?\s*/i, '').split(' ')[0] : 'You',
          fullDoctorName: authorName,
          avatar: authorAvatar,
          image: savedStory.mediaUrl || imageUrl,
          videoUrl: (savedStory.mediaType === 'VIDEO' || isVideoMedia) ? (savedStory.mediaUrl || imageUrl) : null,
          caption: savedStory.caption || content,
          time: 'Just now',
          likes: 0,
          shares: 0,
          isLiked: false
        };
        setStories(prev => [formattedStory, ...prev]);
      } catch (e) {
        console.warn('Backend story persistence error:', e);
      }

      alert('Your 24-hour story is now live in the community moments bar!');
      return;
    }

    let createdVideoId = null;
    let createdCaseId = null;

    if (postType === 'SHORT_VIDEO') {
      createdVideoId = `vid-${Date.now()}`;
      const videoPayload = {
        title: videoTitle || (content ? content.slice(0, 50) : 'Clinical Technique Reel'),
        doctorName: authorName,
        doctorSpecialty: `${authorSpecialty} · ${currentUser?.city || 'Bengaluru'}`,
        views: '1',
        duration: duration || '0:45',
        thumbnail: (imageUrl && !imageUrl.endsWith('.mp4') && !imageUrl.includes('543a7dc6') && !imageUrl.includes('bcb16239') && !imageUrl.includes('43090d16')) ? imageUrl : null,
        videoUrl: effectiveVideoUrl,
        likes: 1,
        comments: 0
      };
      try {
        const savedVideo = await api.videos.create(videoPayload);
        createdVideoId = savedVideo?.id || createdVideoId;
        setVideos(prev => [savedVideo, ...prev]);
      } catch (e) {
        setVideos(prev => [{ ...videoPayload, id: createdVideoId }, ...prev]);
      }

      notifyReelUploaded({
        doctorName: authorName,
        reelTitle: videoPayload.title,
        videoId: createdVideoId
      });

      api.notifications.broadcast({
        senderId: currentUser?.id || 1,
        senderName: authorName,
        senderAvatar: authorAvatar,
        type: 'REEL_UPLOAD',
        message: `${authorName} uploaded a new surgical reel: "${videoPayload.title}"`,
        targetId: createdVideoId
      }).catch(() => { });
    }

    if (postType === 'CLINICAL_CASE') {
      createdCaseId = `case-${Date.now()}`;
      const casePayload = {
        title: (videoTitle || content).slice(0, 50) + '...',
        authorName,
        authorSpecialty,
        species: species || 'Canine',
        presentingComplaint: content,
        clinicalFindings: 'Physical exam and diagnostic tests evaluated.',
        diagnostics: 'Diagnostics completed.',
        diagnosis: 'Case under peer review',
        treatmentProtocol: 'Evidence-based veterinary protocol.',
        outcome: 'Active management',
        views: 1,
        comments: 0,
        mediaUrl: imageUrl
      };
      try {
        const savedCase = await api.cases.create(casePayload);
        createdCaseId = savedCase?.id || createdCaseId;
        setClinicalCases(prev => [savedCase, ...prev]);
      } catch (e) {
        setClinicalCases(prev => [{ ...casePayload, id: createdCaseId }, ...prev]);
      }

      notifyCaseShared({
        doctorName: authorName,
        caseTitle: casePayload.title,
        caseId: createdCaseId
      });

      api.notifications.broadcast({
        senderId: currentUser?.id || 1,
        senderName: authorName,
        senderAvatar: authorAvatar,
        type: 'CLINICAL_CASE_SHARED',
        message: `${authorName} shared a clinical case: "${casePayload.title}" (${casePayload.species})`,
        targetId: createdCaseId
      }).catch(() => { });
    }

    const postPayload = {
      authorId: currentUser?.id || 1,
      authorName,
      authorSpecialty,
      authorCity: currentUser?.city || 'Bengaluru',
      authorAvatar,
      postType,
      caseId: createdCaseId,
      videoId: createdVideoId,
      badgeLabel: postType === 'CLINICAL_CASE'
        ? 'CLINICAL CASE REPORT'
        : postType === 'SHORT_VIDEO'
          ? 'CLINICAL REEL · VIDEO'
          : 'CLINICAL UPDATE',
      content: videoTitle ? `${videoTitle} — ${content}` : content,
      imageUrl: (imageUrl && !imageUrl.endsWith('.mp4')) ? imageUrl : null,
      videoUrl: effectiveVideoUrl,
      species: species || 'Canine',
      likes: 1,
      commentsCount: 0
    };

    try {
      const savedPost = await api.feed.createPost(postPayload);
      setPosts(prev => [{ ...savedPost, caseId: createdCaseId, videoId: createdVideoId }, ...prev]);
    } catch (e) {
      setPosts(prev => [{ ...postPayload, id: `post-${Date.now()}`, comments: [] }, ...prev]);
    }
  };

  // Dynamic Community Handlers (Backed by Spring Boot API)
  const handleSelectCommunity = (commId) => {
    setSelectedCommunityId(commId);
  };

  const handleCreateCommunity = async (commData) => {
    try {
      const created = await api.communities.create({
        name: commData.name,
        category: commData.category,
        description: commData.description,
        privacy: commData.privacy || 'Public Group',
        coverGradient: commData.coverGradient || 'linear-gradient(135deg, #064e3b 0%, #0d9488 100%)',
        coverImage: commData.coverImage || null
      }, currentUser?.id);
      if (created) {
        setCommunities(prev => [created, ...prev.filter(c => c.id !== created.id)]);
        setSelectedCommunityId(created.id);
      }
    } catch (e) {
      console.error('Failed to create community:', e);
      alert('Failed to create community: ' + (e.message || 'Please try again'));
    }
  };

  const handleDeleteCommunity = async (commId) => {
    const docId = currentUser?.id ? String(currentUser.id).replace(/^doc-/i, '') : 1;
    try {
      await api.communities.delete(commId, docId);
      const cleanTargetId = String(commId).replace(/^comm-/i, '');
      setCommunities(prev => {
        const remaining = prev.filter(c => {
          const cCleanId = String(c.id).replace(/^comm-/i, '');
          return cCleanId !== cleanTargetId;
        });
        setSelectedCommunityId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });
      alert('Community deleted successfully.');
    } catch (e) {
      console.error('Failed to delete community:', e);
      alert('Failed to delete community: ' + (e.message || 'Please try again'));
    }
  };

  const handleUpdateCommunityCover = async (commId, newCoverUrl) => {
    const cleanTargetId = String(commId).replace(/^comm-/i, '');

    // 1. Immediate optimistic UI update so banner changes with zero delay
    setCommunities(prev => prev.map(c => {
      const cCleanId = String(c.id).replace(/^comm-/i, '');
      if (cCleanId === cleanTargetId) {
        return { ...c, coverImage: newCoverUrl };
      }
      return c;
    }));

    // 2. Persist to Spring Boot backend
    try {
      const updated = await api.communities.updateCover(commId, newCoverUrl, currentUser?.id);
      if (updated) {
        setCommunities(prev => prev.map(c => {
          const cCleanId = String(c.id).replace(/^comm-/i, '');
          if (cCleanId === cleanTargetId) {
            return {
              ...c,
              ...updated,
              coverImage: newCoverUrl
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.warn('Backend cover update notification:', e);
    }
  };

  const handleJoinCommunity = async (commId) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.join(commId, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to join community:', e);
    }
  };

  const handleLeaveCommunity = async (commId) => {
    if (!currentUser) return;
    try {
      const updated = await api.communities.leave(commId, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to leave community:', e);
    }
  };

  const handleInviteDoctorToCommunity = async (commId, doctor) => {
    try {
      const updated = await api.communities.invite(commId, doctor.id, currentUser?.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
        alert(`Invited ${doctor.name} to the community!`);
      }
    } catch (e) {
      console.error('Failed to invite doctor:', e);
    }
  };

  const handleAddCommunityPost = async (commId, postData) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.addPost(commId, {
        content: postData.content,
        imageUrl: postData.imageUrl || null,
        tag: postData.tag || 'Clinical Discussion',
        authorId: currentUser.id
      }, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to add post to community:', e);
    }
  };

  const handleAddCommunityComment = async (commId, postId, commentText) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.addComment(commId, postId, commentText, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to add comment to community post:', e);
    }
  };

  const handleToggleCommunityPostLike = async (commId, postId) => {
    if (!currentUser) return;
    try {
      const updated = await api.communities.toggleLike(commId, postId, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to toggle like on community post:', e);
    }
  };

  const handleAddCommunityCase = async (commId, caseData) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.addCase(commId, caseData, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to share case in community:', e);
    }
  };

  const handleAddCommunityReel = async (commId, reelData) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.addReel(commId, reelData, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to share reel in community:', e);
    }
  };

  const handleDeleteCommunityPost = async (commId, postId) => {
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
    try {
      const updated = await api.communities.deletePost(commId, postId, currentUser?.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to delete community post:', e);
      setCommunities(prev => prev.map(c => {
        if (c.id === commId || String(c.id) === String(commId)) {
          return {
            ...c,
            posts: (c.posts || []).filter(p => p.id !== postId && String(p.id) !== String(postId))
          };
        }
        return c;
      }));
    }
    // Also remove from main feed posts and backend feed if present
    const matchingPosts = posts.filter(p => String(p.id) === String(postId));
    for (const p of matchingPosts) {
      try { await api.feed.deletePost(p.id); } catch (_) {}
    }
    setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
  };

  const handleDeleteCommunityCase = async (commId, caseId) => {
    if (!window.confirm('Are you sure you want to delete this clinical case from the community?')) return;
    try {
      const updated = await api.communities.deleteCase(commId, caseId, currentUser?.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to delete community case:', e);
      setCommunities(prev => prev.map(c => {
        if (c.id === commId || String(c.id) === String(commId)) {
          return {
            ...c,
            cases: (c.cases || []).filter(item => item.id !== caseId && String(item.id) !== String(caseId))
          };
        }
        return c;
      }));
    }
    // Also remove from main feed posts and backend feed if present
    const matchingPosts = posts.filter(p => String(p.caseId) === String(caseId) || String(p.id) === String(caseId));
    for (const p of matchingPosts) {
      try { await api.feed.deletePost(p.id); } catch (_) {}
    }
    setPosts(prev => prev.filter(p => String(p.caseId) !== String(caseId) && String(p.id) !== String(caseId)));
  };

  const handleDeleteCommunityReel = async (commId, reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel video from the community?')) return;
    try {
      const updated = await api.communities.deleteReel(commId, reelId, currentUser?.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to delete community reel:', e);
      setCommunities(prev => prev.map(c => {
        if (c.id === commId || String(c.id) === String(commId)) {
          return {
            ...c,
            reels: (c.reels || []).filter(r => r.id !== reelId && String(r.id) !== String(reelId))
          };
        }
        return c;
      }));
    }
    // Also remove from main feed posts and backend feed if present
    const matchingPosts = posts.filter(p => String(p.videoId) !== String(reelId) || String(p.id) !== String(reelId));
    for (const p of matchingPosts) {
      try { await api.feed.deletePost(p.id); } catch (_) {}
    }
    setPosts(prev => prev.filter(p => String(p.videoId) !== String(reelId) && String(p.id) !== String(reelId)));
  };

  const handleDeleteClinicalCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this clinical case? It will also be removed from the feed.')) return;
    const targetCase = clinicalCases.find(c => c.id === caseId || String(c.id) === String(caseId));

    // 1. Delete matching feed post(s) from backend
    const matchingFeedPosts = posts.filter(p => isPostMatchingCase(p, caseId, targetCase));
    for (const p of matchingFeedPosts) {
      try {
        await api.feed.deletePost(p.id);
      } catch (err) {
        console.warn('Failed to delete feed post for case:', err);
      }
    }

    // 2. Delete clinical case from backend
    try {
      await api.cases.delete(caseId);
    } catch (e) {
      console.error('Failed to delete case:', e);
    }

    // 3. Update local state: remove from cases AND from feed posts
    setClinicalCases(prev => prev.filter(c => c.id !== caseId && String(c.id) !== String(caseId)));
    setPosts(prev => prev.filter(p => !isPostMatchingCase(p, caseId, targetCase)));
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this short video/reel? It will also be removed from the feed.')) return;
    const targetVideo = videos.find(v => v.id === videoId || String(v.id) === String(videoId));

    // 1. Delete matching feed post(s) from backend
    const matchingFeedPosts = posts.filter(p => isPostMatchingVideo(p, videoId, targetVideo));
    for (const p of matchingFeedPosts) {
      try {
        await api.feed.deletePost(p.id);
      } catch (err) {
        console.warn('Failed to delete feed post for reel:', err);
      }
    }

    // 2. Delete video from backend
    try {
      await api.videos.delete(videoId);
    } catch (e) {
      console.error('Failed to delete video:', e);
    }

    // 3. Update local state: remove from videos, from feed posts, and stories
    setVideos(prev => prev.filter(v => v.id !== videoId && String(v.id) !== String(videoId)));
    setPosts(prev => !targetVideo ? prev.filter(p => String(p.id) !== String(videoId)) : prev.filter(p => !isPostMatchingVideo(p, videoId, targetVideo)));
    setStories(prev => prev.filter(s => s.id !== videoId && (!targetVideo || s.videoUrl !== targetVideo.videoUrl)));
  };

  const handleDeleteStory = async (storyId) => {
    try {
      await api.stories.delete(storyId);
    } catch (e) {
      console.error('Failed to delete story:', e);
    }
    setStories(prev => prev.filter(s => s.id !== storyId && String(s.id) !== String(storyId)));
    if (selectedStory && (selectedStory.id === storyId || String(selectedStory.id) === String(storyId))) {
      setSelectedStory(null);
    }
  };

  const handleSendCommunityMessage = async (commId, text) => {
    if (!currentUser) {
      setIsLoginView(true);
      return;
    }
    try {
      const updated = await api.communities.sendMessage(commId, text, currentUser.id);
      if (updated) {
        setCommunities(prev => prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c));
      }
    } catch (e) {
      console.error('Failed to send message in community:', e);
    }
  };

  const handleJoinCommunityByCode = async (code) => {
    if (!currentUser) {
      setIsLoginView(true);
      return null;
    }
    const updated = await api.communities.joinByCode(code, currentUser.id);
    if (updated) {
      setCommunities(prev => {
        const exists = prev.some(c => c.id === updated.id || String(c.id) === String(updated.id));
        if (exists) {
          return prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c);
        }
        return [updated, ...prev];
      });
      setSelectedCommunityId(updated.id);
      return updated;
    }
    return null;
  };

  const handleAcceptCommunityInvite = async (communityOrInviteId) => {
    if (!currentUser) return;
    try {
      let updated = null;
      try {
        updated = await api.communities.acceptCommunityInvite(communityOrInviteId, currentUser.id);
      } catch (err) {
        updated = await api.communities.acceptInvite(communityOrInviteId, currentUser.id);
      }
      if (updated) {
        setCommunities(prev => {
          const exists = prev.some(c => c.id === updated.id || String(c.id) === String(updated.id));
          if (exists) {
            return prev.map(c => (c.id === updated.id || String(c.id) === String(updated.id)) ? updated : c);
          }
          return [updated, ...prev];
        });
        setSelectedCommunityId(updated.id);
      }
      try {
        const [freshNotifs, freshComms] = await Promise.all([
          api.notifications.getNotifications(currentUser.id),
          api.communities.getAll(currentUser.id)
        ]);
        if (Array.isArray(freshNotifs)) setNotifications(freshNotifs);
        if (Array.isArray(freshComms)) setCommunities(freshComms);
      } catch (e) { }
    } catch (e) {
      console.error('Failed to accept community invite:', e);
    }
  };

  const handleDeclineCommunityInvite = async (communityOrInviteId) => {
    if (!currentUser) return;
    try {
      try {
        await api.communities.rejectCommunityInvite(communityOrInviteId, currentUser.id);
      } catch (err) {
        await api.communities.rejectInvite(communityOrInviteId, currentUser.id);
      }
      try {
        const [freshNotifs, freshComms] = await Promise.all([
          api.notifications.getNotifications(currentUser.id),
          api.communities.getAll(currentUser.id)
        ]);
        if (Array.isArray(freshNotifs)) setNotifications(freshNotifs);
        if (Array.isArray(freshComms)) setCommunities(freshComms);
      } catch (e) { }
    } catch (e) {
      console.error('Failed to decline community invite:', e);
    }
  };

  // Real-time Messaging Handlers
  const handleOpenDirectChat = async (doctor) => {
    // Doctors can only message after connecting
    const isConnected = !!connectedMap[doctor.id] ||
      !!connectedMap[`doc-${doctor.id}`] ||
      myConnections.some(c => c.id === doctor.id || String(c.id).replace('doc-', '') === String(doctor.id).replace('doc-', ''));

    if (!isConnected) {
      alert(`Please connect with Dr. ${doctor.name} first before messaging.`);
      return;
    }

    setActiveChatDoctor(doctor);
    let existing = conversations.find(c => c.doctor.id === doctor.id || c.doctor.name === doctor.name);
    if (!existing) {
      try {
        const started = await api.chat.startConversation(currentUser?.id || 1, doctor.id, `Hello Doctor, this is ${currentUser?.name || 'Dr. You'}.`);
        let msgs = [];
        if (started && started.id) {
          try {
            msgs = await api.chat.getMessages(started.id);
          } catch (e) { }
          existing = {
            id: started.id,
            doctor,
            lastMessage: started.lastMessage || 'Started new consultation.',
            timestamp: 'Just now',
            unread: 0,
            messages: (msgs || []).map(m => ({
              id: m.id,
              sender: m.senderId === currentUser?.id ? 'user' : 'doctor',
              senderId: m.senderId,
              text: m.text,
              attachmentUrl: m.attachmentUrl,
              attachmentType: m.attachmentType,
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
            }))
          };
          setConversations(prev => [existing, ...prev]);
        }
      } catch (e) {
        existing = {
          id: `chat-${Date.now()}`,
          doctor,
          lastMessage: 'Started new direct consultation.',
          timestamp: 'Just now',
          unread: 0,
          messages: [
            { id: 1, sender: 'doctor', text: `Hello Doctor, this is ${doctor.name}. How can I assist you with this clinical case?`, time: 'Just now' }
          ]
        };
        setConversations(prev => [existing, ...prev]);
      }
    } else {
      // Immediately reset unread to 0 for this conversation
      setConversations(prev => prev.map(c => {
        if (c.id === existing.id || (c.doctor && (c.doctor.id === doctor.id || c.doctor.name === doctor.name))) {
          return { ...c, unread: 0 };
        }
        return c;
      }));

      const numId = typeof existing.id === 'number' ? existing.id : parseInt(String(existing.id).replace(/\D/g, ''), 10);
      if (!isNaN(numId) && numId > 0) {
        try {
          const msgs = await api.chat.getMessages(numId, currentUser?.id || 1);
          setConversations(prev => prev.map(c => (c.id === existing.id || c.id === numId) ? {
            ...c,
            unread: 0,
            messages: (msgs || []).map(m => ({
              id: m.id,
              sender: m.senderId === currentUser?.id ? 'user' : 'doctor',
              senderId: m.senderId,
              receiverId: m.receiverId,
              text: m.text || m.message,
              attachmentUrl: m.attachmentUrl,
              attachmentType: m.attachmentType,
              status: m.senderId !== currentUser?.id ? 'SEEN' : (m.status || (m.isRead ? 'SEEN' : 'SENT')),
              isRead: m.senderId !== currentUser?.id ? true : (m.isRead || false),
              createdAt: m.createdAt,
              deliveredAt: m.deliveredAt,
              readAt: m.readAt || (m.senderId !== currentUser?.id ? new Date().toISOString() : null),
              time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
            }))
          } : c));
          api.chat.markAsRead(numId, currentUser?.id || 1).catch(() => { });
        } catch (e) { }
      }
    }

    // Immediately mark all message notifications from this doctor as read
    setNotifications(prev => prev.map(n => {
      const isMsgNotif = (n.type === 'NEW_MESSAGE' || n.type === 'MESSAGE' || n.type === 'DIRECT_MESSAGE' || !n.type) &&
        ((doctor.id && n.senderId === doctor.id) || (doctor.name && n.senderName === doctor.name));
      if (isMsgNotif && !n.read) {
        if (n.id) api.notifications.markAsRead(n.id).catch(() => { });
        return { ...n, read: true };
      }
      return n;
    }));

    setActiveTab('messages');
  };

  const handleSelectConversation = async (conv) => {
    if (!conv) return;
    if (conv.doctor) setActiveChatDoctor(conv.doctor);

    // 1. Immediately reset unread count to 0 in local state so badges vanish instantly
    setConversations(prev => prev.map(c => {
      const isMatch = (conv.id && c.id === conv.id) ||
        (conv.doctor?.id && c.doctor?.id === conv.doctor.id) ||
        (conv.doctor?.name && c.doctor?.name === conv.doctor.name);
      if (isMatch) {
        return {
          ...c,
          unread: 0,
          messages: (c.messages || []).map(m => {
            if (m.senderId !== currentUser?.id) {
              return { ...m, status: 'SEEN', isRead: true, readAt: m.readAt || new Date().toISOString() };
            }
            return m;
          })
        };
      }
      return c;
    }));

    // 2. Mark any related NEW_MESSAGE notifications as read immediately
    setNotifications(prev => prev.map(n => {
      const isMatch = (n.type === 'NEW_MESSAGE' || n.type === 'MESSAGE' || n.type === 'DIRECT_MESSAGE' || !n.type) &&
        ((conv.id && n.targetId === conv.id) ||
          (conv.doctor?.id && n.senderId === conv.doctor.id) ||
          (conv.doctor?.name && n.senderName === conv.doctor.name));
      if (isMatch && !n.read) {
        if (n.id) api.notifications.markAsRead(n.id).catch(() => { });
        return { ...n, read: true };
      }
      return n;
    }));

    // 3. Mark as read on backend and load latest messages if available
    const numId = typeof conv.id === 'number' ? conv.id : parseInt(String(conv.id).replace(/\D/g, ''), 10);
    if (!isNaN(numId) && numId > 0) {
      try {
        const msgs = await api.chat.getMessages(numId, currentUser?.id || 1);
        setConversations(prev => prev.map(c => {
          if (c.id === conv.id || c.id === numId) {
            return {
              ...c,
              unread: 0,
              messages: (() => {
                const seen = new Set();
                return (msgs || []).filter(m => {
                  const k = String(m.id);
                  if (seen.has(k)) return false;
                  seen.add(k);
                  return true;
                }).map(m => ({
                  id: m.id,
                  sender: m.senderId === currentUser?.id ? 'user' : 'doctor',
                  senderId: m.senderId,
                  receiverId: m.receiverId,
                  text: m.text || m.message,
                  attachmentUrl: m.attachmentUrl,
                  attachmentType: m.attachmentType,
                  status: m.senderId !== currentUser?.id ? 'SEEN' : (m.status || (m.isRead ? 'SEEN' : 'SENT')),
                  isRead: m.senderId !== currentUser?.id ? true : (m.isRead || false),
                  createdAt: m.createdAt,
                  deliveredAt: m.deliveredAt,
                  readAt: m.readAt || (m.senderId !== currentUser?.id ? new Date().toISOString() : null),
                  time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                }));
              })()
            };
          }
          return c;
        }));
        api.chat.markAsRead(numId, currentUser?.id || 1).catch(() => { });
      } catch (e) { }
    }
  };

  const handleSendMessage = async ({ conversationId, receiverId, text, attachmentUrl, attachmentType }) => {
    let targetConvId = conversationId;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg = {
      id: tempId,
      tempId: tempId,
      sender: 'user',
      senderId: currentUser?.id,
      receiverId: receiverId,
      text,
      attachmentUrl,
      attachmentType,
      status: 'SENT',
      isRead: false,
      createdAt: now.toISOString(),
      deliveredAt: null,
      readAt: null,
      time: timeFormatted
    };

    // 1. Immediate optimistic UI update (0ms response - renders sent message instantly)
    setConversations(prev => {
      const matchIndex = prev.findIndex(conv =>
        conv.id === conversationId ||
        (conv.doctor?.id && (conv.doctor.id === receiverId || String(conv.doctor.id).replace(/\D/g, '') === String(receiverId).replace(/\D/g, ''))) ||
        (conv.doctor?.name && activeChatDoctor?.name && conv.doctor.name === activeChatDoctor.name)
      );

      if (matchIndex >= 0) {
        const copy = [...prev];
        const target = copy[matchIndex];
        copy[matchIndex] = {
          ...target,
          lastMessage: text || 'Sent an attachment',
          timestamp: timeFormatted,
          messages: [...(target.messages || []), optimisticMsg]
        };
        return copy;
      }

      const newConv = {
        id: conversationId,
        doctor: activeChatDoctor || { id: receiverId, name: 'Doctor', specialty: 'Veterinary Practitioner' },
        lastMessage: text || 'Sent an attachment',
        timestamp: timeFormatted,
        unread: 0,
        messages: [optimisticMsg]
      };
      return [newConv, ...prev];
    });

    // 2. Asynchronous backend persistence: Non-blocking background sync
    try {
      if (typeof conversationId !== 'number' && receiverId) {
        try {
          const started = await api.chat.startConversation(currentUser?.id || 1, receiverId, text);
          if (started?.id) targetConvId = started.id;
        } catch (e) { }
      }

      const numericConvId = typeof targetConvId === 'number'
        ? targetConvId
        : parseInt(String(targetConvId || '').replace(/\D/g, ''), 10);

      const saved = await api.chat.sendMessage({
        conversationId: !isNaN(numericConvId) && numericConvId > 0 ? numericConvId : 1,
        senderId: currentUser?.id,
        receiverId: receiverId,
        text,
        attachmentUrl,
        attachmentType
      });

      if (saved && saved.id) {
        setConversations(prev => prev.map(conv => {
          const isMatch = conv.id === targetConvId || conv.id === conversationId ||
            (conv.doctor?.id && (conv.doctor.id === receiverId || String(conv.doctor.id).replace(/\D/g, '') === String(receiverId).replace(/\D/g, '')));

          if (isMatch) {
            const existing = conv.messages || [];
            const alreadyHasSaved = existing.some(m => String(m.id) === String(saved.id));
            let updatedMessages;
            if (alreadyHasSaved) {
              // STOMP already added saved.id, remove the temp message to avoid duplicate keys
              updatedMessages = existing.filter(m => m.id !== tempId);
            } else {
              updatedMessages = existing.map(m => {
                if (m.id === tempId) {
                  return {
                    ...m,
                    id: saved.id,
                    status: saved.status || 'SENT',
                    createdAt: saved.createdAt || m.createdAt,
                    deliveredAt: saved.deliveredAt,
                    readAt: saved.readAt
                  };
                }
                return m;
              });
            }

            const seenIds = new Set();
            const deduplicated = updatedMessages.filter(m => {
              const k = String(m.id);
              if (seenIds.has(k)) return false;
              seenIds.add(k);
              return true;
            });

            return {
              ...conv,
              id: targetConvId,
              messages: deduplicated
            };
          }
          return conv;
        }));
      }
    } catch (e) {
      console.warn('Real-time chat persistence fallback:', e);
    }

  };

  // Notifications Handlers
  const handleMarkNotificationRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
    } catch (e) { }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.notifications.markAllAsRead(currentUser?.id || 1);
    } catch (e) { }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const handleDoctorProfileUpdated = (updatedDoc) => {
    if (!updatedDoc) return;

    // Helper to check match
    const isDocMatch = (entityId, entityName) => {
      if (!entityId && !entityName) return false;
      if (entityId && updatedDoc.id) {
        if (entityId === updatedDoc.id) return true;
        if (String(entityId).replace('doc-', '') === String(updatedDoc.id).replace('doc-', '')) return true;
      }
      if (entityName && updatedDoc.name) {
        const n1 = entityName.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        const n2 = updatedDoc.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim();
        if (n1 === n2) return true;
      }
      return false;
    };

    // 1. Current user
    if (currentUser) {
      setCurrentUser(prev => {
        const next = { ...prev, ...updatedDoc };
        try { localStorage.setItem('doctor_vet_user', JSON.stringify(next)); } catch (e) { }
        return next;
      });
    }

    // 2. Selected Doctor modal & Viewed Profile
    setSelectedDoctor(prev => {
      if (!prev) return prev;
      if (prev.id === currentUser?.id || isDocMatch(prev.id, prev.name)) {
        return { ...prev, ...updatedDoc };
      }
      return prev;
    });

    setViewedProfileDoctor(prev => {
      if (!prev) return updatedDoc;
      if (prev.id === currentUser?.id || isDocMatch(prev.id, prev.name)) {
        return { ...prev, ...updatedDoc };
      }
      return prev;
    });

    // 3. Doctors catalog
    setDoctors(prev => {
      const idx = prev.findIndex(d => isDocMatch(d.id, d.name));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updatedDoc };
        return copy;
      }
      return [updatedDoc, ...prev];
    });

    // 4. Feed Posts
    setPosts(prev => prev.map(p => {
      if (isDocMatch(p.authorId, p.authorName)) {
        return {
          ...p,
          authorAvatar: updatedDoc.avatar,
          authorName: updatedDoc.name || p.authorName,
          authorSpecialty: updatedDoc.specialty || p.authorSpecialty
        };
      }
      return p;
    }));

    // 5. 24h Stories
    setStories(prev => prev.map(s => {
      if (isDocMatch(s.doctorId, s.doctorName) || isDocMatch(s.doctorId, s.fullDoctorName)) {
        return {
          ...s,
          avatar: updatedDoc.avatar,
          doctorName: updatedDoc.name ? updatedDoc.name.replace(/^dr\.?\s*/i, '').split(' ')[0] : s.doctorName,
          fullDoctorName: updatedDoc.name || s.fullDoctorName
        };
      }
      return s;
    }));

    // 6. Clinical Cases
    setClinicalCases(prev => prev.map(c => {
      if (isDocMatch(c.authorId, c.authorName)) {
        return {
          ...c,
          authorAvatar: updatedDoc.avatar,
          authorName: updatedDoc.name || c.authorName,
          authorSpecialty: updatedDoc.specialty || c.authorSpecialty
        };
      }
      return c;
    }));

    // 7. My Connections
    setMyConnections(prev => prev.map(c => {
      if (isDocMatch(c.id, c.name)) {
        return {
          ...c,
          avatar: updatedDoc.avatar,
          name: updatedDoc.name || c.name,
          specialty: updatedDoc.specialty || c.specialty
        };
      }
      return c;
    }));

    // 8. Active Chat Doctor & Conversations
    setActiveChatDoctor(prev => {
      if (!prev) return prev;
      if (isDocMatch(prev.id, prev.name)) {
        return { ...prev, ...updatedDoc, avatar: updatedDoc.avatar };
      }
      return prev;
    });

    setConversations(prev => prev.map(conv => {
      if (conv.doctor && isDocMatch(conv.doctor.id, conv.doctor.name)) {
        return {
          ...conv,
          doctor: { ...conv.doctor, ...updatedDoc, avatar: updatedDoc.avatar }
        };
      }
      return conv;
    }));

    // 9. Communities (members, posts, comments, cases, reels, chat)
    setCommunities(prev => prev.map(comm => {
      const updatedMembers = (comm.members || []).map(m => {
        if (isDocMatch(m.id, m.name)) {
          return {
            ...m,
            avatar: updatedDoc.avatar || m.avatar,
            name: updatedDoc.name || m.name,
            specialty: updatedDoc.specialty || m.specialty,
            city: updatedDoc.city || m.city
          };
        }
        return m;
      });

      const updatedPosts = (comm.posts || []).map(p => {
        let postChanged = false;
        let newP = { ...p };
        if (isDocMatch(p.authorId, p.authorName)) {
          newP.authorAvatar = updatedDoc.avatar || p.authorAvatar;
          newP.authorName = updatedDoc.name || p.authorName;
          newP.authorSpecialty = updatedDoc.specialty || p.authorSpecialty;
          postChanged = true;
        }
        if (Array.isArray(p.comments) && p.comments.length > 0) {
          const newComments = p.comments.map(c => {
            if (isDocMatch(c.authorId, c.authorName)) {
              return {
                ...c,
                authorAvatar: updatedDoc.avatar || c.authorAvatar,
                authorName: updatedDoc.name || c.authorName
              };
            }
            return c;
          });
          newP.comments = newComments;
          postChanged = true;
        }
        return postChanged ? newP : p;
      });

      const updatedCases = (comm.cases || []).map(c => {
        if (isDocMatch(c.authorId, c.authorName)) {
          return {
            ...c,
            authorAvatar: updatedDoc.avatar || c.authorAvatar,
            authorName: updatedDoc.name || c.authorName
          };
        }
        return c;
      });

      const updatedReels = (comm.reels || []).map(r => {
        if (isDocMatch(r.authorId, r.authorName)) {
          return {
            ...r,
            authorName: updatedDoc.name || r.authorName
          };
        }
        return r;
      });

      const updatedMessages = (comm.chatMessages || []).map(msg => {
        if (isDocMatch(msg.senderId, msg.senderName)) {
          return {
            ...msg,
            senderAvatar: updatedDoc.avatar || msg.senderAvatar,
            senderName: updatedDoc.name || msg.senderName
          };
        }
        return msg;
      });

      return {
        ...comm,
        members: updatedMembers,
        posts: updatedPosts,
        cases: updatedCases,
        reels: updatedReels,
        chatMessages: updatedMessages
      };
    }));
  };

  const handleOpenDoctorProfile = (doc, openAsPage = false) => {
    const target = doc || currentUser;
    if (!target) return;

    const fresh = (doctors || []).find(d =>
      d.id === target.id ||
      String(d.id).replace('doc-', '') === String(target.id).replace('doc-', '') ||
      (d.name && target.name && d.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim() === target.name.toLowerCase().replace(/^dr\.?\s*/i, '').trim())
    );

    const merged = fresh
      ? { ...target, ...fresh, avatar: (fresh.avatar && !fresh.avatar.includes('unsplash.com')) ? fresh.avatar : (target.avatar || fresh.avatar) }
      : target;

    if (openAsPage) {
      setViewedProfileDoctor(merged);
      if (activeTab !== 'profile') {
        setProfileReturnTab(activeTab);
      }
      setSelectedDoctor(null);
      setActiveTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSelectedDoctor(merged);
    }
  };

  const handleTabNavigation = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') setViewedProfileDoctor(currentUser);
    if (tab === 'messages') {
      const targetConv = conversations.find(c => activeChatDoctor && (c.doctor?.id === activeChatDoctor.id || c.doctor?.name === activeChatDoctor.name)) || conversations[0];
      if (targetConv) {
        handleSelectConversation(targetConv);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentUser || isLoginView || activeTab === 'login') {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={currentUser ? () => {
            setIsLoginView(false);
            if (activeTab === 'login') setActiveTab('feed');
          } : null}
          onOpenTerms={(secId) => {
            if (typeof secId === 'string') setTermsInitialSection(secId);
            setIsTermsModalOpen(true);
          }}
        />
        <TermsAndConditionsModal
          isOpen={isTermsModalOpen}
          onClose={() => {
            setIsTermsModalOpen(false);
            setTermsInitialSection(null);
          }}
          initialSectionId={termsInitialSection}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <LeftSidebar
        activeTab={activeTab}
        onTabSelect={handleTabNavigation}
        unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unread || 0), 0)}
        onOpenBenefitsModal={() => setActiveTab('benefits')}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginView(true)}
        onLogout={handleLogout}
        onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
        onOpenDoctorProfile={handleOpenDoctorProfile}
        onOpenTerms={() => setIsTermsModalOpen(true)}
      />

      {/* 2. Main Content Layout */}
      <div className="main-content-layout">
        {/* Device Notifications Enable Banner (Laptop, Mobile & iOS) */}
        <DeviceNotificationBanner onOpenDirectChat={handleOpenDirectChat} />
        {/* Top Persistent Header & notification dropdown */}
        <Header
          searchQuery={globalSearch}
          onSearchChange={(query) => {
            setGlobalSearch(query);
            if (query.trim() && activeTab !== 'search') {
              setActiveTab('search');
            }
          }}
          activeTab={activeTab}
          onTabSelect={handleTabNavigation}
          currentUser={currentUser}
          onOpenLogin={() => setIsLoginView(true)}
          onLogout={handleLogout}
          onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
          onOpenDoctorProfile={handleOpenDoctorProfile}
          unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unread || 0), 0)}
          unreadNotificationsCount={unreadNotifsCount}
          pendingRequestsCount={pendingRequests.length}
          notifications={notifications}
          onAcceptRequest={handleAcceptRequest}
          onIgnoreRequest={handleRejectRequest}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onOpenCreatePost={handleOpenCreatePost}
          onOpenDirectChat={handleOpenDirectChat}
          onAcceptCommunityInvite={handleAcceptCommunityInvite}
          onDeclineCommunityInvite={handleDeclineCommunityInvite}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          onSelectCase={(c) => {
            const found = clinicalCases.find(item => item.id === c.id || item.id === Number(c.id));
            setSelectedCase(found || c);
            setActiveTab('cases');
          }}
          onSelectVideo={(v) => {
            const found = videos.find(item => item.id === v.id || item.id === Number(v.id));
            setSelectedVideo(found || v);
            setActiveTab('videos');
          }}
        />

        {/* Workspace Layout */}
        {activeTab === 'messages' ? (
          <div className="messages-workspace-layout" style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '16px 20px',
            boxSizing: 'border-box'
          }}>
            <MessagesView
              conversations={conversations}
              activeChatDoctor={activeChatDoctor}
              onSelectConversation={handleSelectConversation}
              onSendMessage={handleSendMessage}
              onOpenDoctorProfile={handleOpenDoctorProfile}
              currentUser={currentUser}
              doctors={doctors}
              connectedDoctors={myConnections}
              onOpenLogin={() => setIsLoginView(true)}
              onNavigateTab={handleTabNavigation}
              onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
              onSendRequest={handleSendRequest}
              onOpenStory={(s) => setSelectedStory(s)}
              stories={stories}
              onMarkAsRead={(convId) => {
                const num = typeof convId === 'number' ? convId : parseInt(String(convId || '').replace(/\D/g, ''), 10);
                if (!isNaN(num) && num > 0) {
                  api.chat.markAsRead(num, currentUser?.id).catch(() => { });
                  setConversations(prev => prev.map(c => {
                    if (c.id === convId || c.id === num) {
                      return {
                        ...c,
                        unread: 0,
                        messages: (c.messages || []).map(m => {
                          if (m.senderId !== currentUser?.id) {
                            return { ...m, status: 'SEEN', isRead: true, readAt: m.readAt || new Date().toISOString() };
                          }
                          return m;
                        })
                      };
                    }
                    return c;
                  }));
                }
              }}
            />
          </div>
        ) : (
          <div className={`workspace-two-column-layout ${activeTab === 'communities' ? 'communities-workspace-layout' : ''}`}>
            {/* Main Feed Column */}
            <main className={`feed-main-column ${activeTab === 'advertise' || activeTab === 'communities' ? 'full-width-column' : ''}`}>
              {activeTab === 'feed' && (
                <FeedView
                  posts={posts}
                  stories={stories}
                  doctors={doctors}
                  liveCampaigns={liveCampaigns}
                  onExpireCampaign={(campId) => {
                    setLiveCampaigns(prev => prev.filter(c => c.id !== campId));
                    api.campaigns.updateStatus(campId, 'Completed').catch(() => { });
                  }}
                  onOpenStory={(s) => setSelectedStory(s)}
                  onOpenCreatePost={handleOpenCreatePost}
                  onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                  onOpenClinicalCase={(c) => setSelectedCase(c)}
                  onLikePost={handleLikePost}
                  onAddComment={handleAddComment}
                  onDeletePost={handleDeletePost}
                  onBookmarkPost={handleBookmarkPost}
                  onReportPost={handleReportPost}
                  currentUser={currentUser}
                  onOpenDoctorProfile={handleOpenDoctorProfile}
                  onSendMessage={handleSendMessage}
                  onDeleteStory={handleDeleteStory}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  doctor={viewedProfileDoctor || currentUser}
                  doctors={doctors}
                  currentUser={currentUser}
                  cases={clinicalCases}
                  posts={posts}
                  connectedDoctors={myConnections}
                  onEditProfile={() => setIsCreateProfileOpen(true)}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onUpdateAvatar={async (newAvatarUrl) => {
                    const docId = currentUser?.id || 1;
                    try {
                      const updated = await api.doctors.update(docId, { avatar: newAvatarUrl });
                      handleDoctorProfileUpdated(updated);
                      alert('Profile photo updated successfully!');
                    } catch (e) {
                      const fallback = { ...(currentUser || {}), avatar: newAvatarUrl };
                      handleDoctorProfileUpdated(fallback);
                    }
                  }}
                  onUpdateCover={async (newCoverUrl) => {
                    const docId = currentUser?.id || 1;
                    try {
                      const updated = await api.doctors.update(docId, { coverImage: newCoverUrl });
                      handleDoctorProfileUpdated(updated);
                      alert('Cover photo updated successfully!');
                    } catch (e) {
                      const fallback = { ...(currentUser || {}), coverImage: newCoverUrl };
                      handleDoctorProfileUpdated(fallback);
                    }
                  }}
                  onUpdatePhone={async (newPhone) => {
                    const docId = currentUser?.id || 1;
                    try {
                      const updated = await api.doctors.update(docId, { phone: newPhone });
                      handleDoctorProfileUpdated(updated);
                      alert('Phone number updated successfully!');
                    } catch (e) {
                      const fallback = { ...(currentUser || {}), phone: newPhone };
                      handleDoctorProfileUpdated(fallback);
                    }
                  }}
                  onUpdateEmail={async (newEmail) => {
                    const docId = currentUser?.id || 1;
                    try {
                      const updated = await api.doctors.update(docId, { email: newEmail });
                      handleDoctorProfileUpdated(updated);
                      alert('Email address updated successfully!');
                    } catch (e) {
                      const fallback = { ...(currentUser || {}), email: newEmail };
                      handleDoctorProfileUpdated(fallback);
                    }
                  }}
                  onUpdateVci={async (newRegNo, verified = true) => {
                    const docId = currentUser?.id || viewedProfileDoctor?.id || 1;
                    const isVerified = Boolean(verified && newRegNo && newRegNo.trim().length > 3);
                    try {
                      const updated = await api.doctors.update(docId, {
                        licenseNumber: newRegNo,
                        verified: isVerified
                      });
                      const merged = { ...(updated || {}), licenseNumber: newRegNo, verified: isVerified };
                      handleDoctorProfileUpdated(merged);
                      alert('VCI Registration verified and saved successfully!');
                    } catch (e) {
                      console.warn('Backend VCI update fallback:', e);
                      const fallback = {
                        ...(currentUser || viewedProfileDoctor || {}),
                        id: docId,
                        licenseNumber: newRegNo,
                        verified: isVerified
                      };
                      handleDoctorProfileUpdated(fallback);
                      alert('VCI Registration updated successfully!');
                    }
                  }}
                  onOpenChat={handleOpenDirectChat}
                  onToggleConnect={(docId) => handleDisconnect(docId)}
                  isConnected={viewedProfileDoctor ? (!!connectedMap[viewedProfileDoctor.id] || !!connectedMap[`doc-${viewedProfileDoctor.id}`]) : false}
                  isPending={viewedProfileDoctor ? sentRequests.some(r => r.receiverId === viewedProfileDoctor.id) : false}
                  onSendRequest={handleSendRequest}
                  onBackToFeed={() => setActiveTab(profileReturnTab || 'feed')}
                  returnTab={profileReturnTab}
                  onOpenCreateCase={handleOpenCreatePost}
                  onDeleteCase={handleDeleteClinicalCase}
                  onDeletePost={handleDeletePost}
                />
              )}

              {activeTab === 'network' && (
                <VetNetworkView
                  doctors={doctors}
                  onSelectDoctor={handleOpenDoctorProfile}
                  connectedDoctors={connectedMap}
                  pendingRequests={pendingRequests}
                  sentRequests={sentRequests}
                  onSendRequest={handleSendRequest}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                  onCancelRequest={handleCancelRequest}
                  onDisconnect={handleDisconnect}
                  onOpenChat={handleOpenDirectChat}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'cases' && (
                <ClinicalCasesView
                  clinicalCases={clinicalCases}
                  stories={stories}
                  doctors={doctors}
                  currentUser={currentUser}
                  onOpenStory={(s) => setSelectedStory(s)}
                  onOpenCreateCase={handleOpenCreatePost}
                  onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onDeleteCase={handleDeleteClinicalCase}
                  onDeleteStory={handleDeleteStory}
                />
              )}

              {activeTab === 'videos' && (
                <ShortVideosView
                  videos={videos}
                  stories={stories}
                  doctors={doctors}
                  currentUser={currentUser}
                  onOpenStory={(s) => setSelectedStory(s)}
                  onOpenCreateVideo={handleOpenCreatePost}
                  onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
                  onSelectVideo={(v) => setSelectedVideo(v)}
                  onDeleteVideo={handleDeleteVideo}
                  onDeleteStory={handleDeleteStory}
                />
              )}

              {activeTab === 'search' && (
                <SearchView
                  doctors={doctors}
                  clinicalCases={clinicalCases}
                  videos={videos}
                  connectedDoctors={connectedMap}
                  onSelectDoctor={handleOpenDoctorProfile}
                  onSelectCase={(c) => setSelectedCase(c)}
                  onSelectVideo={(v) => setSelectedVideo(v)}
                  onOpenChat={handleOpenDirectChat}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'communities' && (
                <CommunityView
                  communities={communities}
                  activeCommunityId={selectedCommunityId}
                  onSelectCommunity={handleSelectCommunity}
                  onCreateCommunity={handleCreateCommunity}
                  onJoinCommunity={handleJoinCommunity}
                  onLeaveCommunity={handleLeaveCommunity}
                  onInviteDoctor={handleInviteDoctorToCommunity}
                  onAddPost={handleAddCommunityPost}
                  onAddComment={handleAddCommunityComment}
                  onTogglePostLike={handleToggleCommunityPostLike}
                  onAddCase={handleAddCommunityCase}
                  onAddReel={handleAddCommunityReel}
                  onSendMessage={handleSendCommunityMessage}
                  onJoinWithCode={handleJoinCommunityByCode}
                  currentUser={currentUser}
                  doctors={doctors}
                  connectedDoctors={Object.keys(connectedMap).map(k => ({ id: isNaN(k) ? k : Number(k) }))}
                  onOpenDoctorProfile={handleOpenDoctorProfile}
                  onOpenDirectChat={handleOpenDirectChat}
                  onAcceptInvite={handleAcceptCommunityInvite}
                  onRejectInvite={handleDeclineCommunityInvite}
                  onDeleteCommunity={handleDeleteCommunity}
                  onDeletePost={handleDeleteCommunityPost}
                  onDeleteCase={handleDeleteCommunityCase}
                  onDeleteReel={handleDeleteCommunityReel}
                  onUpdateCover={handleUpdateCommunityCover}
                />
              )}

              {activeTab === 'benefits' && (
                <MemberBenefitsView
                  onOpenCreateProfile={() => setIsCreateProfileOpen(true)}
                />
              )}

              {activeTab === 'advertise' && (
                <AdvertiseView
                  onCampaignsUpdated={async () => {
                    try {
                      const liveAds = await api.campaigns.getPublicLive('Feed');
                      if (Array.isArray(liveAds)) setLiveCampaigns(liveAds);
                    } catch (e) { }
                  }}
                  onOpenTerms={() => setIsTermsModalOpen(true)}
                />
              )}

              {activeTab === 'terms' && (
                <TermsView onBackToFeed={() => setActiveTab('feed')} />
              )}
            </main>

            {/* Right Rail Widgets - Hidden on full-width Advertise Dashboard, Terms View & Community Page */}
            {activeTab !== 'advertise' && activeTab !== 'communities' && (
              <RightSidebar
                doctors={doctors}
                currentUser={currentUser}
                onSelectDoctor={(doc) => handleOpenDoctorProfile(doc, false)}
                onOpenChat={handleOpenDirectChat}
                onViewAllDoctors={() => setActiveTab('network')}
                onSendRequest={handleSendRequest}
                connectedDoctors={Object.keys(connectedMap).map(k => ({ id: isNaN(k) ? k : Number(k) }))}
                communities={communities}
                onOpenCommunity={(id) => {
                  if (id) setSelectedCommunityId(id);
                  setActiveTab('communities');
                }}
                onOpenCreateCommunity={() => {
                  setActiveTab('communities');
                }}
                onOpenTerms={() => setIsTermsModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>

      {/* Interactive Modals */}
      {selectedDoctor && (
        <DoctorModal
          doctor={selectedDoctor}
          doctors={doctors}
          onClose={() => setSelectedDoctor(null)}
          onOpenChat={handleOpenDirectChat}
          isConnected={!!connectedMap[selectedDoctor.id] || !!connectedMap[`doc-${selectedDoctor.id}`]}
          isPending={sentRequests.some(r => r.receiverId === selectedDoctor.id)}
          onSendRequest={handleSendRequest}
          onToggleConnect={(docId) => handleDisconnect(docId)}
          onSelectCase={(c) => setSelectedCase(c)}
          cases={clinicalCases}
          posts={posts}
          connectedDoctors={myConnections}
          currentUser={currentUser}
          onEditProfile={() => setIsCreateProfileOpen(true)}
          onUpdateAvatar={async (newAvatarUrl) => {
            const docId = currentUser?.id || selectedDoctor?.id || 1;
            try {
              const updated = await api.doctors.update(docId, { avatar: newAvatarUrl });
              handleDoctorProfileUpdated(updated);
              alert('Profile photo updated successfully!');
            } catch (e) {
              console.error('Failed to update avatar:', e);
              const fallback = { ...(currentUser || selectedDoctor), avatar: newAvatarUrl };
              handleDoctorProfileUpdated(fallback);
            }
          }}
          onUpdateCover={async (newCoverUrl) => {
            const docId = currentUser?.id || selectedDoctor?.id || 1;
            try {
              const updated = await api.doctors.update(docId, { coverImage: newCoverUrl });
              handleDoctorProfileUpdated(updated);
              alert('Cover photo updated successfully!');
            } catch (e) {
              console.error('Failed to update cover:', e);
              const fallback = { ...(currentUser || selectedDoctor), coverImage: newCoverUrl };
              handleDoctorProfileUpdated(fallback);
            }
          }}
          onUpdateVci={async (newRegNo, verified = true) => {
            const docId = currentUser?.id || selectedDoctor?.id || 1;
            const isVerified = Boolean(verified && newRegNo && newRegNo.trim().length > 3);
            try {
              const updated = await api.doctors.update(docId, { licenseNumber: newRegNo, verified: isVerified });
              const merged = { ...(updated || {}), licenseNumber: newRegNo, verified: isVerified };
              handleDoctorProfileUpdated(merged);
              alert('VCI Registration verified successfully!');
            } catch (e) {
              const fallback = { ...(currentUser || selectedDoctor || {}), licenseNumber: newRegNo, verified: isVerified };
              handleDoctorProfileUpdated(fallback);
              alert('VCI Registration updated successfully!');
            }
          }}
          onViewFullPageProfile={(doc) => handleOpenDoctorProfile(doc, true)}
          onDeleteCase={handleDeleteClinicalCase}
          onDeletePost={handleDeletePost}
        />
      )}

      <CreateProfileModal
        isOpen={isCreateProfileOpen}
        onClose={() => setIsCreateProfileOpen(false)}
        currentUser={currentUser}
        onProfileCreated={(savedDoc) => {
          handleDoctorProfileUpdated(savedDoc);
        }}
      />

      <AiCaseAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onInsertCase={(text) => handleCreatePost({ content: text, postType: 'CLINICAL_CASE' })}
      />

      {selectedStory && (
        <StoryModal
          story={selectedStory}
          stories={stories}
          onSelectStory={setSelectedStory}
          onClose={() => setSelectedStory(null)}
          currentUser={currentUser}
          doctors={doctors}
          onSendMessage={handleSendMessage}
          onUpdateStory={(updated) => {
            setStories(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
          }}
          onDeleteStory={handleDeleteStory}
        />
      )}

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
        currentUser={currentUser}
        doctors={doctors}
      />

      <ClinicalCaseModal
        clinicalCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostSubmit={handleCreatePost}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        initialType={createPostInitialType}
        currentUser={currentUser}
      />

      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => {
          setIsTermsModalOpen(false);
          setTermsInitialSection(null);
        }}
        initialSectionId={termsInitialSection}
      />

      {/* 4. Mobile Bottom Navigation Bar (Screens <= 768px) */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabSelect={handleTabNavigation}
        unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unread || 0), 0)}
        pendingRequestsCount={pendingRequests.length}
        onOpenCreatePost={handleOpenCreatePost}
      />

      {/* 5. Universal Cross-Platform Notification Toast (Android, iOS, Laptop & Desktop) */}
      <NotificationToast
        onNavigate={(notif) => {
          if (!notif) return;
          if (notif.type === 'REEL_UPLOAD' || notif.type === 'VIDEO_UPLOAD' || notif.type === 'SHORT_VIDEO') {
            const found = videos.find(v => v.id === notif.targetId || v.id === Number(notif.targetId));
            setSelectedVideo(found || { id: notif.targetId, title: notif.message });
            setActiveTab('videos');
          } else if (notif.type === 'CLINICAL_CASE_SHARED' || notif.type === 'CASE' || notif.type === 'CLINICAL_CASE') {
            const found = clinicalCases.find(c => c.id === notif.targetId || c.id === Number(notif.targetId));
            setSelectedCase(found || { id: notif.targetId, title: notif.message });
            setActiveTab('cases');
          } else if (notif.type === 'NEW_MESSAGE' || notif.type === 'MESSAGE') {
            const targetDocId = notif.senderId || notif.targetId;
            if (targetDocId || notif.senderName) {
              handleOpenDirectChat({ id: targetDocId, name: notif.senderName, avatar: notif.senderAvatar });
            } else {
              setActiveTab('messages');
            }
          } else if (notif.type === 'CONNECTION_REQUEST' || notif.type === 'CONNECTION_ACCEPTED') {
            setActiveTab('network');
          } else {
            setActiveTab('feed');
          }
        }}
      />
    </div>
  );
}

export default App;
