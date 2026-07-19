import React from 'react';
import KnockoutLeaderboard from '../components/KnockoutLeaderboard';
import { KnockoutRound } from '../types';

interface KnockoutRoundLeaderboardPageProps {
  round: KnockoutRound;
  title: string;
  subtitle: string;
}

const KnockoutRoundLeaderboardPage: React.FC<KnockoutRoundLeaderboardPageProps> = ({ round, title, subtitle }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <KnockoutLeaderboard
        initialRound={round}
        allowRoundSwitch={false}
        title={title}
        subtitle={subtitle}
        limit={100}
      />
    </div>
  );
};

export default KnockoutRoundLeaderboardPage;