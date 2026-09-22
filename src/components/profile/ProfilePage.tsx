import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  LogOut, 
  HelpCircle, 
  FileText, 
  Sparkles,
  ExternalLink,
  Check,
  Camera,
  Home,
  AlertCircle,
  Loader2,
  Upload,
  Calendar,
  Clock,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AVATAR_PRESETS = [
  { id: 'p1', label: 'Default', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' },
  { id: 'p2', label: 'Executive', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80' },
  { id: 'p3', label: 'Portrait', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
];

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const activeUser = user || profile;

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(activeUser?.full_name || activeUser?.name || 'Bhaskar');
  const [email, setEmail] = useState(activeUser?.email || 'bhaskar@example.com');
  const [phone, setPhone] = useState(activeUser?.phone || '+91 98765 43210');
  const [homeName, setHomeName] = useState(activeUser?.home_name || 'Bhaskar Home');
  const [address, setAddress] = useState(activeUser?.home_address || 'Villa 42, Palm Meadows, Whitefield, Bengaluru');
  const [avatarUrl, setAvatarUrl] = useState(activeUser?.avatar_url || AVATAR_PRESETS[0].url);
  
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showPrivacyDoc, setShowPrivacyDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local form fields whenever user updates in context
  useEffect(() => {
    if (activeUser) {
      setFullName(activeUser.full_name || activeUser.name || 'Bhaskar');
      setEmail(activeUser.email || 'bhaskar@example.com');
      setPhone(activeUser.phone || '+91 98765 43210');
      setHomeName(activeUser.home_name || 'Bhaskar Home');
      setAddress(activeUser.home_address || 'Villa 42, Palm Meadows, Whitefield, Bengaluru');
      setAvatarUrl(activeUser.avatar_url || AVATAR_PRESETS[0].url);
    }
  }, [activeUser]);

  const handleStartEdit = () => {
    if (activeUser) {
      setFullName(activeUser.full_name || activeUser.name || 'Bhaskar');
      setEmail(activeUser.email || 'bhaskar@example.com');
      setPhone(activeUser.phone || '+91 98765 43210');
      setHomeName(activeUser.home_name || 'Bhaskar Home');
      setAddress(activeUser.home_address || 'Villa 42, Palm Meadows, Whitefield, Bengaluru');
      setAvatarUrl(activeUser.avatar_url || AVATAR_PRESETS[0].url);
    }
    setValidationError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (activeUser) {
      setFullName(activeUser.full_name || activeUser.name || 'Bhaskar');
      setEmail(activeUser.email || 'bhaskar@example.com');
      setPhone(activeUser.phone || '+91 98765 43210');
      setHomeName(activeUser.home_name || 'Bhaskar Home');
      setAddress(activeUser.home_address || 'Villa 42, Palm Meadows, Whitefield, Bengaluru');
      setAvatarUrl(activeUser.avatar_url || AVATAR_PRESETS[0].url);
    }
    setValidationError(null);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setValidationError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Limit file size to 2.5MB
    if (file.size > 2.5 * 1024 * 1024) {
      setValidationError('Image size must be under 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        setValidationError(null);
      }
    };
    reader.onerror = () => {
      setValidationError('Failed to read image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setValidationError('Please enter a valid full name (at least 2 characters).');
      return;
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setValidationError('Please enter a valid phone number (at least 7 digits).');
      return;
    }

    const trimmedHomeName = homeName.trim() || `${trimmedName} Home`;
    const trimmedAddress = address.trim();

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: trimmedName,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        home_name: trimmedHomeName,
        home_address: trimmedAddress,
        avatar_url: avatarUrl,
      });

      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setValidationError(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentDisplayName = activeUser?.full_name || activeUser?.name || 'Bhaskar';
  const currentDisplayAvatar = activeUser?.avatar_url || AVATAR_PRESETS[0].url;

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <User className="h-5 w-5 text-zinc-900" />
          Homeowner Profile
        </h1>
        <p className="text-xs text-zinc-500">
          Account information, home dispatch address, and ethical privacy governance.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Avatar with photo editor integration */}
          <div className="relative group">
            <div className="h-20 w-20 rounded-full overflow-hidden ring-4 ring-zinc-100 shrink-0 bg-zinc-100 flex items-center justify-center shadow-xs">
              <img
                src={isEditing ? avatarUrl : currentDisplayAvatar}
                alt={currentDisplayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = AVATAR_PRESETS[0].url;
                }}
              />
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/45 flex flex-col items-center justify-center text-white transition hover:bg-black/55 shadow-sm"
                title="Upload profile photo"
              >
                <Camera className="h-5 w-5 mb-0.5" />
                <span className="text-[9px] font-bold tracking-tight">CHANGE</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-zinc-900">{currentDisplayName}</h2>
            <p className="text-xs text-zinc-600 font-medium">Primary Resident & System Administrator</p>
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Bengaluru, KA
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Shield className="h-3 w-3" />
                {activeUser?.home_name || 'Protected Home'}
              </span>
            </div>
          </div>

          <button
            onClick={isEditing ? handleCancelEdit : handleStartEdit}
            disabled={isSaving}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition disabled:opacity-50"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 animate-in fade-in">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">Profile updated successfully. All screens and security dispatches are synchronized.</span>
          </div>
        )}

        {validationError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-zinc-100">
            {/* Quick Photo Presets & Upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Profile Photo
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setValidationError(null);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition ${
                      avatarUrl === preset.url
                        ? 'border-zinc-900 bg-zinc-900 text-white font-medium shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Bhaskara Rao"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs transition"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bhaskar@example.com"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs transition"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs transition"
              />
            </div>

            {/* Home / Property Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Home / Property Name
              </label>
              <input
                type="text"
                value={homeName}
                onChange={(e) => setHomeName(e.target.value)}
                placeholder="e.g. Rao Residence or Bhaskar Home"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs transition"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Displayed in system status, security briefs, and dispatch alerts.
              </p>
            </div>

            {/* Emergency Dispatch Address */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Emergency Dispatch Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Villa 42, Palm Meadows, Whitefield, Bengaluru"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-xs transition"
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Transmitted to emergency contacts during verified SOS escalations.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 shadow-xs transition disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 pt-4 border-t border-zinc-100 text-xs">
            <div className="flex items-center gap-3 text-zinc-700">
              <User className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="font-semibold text-zinc-900">{currentDisplayName}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{activeUser?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Key className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="font-mono text-[11px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                User ID: {activeUser?.id || 'usr-local'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-600">
                Member since {activeUser?.created_at ? new Date(activeUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Clock className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-zinc-600">
                Last session: {activeUser?.last_login_at ? new Date(activeUser.last_login_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Active now'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Home className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{activeUser?.home_name || 'Protected Home'}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{activeUser?.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <MapPin className="h-4 w-4 text-zinc-400 shrink-0" />
              <span>{activeUser?.home_address || 'Villa 42, Palm Meadows, Whitefield, Bengaluru'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Governance & Support */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Governance & Support
        </h3>

        <button
          onClick={() => setShowPrivacyDoc(!showPrivacyDoc)}
          className="w-full flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs text-zinc-800 hover:bg-zinc-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-zinc-600" />
            <span className="font-medium">Ethical AI & Privacy Charter</span>
          </div>
          <span className="text-[11px] font-semibold text-zinc-500">Read</span>
        </button>

        {showPrivacyDoc && (
          <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200 text-xs text-zinc-600 space-y-2 animate-in fade-in">
            <div className="font-bold text-zinc-900">SANJAYA Core Privacy Tenet:</div>
            <p>
              1. <strong>Zero Presumption of Threat:</strong> Unknown visitors are strictly classified as "Unrecognized", never labelled as criminal, suspicious, or dangerous.
            </p>
            <p>
              2. <strong>Homeowner in the Loop:</strong> Real humans make every escalation decision. No algorithmic automated calls to law enforcement occur without your explicit approval or countdown timeout.
            </p>
            <p>
              3. <strong>On-Device Face Matching:</strong> Reference facial embeddings never leave your private secured vault.
            </p>
          </div>
        )}

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs text-zinc-800 hover:bg-zinc-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-4 w-4 text-zinc-600" />
            <span className="font-medium">Help Center & Edge Vision Setup</span>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
        </a>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 py-3.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out of SANJAYA</span>
      </button>
    </div>
  );
};

