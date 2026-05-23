// hooks/useRoute.js
import { useState, useCallback } from "react";
import { getRoute } from "../map/mapUtils";

export function useRoute() {
  const [route,    setRoute]    = useState(null);   // { coordinates, distance, duration }
  const [origin,   setOrigin]   = useState(null);   // { lat, lng, name }
  const [dest,     setDest]     = useState(null);   // { lat, lng, name }
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const buildRoute = useCallback(async (from, to) => {
    setLoading(true);
    setError(null);
    try {
      const r = await getRoute(from, to);
      setOrigin(from);
      setDest(to);
      setRoute(r);
      return r;
    } catch (e) {
      setError("Could not calculate route. Try different points.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null); setOrigin(null); setDest(null); setError(null);
  }, []);

  return { route, origin, dest, loading, error, buildRoute, clearRoute, setOrigin, setDest };
}
