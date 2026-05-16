import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { Prediction, Match } from '../types';
import PredictionForm from '../components/PredictionForm';
import { format } from 'date-fns';

const MyPredictions: React.FC = () => {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);

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
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-primary">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -top-48 -right-48" />
                    <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl -bottom-48 -left-48" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                        📋 My Predictions
                    </h1>
                    <p className="text-white/90 text-base sm:text-lg font-medium">
                        Track your predictions and rankings
                    </p>
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
                                            <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider">Match</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">Prediction</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">Actual Score</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">Match Rank</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-primary uppercase tracking-wider">Overall Rank</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {predictions.map((prediction: any) => {
                                            const match = prediction.matchId;
                                            const team1Name = match?.team1Info?.teamName || match?.team1 || 'Unknown';
                                            const team2Name = match?.team2Info?.teamName || match?.team2 || 'Unknown';
                                            return (
                                                <tr key={prediction.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-bold text-gray-900">{team1Name} vs {team2Name}</div>
                                                        <div className="text-xs text-gray-500">{match?.matchTime ? format(new Date(match.matchTime), 'MMM dd, HH:mm') : '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' ? (
                                                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Completed</span>
                                                        ) : (
                                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">Scheduled</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="font-mono bg-blue-50 px-3 py-1 rounded-lg text-blue-700 font-bold text-sm">
                                                            {prediction.team1PredictedScore} - {prediction.team2PredictedScore}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' ? (
                                                            <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg text-gray-700 font-bold text-sm">
                                                                {match?.team1Score} - {match?.team2Score}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' && prediction.matchRank ? (
                                                            <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                                #{prediction.matchRank}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">TBD</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {match?.status === 'completed' && prediction.finalRank && prediction.finalRank > 0 ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className="text-lg">🏆</span>
                                                                <span className="font-black text-secondary">{prediction.finalRank}</span>
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
                                const team1Name = match?.team1Info?.teamName || match?.team1 || 'Unknown';
                                const team2Name = match?.team2Info?.teamName || match?.team2 || 'Unknown';
                                const isCompleted = match?.status === 'completed';

                                return (
                                    <div
                                        key={prediction.id}
                                        className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                        style={{
                                            animation: `slideInUp 0.6s ease-out ${idx * 0.1}s both`,
                                        }}
                                    >
                                        {/* Match Header */}
                                        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                                            <div className="flex-1">
                                                <h3 className="text-base font-black text-gray-900">
                                                    {team1Name} vs {team2Name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {match?.matchTime ? format(new Date(match.matchTime), 'MMM dd, yyyy • HH:mm') : '-'}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {isCompleted ? (
                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">✓ Done</span>
                                                ) : (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">⏳ Soon</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Prediction & Score Row */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                                <p className="text-xs text-gray-600 font-semibold mb-2">YOUR PREDICTION</p>
                                                <div className="font-mono text-2xl font-black text-blue-700">
                                                    {prediction.team1PredictedScore} - {prediction.team2PredictedScore}
                                                </div>
                                            </div>

                                            <div className="bg-gray-100 rounded-xl p-4 text-center">
                                                <p className="text-xs text-gray-600 font-semibold mb-2">ACTUAL SCORE</p>
                                                <div className="font-mono text-2xl font-black text-gray-700">
                                                    {isCompleted ? `${match?.team1Score} - ${match?.team2Score}` : '-'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rankings Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center border border-primary/20">
                                                <p className="text-xs text-primary font-bold mb-2">MATCH RANK</p>
                                                <div className="text-2xl font-black text-primary">
                                                    {isCompleted && prediction.matchRank ? `#${prediction.matchRank}` : 'TBD'}
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4 text-center border border-secondary/20">
                                                <p className="text-xs text-secondary font-bold mb-2">OVERALL RANK</p>
                                                <div className="text-2xl font-black text-secondary">
                                                    {isCompleted && prediction.finalRank && prediction.finalRank > 0
                                                        ? `🏆 ${prediction.finalRank}`
                                                        : '-'}
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
