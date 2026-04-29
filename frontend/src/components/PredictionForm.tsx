import React, { useState } from 'react';
import { Match, Prediction } from '../types';
import { apiService } from '../services/apiService';

interface PredictionFormProps {
  match: Match;
  onSuccess?: (prediction: Prediction) => void;
  onClose?: () => void;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ match, onSuccess, onClose }) => {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.submitPrediction({
        matchId: match.matchId,
        team1Score,
        team2Score,
        comment,
      });

      if (onSuccess) {
        onSuccess(response.data.prediction);
      }

      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-md w-full">
      <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">
        Predict: {match.team1} vs {match.team2}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {match.team1} Score
          </label>
          <input
            type="number"
            min="0"
            max="20"
            value={team1Score}
            onChange={(e) => setTeam1Score(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {match.team2} Score
          </label>
          <input
            type="number"
            min="0"
            max="20"
            value={team2Score}
            onChange={(e) => setTeam2Score(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-secondary text-white py-2 rounded hover:bg-blue-600 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Prediction'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
