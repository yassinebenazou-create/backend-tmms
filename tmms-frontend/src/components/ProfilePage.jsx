import { useState } from 'react';
import { UserCircle2, Mail, Shield, CalendarDays, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfilePhoto } from '../api/authApi';

function ProfilePage({ user, onUserUpdate }) {
  const [uploading, setUploading] = useState(false);
  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const dataUrl = String(reader.result || '');
        const res = await updateProfilePhoto(dataUrl);
        onUserUpdate?.(res.user);
        toast.success('Profile photo updated.');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to update profile photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onRemovePhoto = async () => {
    setUploading(true);
    try {
      const res = await updateProfilePhoto(null);
      onUserUpdate?.(res.user);
      toast.success('Profile photo removed.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove profile photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
        <div className="h-28 bg-gradient-to-r from-blue-600/60 to-violet-600/50" />
        <div className="-mt-12 px-6 pb-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-100 bg-slate-800 text-2xl font-semibold text-white shadow-lg dark:border-slate-900">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">TMMS Member Profile</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-600/40 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20">
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : 'Upload photo'}
                <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} disabled={uploading} />
              </label>
              <button
                type="button"
                onClick={onRemovePhoto}
                disabled={uploading || !user?.profilePhoto}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-600/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.email || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4" />
                Role
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.role || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <UserCircle2 className="h-4 w-4" />
                User ID
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{user?.id || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-4 w-4" />
                Last Session
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
