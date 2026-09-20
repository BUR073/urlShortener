'use client';

import React, { useState, useEffect } from 'react';

interface LinkItem {
  short_code: string;
  target_url: string;
  click_count?: number;
}

export default function Home() {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Recent links saved in localStorage
  const [recentLinks, setRecentLinks] = useState<LinkItem[]>([]);
  const [selectedStats, setSelectedStats] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('trimly_links');
    if (saved) {
      setRecentLinks(JSON.parse(saved));
    }
  }, []);

  const saveToLocal = (newLink: LinkItem) => {
    const updated = [newLink, ...recentLinks.filter(l => l.short_code !== newLink.short_code)];
    setRecentLinks(updated);
    localStorage.setItem('trimly_links', JSON.stringify(updated));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setShortUrl('');
    setErrorMsg('');

    try {
      const payload: any = { target_url: targetUrl };
      if (customCode.trim()) {
        payload.custom_code = customCode.trim();
      }

      const res = await fetch('/api/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to shorten');

      const fullUrl = `http://127.0.0.1:8000/${data.short_code}`;
      setShortUrl(fullUrl);
      saveToLocal({ short_code: data.short_code, target_url: targetUrl });

      setTargetUrl('');
      setCustomCode('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (code: string) => {
    try {
      const res = await fetch(`/api/stats/${code}`);
      if (!res.ok) throw new Error('Could not fetch stats');
      const data = await res.json();
      setSelectedStats(data);
    } catch (err) {
      alert('Error fetching analytics.');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Trimly Pro
          </h1>
          <p className="text-slate-400 text-sm">Custom Aliases, Analytics, & Link History</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Destination URL
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/long-url"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Custom Alias <span className="text-slate-600 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="e.g. my-portfolio"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-600"
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 p-3 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Processing...' : 'Create Short Link'}
            </button>
          </form>

          {shortUrl && (
            <div className="pt-4 border-t border-slate-800 space-y-2 animate-fadeIn">
              <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Your Short Link
              </label>
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl">
                <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 text-sm truncate mr-2 hover:underline">
                  {shortUrl}
                </a>
                <button
                  onClick={() => copyToClipboard(shortUrl)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg transition shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Links History Component */}
        {recentLinks.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your Recent Links</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {recentLinks.map((link) => (
                <div key={link.short_code} className="flex items-center justify-between bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-sm">
                  <div className="truncate mr-4">
                    <span className="text-indigo-400 font-bold mr-2">/{link.short_code}</span>
                    <span className="text-slate-500 truncate text-xs">{link.target_url}</span>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button
                      onClick={() => fetchStats(link.short_code)}
                      className="bg-slate-800 hover:bg-slate-700 text-xs px-2.5 py-1 rounded-lg transition text-slate-300"
                    >
                      Stats
                    </button>
                    <button
                      onClick={() => copyToClipboard(`http://127.0.0.1:8000/${link.short_code}`)}
                      className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs px-2.5 py-1 rounded-lg transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Modal / Card View */}
        {selectedStats && (
          <div className="bg-slate-900 border border-indigo-500/40 p-6 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Analytics for /{selectedStats.short_code}</h3>
              <button onClick={() => setSelectedStats(null)} className="text-slate-500 hover:text-slate-300 text-xs">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-slate-500 text-xs">Total Clicks</p>
                <p className="text-2xl font-bold text-indigo-400">{selectedStats.click_count}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Last Accessed</p>
                <p className="text-xs font-medium text-slate-300 mt-1">
                  {selectedStats.last_accessed ? new Date(selectedStats.last_accessed).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
