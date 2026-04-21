import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useAuthStore } from "../context/store";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    MapPin,
    Trophy,
    Users,
    BarChart3,
    ChevronRight,
    Star,
    Zap,
    Target,
    Shield,
    TrendingUp,
    ArrowRight,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// ─── Data ────────────────────────────────────────────────────────────────────

const LEADERBOARD = [
    {
        rank: 1,
        name: "North Malabar Titans",
        region: "Kannur · Kasargod · Kozhikode",
        score: 9847,
        accuracy: "94.2%",
        members: 312,
        trend: "+12",
        badge: "👑",
    },
    {
        rank: 2,
        name: "Travancore Elites",
        region: "Thiruvananthapuram · Kollam",
        score: 9421,
        accuracy: "91.7%",
        members: 287,
        trend: "+8",
        badge: "🥈",
    },
    {
        rank: 3,
        name: "Ernakulam Surge",
        region: "Ernakulam · Thrissur",
        score: 8963,
        accuracy: "89.4%",
        members: 341,
        trend: "+15",
        badge: "🥉",
    },
    {
        rank: 4,
        name: "Palakkad Predators",
        region: "Palakkad · Malappuram",
        score: 8214,
        accuracy: "86.1%",
        members: 198,
        trend: "+5",
        badge: "⚡",
    },
    {
        rank: 5,
        name: "Wayanad Watch",
        region: "Wayanad · Idukki",
        score: 7650,
        accuracy: "83.9%",
        members: 154,
        trend: "+3",
        badge: "🌿",
    },
];

const STEPS = [
    {
        num: "01",
        icon: MapPin,
        title: "Choose Your Seats",
        desc: "Distribute all 140 Kerala Assembly constituencies across LDF, UDF, and NDA. Every seat counts — even the tightest margins matter.",
        tag: "140 Seats",
        color: "#f59e0b",
    },
    {
        num: "02",
        icon: Target,
        title: "Pick the Kingmakers",
        desc: "Identify swing constituencies where the mandate will be decided. Your instinct on these battleground seats multiplies your score.",
        tag: "Swing Seats",
        color: "#ef4444",
    },
    {
        num: "03",
        icon: Trophy,
        title: "Submit & Represent",
        desc: "Lock in your prediction and earn points for your Halaqa. Climb the leaderboard as results roll in on election night.",
        tag: "Earn Points",
        color: "#16a34a",
    },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "", duration = 2 }: { target: number, suffix?: string, duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        // Force count to start immediately
        const obj = { val: 0 };
        gsap.to(obj, {
            val: target,
            duration,
            ease: "power2.out",
            onUpdate: () => setCount(Math.floor(obj.val)),
        });
    }, [target, duration]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}
            {suffix}
        </span>
    );
}

// ─── Halaqa Card ──────────────────────────────────────────────────────────────

function HalaqaCard({ item, delay }: { item: typeof LEADERBOARD[0], delay: number }) {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        const handleMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            gsap.to(card, {
                rotateY: dx * 8,
                rotateX: -dy * 8,
                duration: 0.3,
                ease: "power2.out",
                transformPerspective: 800,
            });
        };
        const handleLeave = () =>
            gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "elastic.out(1, 0.6)" });
        card.addEventListener("mousemove", handleMove as any);
        card.addEventListener("mouseleave", handleLeave);
        return () => {
            card.removeEventListener("mousemove", handleMove as any);
            card.removeEventListener("mouseleave", handleLeave);
        };
    }, []);

    useEffect(() => {
        gsap.from(cardRef.current, {
            scrollTrigger: { trigger: cardRef.current, start: "top 95%" },
            y: 30,
            duration: 0.6,
            delay,
            ease: "power3.out",
        });
    }, [delay]);

    const isTop = item.rank === 1;

    return (
        <div
            ref={cardRef}
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
            className={`relative rounded-2xl p-5 border cursor-default select-none transition-shadow duration-300
        ${isTop
                    ? "border-amber-400/50 bg-gradient-to-br from-slate-800 via-slate-800 to-amber-950/30 shadow-[0_0_32px_rgba(245,158,11,0.18)]"
                    : "border-slate-700/60 bg-slate-800/70 hover:border-slate-600"
                }`}
        >
            {isTop && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                    LEADING HALAQA
                </div>
            )}
            <div className="flex items-start gap-4">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5
            ${isTop ? "bg-amber-400/20" : "bg-slate-700"}`}
                >
                    {item.badge}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-white text-base leading-tight truncate">{item.name}</h3>
                        <span className={`text-xs font-semibold flex-shrink-0 ${item.trend.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                            {item.trend}
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-3 truncate">{item.region}</p>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-amber-400 font-bold">{item.score.toLocaleString()} pts</span>
                        <span className="text-slate-400 text-xs">{item.accuracy} accuracy</span>
                        <span className="text-slate-500 text-xs ml-auto">{item.members} members</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Floating SVG Background ──────────────────────────────────────────────────

function FloatingShapes() {
    const refs = [useRef<SVGSVGElement>(null), useRef<SVGSVGElement>(null), useRef<SVGSVGElement>(null), useRef<SVGSVGElement>(null)];

    useEffect(() => {
        refs.forEach((ref, i) => {
            if (!ref.current) return;
            gsap.to(ref.current, {
                y: `${(i % 2 === 0 ? -1 : 1) * (18 + i * 5)}px`,
                x: `${(i % 3 === 0 ? 1 : -1) * (8 + i * 3)}px`,
                rotation: i % 2 === 0 ? 8 : -8,
                duration: 4 + i * 0.7,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                delay: i * 0.5,
            });
        });
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg ref={refs[0]} className="absolute top-16 right-[8%] opacity-[0.06] w-32 h-32" viewBox="0 0 120 120">
                <rect x="10" y="10" width="100" height="80" rx="6" stroke="#f59e0b" strokeWidth="2" fill="none" />
                <rect x="20" y="30" width="30" height="4" rx="2" fill="#f59e0b" />
                <rect x="20" y="42" width="80" height="4" rx="2" fill="#f59e0b" />
                <rect x="20" y="54" width="60" height="4" rx="2" fill="#f59e0b" />
                <circle cx="95" cy="95" r="18" stroke="#f59e0b" strokeWidth="2" fill="none" />
                <path d="M88 95 l5 5 l10-10" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            <svg ref={refs[1]} className="absolute bottom-32 left-[5%] opacity-[0.05] w-40 h-40" viewBox="0 0 160 160">
                <polygon points="80,10 150,140 10,140" stroke="#ef4444" strokeWidth="2" fill="none" />
                <polygon points="80,35 125,120 35,120" stroke="#ef4444" strokeWidth="1.5" fill="none" />
            </svg>
            <svg ref={refs[2]} className="absolute top-[40%] left-[2%] opacity-[0.06] w-24 h-24" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" stroke="#16a34a" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                <circle cx="40" cy="40" r="20" stroke="#16a34a" strokeWidth="1.5" fill="none" />
                <circle cx="40" cy="40" r="5" fill="#16a34a" />
            </svg>
            <svg ref={refs[3]} className="absolute top-[20%] right-[2%] opacity-[0.05] w-28 h-28" viewBox="0 0 100 100">
                <rect x="10" y="10" width="80" height="80" rx="4" stroke="#60a5fa" strokeWidth="2" fill="none" />
                {[25, 40, 55, 70].map((y, i) => (
                    <rect key={i} x="20" y={y} width={60 - i * 10} height="6" rx="3" fill="#60a5fa" opacity="0.6" />
                ))}
            </svg>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
    const heroRef = useRef<HTMLDivElement>(null);
    const liveRef = useRef<HTMLSpanElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();

    const handlePredictClick = () => {
        navigate(isLoggedIn ? "/dashboard" : "/login");
    };

    // Hero stagger entrance
    useEffect(() => {
        // Force a refresh to ensure content is visible
        setTimeout(() => ScrollTrigger.refresh(), 100);

        const ctx = gsap.context(() => {
            gsap.from(".hero-stagger", {
                y: 20,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                delay: 0.2,
            });
        }, heroRef);
        return () => ctx.revert();
    }, []);

    // Live pulse
    useEffect(() => {
        gsap.to(liveRef.current, {
            scale: 1.4,
            opacity: 0,
            duration: 1.2,
            repeat: -1,
            ease: "power2.out",
        });
    }, []);

    // CTA magnetic effect
    useEffect(() => {
        const btn = ctaRef.current;
        if (!btn) return;
        const handleMove = (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.3, ease: "power2.out" });
        };
        const handleLeave = () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
        btn.addEventListener("mousemove", handleMove);
        btn.addEventListener("mouseleave", handleLeave);
        return () => {
            btn.removeEventListener("mousemove", handleMove);
            btn.removeEventListener("mouseleave", handleLeave);
        };
    }, []);

    // Steps scroll entrance
    useEffect(() => {
        gsap.utils.toArray<HTMLElement>(".step-card").forEach((el, i) => {
            gsap.from(el, {
                scrollTrigger: { trigger: el, start: "top 92%" },
                y: 20,
                duration: 0.7,
                delay: i * 0.1,
                ease: "power3.out",
            });
        });
    }, []);

    // Stats bar entrance
    useEffect(() => {
        gsap.from(statsRef.current, {
            scrollTrigger: { trigger: statsRef.current, start: "top 95%" },
            y: 20,
            duration: 0.7,
            ease: "power3.out",
        });
    }, []);

    return (
        <div className="bg-kerala-blue-950 text-white font-sans overflow-x-hidden">
            <Header />

            {/* ── Hero ────────────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-14 pb-16 px-4">
                <FloatingShapes />

                {/* Background gradient orbs */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-green-500/5 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    {/* Live badge */}
                    <div className="hero-stagger inline-flex items-center gap-2.5 bg-red-500/15 border border-red-500/30 rounded-full px-4 py-1.5 mb-8">
                        <span className="relative flex h-2.5 w-2.5">
                            <span ref={liveRef} className="absolute inline-flex h-full w-full rounded-full bg-red-500" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                        <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">Live Predictions Open</span>
                    </div>

                    {/* Headline */}
                    <h1 className="hero-stagger text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
                        <span className="block text-white">2026 Kerala</span>
                        <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                            Mandate
                        </span>
                        <span className="block text-slate-300 text-3xl sm:text-4xl lg:text-5xl font-bold mt-1">
                            Predict the Future
                        </span>
                    </h1>

                    <p className="hero-stagger text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
                        The Kerala Assembly has <span className="text-amber-400 font-semibold">140 seats</span> and one
                        outcome — but your prediction could earn glory for your Halaqa.
                        Join thousands competing for prediction supremacy.
                    </p>

                    {/* Alliance tags */}
                    <div className="hero-stagger flex items-center justify-center gap-3 mb-10 flex-wrap">
                        {[
                            { label: "LDF", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                            { label: "UDF", color: "bg-green-500/20 text-green-400 border-green-500/30" },
                            { label: "NDA", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                        ].map((p) => (
                            <span key={p.label} className={`border rounded-full px-4 py-1 text-sm font-semibold ${p.color}`}>
                                {p.label}
                            </span>
                        ))}
                        <span className="text-slate-600 text-sm">· 140 constituencies</span>
                    </div>

                    {/* CTA buttons */}
                    <div className="hero-stagger flex items-center justify-center gap-4 flex-wrap">
                        <button
                            id="predict"
                            ref={ctaRef}
                            onClick={handlePredictClick}
                            className="group relative bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-base px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25 flex items-center gap-2"
                        >
                            <Zap size={18} className="group-hover:rotate-12 transition-transform" />
                            Start Predicting
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-2">
                            <Users size={17} />
                            Join a Halaqa
                        </button>
                    </div>
                </div>

                {/* Scroll cue */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
                    <span className="text-xs text-slate-500 tracking-widest uppercase">Scroll</span>
                    <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
                </div>
            </section>

            {/* ── Stats Bar ───────────────────────────────────────────────────── */}
            <section ref={statsRef} className="py-10 border-y border-slate-800/60 bg-slate-900/40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            { icon: BarChart3, label: "Predictions Made", value: 48293, suffix: "", color: "text-amber-400" },
                            { icon: Users, label: "Active Participants", value: 7841, suffix: "", color: "text-green-400" },
                            { icon: MapPin, label: "Constituencies", value: 140, suffix: "", color: "text-red-400" },
                            { icon: Star, label: "Halaqas Competing", value: 68, suffix: "", color: "text-green-400" },
                        ].map(({ icon: Icon, label, value, suffix, color }) => (
                            <div key={label} className="text-center">
                                <Icon size={20} className={`${color} mx-auto mb-2`} />
                                <div className={`text-2xl sm:text-3xl font-black ${color} tabular-nums`}>
                                    <AnimatedCounter target={value} suffix={suffix} />
                                </div>
                                <div className="text-slate-500 text-xs mt-1 uppercase tracking-wide">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Leaderboard ─────────────────────────────────────────────────── */}
            <section id="leaderboard" className="py-20 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-4 py-1 mb-4">
                            <Trophy size={14} className="text-amber-400" />
                            <span className="text-amber-400 text-xs font-semibold tracking-wider uppercase">Competition</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Halaqa Leaderboard</h2>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            Halaqas are regional chapters competing for collective prediction glory. Which region knows Kerala best?
                        </p>
                    </div>

                    <div className="space-y-4 mt-4">
                        {LEADERBOARD.map((item, i) => (
                            <HalaqaCard key={item.rank} item={item} delay={i * 0.08} />
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button className="text-amber-400 hover:text-amber-300 text-sm font-semibold flex items-center gap-1 mx-auto transition-colors">
                            View Full Leaderboard <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Prediction Roadmap ───────────────────────────────────────────── */}
            <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-800/40">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1 mb-4">
                            <TrendingUp size={14} className="text-green-400" />
                            <span className="text-green-400 text-xs font-semibold tracking-wider uppercase">How It Works</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Your Prediction Roadmap</h2>
                        <p className="text-slate-400 max-w-lg mx-auto">
                            Three decisive steps stand between you and Halaqa supremacy.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6 relative">
                        {/* Connector line (desktop) */}
                        <div className="hidden sm:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-amber-400/30 via-red-400/30 to-green-400/30 z-0" />

                        {STEPS.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <div
                                    key={i}
                                    className="step-card relative bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors z-10"
                                >
                                    {/* Step number badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${step.color}18`, border: `1px solid ${step.color}33` }}
                                        >
                                            <Icon size={22} style={{ color: step.color }} />
                                        </div>
                                        <span
                                            className="text-4xl font-black opacity-[0.07] leading-none"
                                            style={{ color: step.color }}
                                        >
                                            {step.num}
                                        </span>
                                    </div>

                                    <span
                                        className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-3"
                                        style={{
                                            backgroundColor: `${step.color}15`,
                                            color: step.color,
                                            border: `1px solid ${step.color}30`,
                                        }}
                                    >
                                        {step.tag}
                                    </span>

                                    <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ────────────────────────────────────────────────────── */}
            <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-green-500/5" />
                </div>
                <div className="max-w-2xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 mb-6">
                        <Shield size={28} className="text-amber-400" />
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
                        Your Halaqa Needs <span className="text-amber-400">Your Call</span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        140 seats. One mandate. Thousands of predictions. The 2026 Kerala election is a once-in-five-years
                        moment — make sure your voice shapes your Halaqa's destiny.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button
                            onClick={handlePredictClick}
                            className="group bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-lg px-10 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-xl shadow-amber-500/30 flex items-center gap-2.5"
                        >
                            <Zap size={20} />
                            Begin Your Prediction
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <p className="text-slate-600 text-sm mt-6">Free to join · Earn points · Represent your region</p>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────────────── */}
            <footer className="border-t border-slate-800/60 py-8 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center">
                            <BarChart3 size={12} className="text-slate-900" />
                        </div>
                        <span className="font-semibold text-slate-500">Kerala Predicts 2026</span>
                    </div>
                    <p>A community prediction platform. Not affiliated with any political party.</p>
                    <div className="flex gap-4">
                        {["Privacy", "Terms", "Contact"].map((l) => (
                            <a key={l} href="#" className="hover:text-slate-400 transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}