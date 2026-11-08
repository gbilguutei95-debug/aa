import { useState } from 'react'
import { uploadImage } from '../lib/storage'

export default function ImageField({ label, value, onChange, folder }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function pick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(file, folder)) }
    catch (ex) { setErr(ex.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="field">
      <label>{label}</label>
      {value && <img className="preview" src={value} alt="Урьдчилан харах" />}
      <input type="file" accept="image/*" onChange={pick} disabled={busy} />
      {busy && <small>Байршуулж байна…</small>}
      {err && <small className="error">{err}</small>}
    </div>
  )
}
