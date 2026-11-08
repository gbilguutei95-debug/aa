import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty } from '../components/ui'

// ISM Creators: оюутны профайл ↔ бүтээлүүд
export default function Creators() {
  const { data, loading, error } = useQuery(() =>
    supabase.from('profiles').select('id, display_name, avatar_url, exhibits(id, title, status)').order('display_name'), [])
  const creators = data?.filter((p) => p.exhibits?.some((x) => x.status === 'published'))

  return (
    <>
      <h1>ISM Creators</h1>
      {loading && <Loading />}
      <ErrorMsg message={error} />
      {!loading && !error && !creators?.length && <Empty text="Бүтээл нийтэлсэн оюутан хараахан алга." />}
      <div className="grid">
        {creators?.map((p) => (
          <div className="card" key={p.id}>
            <div className="card-body">
              <h3>{p.display_name ?? 'Нэргүй'}</h3>
              <ul>
                {p.exhibits.filter((x) => x.status === 'published').map((x) => (
                  <li key={x.id}><Link to={`/exhibits/${x.id}`}>{x.title}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
