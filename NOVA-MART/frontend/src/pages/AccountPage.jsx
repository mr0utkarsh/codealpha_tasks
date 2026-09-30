import { useState } from 'react';
import { Check, KeyRound, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../lib/format.js';
import PageHeader from '../components/layout/PageHeader.jsx';
import AccountNav from '../components/layout/AccountNav.jsx';
import Button from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Field.jsx';
import { InlineAlert } from '../components/ui/Feedback.jsx';
import { Badge } from '../components/ui/Badge.jsx';

/**
 * Account home: profile details, membership perks and password change.
 */
export function AccountPage() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [profileError, setProfileError] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordError, setPasswordError] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (profile.name.trim().length < 2) {
      setProfileError('Enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      await updateProfile({ name: profile.name.trim() });
      toast.success('Your profile has been updated.');
    } catch (requestError) {
      setProfileError(requestError.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!passwords.current) errors.current = 'Enter your current password.';
    if (passwords.next.length < 8) errors.next = 'Use at least 8 characters.';
    if (passwords.confirm !== passwords.next) errors.confirm = 'Passwords do not match.';

    if (Object.keys(errors).length) {
      setPasswordErrors(errors);
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);
    setPasswordErrors({});

    try {
      await changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      toast.success('Your password has been changed.');
    } catch (requestError) {
      setPasswordError(requestError.message);
      setPasswordErrors(requestError.fieldErrors ?? {});
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Account' }]}
        title={`Hey, ${user?.name ?? 'there'}`}
        description={`Member since ${user?.createdAt ? formatDate(user.createdAt) : 'today'} · ${user?.email ?? ''}`}
        actions={
          <Button variant="secondary" onClick={logout}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        }
      />

      <div className="container grid gap-8 py-10 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <AccountNav className="lg:sticky lg:top-28 lg:h-fit" />


        <div className="space-y-8">
          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <User className="size-4 text-ink-400" aria-hidden="true" />
              Profile details
            </h2>

            <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
              {profileError && (
                <InlineAlert tone="danger" title="Could not save">
                  {profileError}
                </InlineAlert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, name: event.target.value }))
                  }
                  autoComplete="name"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  disabled
                  readOnly
                  hint="Email changes are handled by support."
                />
              </div>

              <Button type="submit" isLoading={isSavingProfile}>
                <Check className="size-4" aria-hidden="true" />
                Save changes
              </Button>
            </form>
          </section>

          <section className="rounded-3xl border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900/40">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold">
              <KeyRound className="size-4 text-ink-400" aria-hidden="true" />
              Change password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              {passwordError && (
                <InlineAlert tone="danger" title="Could not change your password">
                  {passwordError}
                </InlineAlert>
              )}

              <Input
                label="Current password"
                type="password"
                value={passwords.current}
                onChange={(event) =>
                  setPasswords((current) => ({ ...current, current: event.target.value }))
                }
                error={passwordErrors.current}
                autoComplete="current-password"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, next: event.target.value }))
                  }
                  error={passwordErrors.next}
                  autoComplete="new-password"
                  required
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, confirm: event.target.value }))
                  }
                  error={passwordErrors.confirm}
                  autoComplete="new-password"
                  required
                />
              </div>

              <Button type="submit" variant="secondary" isLoading={isSavingPassword}>
                Update password
              </Button>
            </form>
          </section>

          <section className="rounded-3xl border border-brand-200 bg-brand-50/60 p-6 dark:border-brand-500/30 dark:bg-brand-500/10">
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="size-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <h2 className="font-display text-base font-semibold">Nova membership</h2>
              <Badge tone="brand">Active</Badge>
            </div>
            <ul className="mt-4 grid gap-2 text-sm text-ink-600 dark:text-ink-300 sm:grid-cols-2">
              <li>Free express shipping over $150</li>
              <li>30-day free returns on every order</li>
              <li>Early access to seasonal drops</li>
              <li>Members-only pricing events</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

export default AccountPage;
