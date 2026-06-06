import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Prediction, Match } from '../types';
import PredictionForm from '../components/PredictionForm';
import { format } from 'date-fns';

// ── Flag image with fallback ──────────────────────────────────────────────────
const FlagImg: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
    const [err, setErr] = useState(false);
    if (!src || err) {
        return (
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                {alt.slice(0, 3).toUpperCase()}
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            onError={() => setErr(true)}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg shrink-0"
        />
    );
};

const MyPredictions: React.FC = () => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPredictions(1);
    }, []);

    const fetchPredictions = async (page: number) => {
        try {
            setLoading(true);
            const response = await apiService.getUserPredictionsFromResults(page, 10);
            setPredictions(response.data.predictions);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditSuccess = () => {
        setEditingPrediction(null);
        fetchPredictions(pagination.page);
    };

    return (
        <div className="min-h-screen w-full">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-white/5 border-b border-white/10">
                <div className="relative max-w-7xl mx-auto px-4 py-5 sm:py-6 flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition flex-shrink-0"
                        aria-label="Back to Dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-base sm:text-lg font-semibold text-white/80 leading-tight">
                            📋 My Previous Predictions
                        </h1>
                        <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                            Track your predictions and rankings
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative w-16 h-16 mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-spin" />
                            <div className="absolute inset-2 bg-white rounded-full" />
                        </div>
                        <p className="text-gray-600 text-lg font-semibold animate-pulse">Loading predictions...</p>
                    </div>
                ) : predictions.length > 0 ? (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-primary/10 to-secondary/10">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-primary uppercase tracking-wider">Match</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Prediction</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Actual Score</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Match Pts</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Total Pts</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Match Rank</th>
                                            <th className="px-4 py-2 text-center text-xs font-bold text-primary uppercase tracking-wider">Current Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {predictions.map((prediction: any) => {
                                            const match = prediction.matchId;
                                            const team1Name = match?.team1Info?.teamName || match?.team1 || 'Unknown';
                                            const team2Name = match?.team2Info?.teamName || match?.team2 || 'Unknown';
                                            const pred1 =
                                                prediction.team1PredictedScore ??
                                                prediction.team1Score;
                                            const pred2 =
                                                prediction.team2PredictedScore ??
                                                prediction.team2Score;
                                            const matchRank =
                                                prediction.matchRank ??
                                                prediction.historicRank?.matchRank;
                                            const finalRank =
                                                prediction.finalRank ??
                                                prediction.historicRank?.finalRank;
                                            const matchPoints = prediction.matchPoints;
                                            const finalPoints = prediction.finalPoints;
                                            return (
                                                <tr key={prediction.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-2 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">{team1Name} vs {team2Name}</div>
                                                        <div className="text-xs text-gray-500">{match?.matchTime ? format(new Date(match.matchTime), 'MMM dd, HH:mm') : '-'}</div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' ? (
                                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Completed</span>
                                                        ) : match?.status === 'publishing' ? (
                                                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">Publishing</span>
                                                        ) : (
                                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">Scheduled</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        <div className="font-mono bg-blue-50 px-3 py-1 rounded-lg text-blue-700 font-bold text-sm">
                                                            {pred1 != null && pred2 != null ? `${pred1} - ${pred2}` : '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' ? (
                                                            <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-700 font-bold text-sm">
                                                                {match?.team1Score} - {match?.team2Score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {matchPoints != null ? (
                                                            <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                                                {matchPoints} pts
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {finalPoints != null ? (
                                                            <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                                                                {finalPoints} pts
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' && matchRank ? (
                                                            <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                                #{matchRank}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">TBD</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' && finalRank && finalRank > 0 ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className="text-lg">🏆</span>
                                                                <span className="font-black text-secondary">{finalRank}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {predictions.map((prediction: any, idx) => {
                                const match = prediction.matchId;
                                const team1Name = match?.team1Info?.teamName || match?.team1 || '?';
                                const team2Name = match?.team2Info?.teamName || match?.team2 || '?';
                                const isCompleted = match?.status === 'completed';
                                const isPublishing = match?.status === 'publishing';
                                const pred1 = prediction.team1PredictedScore ?? prediction.team1Score;
                                const pred2 = prediction.team2PredictedScore ?? prediction.team2Score;
                                const matchRank = prediction.matchRank ?? prediction.historicRank?.matchRank;
                                const finalRank = prediction.finalRank ?? prediction.historicRank?.finalRank;
                                const matchPoints = prediction.matchPoints;
                                const finalPoints = prediction.finalPoints;
                                const roundLabel = match?.round ? (/^\d+$/.test(String(match.round).trim()) ? `Round ${match.round}` : match.round) : '';

                                return (
                                    <div
                                        key={prediction.id}
                                        className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                                        style={{
                                            background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)',
                                            animation: `slideInUp 0.5s ease-out ${idx * 0.08}s both`,
                                        }}
                                    >
                                        {/* Pitch overlay */}
                                        <div
                                            className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                            style={{
                                                backgroundImage:
                                                    'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
                                                    'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                                            }}
                                        />

                                        {/* Header row */}
                                        <div className="relative z-10 flex items-center justify-between px-4 pt-2 pb-1">
                                            <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest truncate max-w-[140px]">
                                                {match?.matchTag || 'Match'}
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {roundLabel && (
                                                    <span className="text-[10px] text-white/30 font-medium">{roundLabel}</span>
                                                )}
                                                {isCompleted ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-500/70 text-[10px] font-bold text-white">Full Time</span>
                                                ) : isPublishing ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-[10px] font-bold text-white">Publishing</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/70 text-[10px] font-bold text-white">Upcoming</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Predicted on */}
                                        {prediction.createdAt && (
                                            <div className="relative z-10 px-4 pb-1 -mt-0.5">
                                                <span className="text-[9px] text-white/30">
                                                    🕐 Predicted: {format(new Date(prediction.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Teams + Scores */}
                                        <div className="relative z-10 flex items-center justify-between px-4 py-2 gap-2">
                                            {/* Team 1 */}
                                            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                                <FlagImg src={match?.team1Info?.countryLogo} alt={match?.team1 || '?'} />
                                                <span className="text-white font-bold text-[12px] text-center leading-tight line-clamp-2 max-w-[80px]">
                                                    {team1Name}
                                                </span>
                                            </div>

                                            {/* Centre: actual score + your prediction */}
                                            <div className="flex flex-col items-center gap-2 shrink-0">
                                                {/* Actual score boxes */}
                                                <div className="flex items-center gap-1">
                                                    <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-md flex items-center justify-center text-white font-black text-sm">
                                                        {isCompleted ? (match?.team1Score ?? 0) : '–'}
                                                    </div>
                                                    <span className="text-white/40 font-bold text-xs">–</span>
                                                    <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-md flex items-center justify-center text-white font-black text-sm">
                                                        {isCompleted ? (match?.team2Score ?? 0) : '–'}
                                                    </div>
                                                </div>
                                                <span className="text-white/30 text-[9px] uppercase tracking-widest">
                                                    {isCompleted ? 'Final Score' : match?.matchTime ? format(new Date(match.matchTime), 'MMM dd • HH:mm') : 'TBD'}
                                                </span>
                                                {/* Your prediction */}
                                                <div className="flex flex-col items-center gap-0.5 bg-sky-500/20 border border-sky-400/30 rounded-md px-3 py-1">
                                                    <span className="text-sky-400 text-[8px] font-semibold uppercase tracking-wider leading-none">Your Prediction</span>
                                                    <span className="text-sky-200 font-black text-sm tabular-nums leading-none">
                                                        {pred1 != null && pred2 != null ? `${pred1}–${pred2}` : '–'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Team 2 */}
                                            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                                <FlagImg src={match?.team2Info?.countryLogo} alt={match?.team2 || '?'} />
                                                <span className="text-white font-bold text-[12px] text-center leading-tight line-clamp-2 max-w-[80px]">
                                                    {team2Name}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="relative z-10 mx-4 border-t border-white/[0.08]" />

                                        {/* Stats footer */}
                                        <div className="relative z-10 grid grid-cols-2 divide-x divide-white/[0.08] px-0 py-1.5 bg-white/[0.04]">
                                            {/* Match column */}
                                            <div className="flex flex-col items-center gap-1 px-3">
                                                <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Match</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center gap-0">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Points</span>
                                                        <span className="text-emerald-400 font-black text-base tabular-nums leading-none">
                                                            {matchPoints != null ? matchPoints : '–'}
                                                        </span>
                                                    </div>
                                                    <span className="text-white/20 text-sm">|</span>
                                                    <div className="flex flex-col items-center gap-0">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Rank</span>
                                                        <span className="text-yellow-300 font-black text-base tabular-nums leading-none">
                                                            {matchRank ? `#${matchRank}` : '–'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Current column */}
                                            <div className="flex flex-col items-center gap-1 px-3">
                                                <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Current</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center gap-0">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Points</span>
                                                        <span className="text-indigo-300 font-black text-base tabular-nums leading-none">
                                                            {finalPoints != null ? finalPoints : '–'}
                                                        </span>
                                                    </div>
                                                    <span className="text-white/20 text-sm">|</span>
                                                    <div className="flex flex-col items-center gap-0">
                                                        <span className="text-[8px] text-white/30 uppercase tracking-widest">Rank</span>
                                                        <span className="text-orange-300 font-black text-base tabular-nums leading-none">
                                                            {finalRank && finalRank > 0 ? `#${finalRank}` : '–'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchPredictions(pagination.page - 1)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    ← Prev
                                </button>
                                <span className="text-sm sm:text-base text-gray-600 font-bold bg-white px-4 py-2 rounded-lg border border-gray-200">
                                    {pagination.page} / {pagination.pages}
                                </span>
                                <button
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => fetchPredictions(pagination.page + 1)}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-gray-600 mb-4 text-lg font-semibold">You haven't made any predictions yet.</p>
                        <a href="/dashboard" className="inline-block bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all">
                            Start Predicting Now! 🎯
                        </a>
                    </div>
                )}

                {/* Animation Styles */}
                <style>{`
                    @keyframes slideInUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}</style>
            </div>

            {editingPrediction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <PredictionForm
                        match={editingPrediction.matchId as Match}
                        initialPrediction={{
                            team1Score: editingPrediction.team1Score,
                            team2Score: editingPrediction.team2Score,
                            comment: editingPrediction.comment
                        }}
                        onSuccess={handleEditSuccess}
                        onClose={() => setEditingPrediction(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default MyPredictions;
