'use client';

import React, { useState } from 'react';

export default function Home() {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setShortUrl('');

    try {
      const res = await fetch('/api/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_url: targetUrl }),
      });

      if (!res.ok) throw new Error('Failed to shorten');

      const data = await res.json();
      setShortUrl(`http://127.0.0.1:8000/${data.short_code}`);
    } catch (err) {
      alert('Error connecting to backend!');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Trimly
          </h1>
          <p className="text-slate-400 text-sm">Powered by FastAPI & Next.js (TypeScript)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Paste Long URL
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-medium py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            {loading ? 'Shortening...' : 'Generate Short Link'}
          </button>
        </form>

        {shortUrl && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Your Short Link
            </label>
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl">
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-300 text-sm truncate mr-2 hover:underline">
                {shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
