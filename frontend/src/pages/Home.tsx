import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match, Prediction } from '../types';
import MatchCard from '../components/MatchCard';

interface Winner {
  userId: string;
  name: string;
  photoId?: string | null;
  rank: number;
}

const PODIUM_STYLE: Record<number, { label: string; border: string; text: string; icon: string }> = {
  1: { label: 'First Place', border: 'border-yellow-400/50', text: 'text-yellow-300', icon: '🥇' },
  2: { label: 'Second Place', border: 'border-slate-300/50', text: 'text-slate-200', icon: '🥈' },
  3: { label: 'Third Place', border: 'border-amber-600/50', text: 'text-amber-300', icon: '🥉' },
};

const HomeWinnerPhoto: React.FC<{ photoId: string; initials: string; alt: string }> = ({ photoId, initials, alt }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    setObjectUrl(null);
    setFailed(false);

    apiService
      .getWinnerPhoto(photoId)
      .then((res) => {
        if (!active) return;
        createdUrl = URL.createObjectURL(res.data as Blob);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [photoId]);

  if (failed || !objectUrl) {
    return (
      <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-lg"
      onError={() => setFailed(true)}
    />
  );
};

const Home: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [overallWinners, setOverallWinners] = useState<Winner[]>([]);
  const [loadingOverallWinners, setLoadingOverallWinners] = useState(false);
  const [showIntroCollision, setShowIntroCollision] = useState(false);

  const getPredictionMatchId = (prediction: Prediction): string => {
    if (typeof prediction.matchId === 'string') return prediction.matchId;
    if (typeof (prediction.matchId as any) === 'number') return String(prediction.matchId);
    return (prediction.matchId as Match).matchId;
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        setLoadingMatches(true);
        const [matchesRes, predictionsRes] = await Promise.all([
          apiService.getAllMatches('scheduled', 1, 50),
          apiService.getUserPredictions(1, 100),
        ]);
        setMatches(matchesRes.data.matches);
        setUserPredictions(predictionsRes.data.predictions);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    load();
  }, [isLoggedIn]);

  useEffect(() => {
    const loadOverallWinners = async () => {
      try {
        setLoadingOverallWinners(true);
        const res = await apiService.getTopLeaderboard(3);
        const leaderboard = Array.isArray(res.data?.leaderboard) ? res.data.leaderboard : [];

        setOverallWinners(
          leaderboard
            .filter((entry: any) => [1, 2, 3].includes(entry.rank))
            .sort((a: any, b: any) => a.rank - b.rank)
            .slice(0, 3)
            .map((entry: any) => ({
              userId: String(entry.userId),
              name: entry.name,
              rank: entry.rank,
              photoId: null,
            }))
        );
      } catch (err) {
        console.error('Failed to load overall winners:', err);
        setOverallWinners([]);
      } finally {
        setLoadingOverallWinners(false);
      }
    };

    loadOverallWinners();
  }, []);

  useEffect(() => {
    const introKey = 'home-ball-collision-intro-v1';

    try {
      if (sessionStorage.getItem(introKey) === '1') return;
      sessionStorage.setItem(introKey, '1');
      setShowIntroCollision(true);
    } catch {
      setShowIntroCollision(true);
    }

    const timer = window.setTimeout(() => {
      setShowIntroCollision(false);
    }, 4700);

    return () => window.clearTimeout(timer);
  }, []);

  const displayMatches = useMemo(() => {
    const active = matches.filter((m) => {
      const s = String(m.status || '').trim().toLowerCase();
      return s === 'scheduled' || s === 'ongoing';
    });
    const sort = (list: Match[]) =>
      [...list].sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
    return active.length > 0 ? sort(active) : sort(matches);
  }, [matches]);

  const handlePredictionSubmit = (
    matchId: string,
    team1Score: number,
    team2Score: number,
    penaltyShootoutWinner?: string
  ) => {
    const submittedTime = new Date().toISOString();
    setUserPredictions((prev) => {
      const idx = prev.findIndex((p) => getPredictionMatchId(p) === matchId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          matchId,
          team1Score,
          team2Score,
          penaltyShootoutWinner: penaltyShootoutWinner || null,
          submittedTime,
        };
        return next;
      }
      const optimistic: Prediction = {
        _id: `optimistic-${matchId}`,
        userId: user?.userId || '',
        matchId,
        matchTag: '',
        team1Score,
        team2Score,
        penaltyShootoutWinner: penaltyShootoutWinner || null,
        submittedTime,
        points: 0,
      };
      return [optimistic, ...prev];
    });
  };

  return (
    <div>
      <style>{`
        @keyframes rocketLaunch {
          0% {
            transform: translateY(0) scale(0.35);
            opacity: 0;
          }
          18% {
            opacity: 0;
          }
          34% {
            opacity: 1;
          }
          82% {
            opacity: 1;
          }
          100% {
            transform: translate(var(--drift, 0px), var(--rise, -360px)) scale(1);
            opacity: 0;
          }
        }

        @keyframes introBallLeft {
          0% { transform: translate(-52vw, 34vh) scale(0.92) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          48% { transform: translate(-8vw, -20vh) scale(1) rotate(340deg); opacity: 1; }
          58% { transform: translate(0vw, -20vh) scale(1.06) rotate(430deg); opacity: 1; }
          100% { transform: translate(10vw, 36vh) scale(0.9) rotate(670deg); opacity: 0; }
        }

        @keyframes introBallRight {
          0% { transform: translate(52vw, 34vh) scale(0.92) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          48% { transform: translate(8vw, -20vh) scale(1) rotate(-340deg); opacity: 1; }
          58% { transform: translate(0vw, -20vh) scale(1.06) rotate(-430deg); opacity: 1; }
          100% { transform: translate(-10vw, 36vh) scale(0.9) rotate(-670deg); opacity: 0; }
        }

        @keyframes introCollisionFlash {
          0%, 46% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
          56% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.95; }
          74% { transform: translate(-50%, -50%) scale(1.8); opacity: 0.35; }
          100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
        }

        .intro-collision-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 50;
          overflow: hidden;
        }

        .intro-ball {
          position: absolute;
          left: 50%;
          top: 56%;
          width: clamp(48px, 9vw, 76px);
          height: clamp(48px, 9vw, 76px);
          object-fit: contain;
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.45));
          opacity: 0;
        }

        .intro-ball.left { animation: introBallLeft 4.6s cubic-bezier(0.2, 0.9, 0.3, 1) 1 forwards; }
        .intro-ball.right { animation: introBallRight 4.6s cubic-bezier(0.2, 0.9, 0.3, 1) 1 forwards; }

        .intro-hit-flash {
          position: absolute;
          left: 50%;
          top: 36%;
          width: clamp(64px, 14vw, 140px);
          height: clamp(64px, 14vw, 140px);
          transform: translate(-50%, -50%);
        }

        .intro-hit-flash::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background:
            radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,206,107,0.72) 26%, rgba(255,130,53,0.2) 56%, rgba(255,130,53,0) 74%);
          filter: blur(0.4px);
          animation: introCollisionFlash 4.6s ease-out 1 forwards;
          opacity: 0;
        }

        @keyframes fireworkBurst {
          0%, 80% {
            transform: scale(calc(var(--burst-from, 0.2)));
            opacity: 0;
          }
          86% {
            transform: scale(calc(var(--burst-mid, 0.9)));
            opacity: 1;
          }
          100% {
            transform: scale(calc(var(--burst-to, 1.7)));
            opacity: 0;
          }
        }

        @keyframes fireworkFlash {
          0%, 80% {
            transform: translate(-50%, -50%) scale(0.2);
            opacity: 0;
          }
          86% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.4);
            opacity: 0;
          }
        }

        @keyframes smokeFade {
          0%, 72% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          80% {
            transform: translate(-50%, -58%) scale(0.95);
            opacity: 0.28;
          }
          100% {
            transform: translate(-50%, -95%) scale(1.45);
            opacity: 0;
          }
        }

        .home-firework {
          position: absolute;
          bottom: 0;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          animation-name: rocketLaunch;
          animation-timing-function: ease-out;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
          background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, hsla(var(--hue, 42), 100%, 72%, 0.95) 50%, hsla(var(--hue, 42), 100%, 40%, 0) 82%);
          box-shadow:
            0 0 10px hsla(var(--hue, 42), 100%, 70%, 0.95),
            0 0 22px hsla(var(--hue, 42), 100%, 58%, 0.6);
          mix-blend-mode: screen;
        }

        .home-firework::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 5px;
          width: 1.5px;
          height: 110px;
          transform: translateX(-50%);
          background: linear-gradient(to top, hsla(var(--hue, 42), 100%, 72%, 0.85), hsla(var(--hue, 42), 100%, 72%, 0));
          filter: blur(0.8px);
        }

        .home-firework::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--burst-size, 80px);
          height: var(--burst-size, 80px);
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          opacity: 0;
          animation: fireworkBurst var(--dur, 2.8s) ease-out infinite;
          animation-delay: var(--delay, 0s);
          background:
            radial-gradient(circle at 50% 6%, rgba(255, 255, 255, 0.98) 0 5%, transparent 6%),
            radial-gradient(circle at 83% 17%, hsla(calc(var(--hue, 42) + 28), 100%, 70%, 0.95) 0 4%, transparent 5%),
            radial-gradient(circle at 94% 50%, hsla(var(--hue, 42), 100%, 84%, 0.98) 0 4%, transparent 5%),
            radial-gradient(circle at 83% 83%, hsla(calc(var(--hue, 42) - 24), 100%, 62%, 0.95) 0 4%, transparent 5%),
            radial-gradient(circle at 50% 94%, rgba(255, 255, 255, 0.95) 0 5%, transparent 6%),
            radial-gradient(circle at 17% 83%, hsla(calc(var(--hue, 42) + 28), 100%, 70%, 0.95) 0 4%, transparent 5%),
            radial-gradient(circle at 6% 50%, hsla(var(--hue, 42), 100%, 84%, 0.98) 0 4%, transparent 5%),
            radial-gradient(circle at 17% 17%, hsla(calc(var(--hue, 42) - 24), 100%, 62%, 0.95) 0 4%, transparent 5%),
            radial-gradient(circle at 64% 33%, hsla(calc(var(--hue, 42) + 52), 100%, 72%, 0.9) 0 3%, transparent 4%),
            radial-gradient(circle at 36% 67%, hsla(calc(var(--hue, 42) - 38), 100%, 70%, 0.9) 0 3%, transparent 4%);
          filter: drop-shadow(0 0 10px hsla(var(--hue, 42), 100%, 72%, 0.9));
        }

        .home-firework b {
          position: absolute;
          left: 50%;
          top: 50%;
          width: calc(var(--burst-size, 80px) * 0.5);
          height: calc(var(--burst-size, 80px) * 0.5);
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          opacity: 0;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, hsla(var(--hue, 42), 100%, 72%, 0.48) 42%, rgba(255, 255, 255, 0) 72%);
          filter: blur(1.2px);
          animation: fireworkFlash var(--dur, 2.8s) ease-out infinite;
          animation-delay: var(--delay, 0s);
          pointer-events: none;
        }

        .home-firework i {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 3px;
          height: 3px;
          border-radius: 9999px;
          background: hsla(calc(var(--hue, 42) + 18), 100%, 82%, 0.95);
          box-shadow: 0 0 8px hsla(calc(var(--hue, 42) + 18), 100%, 72%, 0.95);
          transform: translate(-50%, -50%);
          opacity: 0;
          animation: fireworkBurst var(--dur, 2.8s) ease-out infinite;
          animation-delay: calc(var(--delay, 0s) + 0.08s);
        }

        .home-firework em {
          position: absolute;
          left: 50%;
          top: 50%;
          width: calc(var(--burst-size, 80px) * 0.52);
          height: calc(var(--burst-size, 80px) * 0.52);
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          opacity: 0;
          background: radial-gradient(circle, rgba(232, 236, 244, 0.35) 0%, rgba(176, 184, 198, 0.16) 42%, rgba(109, 120, 139, 0) 72%);
          filter: blur(2px);
          animation: smokeFade var(--dur, 2.8s) ease-out infinite;
          animation-delay: calc(var(--delay, 0s) + 0.12s);
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .home-firework,
          .home-firework::after {
            animation: none;
            opacity: 0;
          }

          .intro-collision-overlay {
            display: none;
          }
        }
      `}</style>

      {showIntroCollision && (
        <div className="intro-collision-overlay" aria-hidden="true">
          <img src="/original-world-cup.png" alt="" className="intro-ball left" />
          <img src="/original-world-cup.png" alt="" className="intro-ball right" />
          <div className="intro-hit-flash" />
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 block" aria-hidden="true">
        <div className="absolute left-1 sm:left-4 bottom-0 h-40 sm:h-56 w-14 sm:w-20">
          <span className="home-firework" style={{ left: '4px', animationDuration: '2.9s', animationDelay: '0s', ['--dur' as any]: '2.9s', ['--delay' as any]: '0s', ['--drift' as any]: '128px', ['--rise' as any]: '-470px', ['--hue' as any]: '26', ['--burst-size' as any]: '84px', ['--burst-from' as any]: '0.16', ['--burst-mid' as any]: '0.86', ['--burst-to' as any]: '1.7' }}><b /><i /><em /></span>
          <span className="home-firework" style={{ left: '28px', animationDuration: '2.3s', animationDelay: '0.8s', ['--dur' as any]: '2.3s', ['--delay' as any]: '0.8s', ['--drift' as any]: '112px', ['--rise' as any]: '-420px', ['--hue' as any]: '198', ['--burst-size' as any]: '104px', ['--burst-from' as any]: '0.2', ['--burst-mid' as any]: '0.98', ['--burst-to' as any]: '2.05' }}><b /><i /><em /></span>
          <span className="home-firework" style={{ left: '50px', animationDuration: '3.2s', animationDelay: '1.4s', ['--dur' as any]: '3.2s', ['--delay' as any]: '1.4s', ['--drift' as any]: '142px', ['--rise' as any]: '-500px', ['--hue' as any]: '332', ['--burst-size' as any]: '92px', ['--burst-from' as any]: '0.18', ['--burst-mid' as any]: '0.9', ['--burst-to' as any]: '1.85' }}><b /><i /><em /></span>
        </div>

        <div className="absolute right-1 sm:right-4 bottom-0 h-40 sm:h-56 w-14 sm:w-20">
          <span className="home-firework" style={{ left: '44px', animationDuration: '2.8s', animationDelay: '0.3s', ['--dur' as any]: '2.8s', ['--delay' as any]: '0.3s', ['--drift' as any]: '-128px', ['--rise' as any]: '-470px', ['--hue' as any]: '40', ['--burst-size' as any]: '100px', ['--burst-from' as any]: '0.18', ['--burst-mid' as any]: '0.92', ['--burst-to' as any]: '1.96' }}><b /><i /><em /></span>
          <span className="home-firework" style={{ left: '24px', animationDuration: '2.2s', animationDelay: '1s', ['--dur' as any]: '2.2s', ['--delay' as any]: '1s', ['--drift' as any]: '-110px', ['--rise' as any]: '-420px', ['--hue' as any]: '220', ['--burst-size' as any]: '82px', ['--burst-from' as any]: '0.14', ['--burst-mid' as any]: '0.82', ['--burst-to' as any]: '1.66' }}><b /><i /><em /></span>
          <span className="home-firework" style={{ left: '2px', animationDuration: '3.1s', animationDelay: '1.6s', ['--dur' as any]: '3.1s', ['--delay' as any]: '1.6s', ['--drift' as any]: '-142px', ['--rise' as any]: '-500px', ['--hue' as any]: '302', ['--burst-size' as any]: '110px', ['--burst-from' as any]: '0.2', ['--burst-mid' as any]: '1.02', ['--burst-to' as any]: '2.12' }}><b /><i /><em /></span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden shadow-2xl border-b border-white/10 bg-primary">
        <img src="/Cover.png" alt="WORLD CUP 2026 Cover" className="w-full h-auto object-cover max-h-[500px] sm:max-h-[700px] block" />
        
        {/* Bottom-to-top gradient to blend the image into the page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-2 pl-4 sm:pt-10 sm:pb-4 sm:pl-8">
          {isLoggedIn && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
              <button
                onClick={() => logout()}
                className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-bold backdrop-blur-sm shadow-xl"
                title="Logout"
              >
                <span className="hidden sm:inline uppercase tracking-wider">Logout</span>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/VelichamLogo.png" alt="Velicham Logo" className="h-16 sm:h-24 md:h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-left-12 duration-1000" />
              <img src="/Mlogo-w.png" alt="Media One Logo" className="h-16 sm:h-24 md:h-32 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-12 duration-1000" />
            </div>
            <h1 className="text-white font-bold text-xl sm:text-4xl md:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <span className="block text-white">WORLD CUP '26</span>
              <span className="block text-sky-400">Prediction</span>
            </h1>
          </div>
          <p className="text-sm sm:text-2xl md:text-3xl text-sky-100/80 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            Get ready to participate, compete and celebrate with your community!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">

        <div className="text-center mb-6 sm:mb-8 px-4">
          <div className="flex flex-row flex-wrap gap-3 justify-center">
            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="w-40 py-2.5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-lg shadow-sky-500/20 text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                Dashboard
              </Link>
            )}
            {!isLoggedIn && (
              <Link
                to="/login"
                className="w-40 py-2.5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-lg shadow-sky-500/20 text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                Login to Predict
              </Link>
            )}
            <Link
              to="/leaderboard"
              className="w-40 py-2.5 bg-white/5 border border-sky-400/50 text-white/70 font-bold rounded-xl hover:bg-white/15 hover:text-white hover:border-sky-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
            >
              Overall Leaderboard
            </Link>
            <Link
              to="/winners"
              className="w-40 py-2.5 bg-white/5 border border-yellow-400/50 text-yellow-300/80 font-bold rounded-xl hover:bg-yellow-500/10 hover:text-yellow-200 hover:border-yellow-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
            >
              Winners
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm shadow-xl px-4 py-5 sm:px-6 sm:py-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-[0.18em]">Overall Winners</h2>
              <Link to="/winners" className="text-xs text-sky-300 hover:text-sky-200 font-semibold">View all winners</Link>
            </div>

            {loadingOverallWinners ? (
              <div className="text-center py-6 text-white/50 text-sm">Loading overall winners...</div>
            ) : overallWinners.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {overallWinners.map((winner) => {
                  const style = PODIUM_STYLE[winner.rank] || PODIUM_STYLE[3];
                  const name = winner.name?.trim() || 'Winner';
                  const nameParts = name.split(/\s+/).filter(Boolean);
                  const initials = (nameParts[0]?.charAt(0) || nameParts[1]?.charAt(0) || 'W').toUpperCase();

                  return (
                    <div
                      key={winner.userId}
                      className={`rounded-2xl border ${style.border} bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0c1a1a] p-4 flex flex-col items-center text-center`}
                    >
                      <div className="text-xl mb-2">{style.icon}</div>
                      <div className="relative">
                        {winner.photoId ? (
                          <HomeWinnerPhoto photoId={winner.photoId} initials={initials} alt={name} />
                        ) : (
                          <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white">
                            {initials}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-white font-semibold text-sm sm:text-base">{name || 'Winner'}</p>
                      <p className={`text-xs font-medium mt-1 ${style.text}`}>{style.label}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-white/40 text-sm">Overall winners will appear here once final results are published.</div>
            )}
          </div>

          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm shadow-xl px-4 pt-7 pb-4 sm:px-5 sm:pt-8 sm:pb-5 max-w-6xl mx-auto">
            <span className="absolute -top-3 left-4 sm:left-6 px-3 py-1 rounded-full border border-white/20 bg-[#0f172a] text-[10px] sm:text-xs font-bold text-white uppercase tracking-[0.2em]">
              Stage Leaderboards
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <Link
                to="/group-stages"
                className="min-w-0 py-2.5 bg-white/5 border border-purple-400/50 text-purple-300/80 font-bold rounded-xl hover:bg-purple-500/10 hover:text-purple-200 hover:border-purple-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                Group
              </Link>
              <Link
                to="/round-32"
                className="min-w-0 py-2.5 bg-white/5 border border-teal-400/50 text-teal-300/80 font-bold rounded-xl hover:bg-teal-500/10 hover:text-teal-200 hover:border-teal-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                R 32
              </Link>
              <Link
                to="/round-16"
                className="min-w-0 py-2.5 bg-white/5 border border-cyan-400/50 text-cyan-300/80 font-bold rounded-xl hover:bg-cyan-500/10 hover:text-cyan-200 hover:border-cyan-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                R 16
              </Link>
              <Link
                to="/quarter-leaderboard"
                className="min-w-0 py-2.5 bg-white/5 border border-emerald-400/50 text-emerald-300/80 font-bold rounded-xl hover:bg-emerald-500/10 hover:text-emerald-200 hover:border-emerald-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700"
              >
                Quarter
              </Link>
              <Link
                to="/semifinal-leaderboard"
                className="min-w-0 py-2.5 bg-white/5 border border-rose-400/50 text-rose-300/80 font-bold rounded-xl hover:bg-rose-500/10 hover:text-rose-200 hover:border-rose-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700 col-span-2 sm:col-span-1"
              >
                Semi
              </Link>
              <Link
                to="/super-round-leaderboard"
                className="min-w-0 py-2.5 bg-white/5 border border-amber-400/50 text-amber-300/80 font-bold rounded-xl hover:bg-amber-500/10 hover:text-amber-200 hover:border-amber-400 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-xl backdrop-blur-sm text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700 col-span-2 sm:col-span-1"
              >
                Super Round
              </Link>
            </div>
          </div>
        </div>

        {/* Scoring notification — shown for all users */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md border border-yellow-400/40 bg-yellow-500/15 px-3 py-2 flex items-start gap-2">
              <span className="text-sm leading-none mt-0.5">⚠️</span>
              <p className="text-yellow-100/90 text-xs sm:text-sm">
                <strong>Knockout Matches:</strong> Get +2 points for correctly predicting the penalty shootout winner.Please check the Knockout Rules section in Home for more details.
              </p>
            </div>
            <div className="rounded-md border border-yellow-400/40 bg-yellow-500/15 px-3 py-2 flex items-start gap-2">
              <span className="text-sm leading-none mt-0.5">⚠️</span>
              <p className="text-yellow-100/90 text-xs sm:text-sm">
                <strong>Community Weightage Point:</strong> Communities earn +1 point for every 10 members participating in predictions, starting from Group Stage Round 3.
              </p>
            </div>
        </div>

       

        {/* Match Prediction Tiles — shown only when logged in */}
        {isLoggedIn && (
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white">⚽ Matches to Predict</h2>
            </div>
            {loadingMatches ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
                <p className="mt-3 text-white/50 text-sm">Loading matches…</p>
              </div>
            ) : displayMatches.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {displayMatches.map((match) => {
                  const userPrediction = userPredictions.find(
                    (p) => getPredictionMatchId(p) === match.matchId
                  );
                  return (
                    <MatchCard
                      key={match.matchId}
                      match={match}
                      userPrediction={userPrediction}
                      onPredictionSubmit={handlePredictionSubmit}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/50">No matches scheduled yet</div>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {[
            { icon: '⚽', title: 'Make Predictions', text: 'Predict the scores of upcoming WORLD CUP matches before the deadline and earn points based on accuracy.' },
            { icon: '🏅', title: 'Climb Leaderboards', text: 'Compete individually and with your community. Track daily and all-time rankings.' },
            { icon: '👥', title: 'Join Communities', text: 'Be part of up to 2 communities and help them climb the community leaderboard.' }
          ].map((feature, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-blue-900/30 group"
              style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
                }}
              />
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                  <span className="text-2xl">{feature.icon}</span> {feature.title}
                </h3>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                  {feature.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Rules Section */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Scoring Rules */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
              backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">📊 Scoring Rules</h3>
              <ul className="text-sm text-white/70 space-y-3">
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[10px] border border-green-500/20 font-bold">5</span>
                  <span><strong>Correct Result:</strong> 5 points</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/20 font-bold">2</span>
                  <span><strong>Correct Team 1 Score:</strong> 2 points</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/20 font-bold">2</span>
                  <span><strong>Correct Team 2 Score:</strong> 2 points</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] border border-sky-500/20 font-bold">1</span>
                  <span><strong>Correct Goal Difference:</strong> 1 point</span>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/40 text-emerald-300 text-[10px] border border-emerald-500/60 font-bold mt-0.5">+2</span>
                  <div>
                    <span className="text-emerald-100"><strong>✨ Correct penalty shootout winner:</strong> 2 points</span>
                    <p className="text-xs text-emerald-200/70 mt-1">Please check the Knockout Rules section for more details.</p>
                  </div>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-lg border border-purple-500/40 bg-purple-500/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/40 text-purple-300 text-[10px] border border-purple-500/60 font-bold">1</span>
                  <span className="text-purple-100"><strong>✨ Community Weightage:</strong> 1 point per 10 community members</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Knockout Rules */}
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">🛡️ Knockout Rules</h3>
              <div className="text-sm text-white/70 space-y-3">
                <p>Standard scoring (up to 10 points) is based on the score in Normal and Extra time (120 minutes) and NOT penalty score.</p>
                <p className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-100">If the match goes to penalties, users who predicted a draw in normal time and extra time, and correctly selected the penalty shootout winner receive an additional <strong>+2 bonus points</strong>.</p>
                <p>If a user predicts a draw + penalty winner, but the match finishes in normal time or extra time without penalties, they will not receive the 5 points for correct result.</p>
                <p>Predicting a team to win in normal time does not qualify for the penalty bonus, even if that team eventually wins the shootout.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
