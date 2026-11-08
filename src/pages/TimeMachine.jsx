import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty } from '../components/ui'

const TYPES = {
  history: { label: 'Түүх', cls: 'history' },
  event: { label: 'Арга хэмжээ', cls: 'event' },
  exhibit: { label: 'Бүтээл', cls: 'exhibit' },
}

// ISM Time Machine: түүх, арга хэмжээ, бүтээлийг он цагийн дарааллаар interactive timeline-аар үзүүлнэ
export default function TimeMachine() {
  const [active, setActive] = useState({ history: true, event: true, exhibit: true })
  const [openId, setOpenId] = useState(null)

  const res = useQuery(async () => {
    const [h, e, x] = await Promise.all([
      supabase.from('history_milestones').select('*'),
      supabase.from('events').select('*'),
      supabase.from('exhibits').select('id,title,description,year_created,technology_stack').eq('status', 'published').not('year_created', 'is', null),
    ])
    const error = h.error || e.error || x.error
    if (error) return { error }
    const items = [
      ...h.data.map((r) => ({ key: 'h' + r.id, type: 'history', year: r.year, title: r.title, text: r.description })),
      ...e.data.map((r) => ({ key: 'e' + r.id, type: 'event', year: new Date(r.event_date).getFullYear(), title: r.title, text: r.description, date: r.event_date, link: `/events/${r.id}` })),
      ...x.data.map((r) => ({ key: 'x' + r.id, type: 'exhibit', year: r.year_created, title: r.title, text: r.description, tech: r.technology_stack, link: `/exhibits/${r.id}` })),
    ]
    return { data: items }
  }, [])

  const byYear = useMemo(() => {
    const filtered = (res.data ?? []).filter((i) => active[i.type])
    const map = new Map()
    filtered.sort((a, b) => a.year - b.year).forEach((i) => map.set(i.year, [...(map.get(i.year) ?? []), i]))
    return [...map.entries()]
  }, [res.data, active])

  return (
    <>
      <h1>ISM Time Machine</h1>
      <p className="muted">Тэнхимийн түүх, арга хэмжээ, оюутнуудын бүтээлийг он цагийн дарааллаар аялан үзээрэй.</p>
      <div className="chips">
        {Object.entries(TYPES).map(([k, v]) => (
          <button key={k} className={`chip ${v.cls} ${active[k] ? 'on' : ''}`} onClick={() => setActive({ ...active, [k]: !active[k] })}>{v.label}</button>
        ))}
      </div>
      {byYear.length > 0 && (
        <div className="yearjump">
          {byYear.map(([y]) => <a key={y} href={`#y${y}`}>{y}</a>)}
        </div>
      )}
      {res.loading && <Loading />}
      <ErrorMsg message={res.error} />
      {!res.loading && !res.error && !byYear.length && <Empty text="Timeline-д харуулах мэдээлэл алга." />}
      <div className="timeline">
        {byYear.map(([year, items]) => (
          <section key={year} id={`y${year}`} className="tl-year">
            <h2>{year}</h2>
            {items.map((i) => (
              <div key={i.key} className={`tl-item ${TYPES[i.type].cls}`} onClick={() => setOpenId(openId === i.key ? null : i.key)}>
                <span className="badge">{TYPES[i.type].label}</span>
                <h3>{i.title}</h3>
                {openId === i.key && (
                  <div className="tl-more">
                    {i.date && <p className="muted">{i.date}</p>}
                    <p className="prewrap">{i.text || 'Тайлбар алга.'}</p>
                    {i.tech && <p className="muted">Технологи: {i.tech}</p>}
                    {i.link && <Link to={i.link} onClick={(e) => e.stopPropagation()}>Дэлгэрэнгүй →</Link>}
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  )
}
