import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ImageField from '../components/ImageField'
import { Loading, ErrorMsg } from '../components/ui'

// Нийтийн агуулгын CRUD (зөвхөн админ; RLS серверт шалгана)
function AdminCrud({ table, title, fields, orderBy, titleKey = 'title' }) {
  const blank = Object.fromEntries(fields.map((f) => [f.name, '']))
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null)
  const [options, setOptions] = useState({})
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    supabase.from(table).select('*').order(orderBy.col, { ascending: orderBy.asc }).then(({ data, error }) => {
      if (error) setMsg(error.message); else setRows(data)
    })
  }, [table, tick])

  useEffect(() => {
    fields.filter((f) => f.optionsFrom).forEach((f) =>
      supabase.from(f.optionsFrom.table).select('*').then(({ data }) =>
        setOptions((o) => ({ ...o, [f.name]: (data ?? []).map((r) => ({ value: r.id, label: r[f.optionsFrom.label] })) }))))
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function save(e) {
    e.preventDefault(); setMsg('')
    for (const f of fields) if (f.required && !String(form[f.name]).trim()) return setMsg(`"${f.label}" талбар заавал шаардлагатай.`)
    const payload = Object.fromEntries(fields.map((f) => {
      const v = form[f.name]
      return [f.name, v === '' ? null : f.type === 'number' ? Number(v) : v]
    }))
    const { error } = editId
      ? await supabase.from(table).update(payload).eq('id', editId)
      : await supabase.from(table).insert(payload)
    if (error) return setMsg(error.message)
    setForm(blank); setEditId(null); setTick(tick + 1)
  }

  async function remove(id) {
    if (!confirm('Устгах уу?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setMsg(error.message); else setTick(tick + 1)
  }

  function edit(r) {
    setEditId(r.id)
    setForm(Object.fromEntries(fields.map((f) => [f.name, r[f.name] ?? ''])))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="admin-block">
      <h2>{title}</h2>
      <form className="form" onSubmit={save} noValidate>
        {fields.map((f) => f.type === 'image'
          ? <ImageField key={f.name} label={f.label} value={form[f.name]} onChange={(url) => setForm({ ...form, [f.name]: url })} folder={table} />
          : (
            <div className="field" key={f.name}>
              <label>{f.label}{f.required && ' *'}</label>
              {f.type === 'textarea' ? <textarea rows={4} value={form[f.name]} onChange={set(f.name)} />
                : f.type === 'select'
                  ? <select value={form[f.name]} onChange={set(f.name)}><option value="">— сонгох —</option>{options[f.name]?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  : <input type={f.type ?? 'text'} value={form[f.name]} onChange={set(f.name)} />}
            </div>
          ))}
        {msg && <p className="state error">{msg}</p>}
        <div className="actions">
          <button className="btn">{editId ? 'Шинэчлэх' : 'Нэмэх'}</button>
          {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setForm(blank) }}>Болих</button>}
        </div>
      </form>
      {!rows ? <Loading /> : (
        <table className="table">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r[titleKey]}</td>
                <td className="right">
                  <button className="btn ghost sm" onClick={() => edit(r)}>Засах</button>{' '}
                  <button className="btn danger sm" onClick={() => remove(r.id)}>Устгах</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ExhibitModeration() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState('')
  const load = () => supabase.from('exhibits').select('id,title,status').order('created_at', { ascending: false })
    .then(({ data, error }) => error ? setErr(error.message) : setRows(data))
  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    const { error } = await supabase.from('exhibits').update({ status }).eq('id', id)
    if (error) setErr(error.message); else load()
  }
  async function remove(id) {
    if (!confirm('Устгах уу?')) return
    const { error } = await supabase.from('exhibits').delete().eq('id', id)
    if (error) setErr(error.message); else load()
  }

  return (
    <section className="admin-block">
      <h2>Үзмэрийн хяналт</h2>
      <ErrorMsg message={err} />
      {!rows ? <Loading /> : (
        <table className="table"><tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>
                <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                  <option value="published">published</option><option value="draft">draft</option><option value="hidden">hidden</option>
                </select>
              </td>
              <td className="right"><button className="btn danger sm" onClick={() => remove(r.id)}>Устгах</button></td>
            </tr>
          ))}
        </tbody></table>
      )}
    </section>
  )
}

const TABS = {
  exhibits: { label: 'Үзмэр', render: () => <ExhibitModeration /> },
  teachers: { label: 'Багш нар', render: () => (
    <AdminCrud table="teachers" title="Багш нар" titleKey="name" orderBy={{ col: 'name', asc: true }} fields={[
      { name: 'name', label: 'Нэр', required: true }, { name: 'position', label: 'Албан тушаал' },
      { name: 'courses', label: 'Заадаг хичээл' }, { name: 'bio', label: 'Товч танилцуулга', type: 'textarea' },
      { name: 'photo_url', label: 'Зураг', type: 'image' }]} />) },
  events: { label: 'Арга хэмжээ', render: () => (
    <AdminCrud table="events" title="Арга хэмжээ" orderBy={{ col: 'event_date', asc: false }} fields={[
      { name: 'title', label: 'Нэр', required: true }, { name: 'event_date', label: 'Огноо', type: 'date', required: true },
      { name: 'description', label: 'Тайлбар', type: 'textarea' }, { name: 'cover_image_url', label: 'Нүүр зураг', type: 'image' }]} />) },
  photos: { label: 'Зурагт цомог', render: () => (
    <AdminCrud table="event_photos" title="Арга хэмжээний зураг" titleKey="caption" orderBy={{ col: 'id', asc: true }} fields={[
      { name: 'event_id', label: 'Арга хэмжээ', type: 'select', required: true, optionsFrom: { table: 'events', label: 'title' } },
      { name: 'image_url', label: 'Зураг', type: 'image', required: true }, { name: 'caption', label: 'Тайлбар' }]} />) },
  categories: { label: 'Ангилал', render: () => (
    <AdminCrud table="exhibition_categories" title="Үзмэрийн ангилал" titleKey="name" orderBy={{ col: 'name', asc: true }} fields={[
      { name: 'name', label: 'Нэр', required: true }, { name: 'description', label: 'Тайлбар' }]} />) },
  history: { label: 'Түүх', render: () => (
    <AdminCrud table="history_milestones" title="Тэнхимийн түүх" orderBy={{ col: 'year', asc: true }} fields={[
      { name: 'year', label: 'Он', type: 'number', required: true }, { name: 'title', label: 'Гарчиг', required: true },
      { name: 'description', label: 'Тайлбар', type: 'textarea' }]} />) },
}

export default function Admin() {
  const [tab, setTab] = useState('exhibits')
  return (
    <>
      <h1>Админ самбар</h1>
      <div className="chips">
        {Object.entries(TABS).map(([k, v]) => <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{v.label}</button>)}
      </div>
      {TABS[tab].render()}
    </>
  )
}
