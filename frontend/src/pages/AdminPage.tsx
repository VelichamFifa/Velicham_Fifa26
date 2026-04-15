import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { apiService } from '../services/api';
import { User, Match, Community } from '../types';

type AdminTab = 'finalize' | 'users';
type PartyKey = 'UDF' | 'LDF' | 'NDA';
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('finalize');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data State
  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editCommunityId, setEditCommunityId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);


  // Form State
  const [officialResults, setOfficialResults] = useState({
    official_UDF: 0,
    official_LDF: 0,
    official_NDA: 0
  });

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
    setLoading(true);
    setError('');

    // Fetch Matches Independently
    try {
      const matchesRes = await apiService.getAllMatches(undefined, 1, 50);
      const fetchedMatches = matchesRes.data.matches || [];
      setMatches(fetchedMatches);

      if (fetchedMatches.length > 0) {
        const match = fetchedMatches[0];
        setOfficialResults({
          official_UDF: match.official_UDF || 0,
          official_LDF: match.official_LDF || 0,
          official_NDA: match.official_NDA || 0
        });
      }
    } catch (err) {
      console.error('Match fetch failed:', err);
      // We don't set global error here to allow other tabs to work
    }

    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await apiService.getCommunities();
      setCommunities(Array.isArray(res.data) ? res.data : (res.data.communities || []));
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    }
  };

  const handleScoreChange = (party: PartyKey, value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    setOfficialResults(prev => ({ ...prev, [party]: numValue }));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role || 'user');
    setEditCommunityId(user.Community_ID || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await apiService.updateUser(editingUser.User_ID.toString(), {
        role: editRole,
        Community_ID: editCommunityId ? String(editCommunityId) : undefined
      });
      setSuccess('User updated successfully');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      if (users.length === 0) fetchUsers();
      if (communities.length === 0) fetchCommunities();
    }
  }, [activeTab]);

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA !== 140) {
      setError('Official results must sum exactly to 140 seats');
      return;
    }

    if (!window.confirm('Are you sure? This will finalize the election results and lock predictions.')) return;

    try {
      setError('');
      setSuccess('');
      await apiService.finalizeMatch({
        matchId: '1',
        ...officialResults
      });
      setSuccess('Election results finalized successfully!');
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to finalize election');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await apiService.deleteUser(userId);
      setSuccess('User deleted successfully');
      setUsers(prev => prev.filter(u => u.User_ID.toString() !== userId));
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-green-900 tracking-tight flex items-center gap-3">
            <span className="bg-green-100 p-2 rounded-2xl text-2xl">🛡️</span> Admin Hub
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Control Center | Kerala 2026</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-red-700 uppercase">Privileged Session</span>
        </div>
      </div>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded-2xl font-bold flex justify-between items-center border border-red-200">
        {error} <button onClick={() => setError('')} className="bg-white/50 w-8 h-8 rounded-full">×</button>
      </div>}
      {success && <div className="p-4 bg-green-100 text-green-700 rounded-2xl font-bold flex justify-between items-center border border-green-200">
        {success} <button onClick={() => setSuccess('')} className="bg-white/50 w-8 h-8 rounded-full">×</button>
      </div>}

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('finalize')}
          className={`px-6 py-4 whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'finalize' ? 'border-b-4 border-green-600 text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          🗳️ Finalize Result
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-4 whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'border-b-4 border-green-600 text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
        >
          👥 User Directory ({users.length || '...'})
        </button>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'finalize' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-800 to-emerald-900 p-8 text-white">
                <h3 className="text-xl font-black uppercase tracking-widest">Election Result Center</h3>
                <p className="text-green-200 text-xs font-bold mt-1">Enter official Kerala Assembly 2026 seat counts</p>
              </div>
              <form onSubmit={handleFinalize} className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                      <img src="/udf.png" alt="UDF" className="w-8 h-8 object-contain" />
                    </div>
                    <label className="block text-[10px] font-black uppercase text-gray-400">Official UDF</label>
                    <input
                      type="number"
                      value={officialResults.official_UDF}
                      onChange={(e) => setOfficialResults({ ...officialResults, official_UDF: parseInt(e.target.value) || 0 })}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-3xl font-black text-blue-900 bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 shadow-sm">
                      <img src="/ldf.png" alt="LDF" className="w-8 h-8 object-contain" />
                    </div>
                    <label className="block text-[10px] font-black uppercase text-gray-400">Official LDF</label>
                    <input
                      type="number"
                      value={officialResults.official_LDF}
                      onChange={(e) => setOfficialResults({ ...officialResults, official_LDF: parseInt(e.target.value) || 0 })}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-3xl font-black text-red-900 bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 shadow-sm">
                      <img src="/nda.png" alt="NDA" className="w-8 h-8 object-contain" />
                    </div>
                    <label className="block text-[10px] font-black uppercase text-gray-400">Official NDA</label>
                    <input
                      type="number"
                      value={officialResults.official_NDA}
                      onChange={(e) => setOfficialResults({ ...officialResults, official_NDA: parseInt(e.target.value) || 0 })}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-3xl font-black text-orange-900 bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200 flex justify-between items-center transform transition-all duration-300">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-0.5">Total Verified Seats</span>
                    <span className={`text-lg font-black tabular-nums transition-colors duration-300 ${officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA === 140 ? 'text-green-600' : 'text-red-500'}`}>
                      {officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA} / 140
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-0.5">Remaining</span>
                    <span className={`text-base font-black tabular-nums transition-colors duration-300 ${140 - (officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA) === 0 ? 'text-green-600' : 140 - (officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA) < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                      {140 - (officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA) === 0 ? '✓ Ready' : `${140 - (officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA)} Seats`}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={officialResults.official_UDF + officialResults.official_LDF + officialResults.official_NDA !== 140 || matches[0]?.IsFinalized}
                  className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl transition-all ${matches[0]?.IsFinalized
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-green-700 text-white hover:bg-green-800 active:scale-95'}`}
                >
                  {matches[0]?.IsFinalized ? 'Result Already Published' : 'Publish Official Results'}
                </button>
              </form>
            </div>

            <div className="bg-amber-50 rounded-[2rem] p-8 border border-amber-100 space-y-4">
              <h4 className="text-sm font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                <span>⚠️</span> Finalization Protocol
              </h4>
              <p className="text-xs text-amber-700 font-bold leading-relaxed">
                Publishing results will trigger the <span className="underline">Automatic Scoring Engine</span>.
                Scores are determined by comparing user predictions against these numbers. This action is irreversible.
              </p>
              <div className="pt-4 border-t border-amber-200 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase">
                  <span className="text-amber-600">Match Status:</span>
                  <span className={`px-2 py-0.5 rounded ${matches[0]?.IsFinalized ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {matches[0]?.IsFinalized ? 'FINALIZED' : 'OPEN'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-green-800 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black uppercase tracking-widest leading-none">User Directory</h3>
                <span className="text-[10px] font-bold text-green-200">Manage all registered participants</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Participant</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Halaqa (Community)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.User_ID} className="bg-white hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-gray-800">{u.First_Name} {u.Last_Name}</div>
                        <div className="text-[10px] text-gray-400 font-bold font-mono">{u.Email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase border ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                          {communities.find(c => String(c.Community_ID) === String(u.Community_ID))?.Name || u.Community_ID || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="bg-blue-50 text-blue-600 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"
                            title="Edit User"
                          >
                            ✏️
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.User_ID.toString())}
                              className="bg-red-50 text-red-600 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                              title="Delete User"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="text-4xl mb-4">🔦</div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No participants found in directory</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-green-800 to-emerald-900 p-8 text-white relative">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all text-white"
              >
                ✕
              </button>
              <h3 className="text-xl font-black uppercase tracking-widest">Edit Participant</h3>
              <p className="text-green-100 text-xs font-bold mt-1">
                Updating {editingUser.First_Name} {editingUser.Last_Name}
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Assign Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditRole('user')}
                      className={`py-3 rounded-xl border-2 font-black text-xs uppercase transition-all ${editRole === 'user' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      User
                    </button>
                    <button
                      onClick={() => setEditRole('admin')}
                      className={`py-3 rounded-xl border-2 font-black text-xs uppercase transition-all ${editRole === 'admin' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Halaqa (Community)</label>
                  <select
                    value={editCommunityId}
                    onChange={(e) => setEditCommunityId(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-700 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">No Community</option>
                    {communities.map(c => (
                      <option key={c.Community_ID} value={c.Community_ID}>
                        {c.Name} {c.City ? `(${c.City})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-4 bg-green-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-200 hover:bg-green-800 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
