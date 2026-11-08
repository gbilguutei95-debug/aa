import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { useAuth } from '../context/AuthContext'
import { Loading, ErrorMsg, Empty } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const [tick, setTick] = useState(0)
  const { data, loading, error } = useQuery(() =>
    supabase.from('exhibits').select('id,title,status,year_created').eq('creator_id', user.id).order('created_at', { ascending: false }), [user.id, tick])

  async function remove(id) {
    if (!confirm('Устгах уу?')) return
    const { error } = await supabase.from('exhibits').delete().eq('id', id)
    if (error) alert(error.message); else setTick(tick + 1)
  }

  return (
    <>
      <div className="between"><h1>Миний бүтээлүүд</h1><Link className="btn" to="/exhibits/new">+ Шинэ бүтээл</Link></div>
      {loading && <Loading />}
      <ErrorMsg message={error} />
      {!loading && !error && !data?.length && <Empty text="Та одоогоор бүтээл нэмээгүй байна." />}
      <table className="table">
        <tbody>
          {data?.map((e) => (
            <tr key={e.id}>
              <td><Link to={`/exhibits/${e.id}`}>{e.title}</Link></td>
              <td>{e.year_created ?? '—'}</td>
              <td>{e.status}</td>
              <td className="right">
                <Link className="btn ghost sm" to={`/exhibits/${e.id}/edit`}>Засах</Link>{' '}
                <button className="btn danger sm" onClick={() => remove(e.id)}>Устгах</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
