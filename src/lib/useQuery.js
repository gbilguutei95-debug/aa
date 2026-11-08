import { useEffect, useState } from 'react'

// Нэг удаагийн async ачаалалт: { data, loading, error }
export function useQuery(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve(fn())
      .then(({ data, error }) => {
        if (!alive) return
        setState({ data: data ?? null, loading: false, error: error?.message ?? null })
      })
      .catch((e) => alive && setState({ data: null, loading: false, error: e.message }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
