import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
// import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
    // const { user: authUser, login } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editLoading, setEditLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [communities, setCommunities] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        whatsappNumber: '',
        city: '',
        state: '',
        country: '',
        communityId1: '',
        communityId2: '',
    });

    const [requestData, setRequestData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileRes, communitiesRes] = await Promise.all([
                apiService.getProfile(),
                apiService.getCommunities()
            ]);
            const p = profileRes.data;
            setProfile(p);
            setCommunities(communitiesRes.data);
            setFormData({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                whatsappNumber: p.whatsappNumber || '',
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



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox';
        const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setRequestData(prev => ({ ...prev, [name]: val }));
    };

    const handleSaveProfile = async () => {
        try {
            // Check if communities have changed
            const comm1Changed = formData.communityId1 !== (profile.communityId1 || '');
            const comm2Changed = formData.communityId2 !== (profile.communityId2 || '');

            if (comm1Changed || comm2Changed) {
                const confirmed = window.confirm(
                    'Warning: Changing your community will NOT transfer your previous game points to the new community. Are you sure you want to proceed?'
                );
                if (!confirmed) return;
            }

            setEditLoading(true);
            setError('');
            setSuccess('');
            await apiService.updateProfile(formData);
            setSuccess('Profile updated successfully');
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        try {
            setEditLoading(true);
            setError('');
            setSuccess('');

            if (!requestData.name) {
                setError('Community Name is required');
                return;
            }

            await apiService.updateProfile({ requestedCommunity: requestData.name });
            setSuccess('Community request submitted successfully');
            setShowRequestForm(false);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit request');
        } finally {
            setEditLoading(false);
        }
    };

    const getCommunityName = (communityId: string) => {
        const community = communities.find(c => c.communityId === communityId);
        return community ? community.name : 'Unknown';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {success && (
                <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                    {success}
                    <button onClick={() => setSuccess('')} className="absolute right-2 top-2">×</button>
                </div>
            )}
            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                    <button onClick={() => setError('')} className="absolute right-2 top-2">×</button>
                </div>
            )}

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mb-8">
                <div className="bg-gradient-to-r from-primary to-blue-900 px-8 py-10 text-white flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
                        <p className="text-blue-200 mt-1 uppercase tracking-widest text-xs font-bold">{profile.role}</p>
                    </div>
                    {!showRequestForm && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-white/20"
                        >
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    )}
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Details */}
                        <div>
                            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Personal Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Email (Private)</label>
                                    <p className="text-gray-400 font-medium bg-gray-50 px-3 py-2 rounded">{profile.email}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">First Name</label>
                                        {isEditing ? (
                                            <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
                                        ) : (
                                            <p className="text-gray-800 font-medium px-1">{profile.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Last Name</label>
                                        {isEditing ? (
                                            <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
                                        ) : (
                                            <p className="text-gray-800 font-medium px-1">{profile.lastName}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">WhatsApp Number</label>
                                    {isEditing ? (
                                        <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" placeholder="+1234567890" />
                                    ) : (
                                        <p className="text-gray-800 font-medium px-1">{profile.whatsappNumber || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Location
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">City</label>
                                        {isEditing ? (
                                            <input name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
                                        ) : (
                                            <p className="text-gray-800 font-medium px-1">{profile.city || '-'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">State</label>
                                        {isEditing ? (
                                            <input name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
                                        ) : (
                                            <p className="text-gray-800 font-medium px-1">{profile.state || '-'}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Country</label>
                                    {isEditing ? (
                                        <input name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 border rounded text-sm" />
                                    ) : (
                                        <p className="text-gray-800 font-medium px-1">{profile.country || '-'}</p>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Communities */}
                        <div className="md:col-span-2 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    My Communities
                                </h2>
                                {isEditing && (
                                    <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-3 items-center">
                                        <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            <span className="font-black uppercase">Important:</span> Changing your community will <span className="underline decoration-amber-500 underline-offset-2">not transfer</span> your previous game points to the new community.
                                        </p>
                                    </div>
                                )}
                                {!profile.requestedCommunity && !showRequestForm && !isEditing && (
                                    <button
                                        onClick={() => setShowRequestForm(true)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-bold transition"
                                    >
                                        + Request New
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <label className="block text-[9px] text-blue-400 uppercase font-black mb-1">Primary Community</label>
                                    {isEditing ? (
                                        <select
                                            name="communityId1"
                                            value={formData.communityId1}
                                            onChange={handleChange}
                                            className="w-full px-2 py-1 text-sm border rounded bg-white font-bold text-primary"
                                        >
                                            <option value="">None</option>
                                            {communities.map(c => (
                                                <option key={c.communityId} value={c.communityId}>{c.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-primary font-bold">{profile.communityId1 ? getCommunityName(profile.communityId1) : 'None assigned'}</p>
                                    )}
                                    {profile.communityId1 && !isEditing && <p className="text-[10px] text-gray-400 mt-1">ID: {profile.communityId1}</p>}
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <label className="block text-[9px] text-gray-400 uppercase font-black mb-1">Secondary Community</label>
                                    {isEditing ? (
                                        <select
                                            name="communityId2"
                                            value={formData.communityId2}
                                            onChange={handleChange}
                                            className="w-full px-2 py-1 text-sm border rounded bg-white font-bold text-gray-700"
                                        >
                                            <option value="">None</option>
                                            {communities.map(c => (
                                                <option key={c.communityId} value={c.communityId}>{c.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-gray-700 font-bold">{profile.communityId2 ? getCommunityName(profile.communityId2) : 'None assigned'}</p>
                                    )}
                                    {profile.communityId2 && !isEditing && <p className="text-[10px] text-gray-400 mt-1">ID: {profile.communityId2}</p>}
                                </div>
                            </div>

                            {/* Save Button for Edit Mode - Positioned after inputs, before status blocks */}
                            {isEditing && (
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
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
                                <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-primary">New Community Request</h3>
                                        <button onClick={() => setShowRequestForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-[10px] text-gray-400 uppercase font-black mb-1">Community Name Request</label>
                                        <input name="name" value={requestData.name} onChange={handleRequestChange} className="w-full px-3 py-2 border rounded text-sm" placeholder="e.g. SF Soccer League" />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSubmitRequest}
                                            disabled={editLoading}
                                            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition disabled:opacity-50"
                                        >
                                            {editLoading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {profile.requestedCommunity && (
                                <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <label className="block text-[9px] text-orange-400 uppercase font-black mb-1">Pending Community Request</label>
                                            <div className="flex items-center gap-2">
                                                <p className="text-orange-900 font-bold">{profile.requestedCommunity}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => apiService.updateProfile({ requestedCommunity: null }).then(fetchData)}
                                            className="text-[10px] text-orange-400 hover:text-orange-600 font-bold uppercase"
                                        >
                                            Cancel Request
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 text-xs text-gray-400 italic">
                    Account status: <span className="text-green-600 font-bold uppercase">{profile.isActive ? 'Active' : 'Inactive'}</span>
                </div>

            </div>
        </div>
    );
};

export default Profile;
