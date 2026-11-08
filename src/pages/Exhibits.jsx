import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { Loading, ErrorMsg, Empty } from '../components/ui'
import { ExhibitCard } from './Home'

export default function Exhibits() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [year, setYear] = useState('')
  const [tech, setTech] = useState('')
  const [dq, setDq] = useState({ q: '', tech: '' })

  // хайлтыг 300ms саатуулна
  useEffect(() => {
    const t = setTimeout(() => setDq({ q, tech }), 300)
    return () => clearTimeout(t)
  }, [q, tech])

  const cats = useQuery(() => supabase.from('exhibition_categories').select('*').order('name'), [])

  const res = useQuery(() => {
    let query = supabase.from('exhibits').select('*, exhibition_categories(name)')
      .eq('status', 'published').order('year_created', { ascending: false, nullsFirst: false })
    const clean = (s) => s.replace(/[,()%*]/g, ' ').trim()
    if (clean(dq.q)) {
      const s = clean(dq.q)
      query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`)
    }
    if (clean(dq.tech)) query = query.ilike('technology_stack', `%${clean(dq.tech)}%`)
    if (category) query = query.eq('category_id', category)
    if (/^\d{4}$/.test(year)) query = query.eq('year_created', Number(year))
    return query
  }, [dq, category, year])

  const reset = () => { setQ(''); setTech(''); setCategory(''); setYear('') }

  return (
    <>
      <h1>Дижитал үзэсгэлэн</h1>
      <div className="filters">
        <input placeholder="Нэр, тайлбараар хайх…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="Технологи (React, Python…)" value={tech} onChange={(e) => setTech(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Бүх ангилал</option>
          {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="Он (2024)" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value)} />
        <button className="btn ghost" onClick={reset}>Цэвэрлэх</button>
      </div>

      {res.loading && <Loading />}
      <ErrorMsg message={res.error} />
      {!res.loading && !res.error && !res.data?.length && <Empty text="Хайлтад тохирох үзмэр олдсонгүй. Шүүлтүүрээ өөрчилж үзнэ үү." />}
      <div className="grid">{res.data?.map((e) => <ExhibitCard key={e.id} e={e} />)}</div>
    </>
  )
}
