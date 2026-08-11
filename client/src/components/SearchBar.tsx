import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  reports: Array<{ _id: string; fileName: string; reportType: string }>;
  events: Array<{ _id: string; title: string; type: string; date: string }>;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get<SearchResult>(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectReport = (id: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/reports/${id}`);
  };

  const handleSelectEvent = (id: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/history/${id}`);
  };

  return (
    <div className="search-container" ref={searchRef}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Search reports, terms, illnesses..."
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setIsOpen(true)}
      />

      {isOpen && results && (
        <div className="search-results">
          {isLoading && <div className="p-4 text-sm text-secondary">Searching...</div>}

          {!isLoading && results.reports.length === 0 && results.events.length === 0 && (
            <div className="p-4 text-sm text-secondary">No matching results found</div>
          )}

          {results.reports.length > 0 && (
            <div className="search-section">
              <div className="sidebar-nav-section-title px-4 pt-2">Reports ({results.reports.length})</div>
              {results.reports.map(r => (
                <div
                  key={r._id}
                  className="search-result-item"
                  onClick={() => handleSelectReport(r._id)}
                >
                  <div className="font-semibold text-sm">📄 {r.fileName}</div>
                  {r.reportType && <div className="text-xs text-secondary">{r.reportType}</div>}
                </div>
              ))}
            </div>
          )}

          {results.events.length > 0 && (
            <div className="search-section">
              <div className="sidebar-nav-section-title px-4 pt-2">Medical History ({results.events.length})</div>
              {results.events.map(e => (
                <div
                  key={e._id}
                  className="search-result-item"
                  onClick={() => handleSelectEvent(e._id)}
                >
                  <div className="font-semibold text-sm">📋 {e.title}</div>
                  <div className="text-xs text-secondary">{e.type} • {new Date(e.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
