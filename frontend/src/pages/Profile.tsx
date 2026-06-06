import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import SearchableDropdown from '../components/SearchableDropdown';
// import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
    // const { user: authUser, login } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [error, setError] = useState('');
    const [requestError, setRequestError] = useState('');
    const [success, setSuccess] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [userRequests, setUserRequests] = useState<any[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        city: '',
        state: '',
        country: '',
        communityId1: '',
        communityId2: '',
    });

    const [requestData, setRequestData] = useState<{
        id?: number;
        name: string;
        shortName: string;
        description: string;
        isOnline: boolean;
        city: string;
        state: string;
    }>({
        name: '',
        shortName: '',
        description: '',
        isOnline: false,
        city: '',
        state: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, communitiesRes, requestsRes] = await Promise.all([
                apiService.getProfile(),
                apiService.getCommunities(),
                apiService.getUserCommunityRequests()
            ]);
            const p = profileRes.data;
            setProfile(p);
            setCommunities(communitiesRes.data);
            setUserRequests(requestsRes.data.requests || []);
            setFormData({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                phoneNumber: p.phoneNumber || '',
                city: p.city || '',
                state: p.state || '',
                country: p.country || '',
                communityId1: p.communityId1 || '',
                communityId2: p.communityId2 || '',
            });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDropdownChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setRequestData(prev => ({ ...prev, [name]: val }));
    };

    const handleSaveProfileClick = () => {
        if (formData.communityId1 && formData.communityId2 && formData.communityId1 === formData.communityId2) {
            setError('Community 1 and Community 2 must be different.');
            return;
        }

        const comm1Changed = formData.communityId1 !== (profile.communityId1 || '');
        const comm2Changed = formData.communityId2 !== (profile.communityId2 || '');

        if (comm1Changed || comm2Changed) {
            setShowConfirmModal(true);
        } else {
            executeSaveProfile();
        }
    };

    const executeSaveProfile = async () => {
        try {
            setEditLoading(true);
            setError('');
            setSuccess('');
            await apiService.updateProfile(formData);
            setSuccess('Profile updated successfully');
            setIsEditing(false);
            setShowConfirmModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
            setShowConfirmModal(false);
        } finally {
            setEditLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        try {
            setEditLoading(true);
            setRequestError('');
            setSuccess('');

            const isMissingRequired = !requestData.name || !requestData.shortName;
            const isMissingLocation = !requestData.isOnline && (!requestData.city || !requestData.state);

            if (isMissingRequired || isMissingLocation) {
                setRequestError('Please fill in all required details for the new community request.');
                setEditLoading(false);
                return;
            }

            if (requestData.id) {
                await apiService.updateUserCommunityRequest(requestData.id, requestData);
                setSuccess('Community request updated successfully');
            } else {
                await apiService.submitCommunityRequest(requestData);
                setSuccess('Community request submitted successfully');
            }
            setShowRequestForm(false);
            setRequestError('');
            fetchData();
        } catch (err: any) {
            setRequestError(err.response?.data?.error || 'Failed to submit request');
        } finally {
            setEditLoading(false);
        }
    };

    const getCommunityName = (communityId: string) => {
        const community = communities.find(c => c.communityId === communityId);
        return community ? (community.fullName || community.name) : 'Unknown';
    };

    const getCommunityFullName = (communityId: string) => {
        const community = communities.find(c => c.communityId === communityId);
        if (!community) return '';
        return community.fullName || community.name;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] px-4 py-8 text-white">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'radial-gradient(ellipse 70% 50% at 50% 20%, #ffffff 0%, transparent 70%), ' +
                        'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                }}
            />
            <div className="relative z-10 max-w-4xl mx-auto">
            {success && (
                <div className="mb-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-emerald-100 shadow-lg backdrop-blur-sm relative">
                    {success}
                    <button onClick={() => setSuccess('')} className="absolute right-3 top-2 text-emerald-100/80 hover:text-white">×</button>
                </div>
            )}
            {error && (
                <div className="mb-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-rose-100 shadow-lg backdrop-blur-sm relative">
                    {error}
                    <button onClick={() => setError('')} className="absolute right-3 top-2 text-rose-100/80 hover:text-white">×</button>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl mb-8">
                <div
                    className="relative flex items-start justify-between overflow-hidden px-8 py-10 text-white"
                    style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
                >
                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
                                'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                        }}
                    />
                    <div className="relative z-10 flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition flex-shrink-0"
                            aria-label="Back to Dashboard"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
                            <p className="text-blue-200 mt-1 uppercase tracking-widest text-xs font-bold">{profile.role}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Details */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Personal Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">Email</label>
                                    <p className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 font-medium text-white/90">{profile.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">First Name</label>
                                        <p className="font-medium text-white/90 px-1">{profile.firstName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">Last Name</label>
                                        <p className="font-medium text-white/90 px-1">{profile.lastName}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">Phone Number</label>
                                    <p className="font-medium text-white/90 px-1">{profile.phoneNumber || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Location
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">City</label>
                                        <p className="font-medium text-white/90 px-1">{profile.city || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">State</label>
                                        <p className="font-medium text-white/90 px-1">{profile.state || '-'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-white/45 uppercase font-black mb-0.5">Country</label>
                                    <p className="font-medium text-white/90 px-1">{profile.country || '-'}</p>
                                </div>
                            </div>
                        </div>


                        {/* Communities */}
                        <div className="md:col-span-2 pt-6 border-t border-white/10">
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        My Communities
                                    </h2>
                                    <div className="flex gap-2">
                                        {!showRequestForm && !isEditing && (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-1.5 text-[11px] font-bold text-sky-100 transition hover:bg-sky-400/20 hover:border-sky-300/45 flex items-center gap-1.5"
                                            >
                                                ✎ Edit
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mb-4 flex gap-3 items-center rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-amber-400/20 p-1.5 rounded-full">
                                            <svg className="w-4 h-4 text-amber-200 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-[11px] text-amber-50 font-medium leading-relaxed">
                                            <span className="font-extrabold uppercase text-amber-200">Warning:</span> Changing your community will <span className="font-bold underline decoration-amber-300 underline-offset-2">not transfer</span> your previous game points to the new community. This action cannot be undone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <label className="block text-[9px] text-white/45 uppercase font-black mb-1">
                                        Primary Community <span className="text-[10px] text-white/40 font-normal uppercase">(Optional)</span>
                                    </label>
                                    {isEditing ? (
                                        <>
                                            <SearchableDropdown
                                                value={formData.communityId1}
                                                onChange={(val) => handleDropdownChange('communityId1', val)}
                                                options={communities
                                                    .filter((c) => c.communityId !== formData.communityId2)
                                                    .map(c => ({ id: c.communityId, label: c.name }))}
                                                placeholder="Search community..."
                                            />
                                            <p className="mt-2 min-h-[1rem] text-xs font-medium text-sky-200">
                                                {formData.communityId1 ? getCommunityFullName(formData.communityId1) : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-bold text-white">{profile.communityId1 ? getCommunityName(profile.communityId1) : 'None assigned'}</p>
                                    )}
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <label className="block text-[9px] text-white/45 uppercase font-black mb-1">
                                        Secondary Community <span className="text-[10px] text-white/40 font-normal uppercase">(Optional)</span>
                                    </label>
                                    {isEditing ? (
                                        <>
                                            <SearchableDropdown
                                                value={formData.communityId2}
                                                onChange={(val) => handleDropdownChange('communityId2', val)}
                                                options={communities
                                                    .filter((c) => c.communityId !== formData.communityId1)
                                                    .map(c => ({ id: c.communityId, label: c.name }))}
                                                placeholder="Search community..."
                                            />
                                            <p className="mt-2 min-h-[1rem] text-xs font-medium text-white/80">
                                                {formData.communityId2 ? getCommunityFullName(formData.communityId2) : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-bold text-white">{profile.communityId2 ? getCommunityName(profile.communityId2) : 'None assigned'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Save Button for Edit Mode - Positioned after inputs, before status blocks */}
                            {isEditing && (
                                <div className="mt-8 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        disabled={editLoading}
                                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfileClick}
                                        disabled={editLoading}
                                        className="bg-secondary text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {editLoading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                        {editLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}

                            {/* Add Community Request Form */}
                            {showRequestForm && (
                                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl animate-in fade-in slide-in-from-top-4">
                                    {requestError && (
                                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 animate-in fade-in slide-in-from-top-2">
                                            <span className="text-lg">⚠️</span>
                                            {requestError}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white">New Community Request</h3>
                                        <button onClick={() => setShowRequestForm(false)} className="text-white/50 hover:text-white">✕</button>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            id="req_isOnline"
                                            name="isOnline"
                                            checked={requestData.isOnline}
                                            onChange={handleRequestChange}
                                            className="w-4 h-4 rounded border-white/20 text-secondary focus:ring-secondary"
                                        />
                                        <label htmlFor="req_isOnline" className="cursor-pointer text-xs font-bold uppercase text-white/80">
                                            This is an Online Community
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-white/70  mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={requestData.name}
                                                onChange={handleRequestChange}
                                                placeholder="e.g. Mountain House Sports"
                                                className="w-full rounded border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:ring-1 focus:ring-secondary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-white/70  mb-1">
                                                Short Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="shortName"
                                                value={requestData.shortName}
                                                onChange={handleRequestChange}
                                                placeholder="e.g. MHS"
                                                className="w-full rounded border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:ring-1 focus:ring-secondary"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="block text-[11px] font-bold text-white/70  mb-1">
                                            Description <span className="font-normal normal-case text-white/45">(Optional)</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={requestData.description}
                                            onChange={handleRequestChange}
                                            placeholder="Tell us about this community..."
                                            rows={2}
                                            className="w-full rounded border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:ring-1 focus:ring-secondary"
                                        />
                                    </div>

                                    {!requestData.isOnline && (
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-white/70  mb-1">
                                                    City <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={requestData.city}
                                                    onChange={handleRequestChange}
                                                    placeholder="e.g. Mountain House"
                                                    className="w-full rounded border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:ring-1 focus:ring-secondary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-white/70  mb-1">
                                                    State <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={requestData.state}
                                                    onChange={handleRequestChange}
                                                    placeholder="e.g. California"
                                                    className="w-full rounded border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:ring-1 focus:ring-secondary"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end mt-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowRequestForm(false)}
                                            disabled={editLoading}
                                            className="px-4 py-2 text-sm font-bold text-white/50 transition hover:text-white disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitRequest}
                                            disabled={editLoading}
                                            className="rounded-lg bg-sky-500 px-6 py-2 font-bold text-white transition hover:bg-sky-400 disabled:opacity-50"
                                        >
                                            {editLoading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {(() => {
                                const allRequests = userRequests.filter(r => r);

                                return (
                                    <div className="mt-8">
                                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                My Onboarding Requests
                                            </h2>
                                            {!showRequestForm && (
                                                <button
                                                    onClick={() => {
                                                        setRequestData({ id: undefined, name: '', shortName: '', description: '', isOnline: false, city: '', state: '' });
                                                        setShowRequestForm(true);
                                                    }}
                                                    className="rounded-lg border border-sky-300/25 bg-sky-400/10 px-4 py-1.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/20 hover:border-sky-300/45 flex items-center gap-1"
                                                >
                                                    + Request New Community Onboarding
                                                </button>
                                            )}
                                        </div>

                                        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                                            <table className="w-full text-left text-sm text-white/70">
                                                <thead className="border-b border-white/10 bg-white/5 text-[10px] uppercase tracking-wider text-white/50">
                                                    <tr>
                                                        <th className="p-4 font-medium">Community Details</th>
                                                        <th className="p-4 font-medium">Location</th>
                                                        <th className="p-4 font-medium">Status</th>
                                                        <th className="p-4 font-medium text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {allRequests.map((req, idx) => (
                                                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="p-4">
                                                                <div className="font-bold text-white text-base">{req.name}</div>
                                                                {req.shortName && <div className="text-[10px] font-mono text-white/50 mt-0.5">Code: {req.shortName}</div>}
                                                                {req.description && <div className="text-[11px] italic text-white/40 mt-1 truncate max-w-[250px]">"{req.description}"</div>}
                                                            </td>
                                                            <td className="p-4">
                                                                {req.isOnline ? (
                                                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">● Online</span>
                                                                ) : (
                                                                    <span className="text-xs">
                                                                        {req.city}{req.city && req.state ? ', ' : ''}{req.state}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                                    req.status === 'Admin Rejected' ? 'bg-rose-500/20 text-rose-200' : 
                                                                    req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-200' :
                                                                    req.status === 'User Deleted' ? 'bg-gray-500/20 text-gray-400' :
                                                                    'bg-blue-500/20 text-blue-100'
                                                                }`}>
                                                                    {req.status || 'pending'}
                                                                </span>
                                                                {req.existingCommunityId && (
                                                                    <span className="ml-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-100" title="System Match Found">
                                                                        MATCHED
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex justify-end gap-3">
                                                                    {req.status === 'pending' && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setRequestData({
                                                                                        id: req.id,
                                                                                        name: req.name || '',
                                                                                        shortName: req.shortName || '',
                                                                                        description: req.description || '',
                                                                                        isOnline: !!req.isOnline,
                                                                                        city: req.city || '',
                                                                                        state: req.state || ''
                                                                                    });
                                                                                    setShowRequestForm(true);
                                                                                }}
                                                                                className="text-[11px] font-bold uppercase text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded transition"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if(window.confirm(`Are you sure you want to delete this request?`)) {
                                                                                        apiService.deleteUserCommunityRequest(req.id).then(fetchData);
                                                                                    }
                                                                                }}
                                                                                className="text-[11px] font-bold uppercase text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded transition"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    {req.status === 'Admin Rejected' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                if(window.confirm(`Are you sure you want to dismiss this request?`)) {
                                                                                    apiService.deleteUserCommunityRequest(req.id).then(fetchData);
                                                                                }
                                                                            }}
                                                                            className="text-[11px] font-bold uppercase text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded transition"
                                                                        >
                                                                            Dismiss
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {allRequests.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="p-8 text-center text-sm text-white/40 italic">
                                                                No onboarding requests found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                    </div>
                </div>

                <div className="border-t border-white/10 bg-white/5 px-8 py-4 text-xs italic text-white/50">
                    Account status: <span className="text-green-600 font-bold uppercase">{profile.isActive ? 'Active' : 'Inactive'}</span>
                </div>

            </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-amber-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-400"></div>
                        
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 bg-amber-500/20 p-3 rounded-full">
                                <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Change Community?</h3>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Warning: Changing your community will <strong className="text-amber-400">NOT</strong> transfer your previous game points to the new community. 
                                </p>
                                <p className="text-sm text-gray-300 mt-2">
                                    Are you sure you want to proceed?
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={editLoading}
                                className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeSaveProfile}
                                disabled={editLoading}
                                className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {editLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                ) : null}
                                {editLoading ? 'Saving...' : 'Yes, Proceed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
