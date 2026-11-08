import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty, Img } from '../components/ui'

export default function Teachers() {
  const { data, loading, error } = useQuery(() => supabase.from('teachers').select('*').order('name'), [])
  return (
    <>
      <h1>Тэнхимийн багш нар</h1>
      {loading && <Loading />}
      <ErrorMsg message={error} />
      {!loading && !error && !data?.length && <Empty text="Багшийн мэдээлэл хараахан нэмэгдээгүй байна." />}
      <div className="grid">
        {data?.map((t) => (
          <div className="card" key={t.id}>
            <Img src={t.photo_url} alt={t.name} className="card-img portrait" />
            <div className="card-body">
              <h3>{t.name}</h3>
              <p className="muted">{t.position}</p>
              {t.courses && <p><b>Заадаг хичээл:</b> {t.courses}</p>}
              {t.bio && <p className="prewrap">{t.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
