// hooks/useSearch.js
import { useState, useCallback, useRef } from "react";
import { autocompletePlaces, geocodePlace } from "../map/mapUtils";

export function useSearch() {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [error,       setError]       = useState(null);
  const debounceRef = useRef(null);

  const onQueryChange = useCallback((val) => {
    setQuery(val);
    setError(null);
    clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await autocompletePlaces(val);
        setSuggestions(results);
      } catch { setSuggestions([]); }
    }, 350);
  }, []);

  const searchPlace = useCallback(async (queryOrSuggestion) => {
    setSearching(true);
    setError(null);
    setSuggestions([]);
    try {
      if (typeof queryOrSuggestion === "object") {
        setQuery(queryOrSuggestion.shortName || queryOrSuggestion.displayName);
        return queryOrSuggestion;
      }
      const result = await geocodePlace(queryOrSuggestion);
      setQuery(result.displayName.split(",")[0]);
      return result;
    } catch (e) {
      setError("Location not found. Try a different search.");
      return null;
    } finally {
      setSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setError(null);
  }, []);

  return { query, suggestions, searching, error, onQueryChange, searchPlace, clear };
}
