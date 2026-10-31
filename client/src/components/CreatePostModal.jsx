import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  Send,
  UploadCloud,
  Check,
  Plus,
  Play,
  Film,
  Camera,
  Trash2,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PHOTOS = [];
const SAMPLE_STORIES = [];
const SAMPLE_VIDEOS = [];

export function CreatePostModal({
  isOpen,
  onClose,
  onPostSubmit,
  onOpenAiAssistant,
  initialType = 'CLINICAL_CASE',
  currentUser
}) {
  const [postType, setPostType] = useState(initialType);
  const [content, setContent] = useState('');
  const [species, setSpecies] = useState('Canine');

  // Media states
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'

  // Video specific states
  const [videoTitle, setVideoTitle] = useState('');
  const [videoSpecialty, setVideoSpecialty] = useState('Veterinary Surgery');
  const [videoDuration, setVideoDuration] = useState('0:45');
  const [videoFileUrl, setVideoFileUrl] = useState('');

  // Story specific states
  const [storyCaption, setStoryCaption] = useState('');

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const storyInputRef = useRef(null);

  // Sync initial type when modal opens or initialType changes
  useEffect(() => {
    if (isOpen) {
      setPostType(initialType || 'CLINICAL_CASE');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  // Clean reset
  const handleReset = () => {
    setContent('');
    setMediaUrl('');
    setMediaFile(null);
    setFileDetails(null);
    setVideoTitle('');
    setVideoFileUrl('');
    setStoryCaption('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    setMediaFile(file);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileDetails({
      name: file.name,
      size: `${sizeInMB} MB`,
      type: file.type
    });

    if (file.type.startsWith('video/')) {
      const blobUrl = URL.createObjectURL(file);
      setVideoFileUrl(blobUrl);
      setMediaUrl(blobUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSamplePhoto = (sample) => {
    setMediaUrl(sample.url);
    setMediaFile(null);
    setFileDetails({ name: sample.label, size: 'Sample Preset', type: 'image/jpeg' });
  };

  const handleSelectSampleStory = (sample) => {
    setMediaUrl(sample.url);
    setStoryCaption(sample.caption);
    setMediaFile(null);
    setFileDetails({ name: sample.label, size: 'Sample Story', type: 'image/jpeg' });
  };

  const handleSelectSampleVideo = (sample) => {
    setVideoTitle(sample.title);
    setVideoDuration(sample.duration);
    setVideoSpecialty(sample.specialty);
    setMediaUrl(sample.thumbnail);
    setVideoFileUrl(sample.videoUrl);
    setMediaFile(null);
    setFileDetails({ name: sample.title, size: 'Clinical Reel', type: 'video/mp4' });
  };

  const handleClearMedia = () => {
    setMediaUrl('');
    setMediaFile(null);
    setFileDetails(null);
    setVideoFileUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (storyInputRef.current) storyInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let uploadedMediaUrl = mediaUrl;
    let uploadedVideoUrl = videoFileUrl;

    if (mediaFile) {
      try {
        const uploadRes = await api.media.upload(mediaFile);
        if (uploadRes && uploadRes.url) {
          uploadedMediaUrl = uploadRes.url;
          if (mediaFile.type.startsWith('video/')) {
            uploadedVideoUrl = uploadRes.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Server media upload fallback:', uploadErr);
      }
    }

    if (postType === 'STORY') {
      const text = storyCaption.trim() || content.trim() || 'Moments from clinical practice';
      if (!uploadedMediaUrl) {
        alert('Please upload a photo or video for your story.');
        return;
      }
      onPostSubmit({
        postType: 'STORY',
        content: text,
        imageUrl: uploadedMediaUrl,
        videoUrl: uploadedVideoUrl || null,
        species
      });
      handleClose();
      return;
    }

    if (postType === 'SHORT_VIDEO') {
      const title = videoTitle.trim() || content.slice(0, 50) || 'Clinical Technique Reel';
      if (!uploadedMediaUrl && !uploadedVideoUrl) {
        alert('Please upload a clinical video or select a sample reel.');
        return;
      }
      onPostSubmit({
        postType: 'SHORT_VIDEO',
        content: content.trim() || title,
        videoTitle: title,
        specialty: videoSpecialty,
        duration: videoDuration,
        imageUrl: uploadedMediaUrl || null,
        videoUrl: uploadedVideoUrl || uploadedMediaUrl,
        species
      });
      handleClose();
      return;
    }

    // GENERAL_POST or CLINICAL_CASE
    if (!content.trim() && !uploadedMediaUrl) {
      alert('Please enter post content or upload an image.');
      return;
    }

    onPostSubmit({
      content: content.trim() || (postType === 'CLINICAL_CASE' ? 'Clinical case observation' : 'Clinical photograph / update'),
      postType,
      imageUrl: uploadedMediaUrl ? uploadedMediaUrl.trim() : null,
      species
    });

    handleClose();
  };

  const doctorName = currentUser?.name || 'Dr. You (Verified)';
  const doctorAvatar = currentUser?.avatar || '';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          borderRadius: '16px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h3 className="modal-title">Share to Zenve Vet</h3>
          <button className="btn-close-modal" onClick={handleClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="modal-body custom-scrollbar"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Tabs - Exact design from reference screenshot */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'CLINICAL_CASE', label: 'Clinical Case' },
              { id: 'GENERAL_POST', label: 'Photo / Zenv' },
              { id: 'STORY', label: 'Story' },
              { id: 'SHORT_VIDEO', label: 'Short Video' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPostType(tab.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  border: '1px solid',
                  borderColor: postType === tab.id ? '#0D472B' : '#E5E9E5',
                  background: postType === tab.id ? '#E8F3ED' : '#FFF',
                  color: postType === tab.id ? '#0D472B' : '#64726A',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ======================================================== */}
          {/* TAB 1: CLINICAL CASE                                     */}
          {/* ======================================================== */}
          {postType === 'CLINICAL_CASE' && (
            <>
              {/* Species and Case meta selector */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#121A15' }}>Patient Species:</label>
                <select
                  className="pill-select-control"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  <option value="Canine">Canine (Dog)</option>
                  <option value="Feline">Feline (Cat)</option>
                  <option value="Equine">Equine (Horse)</option>
                  <option value="Bovine">Bovine (Cattle)</option>
                  <option value="Avian">Avian (Bird)</option>
                  <option value="Exotic / Wildlife">Exotic / Wildlife</option>
                </select>
              </div>

              {/* Textarea */}
              <textarea
                rows="4"
                className="custom-filter-select"
                style={{ width: '100%', resize: 'vertical', marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 }}
                placeholder="Share a clinical discovery, diagnosis, surgical technique, or discussion with peer veterinarians..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />

              {/* Upload Scan / Photo section */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#121A15' }}>
                    Add Clinical Scan or Radiograph (Optional)
                  </label>
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                    X-Ray · CT · Cytology
                  </span>
                </div>

                {/* File Upload Box */}
                {!mediaUrl ? (
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: isDragging ? '2px dashed #059669' : '1.5px dashed #D1D5DB',
                        backgroundColor: isDragging ? '#ECFDF5' : '#F9FAFB',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '8px'
                      }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <UploadCloud size={24} color="#059669" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        Click to upload scan <span style={{ fontWeight: 400, color: '#6B7280' }}>or drag and drop</span>
                      </p>
                      <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                        JPG, PNG, WEBP, DICOM image (up to 25MB)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Or paste direct URL:</span>
                      <input
                        type="text"
                        placeholder="https://... (radiograph, cytology, or surgical photo)"
                        className="custom-filter-select"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                    </div>

                    {/* Quick sample chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Samples:</span>
                      {SAMPLE_PHOTOS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSamplePhoto(s)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Preview card */
                  <div style={{
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px'
                  }}>
                    <img
                      src={mediaUrl}
                      alt="Clinical scan preview"
                      style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileDetails?.name || 'Clinical Scan Attached'}
                      </p>
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                        {fileDetails?.size || 'Attached photo'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearMedia}
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PHOTO / POST                                      */}
          {/* ======================================================== */}
          {postType === 'GENERAL_POST' && (
            <>
              {/* Species tag */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#121A15' }}>Category / Species:</label>
                <select
                  className="pill-select-control"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  <option value="Canine">Canine</option>
                  <option value="Feline">Feline</option>
                  <option value="Equine">Equine</option>
                  <option value="Bovine">Bovine</option>
                  <option value="Avian & Exotics">Avian & Exotics</option>
                  <option value="General Practice">General Practice</option>
                </select>
              </div>

              {/* Textarea */}
              <textarea
                rows="4"
                className="custom-filter-select"
                style={{ width: '100%', resize: 'vertical', marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 }}
                placeholder="Share clinical photographs, patient recovery milestone, surgical prep, or an update..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required={!mediaUrl}
              />

              {/* Photo Upload Zone */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#121A15' }}>
                    Upload Photos (Clinical & Practice)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: uploadMode === 'file' ? '#E8F3ED' : '#F3F4F6',
                        color: uploadMode === 'file' ? '#0D472B' : '#6B7280',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Browse Device
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: uploadMode === 'url' ? '#E8F3ED' : '#F3F4F6',
                        color: uploadMode === 'url' ? '#0D472B' : '#6B7280',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {!mediaUrl ? (
                  <div>
                    {uploadMode === 'file' ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: isDragging ? '2px dashed #059669' : '1.5px dashed #D1D5DB',
                          backgroundColor: isDragging ? '#ECFDF5' : '#F9FAFB',
                          borderRadius: '10px',
                          padding: '22px 16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '8px'
                        }}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#E8F3ED',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px auto'
                        }}>
                          <Camera size={22} />
                        </div>
                        <p style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>
                          Click to select photos <span style={{ fontWeight: 400, color: '#6B7280' }}>or drag & drop</span>
                        </p>
                        <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                          High resolution JPG, PNG, WEBP, HEIC supported (up to 25MB)
                        </span>
                      </div>
                    ) : (
                      <div style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Paste image URL (https://...)"
                          className="custom-filter-select"
                          style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Sample preset buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Try sample:</span>
                      {SAMPLE_PHOTOS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSamplePhoto(s)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Photo Preview Card with Image */
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#111827',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}>
                    <img
                      src={mediaUrl}
                      alt="Uploaded preview"
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        type="button"
                        onClick={handleClearMedia}
                        style={{
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '8px 12px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: '#FFFFFF',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 600 }}>{fileDetails?.name || 'Photo Ready for Community'}</span>
                      <span style={{ color: '#D1FAE5' }}>{fileDetails?.size || 'High Res'}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STORY                                             */}
          {/* ======================================================== */}
          {postType === 'STORY' && (
            <>
              {/* 24-Hour Expiration Notice Banner */}
              <div style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 100%)',
                borderRadius: '8px',
                border: '1px solid #A7F3D0',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Clock size={18} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#065F46' }}>
                    Moments from the Community · 24-Hour Story
                  </p>
                  <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: '#047857' }}>
                    Appears in the story circle carousel at the top of the feed and automatically expires after 24 hours.
                  </p>
                </div>
              </div>

              {/* Story Caption Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#121A15', marginBottom: '4px' }}>
                  Story Caption / Patient Update
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepped for laparoscopic gastropexy in OR 2 🩺"
                  className="custom-filter-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value)}
                  required
                />
              </div>

              {/* Story Upload & Live Preview Grid */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#121A15', marginBottom: '6px' }}>
                  Upload Story Photo or Vertical Clip
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: mediaUrl ? '1fr 200px' : '1fr', gap: '14px' }}>
                  {/* Left: Upload Dropzone & Controls */}
                  <div>
                    {!mediaUrl ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => storyInputRef.current?.click()}
                        style={{
                          border: isDragging ? '2px dashed #059669' : '1.5px dashed #D1D5DB',
                          backgroundColor: isDragging ? '#ECFDF5' : '#F9FAFB',
                          borderRadius: '10px',
                          padding: '24px 16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '8px'
                        }}
                      >
                        <input
                          type="file"
                          ref={storyInputRef}
                          onChange={handleFileInputChange}
                          accept="image/*,video/*"
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#ECFDF5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px auto'
                        }}>
                          <Plus size={24} />
                        </div>
                        <p style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>
                          Upload Story Photo or Video
                        </p>
                        <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                          Optimized for 9:16 vertical view · JPG, PNG, MP4
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#111827' }}>Story Media Attached</span>
                          <button
                            type="button"
                            onClick={handleClearMedia}
                            style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Replace
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: '#6B7280' }}>
                          {fileDetails?.name || 'Selected media'}
                        </p>
                      </div>
                    )}

                    {/* Or URL Input */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>Or Image URL:</span>
                      <input
                        type="text"
                        placeholder="https://..."
                        className="custom-filter-select"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                    </div>

                    {/* Sample Story Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Quick presets:</span>
                      {SAMPLE_STORIES.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSampleStory(s)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Live Mobile Story Simulator Card */}
                  {mediaUrl && (
                    <div style={{
                      width: '200px',
                      height: '280px',
                      backgroundColor: '#000',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      {/* Top Story Progress Bar */}
                      <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 2.5, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 2, zIndex: 5 }} />

                      {/* Header in Preview */}
                      <div style={{ position: 'absolute', top: 14, left: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, zIndex: 5 }}>
                        <img
                          src={doctorAvatar}
                          alt="Doctor"
                          style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #10B981' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#FFF', fontSize: 10.5, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doctorName}
                          </p>
                          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>Just now · 24h</span>
                        </div>
                      </div>

                      {/* Story Media */}
                      <img
                        src={mediaUrl}
                        alt="Story preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Caption Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '16px 8px 10px 8px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                        color: '#FFF'
                      }}>
                        <p style={{ fontSize: 11, margin: 0, lineHeight: 1.3, fontWeight: 500 }}>
                          {storyCaption || 'Your story caption...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 4: SHORT VIDEO                                       */}
          {/* ======================================================== */}
          {postType === 'SHORT_VIDEO' && (
            <>
              {/* Video Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#121A15', marginBottom: '4px' }}>
                  Clinical Reel Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rapid Subdermal Suture Pattern for Tension Relief"
                  className="custom-filter-select"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  required
                />
              </div>

              {/* Video Category and Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#121A15', marginBottom: '4px' }}>
                    Specialty / Category
                  </label>
                  <select
                    className="pill-select-control"
                    value={videoSpecialty}
                    onChange={(e) => setVideoSpecialty(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px' }}
                  >
                    <option value="Veterinary Surgery">Veterinary Surgery</option>
                    <option value="Critical Care & TFAST">Critical Care & TFAST</option>
                    <option value="Feline Practice">Feline Practice</option>
                    <option value="Avian & Exotics">Avian & Exotics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#121A15', marginBottom: '4px' }}>
                    Duration
                  </label>
                  <select
                    className="pill-select-control"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12px' }}
                  >
                    <option value="0:30">0:30 seconds</option>
                    <option value="0:45">0:45 seconds</option>
                    <option value="0:58">0:58 seconds</option>
                    <option value="1:15">1:15 minutes</option>
                  </select>
                </div>
              </div>

              {/* Description textarea */}
              <textarea
                rows="3"
                className="custom-filter-select"
                style={{ width: '100%', resize: 'vertical', marginBottom: '14px', fontSize: '13px' }}
                placeholder="Briefly explain the clinical technique, instrumentation used, or pearls for colleagues..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {/* Short Video Upload Zone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#121A15', marginBottom: '6px' }}>
                  Upload Video File or Clinical Reel URL
                </label>

                {!videoFileUrl && !mediaUrl ? (
                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => videoInputRef.current?.click()}
                      style={{
                        border: isDragging ? '2px dashed #059669' : '1.5px dashed #D1D5DB',
                        backgroundColor: isDragging ? '#ECFDF5' : '#F9FAFB',
                        borderRadius: '10px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: '8px'
                      }}
                    >
                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={handleFileInputChange}
                        accept="video/mp4,video/webm,video/quicktime,image/*"
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#E8F3ED',
                        color: '#0D472B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px auto'
                      }}>
                        <Video size={24} />
                      </div>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>
                        Click to upload clinical video <span style={{ fontWeight: 400, color: '#6B7280' }}>or drag & drop</span>
                      </p>
                      <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>
                        MP4, WebM, MOV clips (recommended under 60 seconds)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', color: '#6B7280', whiteSpace: 'nowrap' }}>Or Video/Thumbnail URL:</span>
                      <input
                        type="text"
                        placeholder="https://... (direct video link or reel thumbnail)"
                        className="custom-filter-select"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                        value={mediaUrl}
                        onChange={(e) => {
                          setMediaUrl(e.target.value);
                          setVideoFileUrl(e.target.value);
                        }}
                      />
                    </div>

                    {/* Quick Sample Clinical Reels */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Sample Reels:</span>
                      {SAMPLE_VIDEOS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSampleVideo(s)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#F3F4F6',
                            border: '1px solid #E5E7EB',
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          {s.specialty}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Video Live Player Preview */
                  <div style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {videoFileUrl && (/\.(mp4|webm|mov|m4v|ogg)$/i.test(videoFileUrl) || videoFileUrl.startsWith('blob:') || videoFileUrl.startsWith('data:video') || !mediaUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                      <video
                        src={videoFileUrl || mediaUrl}
                        controls
                        playsInline
                        style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', backgroundColor: '#000', display: 'block' }}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Reel preview"
                        style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
                      />
                    )}

                    <div style={{
                      padding: '10px 14px',
                      background: '#1F2937',
                      color: '#FFF',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{videoTitle || 'Clinical Video Attached'}</p>
                        <span style={{ fontSize: '11.5px', color: '#9CA3AF' }}>{videoSpecialty} · {videoDuration}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearMedia}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* FOOTER ACTIONS ROW - Sticky at bottom so always visible */}
          {/* ======================================================== */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            paddingBottom: '4px',
            borderTop: '1px solid #E5E9E5',
            marginTop: 'auto',
            position: 'sticky',
            bottom: 0,
            backgroundColor: '#FFFFFF',
            zIndex: 10,
            boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.02)'
          }}>
            {/* Left AI Assistant button */}
            <button
              type="button"
              className="btn-post-type ai-special"
              onClick={() => {
                handleClose();
                onOpenAiAssistant();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#121A15',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 8px'
              }}
            >
              <Sparkles size={16} color="#059669" />
              <span>Use AI Case Assistant</span>
            </button>

            {/* Right Submit Button */}
            <button
              type="submit"
              className="btn-submit-post"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0D472B',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#072e1c'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0D472B'}
            >
              <span>
                {postType === 'STORY' && 'Publish Story'}
                {postType === 'SHORT_VIDEO' && 'Upload Reel'}
                {postType === 'GENERAL_POST' && 'Zenv to Network'}
                {postType === 'CLINICAL_CASE' && 'Zenv to Network'}
              </span>
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
