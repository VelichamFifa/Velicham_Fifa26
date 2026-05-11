import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

interface Community {
    _id: string;
    communityId: string;
    name: string;
    state: string;
    city: string;
}

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // We use login to sync user context after an update

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        city: '',
        state: '',
        country: '',
        communityId1: '',
        communityId2: '',
        whatsappNumber: '',
    });

    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loadingCommunities, setLoadingCommunities] = useState(true);

    useEffect(() => {
        // If not logged in, go to login
        if (!user) {
            navigate('/login');
            return;
        }

        // Pre-fill form
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            city: user.city === 'Not Set' ? '' : user.city || '',
            state: user.state === 'Not Set' ? '' : user.state || '',
            country: user.country === 'Not Set' ? '' : user.country || '',
            whatsappNumber: user.whatsappNumber || '',
            communityId1: user.communityId1 || '',
            communityId2: user.communityId2 || '',
        });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await apiService.updateProfile(formData);

            // Sync user back to context
            const token = localStorage.getItem('token') || '';
            login(token, response.data.user);

            setSuccess('Profile updated successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Profile update failed');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    My Profile
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-md">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            WhatsApp Number
                        </label>
                        <input
                            type="text"
                            name="whatsappNumber"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Community 1
                            </label>
                            <select
                                name="communityId1"
                                value={formData.communityId1}
                                onChange={handleChange}
                                disabled={loadingCommunities}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary disabled:bg-gray-100"
                            >
                                <option value="">Select...</option>
                                {communities.map((community) => (
                                    <option key={community._id} value={community.communityId}>
                                        {community.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Community 2
                            </label>
                            <select
                                name="communityId2"
                                value={formData.communityId2}
                                onChange={handleChange}
                                disabled={loadingCommunities}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary disabled:bg-gray-100"
                            >
                                <option value="">Select...</option>
                                {communities.map((community) => (
                                    <option key={community._id} value={community.communityId}>
                                        {community.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary text-white py-3 rounded-md font-medium hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
