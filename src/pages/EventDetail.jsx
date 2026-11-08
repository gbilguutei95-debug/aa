import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty } from '../components/ui'

export default function EventDetail() {
  const { id } = useParams()
  const [zoom, setZoom] = useState(null)
  const ev = useQuery(() => supabase.from('events').select('*').eq('id', id).maybeSingle(), [id])
  const photos = useQuery(() => supabase.from('event_photos').select('*').eq('event_id', id), [id])

  if (ev.loading) return <Loading />
  if (ev.error) return <ErrorMsg message={ev.error} />
  if (!ev.data) return <p className="state">Арга хэмжээ олдсонгүй.</p>

  return (
    <>
      <Link to="/events">← Буцах</Link>
      <h1>{ev.data.title}</h1>
      <p className="muted">{ev.data.event_date}</p>
      <p className="prewrap">{ev.data.description}</p>
      <h2>Зурагт цомог</h2>
      {photos.loading && <Loading />}
      {!photos.loading && !photos.data?.length && <Empty text="Энэ арга хэмжээнд зураг хараахан нэмэгдээгүй байна." />}
      <div className="gallery">
        {photos.data?.map((p) => (
          <figure key={p.id} onClick={() => setZoom(p)}>
            <img src={p.image_url} alt={p.caption ?? 'Арга хэмжээний зураг'} loading="lazy" />
            {p.caption && <figcaption>{p.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom.image_url} alt={zoom.caption ?? ''} />
          {zoom.caption && <p>{zoom.caption}</p>}
        </div>
      )}
    </>
  )
}
