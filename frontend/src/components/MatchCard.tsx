import React from 'react';
import { Match } from '../types';
import { format } from 'date-fns';

interface MatchCardProps {
  match: Match;
  hasPredicted?: boolean;
  onPredictClick?: (match: Match) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, hasPredicted, onPredictClick }) => {
  const isCompleted = match.status === 'completed';
  const isPredictionOpen = new Date(match.predictionsEndingTime) > new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
            {match.team1} vs {match.team2}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500">Round {match.round}</p>
        </div>
        <span
          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${isCompleted ? 'bg-gray-200' : isPredictionOpen ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
            }`}
        >
          {match.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <p className="text-xs text-gray-500">Match Time</p>
          <p className="text-sm font-medium">
            {format(new Date(match.matchTime), 'MMM dd, HH:mm')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Predictions Close</p>
          <p className="text-sm font-medium">
            {format(new Date(match.predictionsEndingTime), 'MMM dd, HH:mm')}
          </p>
        </div>
      </div>

      {isCompleted && match.team1Score !== undefined && match.team2Score !== undefined && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <p className="text-center text-2xl font-bold text-gray-800">
            {match.team1Score} - {match.team2Score}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {isPredictionOpen && !isCompleted && onPredictClick && (
          <button
            onClick={() => onPredictClick(match)}
            className="flex-1 bg-secondary text-white py-2 rounded hover:bg-blue-600 transition font-medium"
          >
            {hasPredicted ? 'Update Prediction' : 'Make Prediction'}
          </button>
        )}
        {isCompleted && (
          <button
            disabled
            className="flex-1 bg-gray-200 text-gray-600 py-2 rounded cursor-not-allowed font-medium"
          >
            Match Ended
          </button>
        )}
      </div>

      {match.comment && (
        <p className="mt-3 text-xs text-gray-600 italic">{match.comment}</p>
      )}
    </div>
  );
};

export default MatchCard;
