import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty, Img } from '../components/ui'

export function ExhibitCard({ e }) {
  return (
    <Link to={`/exhibits/${e.id}`} className="card">
      <Img src={e.image_url} alt={e.title} className="card-img" />
      <div className="card-body">
        <h3>{e.title}</h3>
        <p className="muted">
          {e.exhibition_categories?.name ?? 'Ангилалгүй'}{e.year_created ? ` · ${e.year_created}` : ''}
        </p>
        {e.technology_stack && <p className="tags">{e.technology_stack.split(',').map((t) => <span key={t}>{t.trim()}</span>)}</p>}
      </div>
    </Link>
  )
}

export default function Home() {
  const latest = useQuery(() =>
    supabase.from('exhibits').select('*, exhibition_categories(name)')
      .eq('status', 'published').order('created_at', { ascending: false }).limit(6), [])
  const counts = useQuery(async () => {
    const tables = ['exhibits', 'teachers', 'events']
    const res = await Promise.all(tables.map((t) => supabase.from(t).select('*', { count: 'exact', head: true })))
    return { data: Object.fromEntries(tables.map((t, i) => [t, res[i].count ?? 0])) }
  }, [])

  return (
    <>
      <section className="hero">
        <h1>ISM Digital Museum</h1>
        <p>Мэдээллийн Системийн Менежментийн тэнхимийн түүх, багш нар, арга хэмжээ, оюутнуудын бүтээл болон технологийн хөгжлийг нэг дор.</p>
        <div className="hero-actions">
          <Link className="btn light" to="/exhibits">Үзэсгэлэн үзэх</Link>
          <Link className="btn ghost light" to="/time-machine">ISM Time Machine →</Link>
        </div>
        {counts.data && (
          <ul className="stats">
            <li><b>{counts.data.exhibits}</b> үзмэр</li>
            <li><b>{counts.data.teachers}</b> багш</li>
            <li><b>{counts.data.events}</b> арга хэмжээ</li>
          </ul>
        )}
      </section>

      <h2>Сүүлд нэмэгдсэн бүтээлүүд</h2>
      {latest.loading && <Loading />}
      <ErrorMsg message={latest.error} />
      {!latest.loading && !latest.error && !latest.data?.length && <Empty text="Одоогоор үзмэр алга. Бүртгүүлж эхний бүтээлээ нэмээрэй!" />}
      <div className="grid">{latest.data?.map((e) => <ExhibitCard key={e.id} e={e} />)}</div>
    </>
  )
}
