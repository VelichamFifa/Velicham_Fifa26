import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

const CommunityManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'manage' | 'requests'>('manage');
    const [communities, setCommunities] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [reviewingRequest, setReviewingRequest] = useState<any>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        shortName: '',
        city: '',
        state: '',
        isOnline: false,
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'manage') {
                const res = await apiService.getCommunities();
                setCommunities(res.data);
            } else {
                const res = await apiService.getCommunityRequests();
                setRequests(res.data.requests || []);
            }
        } catch (err: any) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ fullName: '', shortName: '', city: '', state: '', isOnline: false, description: '' });
        setEditingItem(null);
        setShowForm(false);
    };

    const handleEdit = (item: any) => {
        setFormData({
            fullName: item.fullName || '',
            shortName: item.name || '',
            city: item.city || '',
            state: item.state || '',
            isOnline: item.isOnline || false,
            description: item.description || ''
        });
        setEditingItem(item);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        try {
            setActionLoading(true);
            if (editingItem) {
                await apiService.adminUpdateCommunity(editingItem.communityId, formData);
                setSuccess('Community updated successfully');
            } else {
                await apiService.adminCreateCommunity(formData);
                setSuccess('Community created successfully');
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Operation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure? This will fail if users are still members.')) return;
        try {
            await apiService.adminDeleteCommunity(id);
            setSuccess('Deleted successfully');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleDeleteUserRequest = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this community request?')) return;
        try {
            setActionLoading(true);
            await apiService.adminDeleteUserCommunityRequest(id);
            setSuccess('Request deleted successfully');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveRequest = async () => {
        try {
            setActionLoading(true);
            // We use the createAndApprove logic to allow admin to edit data before creation
            await apiService.createAndApproveCommunity({
                userId: reviewingRequest.userId,
                requestId: reviewingRequest.requestedCommunity?.id,
                name: formData.fullName || '',
                ...formData
            });
            setSuccess('Request approved and community created');
            setReviewingRequest(null);
            fetchData();
        } catch (err: any) {
            setError('Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const openReview = (req: any) => {
        const rc = req.requestedCommunity;
        setFormData({
            fullName: rc.name || '', // This is the full name from the request
            shortName: rc.shortName || '',
            city: rc.city || '',
            state: rc.state || '',
            isOnline: rc.isOnline || false,
            description: rc.description || ''
        });
        setReviewingRequest(req);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto text-white">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Community Management</h1>
                <button 
                    onClick={() => setShowForm(true)}
                    className="bg-sky-500 hover:bg-sky-400 px-4 py-2 rounded-lg font-bold text-sm transition"
                >
                    + Add Community
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('manage')}
                    className={`pb-3 px-2 text-sm font-bold transition ${activeTab === 'manage' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-white/50 hover:text-white'}`}
                >
                    Directory ({communities.length})
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-2 text-sm font-bold transition ${activeTab === 'requests' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-white/50 hover:text-white'}`}
                >
                    Requests ({requests.length})
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search communities or requests (name, short name, city, state)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                />
            </div>
            {/* Alerts */}
            {success && <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 rounded-lg text-sm">{success}</div>}
            {error && <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/50 text-rose-200 rounded-lg text-sm">{error}</div>}

            {loading ? (
                <div className="py-20 text-center text-white/40">Loading data...</div>
            ) : activeTab === 'manage' ? (
                <>
                    {communities.filter(c => 
                        c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.state?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && <p className="text-center py-10 text-white/30">No communities found matching your search.</p>}
                    <div className="grid grid-cols-1 gap-4">
                        {communities.filter(c => 
                            c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.state?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((c) => (
                            <div key={c.communityId} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{c.fullName || c.name}</h3>
                                        <p className="text-[10px] text-white/40 font-mono">ID: {c.communityId}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-3 py-1 rounded text-xs font-mono font-bold uppercase">{c.name}</span>
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-xs text-white/60 uppercase tracking-wider">{c.city}, {c.state}</p>
                                        {c.isOnline && <span className="text-[10px] text-emerald-400 font-bold">● ONLINE</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(c)} className="p-2 hover:bg-white/10 rounded-lg text-sky-400">Edit</button>
                                    <button onClick={() => handleDelete(c.communityId)} className="p-2 hover:bg-white/10 rounded-lg text-rose-400">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {requests.filter(r => 
                        r.requestedCommunity?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.requestedCommunity?.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.requestedCommunity?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.requestedCommunity?.state?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && <p className="text-center py-10 text-white/30">No pending requests found matching your search.</p>}
                    <div className="grid grid-cols-1 gap-4">
                        {requests.filter(r => 
                            r.requestedCommunity?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.requestedCommunity?.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.requestedCommunity?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.requestedCommunity?.state?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((r) => (
                        <div key={r.requestedCommunity?.id || r.userId} className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 flex justify-between items-center">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                <div>
                                    <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Request from {r.firstName} {r.lastName}</p>
                                    <h3 className="font-bold text-white">{r.requestedCommunity?.name}</h3>
                                    <p className="text-xs text-white/60 italic line-clamp-1">"{r.requestedCommunity?.description}"</p>
                                </div>
                                <div className="flex items-center">
                                    <span className="bg-white/10 text-white/80 border border-white/20 px-3 py-1 rounded text-xs font-mono font-bold uppercase">{r.requestedCommunity?.shortName}</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-xs text-white/60 uppercase tracking-wider">{r.requestedCommunity?.city}, {r.requestedCommunity?.state}</p>
                                    {r.requestedCommunity?.isOnline && <span className="text-[10px] text-emerald-400 font-bold">● ONLINE</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => openReview(r)}
                                    className="bg-amber-400 text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-amber-300 transition"
                                >
                                    Review Request
                                </button>
                                <button 
                                    onClick={() => handleDeleteUserRequest(r.requestedCommunity.id)}
                                    className="bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-rose-400 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                </>
            )}

            {/* Form Modal (Create/Edit/Approve) */}
            {(showForm || reviewingRequest) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/20 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">
                            {reviewingRequest ? 'Review & Approve Request' : editingItem ? 'Edit Community' : 'Add New Community'}
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Short Name / Code</label>
                                    <input 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                        value={formData.shortName}
                                        onChange={(e) => setFormData({...formData, shortName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Online Only</label>
                                    <div 
                                        onClick={() => setFormData({...formData, isOnline: !formData.isOnline})}
                                        className={`w-full cursor-pointer border rounded-lg px-3 py-2 text-sm font-bold text-center transition ${formData.isOnline ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                                    >
                                        {formData.isOnline ? 'YES' : 'NO'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Full Display Name</label>
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                />
                            </div>

                            {!formData.isOnline && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">City</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                            value={formData.city}
                                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">State</label>
                                        <input 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                            value={formData.state}
                                            onChange={(e) => setFormData({...formData, state: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Description</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm h-20"
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                />
                            </div>

                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <button 
                                onClick={() => { resetForm(); setReviewingRequest(null); }}
                                className="text-sm font-bold text-white/40 hover:text-white"
                            >
                                Cancel
                            </button>
                            
                            <div className="flex gap-3">
                                {reviewingRequest ? (
                                        <button 
                                            disabled={actionLoading}
                                            onClick={handleApproveRequest}
                                            className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2 rounded-lg font-bold text-sm text-black"
                                        >
                                            {actionLoading ? 'Approving...' : 'Approve & Create'}
                                        </button>
                                ) : (
                                    <button 
                                        disabled={actionLoading}
                                        onClick={handleSubmit}
                                        className="bg-sky-500 hover:bg-sky-400 px-8 py-2 rounded-lg font-bold text-sm"
                                    >
                                        {actionLoading ? 'Saving...' : editingItem ? 'Update' : 'Create Community'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityManagement;