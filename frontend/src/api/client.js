import axios from 'axios'

// One shared axios instance. In dev, /api is proxied to FastAPI by vite.config.js.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

const SERVER_DOWN = 'Cannot reach the server. Is the backend running on port 8000?'

// Turn any axios/FastAPI error into one readable string for toasts and banners.
export function getErrorMessage(err) {
  // No response at all (network error), or the Vite proxy / a gateway
  // answered 502/503/504 because the backend is not running.
  const status = err?.response?.status
  if (err?.code === 'ERR_NETWORK' || status === 502 || status === 503 || status === 504) {
    return SERVER_DOWN
  }

  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    // Pydantic 422 errors: [{ loc: [...], msg: "..." }, ...]
    return detail
      .map((d) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`)
      .join('; ')
  }
  return err?.message || 'Something went wrong'
}

export default client
