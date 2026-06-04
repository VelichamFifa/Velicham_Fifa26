// Multi-timezone display for US and UTC
const getKickoffTimeZones = (dateValue: string) => {
    const date = new Date(dateValue);
    const zones = [
        { label: 'EDT/EST', tz: 'America/New_York' },
        { label: 'CDT/CST', tz: 'America/Chicago' },
        { label: 'MDT/MST', tz: 'America/Denver' },
        { label: 'PDT/PST', tz: 'America/Los_Angeles' },
        { label: 'UTC', tz: 'UTC' },
    ];
    return zones.map(({ label, tz }) => {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: tz,
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short',
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(date);
        const abbr = parts.find(p => p.type === 'timeZoneName')?.value || '';
        return { label, value: formatter.format(date), abbr };
    });
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { User, Match, Community, Team } from '../types';

import { format } from 'date-fns';
// Helper to get current US Eastern time and abbreviation
const getEasternTimeWithAbbr = () => {
    const now = new Date();
    // Get time in America/New_York
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    const abbr = parts.find(p => p.type === 'timeZoneName')?.value || '';
    const dateStr = formatter.format(now);
    return { dateStr, abbr };
};

// Helper to get current UTC time and abbreviation
const getUtcTimeWithAbbr = () => {
    const now = new Date();
    // Get time in UTC
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short',
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(now);
    const abbr = parts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    const dateStr = formatter.format(now);
    return { dateStr, abbr };
};



const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'communities' | 'directory' | 'matches' | 'users' | 'messages'>('communities');
    const [matchTab, setMatchTab] = useState<'onboarded' | 'scheduled' | 'completed'>('onboarded');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [communityRequests, setCommunityRequests] = useState<any[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [onboardedMatches, setOnboardedMatches] = useState<Match[]>([]);
    const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
    const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
    const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null);
    const [reviewingRequest, setReviewingRequest] = useState<any>(null);
    const [communitySearchTerm, setCommunitySearchTerm] = useState('');
    const [communityForm, setCommunityForm] = useState({
        fullName: '',
        shortName: '',
        city: '',
        state: '',
        isOnline: false,
        description: ''
    });
    const [newMatchForm, setNewMatchForm] = useState({
        sequence: '',
        team1: '',
        team2: '',
        matchTime: '',
        predictionsEndingTime: '',
        round: '',
        group: '',
        matchTag: '',
        comment: '',
    });

    const serializeEnteredUtcTime = (value: string) => {
        if (!value) return value;
        if (value.endsWith('Z')) return value;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
            return `${value}:00.000Z`;
        }
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
            return `${value}.000Z`;
        }
        return `${value}Z`;
    };

    const derivePredictionDeadline = (kickoffTime: string) => {
        if (!kickoffTime) return '';
        const kickoffUtc = new Date(serializeEnteredUtcTime(kickoffTime));
        kickoffUtc.setUTCHours(kickoffUtc.getUTCHours() - 1);
        return kickoffUtc.toISOString().slice(0, 16);
    };

    const buildMatchTag = (team1Id: string, team2Id: string) => {
        if (!team1Id || !team2Id) return '';
        return `#${team1Id}_${team2Id}`;
    };

    const syncMatchTag = (team1Id: string, team2Id: string) => {
        const nextTag = buildMatchTag(team1Id, team2Id);
        setNewMatchForm((prev) => ({ ...prev, team1: team1Id, team2: team2Id, matchTag: nextTag }));
    };

    const getTeamDisplayName = (match: Match, side: 'team1' | 'team2') => {
        const teamInfo = side === 'team1' ? match.team1Info : match.team2Info;
        const fallback = side === 'team1' ? match.team1 : match.team2;
        return teamInfo?.teamName || fallback;
    };

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        fetchInitialData();
    }, [isLoggedIn, user, navigate]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [commRes, allMatchesRes, teamsRes, communitiesListRes, messagesRes] = await Promise.all([
                apiService.getCommunityRequests(),
                apiService.getAllMatches(undefined, 1, 500),
                apiService.getTeams(),
                apiService.getCommunities(),
                apiService.getContactMessages()
            ]);
            const allMatches = allMatchesRes.data.matches as Match[];
            setCommunityRequests(commRes.data.requests);
            setOnboardedMatches(allMatches.filter(match => !['scheduled', 'publishing', 'completed'].includes((match.status || '').toLowerCase())));
            setScheduledMatches(allMatches.filter(match => ['scheduled', 'publishing'].includes((match.status || '').toLowerCase())));
            setCompletedMatches(allMatches.filter(match => match.status === 'completed'));
            setTeams(teamsRes.data.teams);
            setCommunities(communitiesListRes.data);
            setMessages(messagesRes.data.messages || []);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await apiService.getAllUsers();
            setUsers(res.data.users);
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            fetchUsers();
        }
    }, [activeTab]);

    const handleOpenReview = (req: any) => {
        setReviewingRequest(req);
        setCommunityForm({
            fullName: req.requestedCommunity?.name || '',
            shortName: req.requestedCommunity?.shortName || '',
            city: req.requestedCommunity?.city || '',
            state: req.requestedCommunity?.state || '',
            isOnline: req.requestedCommunity?.isOnline || false,
            description: req.requestedCommunity?.description || ''
        });
    };

    const handleApproveReviewedRequest = async () => {
        try {
            setActionLoading(true);
            await apiService.createAndApproveCommunity({ 
                userId: reviewingRequest.userId, 
                requestId: reviewingRequest.requestedCommunity?.id,
                name: communityForm.fullName || '', 
                city: communityForm.city, 
                state: communityForm.state, 
                description: communityForm.description, 
                shortName: communityForm.shortName || '', 
                isOnline: communityForm.isOnline 
            });
            setSuccess(`Community "${communityForm.fullName}" created and approved successfully`);
            setCommunityRequests(prev => prev.filter(req => req.userId !== reviewingRequest.userId));
            setReviewingRequest(null);
            setCommunityForm({ fullName: '', shortName: '', city: '', state: '', isOnline: false, description: '' });
            
            // Refresh communities list so it shows up in future selects
            const res = await apiService.getCommunities();
            setCommunities(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to approve community');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCommunitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            if (editingCommunityId) {
                await apiService.adminUpdateCommunity(editingCommunityId, communityForm);
                setSuccess('Community updated successfully');
            } else {
                await apiService.adminCreateCommunity(communityForm);
                setSuccess('Community created successfully');
            }
            setEditingCommunityId(null);
            setCommunityForm({ fullName: '', shortName: '', city: '', state: '', isOnline: false, description: '' });
            fetchInitialData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Operation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditCommunity = (c: Community) => {
        setEditingCommunityId(c.communityId);
        setCommunityForm({
            fullName: c.fullName || '',
            shortName: c.name || '',
            city: c.city || '',
            state: c.state || '',
            isOnline: (c as any).isOnline || false,
            description: (c as any).description || ''
        });
    };

    const handleDeleteCommunity = async (id: string) => {
        if (!window.confirm('Are you sure? This will fail if users are still members.')) return;
        try {
            setActionLoading(true);
            await apiService.adminDeleteCommunity(id);
            setSuccess('Community deleted successfully');
            fetchInitialData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteCommunityRequest = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this community request?')) return;
        try {
            await apiService.adminDeleteUserCommunityRequest(id);
            setSuccess('Community request deleted successfully');
            fetchInitialData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete community request');
        }
    };

    const handleFinalizeMatch = async (matchId: string, t1: string, t2: string) => {
        const match = [...onboardedMatches, ...scheduledMatches, ...completedMatches].find(m => m.matchId === matchId);
        const matchName = match ? `${getTeamDisplayName(match, 'team1')} vs ${getTeamDisplayName(match, 'team2')}` : 'this match';

        if (!window.confirm(`Are you sure you want to finalize ${matchName} with score ${t1}-${t2}? This will calculate points for ALL users.`)) {
            return;
        }

        try {
            const team1Score = parseInt(t1);
            const team2Score = parseInt(t2);
            if (isNaN(team1Score) || isNaN(team2Score)) {
                setError('Please enter valid scores');
                return;
            }
            await apiService.finalizeMatch({ matchId, team1Score, team2Score });
            setSuccess(
              import.meta.env.VITE_FINALIZE_MATCH_URL
                                ? 'Match moved to publishing. It will switch to completed after Azure Function finishes scoring and leaderboard rebuild.'
                : 'Match finalized and points calculated'
            );
            fetchInitialData();
        } catch (err) {
            setError('Failed to finalize match');
        }
    };

    const handleScheduleMatch = async (matchId: string) => {
        const match = [...onboardedMatches, ...scheduledMatches, ...completedMatches].find(m => m.matchId === matchId);
        const matchName = match ? `${getTeamDisplayName(match, 'team1')} vs ${getTeamDisplayName(match, 'team2')}` : 'this match';

        if (!window.confirm(`Schedule ${matchName} for kickoff time ${match?.matchTime ? format(new Date(match.matchTime), 'MMM dd, HH:mm') : ''}?`)) {
            return;
        }

        try {
            await apiService.updateMatch(matchId, { status: 'scheduled' });
            setSuccess('Match scheduled successfully');
            fetchInitialData();
        } catch (err) {
            setError('Failed to schedule match');
        }
    };

    const handleDeleteMatch = async (matchId: string) => {
        const match = [...onboardedMatches, ...scheduledMatches, ...completedMatches].find(m => m.matchId === matchId);
        const matchName = match ? `${getTeamDisplayName(match, 'team1')} vs ${getTeamDisplayName(match, 'team2')}` : 'this match';

        if (!window.confirm(`Are you sure you want to delete ${matchName}? This will remove all predictions and results.`)) {
            return;
        }

        try {
            await apiService.deleteMatch(matchId);
            setSuccess('Match deleted successfully');
            fetchInitialData();
        } catch (err) {
            setError('Failed to delete match');
        }
    };

    const handleCreateMatchEntry = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            if (!newMatchForm.sequence || !newMatchForm.team1 || !newMatchForm.team2 || !newMatchForm.matchTime || !newMatchForm.predictionsEndingTime || !newMatchForm.round) {
                setError('Please fill all required match fields');
                return;
            }

            const payload = {
                sequence: Number(newMatchForm.sequence),
                team1: newMatchForm.team1,
                team2: newMatchForm.team2,
                matchTime: serializeEnteredUtcTime(newMatchForm.matchTime),
                predictionsEndingTime: serializeEnteredUtcTime(newMatchForm.predictionsEndingTime),
                round: newMatchForm.round,
                group: newMatchForm.group || undefined,
                matchTag: newMatchForm.matchTag || buildMatchTag(newMatchForm.team1, newMatchForm.team2),
                comment: newMatchForm.comment || undefined,
            };

            if (editingMatchId) {
                await apiService.updateMatch(editingMatchId, payload);
            } else {
                await apiService.createMatch(payload);
            }

            setSuccess(editingMatchId ? 'Match updated successfully' : 'Match entry created successfully');
            setEditingMatchId(null);
            setNewMatchForm({
                sequence: '',
                team1: '',
                team2: '',
                matchTime: '',
                predictionsEndingTime: '',
                round: '',
                group: '',
                matchTag: '',
                comment: '',
            });
            fetchInitialData();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create match entry');
        }
    };

    const handleEditMatch = (match: Match) => {
        setEditingMatchId(match.matchId);
        setNewMatchForm({
            sequence: String(match.sequence ?? ''),
            team1: match.team1,
            team2: match.team2,
            matchTime: new Date(match.matchTime).toISOString().slice(0, 16),
            predictionsEndingTime: new Date(match.predictionsEndingTime).toISOString().slice(0, 16),
            round: match.round || '',
            group: match.group || '',
            matchTag: match.matchTag || buildMatchTag(match.team1, match.team2),
            comment: match.comment || '',
        });
    };

    const resetMatchForm = () => {
        setEditingMatchId(null);
        setNewMatchForm({
            sequence: '',
            team1: '',
            team2: '',
            matchTime: '',
            predictionsEndingTime: '',
            round: '',
            group: '',
            matchTag: '',
            comment: '',
        });
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
        try {
            await apiService.deleteUser(userId);
            setSuccess('User deleted successfully');
            setUsers(prev => prev.filter(u => u.userId !== userId));
        } catch (err) {
            setError('Failed to delete user');
        }
    };

    const matchesForActiveMatchTab =
        matchTab === 'onboarded'
            ? onboardedMatches
            : matchTab === 'scheduled'
                ? scheduledMatches
                : completedMatches;


    // Eastern time display for admins
    const { dateStr: easternTimeStr, abbr: easternAbbr } = getEasternTimeWithAbbr();
    const { dateStr: utcTimeStr, abbr: utcAbbr } = getUtcTimeWithAbbr();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            {/* Time Displays */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-4">
                    <span className="font-semibold text-blue-800">US Eastern Time:</span>
                    <span className="font-mono text-blue-900 text-lg">{easternTimeStr}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-xs font-bold uppercase">{easternAbbr}</span>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded flex items-center gap-4">
                    <span className="font-semibold text-purple-800">UTC Time:</span>
                    <span className="font-mono text-purple-900 text-lg">{utcTimeStr}</span>
                    <span className="ml-2 px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-xs font-bold uppercase">{utcAbbr}</span>
                </div>
            </div>

            {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between">
                {error} <button onClick={() => setError('')}>×</button>
            </div>}
            {success && <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex justify-between">
                {success} <button onClick={() => setSuccess('')}>×</button>
            </div>}

            <div className="flex border-b mb-6 overflow-x-auto">
                <button
                    className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'communities' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('communities')}
                >
                    Community Requests ({communityRequests.length})
                </button>
                <button
                    className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'directory' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('directory')}
                >
                    Community Directory ({communities.length})
                </button>
                <button
                    className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'matches' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('matches')}
                >
                    Match Management
                </button>
                <button
                    className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'users' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
                <button
                    className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'messages' ? 'border-b-2 border-secondary text-secondary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('messages')}
                >
                    Contact Messages
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div></div>
            ) : (
                <div className="bg-white rounded-lg shadow min-h-[400px]">
                    {activeTab === 'communities' && (
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Pending Community Assignments</h2>
                            {communityRequests.length === 0 ? <p className="text-gray-500">No pending requests</p> : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {communityRequests.map(req => (
                                            <tr key={req.requestedCommunity?.id || req.userId}>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-medium">{req.firstName} {req.lastName}</div>
                                                        <div className="text-xs text-gray-500">{req.email}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-[10px] text-gray-600">
                                                        <div><span className="font-black text-gray-400 uppercase">City:</span> {req.city || '-'}</div>
                                                        <div><span className="font-black text-gray-400 uppercase">State:</span> {req.state || '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-bold text-secondary">{req.requestedCommunity?.name || '-'}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-tighter">Short Name: {req.requestedCommunity?.shortName || '-'}</div>
                                                        <div className="text-[10px] text-gray-500 max-w-[200px] truncate" title={req.requestedCommunity?.description}>
                                                            <span className="font-bold text-gray-400 uppercase text-[9px]">Description:</span> {req.requestedCommunity?.description || '-'}
                                                        </div>
                                                        {req.requestedCommunity?.isOnline && (
                                                            <div className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded inline-block mt-1">ONLINE</div>
                                                        )}

                                                        {req.requestedCommunity?.existingCommunityId && (
                                                            <div className="mt-2 p-1.5 border border-green-200 bg-green-50 rounded-md animate-in fade-in slide-in-from-top-1 duration-300">
                                                                <div className="text-[9px] font-black text-green-700 uppercase tracking-wider leading-none mb-1">System Match</div>
                                                                {(() => {
                                                                    const matched = communities.find(c => c.communityId === req.requestedCommunity.existingCommunityId);
                                                                    if (!matched) return <div className="text-[10px] text-gray-400 italic">ID: {req.requestedCommunity.existingCommunityId} (not found)</div>;
                                                                    return (
                                                                        <div className="text-[10px] text-green-800 leading-tight">
                                                                            <div className="font-bold">{matched.name}</div>
                                                                            <div className="text-[9px] opacity-75">
                                                                                <span className="font-bold">City:</span> {matched.city}, <span className="font-bold">State:</span> {matched.state}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-[10px] px-2 py-0.5 rounded font-black bg-gray-100 text-gray-600 uppercase">
                                                            {req.requestedCommunity?.status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                            !req.communityId1 ? 'bg-orange-100 text-orange-700' : 
                                                            !req.communityId2 ? 'bg-blue-100 text-blue-700' : 
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {!req.communityId1 ? 'FIRST' : !req.communityId2 ? 'SECOND' : 'NEW'}
                                                        </span>
                                                        {req.requestedCommunity?.existingCommunityId && (
                                                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase">
                                                                MATCHED
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex flex-col gap-2 scale-90 origin-right">
                                                           
                                                            <button
                                                                onClick={() => handleOpenReview(req)}
                                                                className="bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                                                            >
                                                                Review & Approve
                                                            </button>
                                                            <button
                                                                onClick={() => req.requestedCommunity?.id && handleDeleteCommunityRequest(req.requestedCommunity.id)}
                                                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 whitespace-nowrap"
                                                            >
                                                                Delete Request
                                                            </button>
                                                         
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'directory' && (
                        <div className="p-6">
                            <form onSubmit={handleCommunitySubmit} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-bold text-gray-800">{editingCommunityId ? 'Edit Community' : 'Add New Community'}</h3>
                                    {editingCommunityId && (
                                        <button type="button" onClick={() => { setEditingCommunityId(null); setCommunityForm({ fullName: '', shortName: '', city: '', state: '', isOnline: false, description: '' }); }} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Short Name / Code</label>
                                        <input 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={communityForm.shortName}
                                            onChange={(e) => setCommunityForm({...communityForm, shortName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Online Only</label>
                                        <div 
                                            onClick={() => setCommunityForm({...communityForm, isOnline: !communityForm.isOnline})}
                                            className={`w-full cursor-pointer border rounded px-3 py-2 text-sm font-bold text-center transition ${communityForm.isOnline ? 'bg-sky-500/10 border-sky-500 text-sky-600' : 'bg-white border-gray-300 text-gray-400'}`}
                                        >
                                            {communityForm.isOnline ? 'YES' : 'NO'}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Display Name</label>
                                        <input 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={communityForm.fullName}
                                            onChange={(e) => setCommunityForm({...communityForm, fullName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    {!communityForm.isOnline && (
                                        <>
                                            <input className="border rounded px-3 py-2 text-sm" placeholder="City" value={communityForm.city} onChange={(e) => setCommunityForm({...communityForm, city: e.target.value})} required />
                                            <input className="border rounded px-3 py-2 text-sm" placeholder="State" value={communityForm.state} onChange={(e) => setCommunityForm({...communityForm, state: e.target.value})} required />
                                        </>
                                    )}
                                    <textarea 
                                        className="border rounded px-3 py-2 text-sm md:col-span-2 h-20" 
                                        placeholder="Description" 
                                        value={communityForm.description} 
                                        onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})} 
                                    />
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" disabled={actionLoading} className="bg-secondary text-white px-6 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                                        {actionLoading ? 'Processing...' : editingCommunityId ? 'Update Community' : 'Create Community'}
                                    </button>
                                </div>
                            </form>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                                <h2 className="text-xl font-bold text-gray-800">Existing Communities</h2>
                                <input
                                    type="text"
                                    placeholder="Search by name, short name, city, state..."
                                    value={communitySearchTerm}
                                    onChange={(e) => setCommunitySearchTerm(e.target.value)}
                                    className="w-full sm:w-80 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary"
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Community</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {communities.filter(c => 
                                            !communitySearchTerm || 
                                            c.fullName?.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
                                            c.name?.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
                                            c.city?.toLowerCase().includes(communitySearchTerm.toLowerCase()) ||
                                            c.state?.toLowerCase().includes(communitySearchTerm.toLowerCase())
                                        ).map(c => (
                                            <tr key={c.communityId}>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{c.fullName || c.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono">ID: {c.communityId}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded inline-block uppercase">{c.name}</div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-600">{(c as any).isOnline ? '-' : `${c.city}, ${c.state}`}</td>
                                                <td className="px-4 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${(c as any).isOnline ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{(c as any).isOnline ? 'ONLINE' : 'LOCAL'}</span></td>
                                                <td className="px-4 py-4 text-right">
                                                    <button onClick={() => handleEditCommunity(c)} className="text-sky-600 hover:text-sky-800 text-xs font-bold mr-3">Edit</button>
                                                    <button onClick={() => handleDeleteCommunity(c.communityId)} className="text-red-600 hover:text-red-800 text-xs font-bold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="p-6">
                            {matchTab === 'onboarded' && (
                                <form onSubmit={handleCreateMatchEntry} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold">{editingMatchId ? 'Edit Match Entry' : 'Add Match Entry'}</h3>
                                        {editingMatchId && (
                                            <button type="button" onClick={resetMatchForm} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        <input className="border rounded px-3 py-2" type="number" placeholder="Sequence" value={newMatchForm.sequence} onChange={(e) => setNewMatchForm(prev => ({ ...prev, sequence: e.target.value }))} />
                                        <select className="border rounded px-3 py-2" value={newMatchForm.team1} onChange={(e) => syncMatchTag(e.target.value, newMatchForm.team2)}>
                                            <option value="">Select Team 1</option>
                                            {teams.map((team) => (
                                                <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                                            ))}
                                        </select>
                                        <select className="border rounded px-3 py-2" value={newMatchForm.team2} onChange={(e) => syncMatchTag(newMatchForm.team1, e.target.value)}>
                                            <option value="">Select Team 2</option>
                                            {teams.map((team) => (
                                                <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                                            ))}
                                        </select>
                                        <div className="border rounded px-3 py-2 bg-white text-gray-600">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kickoff Date/Time (UTC)</div>
                                            <input className="w-full outline-none mt-1" type="datetime-local" value={newMatchForm.matchTime} onChange={(e) => setNewMatchForm(prev => ({
                                                ...prev,
                                                matchTime: e.target.value,
                                                predictionsEndingTime: derivePredictionDeadline(e.target.value),
                                                matchTag: buildMatchTag(prev.team1, prev.team2)
                                            }))} />
                                        </div>
                                        <div className="border rounded px-3 py-2 bg-white text-gray-600">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prediction Deadline (UTC)</div>
                                            <input className="w-full outline-none mt-1" type="datetime-local" value={newMatchForm.predictionsEndingTime} onChange={(e) => setNewMatchForm(prev => ({ ...prev, predictionsEndingTime: e.target.value }))} />
                                        </div>
                                        <input className="border rounded px-3 py-2" placeholder="Round" value={newMatchForm.round} onChange={(e) => setNewMatchForm(prev => ({ ...prev, round: e.target.value }))} />
                                        <input className="border rounded px-3 py-2" placeholder="Group" value={newMatchForm.group} onChange={(e) => setNewMatchForm(prev => ({ ...prev, group: e.target.value }))} />
                                        <input className="border rounded px-3 py-2 md:col-span-2 xl:col-span-3" placeholder="Comment" value={newMatchForm.comment} onChange={(e) => setNewMatchForm(prev => ({ ...prev, comment: e.target.value }))} />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                                            {editingMatchId ? 'Update Match Entry' : 'Add Match Entry'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="flex flex-wrap gap-2 mb-6">
                                <button
                                    className={`px-4 py-2 rounded-full text-sm font-medium border ${matchTab === 'onboarded' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-300'}`}
                                    onClick={() => setMatchTab('onboarded')}
                                >
                                    Onboarded Matches
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-full text-sm font-medium border ${matchTab === 'scheduled' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-300'}`}
                                    onClick={() => setMatchTab('scheduled')}
                                >
                                    Scheduled Matches
                                </button>
                                <button
                                    className={`px-4 py-2 rounded-full text-sm font-medium border ${matchTab === 'completed' ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-300'}`}
                                    onClick={() => setMatchTab('completed')}
                                >
                                    Completed Matches
                                </button>
                            </div>

                            <h2 className="text-xl font-bold mb-4">
                                {matchTab === 'onboarded'
                                    ? 'Onboarded Matches'
                                    : matchTab === 'scheduled'
                                        ? 'Scheduled Matches'
                                        : 'Completed Matches'}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {matchTab === 'onboarded' ? 'Kickoff Time Zones' : 'Final Score'}
                                            </th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {matchesForActiveMatchTab.map(match => (
                                            <tr key={match.matchId}>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-bold">{getTeamDisplayName(match, 'team1')} vs {getTeamDisplayName(match, 'team2')}</div>
                                                    <div className="text-xs text-gray-400 font-mono">ID: {match.matchId}</div>
                                                </td>
                                                <td className="px-4 py-4 text-xs text-gray-700">{match.group || '-'}</td>
                                                <td className="px-4 py-4 text-xs text-gray-700">{match.round || '-'}</td>
                                                <td className="px-4 py-4">
                                                    {matchTab === 'onboarded' ? (
                                                        <span className="text-xs px-2 py-1 rounded font-bold bg-amber-100 text-amber-700">
                                                            ONBOARDED
                                                        </span>
                                                    ) : (
                                                        <span className={`text-xs px-2 py-1 rounded font-bold ${match.status === 'completed' ? 'bg-gray-100 text-gray-600' : match.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                            {match.status.toUpperCase()}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {matchTab === 'onboarded' ? (
                                                        <div className="space-y-3 text-xs text-gray-600">
                                                            <div>
                                                                <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Kickoff</div>
                                                                {getKickoffTimeZones(match.matchTime).map((entry) => (
                                                                    <div key={`kickoff-${entry.label}`} className="flex gap-2">
                                                                        <span className="w-14 font-semibold text-gray-500">{entry.label}</span>
                                                                        <span>{entry.value}</span>
                                                                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold uppercase">{entry.abbr}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div>
                                                                <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Prediction</div>
                                                                {getKickoffTimeZones(match.predictionsEndingTime).map((entry) => (
                                                                    <div key={`prediction-${entry.label}`} className="flex gap-2">
                                                                        <span className="w-14 font-semibold text-gray-500">{entry.label}</span>
                                                                        <span>{entry.value}</span>
                                                                        <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold uppercase">{entry.abbr}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <input type="number" id={`s1-${match.matchId}`} defaultValue={match.team1Score || 0} className="w-12 border rounded px-1 text-center" />
                                                            <span>-</span>
                                                            <input type="number" id={`s2-${match.matchId}`} defaultValue={match.team2Score || 0} className="w-12 border rounded px-1 text-center" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {matchTab === 'onboarded' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditMatch(match)}
                                                                className="border border-gray-300 bg-white px-3 py-1 rounded text-sm hover:bg-gray-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleScheduleMatch(match.matchId)}
                                                                className="bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                            >
                                                                Schedule
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMatch(match.matchId)}
                                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (match.status === 'publishing') return;
                                                                const s1 = (document.getElementById(`s1-${match.matchId}`) as HTMLInputElement).value;
                                                                const s2 = (document.getElementById(`s2-${match.matchId}`) as HTMLInputElement).value;
                                                                handleFinalizeMatch(match.matchId, s1, s2);
                                                            }}
                                                            className={`bg-secondary text-white px-3 py-1 rounded text-sm ${match.status === 'publishing' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                                            disabled={match.status === 'publishing'}
                                                            title={match.status === 'publishing' ? 'Cannot finalize while match is publishing' : ''}
                                                        >
                                                            {match.status === 'completed' ? 'Recalculate' : 'Finalize'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">User List</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map(u => (
                                            <tr key={u.userId}>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium">{u.firstName} {u.lastName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {u.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {format(new Date(u.createdAt || Date.now()), 'MMM yyyy')}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {u.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.userId)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Contact Messages</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Info</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject & Message</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {messages.map(msg => (
                                            <tr key={msg.id} className={msg.status === 'new' ? 'bg-blue-50/30' : ''}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium text-gray-900">{msg.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                      <a href={`mailto:${msg.email}`} className="text-blue-600 hover:underline">{msg.email}</a>
                                                    </div>
                                                    {msg.userId && (
                                                      <div className="text-[10px] text-blue-600 bg-blue-100 inline-block px-2 py-0.5 rounded mt-1">Registered User</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-bold text-gray-900">{msg.subject}</div>
                                                    <div className="text-sm text-gray-700 mt-1 max-w-md whitespace-pre-wrap">{msg.message}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                        msg.status === 'new' ? 'bg-amber-100 text-amber-700' :
                                                        msg.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {msg.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right whitespace-nowrap">
                                                    <select
                                                        value={msg.status}
                                                        onChange={async (e) => {
                                                            try {
                                                                await apiService.updateContactMessageStatus(msg.id, e.target.value);
                                                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: e.target.value } : m));
                                                                setSuccess('Status updated');
                                                            } catch (err) {
                                                                setError('Failed to update status');
                                                            }
                                                        }}
                                                        className="text-sm border border-gray-300 rounded-md shadow-sm focus:border-secondary focus:ring-secondary px-3 py-1"
                                                    >
                                                        <option value="new">New</option>
                                                        <option value="in-progress">In Progress</option>
                                                        <option value="resolved">Resolved</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                        {messages.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No contact messages found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {reviewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white border border-gray-200 w-full max-w-lg rounded-xl p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Review & Approve Request</h2>
                        <div className="space-y-4 text-gray-700">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Short Name / Code</label>
                                    <input 
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        value={communityForm.shortName}
                                        onChange={(e) => setCommunityForm({...communityForm, shortName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Online Only</label>
                                    <div 
                                        onClick={() => setCommunityForm({...communityForm, isOnline: !communityForm.isOnline})}
                                        className={`w-full cursor-pointer border rounded px-3 py-2 text-sm font-bold text-center transition ${communityForm.isOnline ? 'bg-sky-100 border-sky-500 text-sky-700' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                                    >
                                        {communityForm.isOnline ? 'YES' : 'NO'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Display Name</label>
                                <input 
                                    className="w-full border rounded px-3 py-2 text-sm"
                                    value={communityForm.fullName}
                                    onChange={(e) => setCommunityForm({...communityForm, fullName: e.target.value})}
                                />
                            </div>

                            {!communityForm.isOnline && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">City</label>
                                        <input 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={communityForm.city}
                                            onChange={(e) => setCommunityForm({...communityForm, city: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State</label>
                                        <input 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={communityForm.state}
                                            onChange={(e) => setCommunityForm({...communityForm, state: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea 
                                    className="w-full border rounded px-3 py-2 text-sm h-20"
                                    value={communityForm.description}
                                    onChange={(e) => setCommunityForm({...communityForm, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <button 
                                onClick={() => { setReviewingRequest(null); setCommunityForm({ fullName: '', shortName: '', city: '', state: '', isOnline: false, description: '' }); }}
                                className="text-sm font-bold text-gray-500 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={actionLoading}
                                onClick={handleApproveReviewedRequest}
                                className="bg-secondary hover:bg-blue-700 px-6 py-2 rounded-lg font-bold text-sm text-white"
                            >
                                {actionLoading ? 'Approving...' : 'Approve & Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
