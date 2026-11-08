import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isConfigured } from '../lib/supabaseClient'

export default function Auth() {
  const { user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ email: '', password: '', name: '' })
  const [msg, setMsg] = useState({ text: '', ok: false })
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()

  if (user) return <Navigate to={loc.state?.from ?? '/dashboard'} replace />

  async function submit(e) {
    e.preventDefault()
    setMsg({ text: '', ok: false })
    if (!isConfigured) return setMsg({ text: 'Supabase тохируулагдаагүй байна.', ok: false })
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setMsg({ text: 'И-мэйл буруу байна.', ok: false })
    if (f.password.length < 6) return setMsg({ text: 'Нууц үг хамгийн багадаа 6 тэмдэгт байна.', ok: false })
    if (mode === 'register' && !f.name.trim()) return setMsg({ text: 'Нэрээ оруулна уу.', ok: false })
    setBusy(true)
    const { data, error } = mode === 'login'
      ? await signIn(f.email, f.password)
      : await signUp(f.email, f.password, f.name.trim())
    setBusy(false)
    if (error) return setMsg({ text: error.message, ok: false })
    if (mode === 'register' && !data.session)
      return setMsg({ text: 'Бүртгэл амжилттай. И-мэйлээ шалгаж баталгаажуулаад нэвтэрнэ үү.', ok: true })
    nav(loc.state?.from ?? '/dashboard')
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <form className="form narrow" onSubmit={submit} noValidate>
      <h1>{mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>
      {mode === 'register' && <div className="field"><label>Нэр</label><input value={f.name} onChange={set('name')} /></div>}
      <div className="field"><label>И-мэйл</label><input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></div>
      <div className="field"><label>Нууц үг</label><input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} /></div>
      {msg.text && <p className={`state ${msg.ok ? '' : 'error'}`}>{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? '…' : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</button>
      <p>
        <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Бүртгэлгүй юу? Бүртгүүлэх' : 'Бүртгэлтэй юу? Нэвтрэх'}
        </button>
      </p>
    </form>
  )
}
