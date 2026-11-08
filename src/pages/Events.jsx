import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty, Img } from '../components/ui'

export default function Events() {
  const { data, loading, error } = useQuery(() => supabase.from('events').select('*').order('event_date', { ascending: false }), [])
  return (
    <>
      <h1>Өдөрлөг ба арга хэмжээ</h1>
      {loading && <Loading />}
      <ErrorMsg message={error} />
      {!loading && !error && !data?.length && <Empty text="Арга хэмжээ хараахан нэмэгдээгүй байна." />}
      <div className="grid">
        {data?.map((ev) => (
          <Link className="card" key={ev.id} to={`/events/${ev.id}`}>
            <Img src={ev.cover_image_url} alt={ev.title} className="card-img" />
            <div className="card-body">
              <h3>{ev.title}</h3>
              <p className="muted">{ev.event_date}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
