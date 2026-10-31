import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  UserPlus,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Shield,
  Users,
  Check,
  Headphones,
  FileText,
  Heart,
  ArrowLeft,
  Sparkles,
  Award,
  Activity,
  Phone,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  MapPin
} from 'lucide-react';
import zenveLogo from '../assets/zenve_logo.png';
import loginBgVet from '../assets/login_bg_vet.jpg';
import { LOGIN_BACKGROUNDS } from '../data/loginBackgrounds';
import { SPECIALTIES, STATES_INDIA } from '../data/mockData';
import { api } from '../services/api';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export function LoginPage({ onLoginSuccess, onCancel, onOpenTerms }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    name: '',
    phone: '',
    specialty: 'Small Animal Medicine',
    state: '',
    city: '',
    rememberMe: true,
    termsAccepted: true
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: verify & new password, 3: success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [targetDoctorName, setTargetDoctorName] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Mobile OTP Sign In States
  const [signInMethod, setSignInMethod] = useState('password'); // 'password' | 'otp'
  const [otpMobile, setOtpMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMaskedPhone, setOtpMaskedPhone] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Dynamic Background Slideshow (cycles every 15 seconds)
  const [activeBgIndex, setActiveBgIndex] = useState(0);

  useEffect(() => {
    if (!LOGIN_BACKGROUNDS || LOGIN_BACKGROUNDS.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBgIndex(prev => (prev + 1) % LOGIN_BACKGROUNDS.length);
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendLoginOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    const cleanPhone = otpMobile.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.auth.sendLoginOtp(cleanPhone);
      setOtpMaskedPhone(res.registeredPhoneMasked || ('+91 ******' + cleanPhone.slice(-4)));
      setOtpSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to send OTP. Please check your mobile number.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    const cleanPhone = otpMobile.replace(/[^0-9]/g, '');
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP verification code.');
      return;
    }
    setOtpLoading(true);
    try {
      const loggedInUser = await api.auth.loginWithOtp(cleanPhone, otpCode.trim());
      if (loggedInUser?.token) {
        localStorage.setItem('doctor_vet_token', loggedInUser.token);
      }
      if (loggedInUser) {
        localStorage.setItem('doctor_vet_user', JSON.stringify(loggedInUser));
      }
      if (onLoginSuccess) {
        onLoginSuccess(loggedInUser);
      }
    } catch (err) {
      setErrorMsg(err.message || 'OTP verification failed. Please check the code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isRegister && signInMethod === 'otp') {
      if (!otpSent) {
        handleSendLoginOtp();
      } else {
        handleVerifyLoginOtp();
      }
      return;
    }

    if (isRegister && !formData.termsAccepted) {
      setErrorMsg('You must accept the Zenve Pets Healthcare Pvt. Ltd. Terms & Conditions to create an account.');
      return;
    }

    setIsLoading(true);

    try {
      let loggedInUser = null;
      if (isRegister) {
        loggedInUser = await api.auth.register({
          name: formData.name,
          email: formData.identifier,
          password: formData.password,
          phone: formData.phone,
          specialty: formData.specialty,
          city: formData.city,
          state: formData.state
        });
      } else {
        loggedInUser = await api.auth.login(formData.identifier, formData.password);
      }

      if (loggedInUser?.token) {
        localStorage.setItem('doctor_vet_token', loggedInUser.token);
      }
      if (loggedInUser) {
        localStorage.setItem('doctor_vet_user', JSON.stringify(loggedInUser));
      }

      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(loggedInUser);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleOpenForgotModal = () => {
    setForgotIdentifier(formData.identifier || '');
    setForgotStep(1);
    setForgotError('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotSuccessMsg('');
    setShowForgotModal(true);
  };

  const handleRequestResetCode = async (e) => {
    e?.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email, mobile number, or Doctor name.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.auth.forgotPassword(forgotIdentifier.trim());
      setTargetDoctorName(res.doctorName || forgotIdentifier);
      setMaskedPhone(res.registeredPhoneMasked || '');
      setMaskedEmail(res.maskedEmail || res.email || '');
      setForgotTargetEmail(res.email || res.targetEmail || forgotIdentifier.trim());
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Unable to locate a doctor account matching that identifier.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    setForgotError('');
    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please verify both password fields.');
      return;
    }

    setForgotLoading(true);
    try {
      const target = forgotTargetEmail || forgotIdentifier.trim();
      const res = await api.auth.resetPassword(target, forgotCode.trim(), newPassword);
      setForgotSuccessMsg(res.message || 'Password reset successfully!');
      setForgotStep(3);
      setFormData(prev => ({
        ...prev,
        identifier: target,
        password: newPassword
      }));
    } catch (err) {
      setForgotError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSuccessDone = () => {
    setShowForgotModal(false);
  };

  return (
    <div className="zenve-modern-portal">
      {/* Dynamic Background Slideshow (cycles every 15s) */}
      <div className="portal-bg-slideshow-container" aria-hidden="true">
        {LOGIN_BACKGROUNDS.map((bg, idx) => (
          <div
            key={idx}
            className={`portal-bg-slide ${idx === activeBgIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
      </div>
      {/* TOP HEADER NAVIGATION BAR */}
      <header className="portal-topbar">
        <div className="portal-brand-group">
          <img
            src={zenveLogo}
            alt="Zenve Vet Logo"
            className="portal-header-zenve-logo"
          />
          <div className="portal-brand-text-block">
            <span className="brand-zenve">ZENVE</span>
            <span className="brand-vet">VET</span>
          </div>
        </div>

        <div className="portal-topbar-right">
          <div className="portal-tagline-cluster">
            <span className="cluster-item">Better Care</span>
            <span className="cluster-dot">•</span>
            <span className="cluster-item">Healthier Pets</span>
            <span className="cluster-dot">•</span>
            <span className="cluster-item">Stronger Communities</span>
          </div>

          {onCancel && (
            <button className="portal-back-btn" onClick={onCancel} title="Return to Feed">
              <ArrowLeft size={14} />
              <span>Explore Platform</span>
            </button>
          )}
        </div>
      </header>

      {/* MAIN TWO-COLUMN CONTENT WORKSPACE */}
      <main className="portal-main-grid">
        {/* LEFT COLUMN: HERO HEADLINE (TOP LEFT OVER OPEN WINDOW) */}
        <section className="portal-hero-column">
          {/* Trust Badge with Live Pulse */}
          <div className="portal-trust-badge">
            <div className="badge-shield-circle">
              <ShieldCheck size={14} color="#065F46" />
            </div>
            <span className="badge-text">Trusted by 10,000+ Veterinary Professionals</span>
            <span className="badge-live-dot" />
          </div>

          {/* Primary Headline */}
          <h1 className="portal-hero-title">
            A World of Care.<br />
            <span className="hero-gradient-text">Connected.</span>
          </h1>

          {/* Subtitle */}
          <p className="portal-hero-subtitle">

          </p>
        </section>

        {/* RIGHT COLUMN: ELEVATED AUTHENTICATION CARD OVER MINT AREA */}
        <section className={`portal-card-column ${isRegister ? 'is-register-mode' : ''}`}>
          <div className={`portal-auth-card ${isRegister ? 'is-register-mode' : ''}`}>
            {/* Card Header with Zenve Golden Logo */}
            <div className="auth-card-header">
              <div className="auth-logo-badge-wrap">
                <img
                  src={zenveLogo}
                  alt="Zenve Logo"
                  className="auth-card-zenve-logo"
                />
              </div>
              <div className="auth-header-text">
                <h2 className="auth-header-title">
                  {isRegister ? 'Create Doctor Account' : 'Welcome to Zenve Vet'}
                </h2>
                <p className="auth-header-sub">
                  {isRegister
                    ? 'Join India’s verified veterinary medical registry'
                    : 'Sign in with your registered Email ID'}
                </p>
              </div>
            </div>

            {/* Segmented Switcher Pill Bar */}
            <div className="auth-segmented-pill-bar">
              <button
                type="button"
                className={`auth-switcher-btn ${!isRegister ? 'is-active' : ''}`}
                onClick={() => { setIsRegister(false); setErrorMsg(''); }}
              >
                <User size={14} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-switcher-btn ${isRegister ? 'is-active' : ''}`}
                onClick={() => { setIsRegister(true); setErrorMsg(''); }}
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="auth-error-banner">
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="auth-form-fields">
              {isRegister ? (
                <>
                  {/* Full Name */}
                  <div className="auth-field-group">
                    <label className="auth-field-label">Full Name & Title *</label>
                    <div className="auth-input-container">
                      <User size={15} className="auth-input-lead-icon" />
                      <input
                        type="text"
                        required
                        placeholder="Dr. Arjun Mehta, BVSc"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="auth-text-input"
                      />
                    </div>
                  </div>

                  {/* Row 2: Specialty */}
                  <div className="auth-field-group">
                    <label className="auth-field-label">Specialty *</label>
                    <select
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      className="auth-select-input"
                    >
                      {SPECIALTIES.filter(s => s !== 'All specialties').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Row 3: State & City */}
                  <div className="auth-two-col-grid">
                    <div className="auth-field-group">
                      <label className="auth-field-label">State</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="auth-select-input"
                      >
                        <option value="">Select State</option>
                        {STATES_INDIA.filter(s => s !== 'All states').map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">City / Town</label>
                      <div className="auth-input-container">
                        <MapPin size={15} className="auth-input-lead-icon" />
                        <input
                          type="text"
                          placeholder="e.g. Pune, Mumbai"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="auth-text-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Official Email & Phone Number */}
                  <div className="auth-two-col-grid">
                    <div className="auth-field-group">
                      <label className="auth-field-label">Official Email Address *</label>
                      <div className="auth-input-container">
                        <Mail size={15} className="auth-input-lead-icon" />
                        <input
                          type="email"
                          required
                          placeholder="doctor@clinic.com"
                          value={formData.identifier}
                          onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                          className="auth-text-input"
                        />
                      </div>
                    </div>

                    <div className="auth-field-group">
                      <label className="auth-field-label">Phone / Mobile Number</label>
                      <div className="auth-input-container">
                        <Phone size={15} className="auth-input-lead-icon" />
                        <input
                          type="tel"
                          placeholder="+91 98401 23456"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="auth-text-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Password */}
                  <div className="auth-field-group">
                    <label className="auth-field-label">Create Password</label>
                    <div className="auth-input-container">
                      <Lock size={15} className="auth-input-lead-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Choose password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="auth-text-input"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions Agreement */}
                  <div className="auth-field-group auth-terms-compact-wrap">
                    <label className="auth-terms-compact-label">
                      <input
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                        className="auth-terms-compact-checkbox"
                      />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenTerms && onOpenTerms();
                          }}
                          className="auth-terms-compact-btn"
                        >
                          Terms & Conditions
                        </button>
                        {' '}of <strong>Zenve Pets Healthcare Pvt. Ltd.</strong> and confirm veterinary licensure.
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Sign In Method Tab Switcher */}
                  <div style={{
                    display: 'flex',
                    background: '#F1F5F9',
                    borderRadius: '10px',
                    padding: '3px',
                    marginBottom: '18px'
                  }}>
                    <button
                      type="button"
                      onClick={() => { setSignInMethod('password'); setErrorMsg(''); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        background: signInMethod === 'password' ? '#FFFFFF' : 'transparent',
                        color: signInMethod === 'password' ? '#0F172A' : '#64748B',
                        boxShadow: signInMethod === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      <Lock size={14} />
                      <span>Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSignInMethod('otp'); setErrorMsg(''); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        background: signInMethod === 'otp' ? '#FFFFFF' : 'transparent',
                        color: signInMethod === 'otp' ? '#0F172A' : '#64748B',
                        boxShadow: signInMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      <Smartphone size={14} />
                      <span>Mobile OTP</span>
                    </button>
                  </div>

                  {signInMethod === 'password' ? (
                    <>
                      {/* Email / Phone / Doctor Name */}
                      <div className="auth-field-group">
                        <label className="auth-field-label">Email ID, Phone Number</label>
                        <div className="auth-input-container">
                          <User size={16} className="auth-input-lead-icon" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. doctor@gmail.com"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            className="auth-text-input"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="auth-field-group">
                        <div className="auth-label-split">
                          <label className="auth-field-label">Password</label>
                          <button
                            type="button"
                            onClick={handleOpenForgotModal}
                            className="auth-forgot-link"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="auth-input-container">
                          <Lock size={16} className="auth-input-lead-icon" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="auth-text-input"
                          />
                          <button
                            type="button"
                            className="auth-eye-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me Checkbox */}
                      <div className="auth-remember-row">
                        <label
                          className="auth-custom-checkbox-label"
                          onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
                        >
                          <div className={`auth-custom-checkbox-box ${formData.rememberMe ? 'is-checked' : ''}`}>
                            {formData.rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                          </div>
                          <span className="auth-checkbox-text">Remember me on this workstation</span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Mobile OTP Flow */}
                      {!otpSent ? (
                        <div className="auth-field-group">
                          <label className="auth-field-label">Registered Mobile Number *</label>
                          <div className="auth-input-container">
                            <Phone size={16} className="auth-input-lead-icon" />
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              placeholder="Enter 10-digit mobile number"
                              value={otpMobile}
                              onChange={(e) => setOtpMobile(e.target.value.replace(/[^0-9]/g, ''))}
                              className="auth-text-input"
                              style={{ letterSpacing: '1px', fontWeight: 600 }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* OTP Sent Banner */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            padding: '11px 14px',
                            backgroundColor: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            fontSize: '12.5px',
                            color: '#065F46'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <KeyRound size={16} color="#059669" style={{ flexShrink: 0 }} />
                              <span>OTP sent to <strong>{otpMaskedPhone}</strong></span>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setOtpSent(false); setOtpCode(''); }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#047857',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Edit
                            </button>
                          </div>

                          <div className="auth-field-group">
                            <div className="auth-label-split">
                              <label className="auth-field-label">6-Digit Login Code *</label>
                              <button
                                type="button"
                                className="auth-forgot-link"
                                onClick={handleSendLoginOtp}
                                disabled={otpLoading}
                              >
                                Resend OTP
                              </button>
                            </div>
                            <div className="auth-input-container">
                              <KeyRound size={16} className="auth-input-lead-icon" />
                              <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className="auth-text-input"
                                style={{ letterSpacing: '4px', fontWeight: 700 }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading || otpLoading}
              >
                <span>
                  {isLoading || otpLoading
                    ? 'Authenticating...'
                    : isRegister
                      ? 'Create Account & Verify Credentials'
                      : signInMethod === 'otp'
                        ? (!otpSent ? 'Send Login OTP' : 'Verify & Sign In')
                        : 'Sign In to Zenve Vet'}
                </span>
                <ArrowRight size={17} strokeWidth={2.4} />
              </button>
            </form>

            {/* Regulatory Compliance Footer */}
            <div className={`auth-regulatory-box ${isRegister ? 'is-register-mode' : ''}`}>
              <Shield size={15} className="regulatory-icon" />
              <p className="regulatory-copy">
                {isRegister
                  ? 'Zenve Vet authenticates licensed veterinary surgeons under State & National Veterinary Council frameworks.'
                  : 'Zenve Vet strictly authenticates licensed veterinary surgeons and clinical residents under State & National Veterinary Council frameworks.'}
                {' '}
                <button
                  type="button"
                  onClick={onOpenTerms}
                  style={{
                    color: '#065f46',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'inline'
                  }}
                >
                  Terms & Conditions
                </button>
              </p>
            </div>
          </div>

          {/* Compact Feature Pillars beneath Auth Card */}
          <div className="portal-right-pillars-row">
            <div className="right-pillar-pill">
              <Users size={13} color="#065F46" />
              <span>Peer-reviewed cases</span>
            </div>
            <div className="right-pillar-pill">
              <FileText size={13} color="#065F46" />
              <span>CME webinars</span>
            </div>
            <div className="right-pillar-pill">
              <Headphones size={13} color="#065F46" />
              <span>24/7 Helpline</span>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="auth-forgot-modal-backdrop" onClick={() => !forgotLoading && setShowForgotModal(false)}>
          <div className="auth-forgot-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="auth-forgot-modal-head">
              <div className="auth-forgot-head-left">
                <div className="auth-forgot-icon-badge">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="auth-forgot-title">Reset Password</h3>
                  <p className="auth-forgot-subtitle">
                    {forgotStep === 1 && 'Enter your registered doctor email or mobile number'}
                    {forgotStep === 2 && 'Enter verification code and choose a new password'}
                    {forgotStep === 3 && 'Account recovery complete!'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="auth-forgot-close-btn"
                onClick={() => setShowForgotModal(false)}
                disabled={forgotLoading}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Stepper indicator bar */}
            <div className="auth-forgot-steps-bar">
              <div className={`auth-forgot-step-pill ${forgotStep === 1 ? 'is-active' : forgotStep > 1 ? 'is-done' : ''}`}>
                <div className="auth-forgot-step-num">
                  {forgotStep > 1 ? <Check size={11} strokeWidth={3} /> : '1'}
                </div>
                <span>Account ID</span>
              </div>
              <div className={`auth-forgot-step-pill ${forgotStep === 2 ? 'is-active' : forgotStep > 2 ? 'is-done' : ''}`}>
                <div className="auth-forgot-step-num">
                  {forgotStep > 2 ? <Check size={11} strokeWidth={3} /> : '2'}
                </div>
                <span>Verification</span>
              </div>
              <div className={`auth-forgot-step-pill ${forgotStep === 3 ? 'is-active' : ''}`}>
                <div className="auth-forgot-step-num">3</div>
                <span>New Password</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="auth-forgot-modal-body">
              {forgotError && (
                <div className="auth-forgot-error">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* STEP 1: ENTER IDENTIFIER */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestResetCode}>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                    Please provide your registered veterinary email address, mobile number, or doctor name. We will generate an instant verification code.
                  </p>

                  <div className="auth-field-group">
                    <label className="auth-field-label">Email or Mobile Number</label>
                    <div className="auth-input-container">
                      <Mail size={16} className="auth-input-lead-icon" />
                      <input
                        type="text"
                        autoFocus
                        required
                        placeholder="e.g. zenve@gmail.com "
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="auth-text-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="portal-back-btn"
                      style={{ flex: '1', justifyContent: 'center' }}
                      onClick={() => setShowForgotModal(false)}
                      disabled={forgotLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      style={{ flex: '2', marginTop: 0 }}
                      disabled={forgotLoading}
                    >
                      <span>{forgotLoading ? 'Searching...' : 'Send Verification Code'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: ENTER CODE & SET NEW PASSWORD */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPassword}>
                  {/* Live OTP Notification */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 14px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '12.5px',
                    color: '#065F46'
                  }}>
                    <KeyRound size={16} color="#059669" style={{ flexShrink: 0 }} />
                    <span>
                      A 6-digit verification code has been dispatched from <strong>no-reply@zenvevet.com</strong> to your registered email{maskedEmail ? `: ` : '.'}
                      {maskedEmail && <strong style={{ color: '#047857' }}>{maskedEmail}</strong>}
                      {maskedPhone && <span style={{ display: 'block', marginTop: '2px', fontSize: '11.5px', color: '#047857' }}>SMS alert also dispatched to: {maskedPhone}</span>}
                    </span>
                  </div>

                  <div className="auth-field-group">
                    <div className="auth-label-split">
                      <label className="auth-field-label">6-Digit Verification Code</label>
                      <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={handleRequestResetCode}
                        disabled={forgotLoading}
                      >
                        Resend Code
                      </button>
                    </div>
                    <div className="auth-input-container">
                      <KeyRound size={16} className="auth-input-lead-icon" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit OTP code"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        className="auth-text-input"
                        style={{ letterSpacing: '3px', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div className="auth-field-group" style={{ marginTop: '14px' }}>
                    <label className="auth-field-label">New Password</label>
                    <div className="auth-input-container">
                      <Lock size={16} className="auth-input-lead-icon" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter at least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="auth-text-input"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-field-group" style={{ marginTop: '14px' }}>
                    <label className="auth-field-label">Confirm New Password</label>
                    <div className="auth-input-container">
                      <Lock size={16} className="auth-input-lead-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-type your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="auth-text-input"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                    <button
                      type="button"
                      className="portal-back-btn"
                      style={{ flex: '1', justifyContent: 'center' }}
                      onClick={() => setForgotStep(1)}
                      disabled={forgotLoading}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      style={{ flex: '2', marginTop: 0 }}
                      disabled={forgotLoading}
                    >
                      <span>{forgotLoading ? 'Updating Password...' : 'Save New Password'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS STATE */}
              {forgotStep === 3 && (
                <div className="auth-forgot-success-box">
                  <div className="auth-forgot-success-icon">
                    <CheckCircle2 size={36} color="#059669" />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
                    Password Reset Complete!
                  </h4>
                  <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
                    {forgotSuccessMsg || 'Your new password has been set. You can now log in securely.'}
                  </p>

                  <button
                    type="button"
                    className="auth-submit-btn"
                    style={{ width: '100%', marginTop: 0 }}
                    onClick={handleForgotSuccessDone}
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
