import React from 'react';
import { LeaderboardEntry, CommunityLeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[] | CommunityLeaderboardEntry[];
  type: 'user' | 'community';
  title: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, type, title }) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-primary text-white p-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                {type === 'user' ? 'Name' : 'Community'}
              </th>
              {type === 'user' && (
                <>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">State</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Communities</th>
                </>
              )}
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={
                  type === 'user'
                    ? `${(entry as any).userId ?? (entry as any).email ?? ''}-${entry.rank}-${entry.totalPoints}`
                    : `${(entry as any).communityId ?? (entry as any).communityName ?? ''}-${entry.rank}-${entry.totalPoints}`
                }
                className={`border-b hover:bg-gray-50 transition ${
                  entry.rank <= 3 ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {entry.rank === 1 && <span>🥇</span>}
                    {entry.rank === 2 && <span>🥈</span>}
                    {entry.rank === 3 && <span>🥉</span>}
                    <span className="font-bold text-gray-900">#{entry.rank}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">
                    {type === 'user' ? (entry as LeaderboardEntry).name : (entry as CommunityLeaderboardEntry).communityName}
                  </p>
                </td>
                {type === 'user' && (
                  <>
                    <td className="px-6 py-4 text-gray-600">
                      {(entry as LeaderboardEntry).state || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(entry as LeaderboardEntry).community1 && (
                        <span className="block">{(entry as LeaderboardEntry).community1}</span>
                      )}
                      {(entry as LeaderboardEntry).community2 && (
                        <span className="block">{(entry as LeaderboardEntry).community2}</span>
                      )}
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-right font-bold text-secondary">
                  {entry.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No entries yet
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
