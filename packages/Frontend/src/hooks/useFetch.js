import { useEffect, useState } from "react";

/**
 * Custom hook that fetches one or more URLs and returns [data..., loading].
 * Handles cleanup to prevent state updates on unmounted components.
 */
export default function useFetch(...urls) {
    const key = urls.join('|');

    const [state, setState] = useState({
        key,
        data: new Array(urls.length).fill(null),
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        Promise.all(
            urls.map(url =>
                // SÄKERHETSUPPDATERING: Lägg till credentials: "include"
                fetch(url, { credentials: "include" })
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        return res.json();
                    })
            )
        )
            .then(results => {
                if (!cancelled) {
                    setState({ key, data: results, loading: false, error: null });
                }
            })
            .catch(error => {
                console.error(`useFetch error for ${key}:`, error);
                if (!cancelled) {
                    setState({ key, data: new Array(urls.length).fill(null), loading: false, error });
                }
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    if (state.key !== key) {
        return [...new Array(urls.length).fill(null), true, null];
    }

    return [...state.data, state.loading, state.error];
}