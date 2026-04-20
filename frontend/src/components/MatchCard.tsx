import React, { useState, useEffect } from 'react';
import { Match, Prediction } from '../types';
import { format } from 'date-fns';
import { apiService } from '../services/apiService';

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  onPredictionSubmit?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, userPrediction, onPredictionSubmit }) => {
  const isCompleted = match.status === 'completed';
  const isPredictionOpen = new Date(match.predictionsEndingTime) > new Date();
  
  const [team1Score, setTeam1Score] = useState<number | ''>('');
  const [team2Score, setTeam2Score] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userPrediction) {
      setTeam1Score(userPrediction.team1Score);
      setTeam2Score(userPrediction.team2Score);
    } else {
      setTeam1Score('');
      setTeam2Score('');
    }
  }, [userPrediction]);

  const handleSubmit = async () => {
    if (!isPredictionOpen) return;
    if (team1Score === '' || team2Score === '') {
      setError('Please enter both scores');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await apiService.submitPrediction({
        matchId: match.matchId,
        team1Score: Number(team1Score),
        team2Score: Number(team2Score),
        comment: '',
      });
      if (onPredictionSubmit) {
        onPredictionSubmit();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit prediction');
    } finally {
      setLoading(false);
    }
  };

  const getFlag = (team: string) => {
    if (!team) return 'TBD';
    return team.substring(0, 3).toUpperCase();
  };

  return (
    <div 
      className="border border-gray-200 rounded-2xl shadow-sm p-4 hover:shadow-md transition bg-cover bg-center overflow-hidden relative"
      style={{ backgroundImage: "url('/soccer-ground.png')", backgroundColor: '#f8f9fa' }}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-white flex items-center justify-center text-[10px] font-bold text-gray-700 z-10 shadow-sm">
            {getFlag(match.team1)}
          </div>
          <div className="w-8 h-8 rounded-full bg-red-50 border border-white flex items-center justify-center text-[10px] font-bold text-gray-700 z-0 shadow-sm">
            {getFlag(match.team2)}
          </div>
        </div>

        <div className="flex-1 text-center px-1">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            {match.team1} vs {match.team2}
          </h3>
          <p className="text-[10px] text-gray-500 font-medium">{match.matchTag || 'Group Stage'}</p>
        </div>

        <span className="px-3 py-1 bg-white text-gray-500 border border-gray-200 rounded-full text-[10px] font-medium tracking-wide shadow-sm truncate max-w-[80px]">
          {match.status === 'scheduled' ? 'Scheduled' : match.status.charAt(0).toUpperCase() + match.status.slice(1)}
        </span>
      </div>

      {error && <p className="text-red-500 text-[10px] text-center mb-2 font-medium relative z-10">{error}</p>}

      <div className="flex justify-center items-center gap-6 mb-5 mt-2 relative z-10">
        {isCompleted ? (
          <>
            <div className="bg-white text-gray-900 text-2xl font-black rounded-lg w-16 h-12 flex items-center justify-center shadow-sm border border-gray-200">
              {match.team1Score ?? 0}
            </div>
            <div className="bg-white text-gray-900 text-2xl font-black rounded-lg w-16 h-12 flex items-center justify-center shadow-sm border border-gray-200">
              {match.team2Score ?? 0}
            </div>
          </>
        ) : (
          <>
            <input
              type="number"
              min="0"
              max="20"
              disabled={!isPredictionOpen || loading}
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-white text-gray-900 text-center text-2xl font-black rounded-lg w-16 h-12 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2b9348] disabled:opacity-70 shadow-sm transition-shadow"
            />
            <input
              type="number"
              min="0"
              max="20"
              disabled={!isPredictionOpen || loading}
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-white text-gray-900 text-center text-2xl font-black rounded-lg w-16 h-12 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2b9348] disabled:opacity-70 shadow-sm transition-shadow"
            />
          </>
        )}
      </div>

      <div className="mb-4 relative z-10">
        {!isCompleted ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !isPredictionOpen}
            className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition shadow-sm ${
              isPredictionOpen 
                ? 'bg-gradient-to-r from-[#1a2b4c] via-[#38bdf8] to-[#459a45] text-white hover:brightness-110 active:transform active:scale-[0.98]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'SUBMITTING...' : isPredictionOpen ? 'SUBMIT PREDICTION' : 'PREDICTION CLOSED'}
          </button>
        ) : (
          <button disabled className="w-full py-2.5 bg-gray-200 text-gray-500 rounded-lg text-sm font-bold tracking-wide cursor-not-allowed shadow-sm">
            MATCH ENDED
          </button>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-gray-800 mt-2 relative z-10 font-medium">
        <div className="flex flex-col">
          <span>Match Time:</span>
          <span className="font-bold whitespace-nowrap">{format(new Date(match.matchTime), 'MMM dd, HH:mm')}</span>
        </div>
        <span className="text-gray-900 font-black px-1 text-center text-[8px]">•</span>
        <div className="flex flex-col text-center">
          <span>Prediction Close:</span>
          <span className="font-bold whitespace-nowrap">{format(new Date(match.predictionsEndingTime), 'MMM dd, HH:mm')}</span>
        </div>
        <span className="text-gray-900 font-black px-1 text-center text-[8px]">•</span>
        <div className="flex flex-col text-right">
          <span>Round:</span>
          <span className="font-bold whitespace-nowrap">Round {match.round}</span>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
