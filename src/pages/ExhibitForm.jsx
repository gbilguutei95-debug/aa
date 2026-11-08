import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '../lib/useQuery'
import { useAuth } from '../context/AuthContext'
import ImageField from '../components/ImageField'
import { Loading } from '../components/ui'

const empty = { title: '', description: '', image_url: '', category_id: '', technology_stack: '', year_created: '', demo_url: '', github_url: '', status: 'published' }
const isUrl = (s) => !s || /^https?:\/\/\S+\.\S+/.test(s)

export default function ExhibitForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user, isAdmin } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!editing)
  const [msg, setMsg] = useState('')
  const cats = useQuery(() => supabase.from('exhibition_categories').select('*').order('name'), [])

  useEffect(() => {
    if (!editing) return
    supabase.from('exhibits').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...empty, ...data, category_id: data.category_id ?? '', year_created: data.year_created ?? '' })
      setLoaded(true)
    })
  }, [id, editing])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function validate() {
    const er = {}
    if (!form.title.trim()) er.title = 'Нэр заавал шаардлагатай.'
    const y = Number(form.year_created)
    if (form.year_created !== '' && (!Number.isInteger(y) || y < 1990 || y > new Date().getFullYear() + 1)) er.year_created = 'Он буруу байна.'
    if (!isUrl(form.demo_url)) er.demo_url = 'http:// эсвэл https:// -ээр эхэлсэн холбоос оруулна уу.'
    if (!isUrl(form.github_url)) er.github_url = 'http:// эсвэл https:// -ээр эхэлсэн холбоос оруулна уу.'
    setErrors(er)
    return !Object.keys(er).length
  }

  async function submit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true); setMsg('')
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      technology_stack: form.technology_stack || null,
      year_created: form.year_created === '' ? null : Number(form.year_created),
      demo_url: form.demo_url || null,
      github_url: form.github_url || null,
      status: form.status,
    }
    const { data, error } = editing
      ? await supabase.from('exhibits').update(payload).eq('id', id).select().single()
      : await supabase.from('exhibits').insert({ ...payload, creator_id: user.id }).select().single()
    setSaving(false)
    if (error) setMsg(error.message)
    else nav(`/exhibits/${data.id}`)
  }

  if (!loaded) return <Loading />

  return (
    <form className="form" onSubmit={submit} noValidate>
      <h1>{editing ? 'Үзмэр засах' : 'Шинэ үзмэр нэмэх'}</h1>
      <div className="field"><label>Нэр *</label><input value={form.title} onChange={set('title')} />{errors.title && <small className="error">{errors.title}</small>}</div>
      <div className="field"><label>Тайлбар</label><textarea rows={5} value={form.description ?? ''} onChange={set('description')} /></div>
      <ImageField label="Зураг" value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="exhibits" />
      <div className="row">
        <div className="field"><label>Ангилал</label>
          <select value={form.category_id} onChange={set('category_id')}>
            <option value="">— сонгох —</option>
            {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Он</label><input inputMode="numeric" value={form.year_created} onChange={set('year_created')} />{errors.year_created && <small className="error">{errors.year_created}</small>}</div>
      </div>
      <div className="field"><label>Технологи (таслалаар)</label><input placeholder="React, Supabase" value={form.technology_stack ?? ''} onChange={set('technology_stack')} /></div>
      <div className="field"><label>Demo холбоос</label><input value={form.demo_url ?? ''} onChange={set('demo_url')} />{errors.demo_url && <small className="error">{errors.demo_url}</small>}</div>
      <div className="field"><label>GitHub холбоос</label><input value={form.github_url ?? ''} onChange={set('github_url')} />{errors.github_url && <small className="error">{errors.github_url}</small>}</div>
      <div className="field"><label>Төлөв</label>
        <select value={form.status} onChange={set('status')}>
          <option value="published">Нийтлэгдсэн</option>
          <option value="draft">Ноорог</option>
          {isAdmin && <option value="hidden">Нуусан</option>}
        </select>
      </div>
      {msg && <p className="state error">{msg}</p>}
      <button className="btn" disabled={saving}>{saving ? 'Хадгалж байна…' : 'Хадгалах'}</button>
    </form>
  )
}
