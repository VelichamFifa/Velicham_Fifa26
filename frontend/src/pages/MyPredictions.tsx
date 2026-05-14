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
            const response = await apiService.getUserPredictions(page, 10);
            setPredictions(response.data.predictions);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (match: Match) => {
        if (match.status === 'completed') {
            return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-0.5 rounded">Completed</span>;
        }
        const isPredictionOpen = new Date(match.predictionsEndingTime || '') > new Date();
        return isPredictionOpen ?
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">Open</span> :
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">Closed</span>;
    };

    const handleEditSuccess = () => {
        setEditingPrediction(null);
        fetchPredictions(pagination.page);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">My Predictions</h1>
                    <p className="text-gray-600">History of all your match predictions</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                    <p className="mt-4 text-gray-600">Loading predictions...</p>
                </div>
            ) : predictions.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Score</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Match Rank</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Rank</th>
                                    
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {predictions.map((prediction) => {
                                    const match = prediction.matchId as Match;
                                    return (
                                        <tr key={prediction._id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{match.team1} vs {match.team2}</div>
                                                <div className="text-xs text-gray-500">{format(new Date(match.matchTime), 'MMM dd, HH:mm')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(match)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 font-bold">
                                                    {prediction.team1Score} - {prediction.team2Score}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {match.status === 'completed' ? (
                                                    <span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 font-bold">
                                                        {match.team1Score} - {match.team2Score}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {match.status === 'completed' && prediction.historicRank ? (
                                                    <span className="text-sm font-black text-primary">
                                                        #{prediction.historicRank.dailyRank}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">TBD</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {match.status === 'completed' && prediction.historicRank && prediction.historicRank.finalRank > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-black text-secondary">#{prediction.historicRank.finalRank}</span>
                                                        <span className="text-[10px] text-gray-500">Overall</span>
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

                    {pagination.pages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => fetchPredictions(pagination.page - 1)}
                                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => fetchPredictions(pagination.page + 1)}
                                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4">You haven't made any predictions yet.</p>
                    <a href="/dashboard" className="text-secondary font-bold hover:underline">Go to Dashboard to start predicting!</a>
                </div>
            )}

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
