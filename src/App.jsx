import { Link, NavLink, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { isConfigured } from './lib/supabaseClient'
import Home from './pages/Home'
import Exhibits from './pages/Exhibits'
import ExhibitDetail from './pages/ExhibitDetail'
import ExhibitForm from './pages/ExhibitForm'
import Teachers from './pages/Teachers'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Creators from './pages/Creators'
import TimeMachine from './pages/TimeMachine'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function Protected({ children, admin = false }) {
  const { user, isAdmin, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <p className="state">Ачаалж байна…</p>
  if (!user) return <Navigate to="/auth" state={{ from: loc.pathname }} replace />
  if (admin && !isAdmin) return <p className="state error">Танд энэ хуудсыг үзэх эрх байхгүй.</p>
  return children
}

export default function App() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand" onClick={close}>ISM <span>Digital Museum</span></Link>
        <button className="burger" aria-label="Цэс" onClick={() => setOpen(!open)}>☰</button>
        <nav className={open ? 'open' : ''} onClick={close}>
          <NavLink to="/exhibits">Үзэсгэлэн</NavLink>
          <NavLink to="/time-machine">Time Machine</NavLink>
          <NavLink to="/teachers">Багш нар</NavLink>
          <NavLink to="/events">Арга хэмжээ</NavLink>
          <NavLink to="/creators">Creators</NavLink>
          {user && <NavLink to="/dashboard">Миний бүтээл</NavLink>}
          {isAdmin && <NavLink to="/admin">Админ</NavLink>}
          {user
            ? <button className="btn ghost" onClick={signOut}>Гарах ({profile?.display_name ?? 'хэрэглэгч'})</button>
            : <NavLink to="/auth" className="btn">Нэвтрэх</NavLink>}
        </nav>
      </header>

      {!isConfigured && (
        <div className="banner">
          Supabase тохируулагдаагүй байна. <code>.env</code> файлд <code>VITE_SUPABASE_URL</code> болон{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>-г тохируулна уу (README-г үзнэ үү).
        </div>
      )}

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exhibits" element={<Exhibits />} />
          <Route path="/exhibits/:id" element={<ExhibitDetail />} />
          <Route path="/exhibits/new" element={<Protected><ExhibitForm /></Protected>} />
          <Route path="/exhibits/:id/edit" element={<Protected><ExhibitForm /></Protected>} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/time-machine" element={<TimeMachine />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
          <Route path="*" element={<p className="state">Хуудас олдсонгүй.</p>} />
        </Routes>
      </main>

      <footer className="footer">Мэдээллийн Системийн Менежментийн Тэнхим · Internet Programming · Гэрийн даалгавар №1</footer>
    </>
  )
}
