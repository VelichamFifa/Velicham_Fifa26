import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import SearchableDropdown from '../components/SearchableDropdown';

interface Community {
    _id: string;
    communityId: string;
    name: string;
    fullName?: string;
    state: string;
    city: string;
}

const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // Need login to update the stored user context

    const [formData, setFormData] = useState({
        city: '',
        state: '',
        country: '',
        communityId1: '',
        communityId2: '',
        phoneNumber: '',
    });

    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingCommunities, setLoadingCommunities] = useState(true);

    useEffect(() => {
        // If user is already set up perfectly, redirect to dashboard
        if (user && user.city !== 'Not Set' && user.country !== 'Not Set') {
            navigate('/dashboard');
        }

        // Pre-fill if we have existing data (even if it's 'Not Set' we should clear it for the form)
        if (user) {
            setFormData(prev => ({
                ...prev,
                city: user.city === 'Not Set' ? '' : user.city || '',
                state: user.state === 'Not Set' ? '' : user.state || '',
                country: user.country === 'Not Set' ? '' : user.country || '',
            }));
        }

        const fetchCommunities = async () => {
            try {
                const response = await apiService.getCommunities();
                setCommunities(response.data);
            } catch (err) {
                console.error('Failed to fetch communities:', err);
            } finally {
                setLoadingCommunities(false);
            }
        };

        fetchCommunities();
    }, [user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDropdownChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const getCommunityFullName = (communityId: string) => {
        const community = communities.find((c) => c.communityId === communityId);
        if (!community) return '';
        return community.fullName || community.name;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.phoneNumber.trim()) {
            setError('Phone number is required.');
            setLoading(false);
            return;
        }

        if (formData.communityId1 && formData.communityId2 && formData.communityId1 === formData.communityId2) {
            setError('Community 1 and Community 2 must be different.');
            setLoading(false);
            return;
        }

        try {
            // Need an update profile endpoint if one exists
            const response = await apiService.updateProfile(formData);

            // Update global user context with new details
            const token = localStorage.getItem('token') || '';
            login(token, response.data.user);

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Profile setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-8 text-white flex items-center justify-center">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'radial-gradient(ellipse 70% 50% at 50% 20%, #ffffff 0%, transparent 70%), ' +
                        'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                }}
            />
            <div className="relative z-10 w-full max-w-lg my-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <div
                    className="relative overflow-hidden px-6 sm:px-8 py-8 text-white"
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
                    <div className="relative z-10">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100">
                            Profile Setup
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                            Profile Setup
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-white/70">
                            Welcome{user?.firstName ? `, ${user.firstName}` : ''}! Please provide a few more details to complete your registration.
                        </p>
                    </div>
                </div>

                <div className="p-6 sm:p-8 text-white">
                
                {error && (
                    <div className="mb-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-rose-100 shadow-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/70">
                            Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-white/70">
                                City <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-white/70">
                                State <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-white/70">
                            Country <span className="text-red-400">*</span>
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40"
                            required
                        >
                            <option value="">Select Country</option>
                            <option value="USA">USA</option>
                            <option value="Canada">Canada</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <SearchableDropdown
                                label="Community 1 (Optional)"
                                value={formData.communityId1}
                                onChange={(val) => handleDropdownChange('communityId1', val)}
                                options={communities
                                    .filter((c) => c.communityId !== formData.communityId2)
                                    .map(c => ({ id: c.communityId, label: c.name }))}
                                placeholder="Search community..."
                                disabled={loadingCommunities}
                                theme="dark"
                            />
                            <p className="mt-2 min-h-[1rem] text-xs font-medium text-sky-200">
                                {formData.communityId1 ? getCommunityFullName(formData.communityId1) : ''}
                            </p>
                        </div>
                        <div>
                            <SearchableDropdown
                                label="Community 2 (Optional)"
                                value={formData.communityId2}
                                onChange={(val) => handleDropdownChange('communityId2', val)}
                                options={communities
                                    .filter((c) => c.communityId !== formData.communityId1)
                                    .map(c => ({ id: c.communityId, label: c.name }))}
                                placeholder="Search community..."
                                disabled={loadingCommunities}
                                theme="dark"
                            />
                            <p className="mt-2 min-h-[1rem] text-xs font-medium text-white/70">
                                {formData.communityId2 ? getCommunityFullName(formData.communityId2) : ''}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-sky-500 py-2.5 font-bold text-white transition hover:bg-sky-400 disabled:opacity-50 shadow-lg shadow-sky-950/30"
                    >
                        {loading ? 'Saving...' : 'Finish Setup'}
                    </button>
                </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;
