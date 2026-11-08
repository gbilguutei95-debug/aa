import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { useAuth } from '../context/AuthContext'
import { Loading, ErrorMsg, Img } from '../components/ui'

export default function ExhibitDetail() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const { data: e, loading, error } = useQuery(() =>
    supabase.from('exhibits').select('*, exhibition_categories(name), profiles(display_name)').eq('id', id).maybeSingle(), [id])

  async function remove() {
    if (!confirm('Энэ үзмэрийг устгах уу?')) return
    const { error } = await supabase.from('exhibits').delete().eq('id', id)
    if (error) alert(error.message); else nav('/exhibits')
  }

  if (loading) return <Loading />
  if (error) return <ErrorMsg message={error} />
  if (!e) return <p className="state">Үзмэр олдсонгүй.</p>
  const canEdit = user && (user.id === e.creator_id || isAdmin)

  return (
    <article className="detail">
      <Link to="/exhibits">← Буцах</Link>
      <Img src={e.image_url} alt={e.title} className="detail-img" />
      <h1>{e.title}</h1>
      <p className="muted">
        {e.exhibition_categories?.name ?? 'Ангилалгүй'}
        {e.year_created ? ` · ${e.year_created}` : ''} · Зохиогч: {e.profiles?.display_name ?? 'Тодорхойгүй'}
        {e.status !== 'published' && ` · [${e.status}]`}
      </p>
      <p className="prewrap">{e.description || 'Тайлбар оруулаагүй байна.'}</p>
      {e.technology_stack && <p className="tags">{e.technology_stack.split(',').map((t) => <span key={t}>{t.trim()}</span>)}</p>}
      <p className="actions">
        {e.demo_url && <a className="btn" href={e.demo_url} target="_blank" rel="noreferrer">Demo</a>}
        {e.github_url && <a className="btn ghost" href={e.github_url} target="_blank" rel="noreferrer">GitHub</a>}
        {canEdit && <Link className="btn ghost" to={`/exhibits/${e.id}/edit`}>Засах</Link>}
        {canEdit && <button className="btn danger" onClick={remove}>Устгах</button>}
      </p>
    </article>
  )
}
