'use client';

import { useEffect, useMemo, useState } from 'react';
import { Lock, Key } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';

interface OverviewTabProfile {
  id: string;
  email: string;
  fullName: string | null;
  timezone?: string | null;
  locale?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  companyName?: string | null;
  dateOfBirth?: string | Date | null;
  bio?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

interface OverviewTabProps {
  profile: OverviewTabProfile;
  onProfileUpdated: (profile: OverviewTabProfile) => void;
  onSavingChange?: (saving: boolean) => void;
  isSaving?: boolean;
  onChangePassword: () => void;
}

export function OverviewTab({
  profile,
  onProfileUpdated,
  onSavingChange,
  isSaving = false,
  onChangePassword,
}: OverviewTabProps) {
  const [fullName, setFullName] = useState(profile.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '');
  const [jobTitle, setJobTitle] = useState(profile.jobTitle ?? '');
  const [department, setDepartment] = useState(profile.department ?? '');
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth
      ? typeof profile.dateOfBirth === 'string'
        ? profile.dateOfBirth
        : profile.dateOfBirth.toISOString().slice(0, 10)
      : ''
  );
  const [bio, setBio] = useState(profile.bio ?? '');
  const [addressLine1, setAddressLine1] = useState(profile.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(profile.addressLine2 ?? '');
  const [city, setCity] = useState(profile.city ?? '');
  const [state, setState] = useState(profile.state ?? '');
  const [postalCode, setPostalCode] = useState(profile.postalCode ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [error, setError] = useState<string | null>(null);
  const [localSaving, setLocalSaving] = useState(false);

  // Keep form in sync when profile changes
  useEffect(() => {
    setFullName(profile.fullName ?? '');
    setPhoneNumber(profile.phoneNumber ?? '');
    setJobTitle(profile.jobTitle ?? '');
    setDepartment(profile.department ?? '');
    setCompanyName(profile.companyName ?? '');
    setDateOfBirth(
      profile.dateOfBirth
        ? typeof profile.dateOfBirth === 'string'
          ? profile.dateOfBirth
          : profile.dateOfBirth.toISOString().slice(0, 10)
        : ''
    );
    setBio(profile.bio ?? '');
    setAddressLine1(profile.addressLine1 ?? '');
    setAddressLine2(profile.addressLine2 ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setPostalCode(profile.postalCode ?? '');
    setCountry(profile.country ?? '');
  }, [profile]);

  const isDirty = useMemo(() => {
    return (
      (profile.fullName ?? '') !== fullName ||
      (profile.phoneNumber ?? '') !== phoneNumber ||
      (profile.jobTitle ?? '') !== jobTitle ||
      (profile.department ?? '') !== department ||
      (profile.companyName ?? '') !== companyName ||
      ((profile.dateOfBirth
        ? typeof profile.dateOfBirth === 'string'
          ? profile.dateOfBirth
          : profile.dateOfBirth.toISOString().slice(0, 10)
        : '') !== dateOfBirth) ||
      (profile.bio ?? '') !== bio ||
      (profile.addressLine1 ?? '') !== addressLine1 ||
      (profile.addressLine2 ?? '') !== addressLine2 ||
      (profile.city ?? '') !== city ||
      (profile.state ?? '') !== state ||
      (profile.postalCode ?? '') !== postalCode ||
      (profile.country ?? '') !== country
    );
  }, [
    profile,
    fullName,
    phoneNumber,
    jobTitle,
    department,
    companyName,
    dateOfBirth,
    bio,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
  ]);

  const effectiveSaving = isSaving || localSaving;

  const handleSave = async () => {
    if (!isDirty || effectiveSaving) return;

    setError(null);
    setLocalSaving(true);
    onSavingChange?.(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          phoneNumber: phoneNumber.trim() || null,
          jobTitle: jobTitle.trim() || null,
          department: department.trim() || null,
          companyName: companyName.trim() || null,
          dateOfBirth: dateOfBirth || null,
          bio: bio.trim() || null,
          addressLine1: addressLine1.trim() || null,
          addressLine2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          postalCode: postalCode.trim() || null,
          country: country.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      if (data.user) {
        onProfileUpdated({
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          timezone: data.user.timezone,
          locale: data.user.locale,
          phoneNumber: data.user.phoneNumber,
          jobTitle: data.user.jobTitle,
          department: data.user.department,
          companyName: data.user.companyName,
          dateOfBirth: data.user.dateOfBirth,
          bio: data.user.bio,
          addressLine1: data.user.addressLine1,
          addressLine2: data.user.addressLine2,
          city: data.user.city,
          state: data.user.state,
          postalCode: data.user.postalCode,
          country: data.user.country,
        });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('An unexpected error occurred while updating your profile');
    } finally {
      setLocalSaving(false);
      onSavingChange?.(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editable Profile Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
            <p className="text-sm text-muted-foreground">
              View and update your basic account details.
            </p>
          </div>
          {isDirty && (
            <Button
              onClick={handleSave}
              disabled={effectiveSaving}
              className="ml-auto"
            >
              {effectiveSaving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />
          <Input
            label="Email address"
            type="email"
            value={profile.email}
            disabled
            placeholder="you@example.com"
          />
          <Input
            label="Phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. +1 555 123 4567"
          />
          <Input
            label="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Product Manager"
          />
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Engineering"
          />
          <Input
            label="Company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
          />
          <Input
            label="Date of birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
          <div className="md:col-span-2">
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself"
            />
          </div>
          <Input
            label="Address line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="Street address, P.O. box, company name"
          />
          <Input
            label="Address line 2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
          />
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            label="State / Province"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <Input
            label="Postal code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Change Password</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Update your password regularly to keep your account secure. We recommend using a
              strong password that you don&apos;t use elsewhere.
            </p>
            <Button onClick={onChangePassword} variant="outline">
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

