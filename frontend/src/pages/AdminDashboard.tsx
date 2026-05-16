import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { User, Match, Community, Team } from '../types';
import { format } from 'date-fns';

const formatInTimeZone = (dateValue: string, timeZone: string) => {
    try {
        return new Date(dateValue).toLocaleString('en-US', {
            timeZone,
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return format(new Date(dateValue), 'MMM dd, yyyy hh:mm a');
    }
};

const getKickoffTimeZones = (dateValue: string) => ([
    { label: 'UTC', value: formatInTimeZone(dateValue, 'UTC') },
    { label: 'EST', value: formatInTimeZone(dateValue, 'America/New_York') },
    { label: 'MST', value: formatInTimeZone(dateValue, 'America/Denver') },
    { label: 'PST', value: formatInTimeZone(dateValue, 'America/Los_Angeles') },
]);

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [activeTab, setActiveTab] = useState<'communities' | 'matches' | 'users'>('communities');
    const [matchTab, setMatchTab] = useState<'onboarded' | 'scheduled' | 'completed'>('onboarded');
    const [loading, setLoading] = useState(true);
    const [communityRequests, setCommunityRequests] = useState<any[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [onboardedMatches, setOnboardedMatches] = useState<Match[]>([]);
    const [scheduledMatches, setScheduledMatches] = useState<Match[]>([]);
    const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
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
            const [commRes, allMatchesRes, teamsRes, communitiesListRes] = await Promise.all([
                apiService.getCommunityRequests(),
                apiService.getAllMatches(undefined, 1, 500),
                apiService.getTeams(),
                apiService.getCommunities()
            ]);
            const allMatches = allMatchesRes.data.matches as Match[];
            setCommunityRequests(commRes.data.requests);
            setOnboardedMatches(allMatches.filter(match => match.status !== 'completed'));
            setScheduledMatches(allMatches.filter(match => match.status === 'scheduled'));
            setCompletedMatches(allMatches.filter(match => match.status === 'completed'));
            setTeams(teamsRes.data.teams);
            setCommunities(communitiesListRes.data);
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

    const handleApproveCommunity = async (userId: string, communityId: string) => {
        try {
            if (!communityId) {
                setError('Please select a community to approve');
                return;
            }
            await apiService.approveCommunity({ userId, communityId });
            setSuccess('Community approved successfully');
            setCommunityRequests(prev => prev.filter(req => req.userId !== userId));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to approve community');
        }
    };

    const handleQuickCreateCommunity = async (userId: string, name: string, city: string, state: string, description: string, shortName: string, isOnline: boolean) => {
        try {
            await apiService.createAndApproveCommunity({ userId, name, city, state, description, shortName, isOnline });
            setSuccess(`Community "${name}" created and approved successfully`);
            setCommunityRequests(prev => prev.filter(req => req.userId !== userId));
            // Refresh communities list so it shows up in future selects
            const res = await apiService.getCommunities();
            setCommunities(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to quick create community');
        }
    };

    const handleRejectCommunity = async (userId: string) => {
        if (!window.confirm('Are you sure you want to reject and clear this community request?')) return;
        try {
            await apiService.rejectCommunity({ userId });
            setSuccess('Community request rejected and cleared');
            setCommunityRequests(prev => prev.filter(req => req.userId !== userId));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reject community');
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
            setSuccess('Match finalized and points calculated');
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

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>

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
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assign To</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {communityRequests.map(req => (
                                                <tr key={req.userId}>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-medium">{req.firstName} {req.lastName}</div>
                                                        <div className="text-xs text-gray-500">{req.email}</div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {req.city || '-'}, {req.state || '-'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm font-bold text-secondary">{req.requestedCommunity?.name || '-'}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">Short: {req.requestedCommunity?.shortName || '-'}</div>
                                                        <div className="text-[10px] text-gray-500 max-w-[200px] truncate" title={req.requestedCommunity?.description}>
                                                            {req.requestedCommunity?.description || '-'}
                                                        </div>
                                                        {req.requestedCommunity?.isOnline ? (
                                                            <div className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded inline-block mb-1">ONLINE</div>
                                                        ) : (
                                                            <div className="text-[10px] text-gray-400 italic">Loc: {req.requestedCommunity?.city}, {req.requestedCommunity?.state}</div>
                                                        )}
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
                                                    <td className="px-4 py-4">
                                                        <select
                                                            id={`select-${req.userId}`}
                                                            className="text-sm border rounded px-2 py-1 w-full max-w-[200px]"
                                                            defaultValue={req.requestedCommunity?.existingCommunityId || ""}
                                                        >
                                                            <option value="">Select Community...</option>
                                                            {communities.map(c => <option key={c.communityId} value={c.communityId}>{c.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex flex-col gap-2 scale-90 origin-right">
                                                            <button
                                                                onClick={() => {
                                                                    const select = document.getElementById(`select-${req.userId}`) as HTMLSelectElement;
                                                                    handleApproveCommunity(req.userId, select.value);
                                                                }}
                                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 whitespace-nowrap"
                                                            >
                                                                Approve Existing
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickCreateCommunity(
                                                                    req.userId,
                                                                    req.requestedCommunity?.name || '',
                                                                    req.requestedCommunity?.city || '',
                                                                    req.requestedCommunity?.state || '',
                                                                    req.requestedCommunity?.description || '',
                                                                    req.requestedCommunity?.shortName || '',
                                                                    !!req.requestedCommunity?.isOnline
                                                                )}
                                                                className="bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-blue-700 whitespace-nowrap"
                                                            >
                                                                Quick Create & Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectCommunity(req.userId)}
                                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 whitespace-nowrap"
                                                            >
                                                                Reject Request
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
                                                                        <span className="w-10 font-semibold text-gray-500">{entry.label}</span>
                                                                        <span>{entry.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div>
                                                                <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Prediction</div>
                                                                {getKickoffTimeZones(match.predictionsEndingTime).map((entry) => (
                                                                    <div key={`prediction-${entry.label}`} className="flex gap-2">
                                                                        <span className="w-10 font-semibold text-gray-500">{entry.label}</span>
                                                                        <span>{entry.value}</span>
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
                                                                const s1 = (document.getElementById(`s1-${match.matchId}`) as HTMLInputElement).value;
                                                                const s2 = (document.getElementById(`s2-${match.matchId}`) as HTMLInputElement).value;
                                                                handleFinalizeMatch(match.matchId, s1, s2);
                                                            }}
                                                            className="bg-secondary text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
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
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
