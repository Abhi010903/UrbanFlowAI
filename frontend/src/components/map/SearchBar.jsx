// components/map/SearchBar.jsx
import React, { useRef, useEffect } from "react";

export default function SearchBar({
  query, suggestions, searching, error,
  onQueryChange, onSelect, onClear, onSearch, placeholder,
}) {
  const inputRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === "Enter") onSearch(query);
    if (e.key === "Escape") onClear();
  };

  return (
    <div className="sb-wrap">
      <div className={`sb-box ${error ? "sb-error" : ""}`}>
        {/* search icon */}
        <svg className="sb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          className="sb-input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Search city, road, intersection…"}
          autoComplete="off"
          spellCheck="false"
        />

        {searching && <div className="sb-spinner" />}

        {query && !searching && (
          <button className="sb-clear" onClick={onClear} title="Clear">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}

        <button className="sb-btn" onClick={() => onSearch(query)}>
          Search
        </button>
      </div>

      {error && <div className="sb-error-msg">{error}</div>}

      {suggestions.length > 0 && (
        <ul className="sb-suggestions">
          {suggestions.map((s, i) => (
            <li key={i} className="sb-suggestion" onClick={() => onSelect(s)}>
              <span className="sb-sug-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </span>
              <div className="sb-sug-text">
                <span className="sb-sug-main">{s.shortName}</span>
                <span className="sb-sug-sub">{s.displayName.split(",").slice(1, 3).join(",").trim()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
