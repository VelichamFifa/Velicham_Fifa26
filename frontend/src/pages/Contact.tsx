import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const Contact: React.FC = () => {
    const { user } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Pre-fill user data if they are logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || ''
            }));
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiService.submitContactMessage(formData);
            setSuccess('Thank you! Your message has been sent to the admin successfully.');
            // Clear the subject and message, but keep name/email
            setFormData(prev => ({ ...prev, subject: '', message: '' }));
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] px-4 py-12 text-white flex items-center justify-center">
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'radial-gradient(ellipse 70% 50% at 50% 20%, #ffffff 0%, transparent 70%), ' +
                        'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                }}
            />
            
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
                <div
                    className="relative overflow-hidden px-8 py-10 text-white"
                    style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
                >
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">Contact Admin</h2>
                        <p className="text-white/70">
                            Have questions or facing an issue? Send us a message and we'll get back to you.
                        </p>
                    </div>
                </div>

                <div className="p-8">
                    {success && (
                        <div className="mb-6 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-emerald-100 shadow-lg relative">
                            {success}
                            <button onClick={() => setSuccess('')} className="absolute right-3 top-2 text-emerald-100/80 hover:text-white">✕</button>
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-rose-100 shadow-lg relative">
                            {error}
                            <button onClick={() => setError('')} className="absolute right-3 top-2 text-rose-100/80 hover:text-white">✕</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-1">Name <span className="text-rose-400">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/70 uppercase mb-1">Email <span className="text-rose-400">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/70 uppercase mb-1">Subject <span className="text-rose-400">*</span></label>
                            <select name="subject" required value={formData.subject} onChange={handleChange} className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60 [&>option]:bg-slate-900">
                                <option value="" disabled>Select a subject...</option>
                                <option value="General Query">General Query</option>
                                <option value="Account Issue">Account / Login Issue</option>
                                <option value="Community / Team Request">Community / Team Request</option>
                                <option value="Bug Report">Report a Bug</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/70 uppercase mb-1">Message <span className="text-rose-400">*</span></label>
                            <textarea name="message" required value={formData.message} onChange={handleChange} rows={5} className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60" placeholder="How can we help you?" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full rounded-lg bg-sky-500 py-3 font-bold text-white transition hover:bg-sky-400 disabled:opacity-50 mt-2 shadow-lg shadow-sky-950/30">
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Contact;