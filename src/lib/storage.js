import { supabase } from './supabaseClient'

const MAX_MB = 5

export async function uploadImage(file, folder = 'misc') {
  if (!file.type.startsWith('image/')) throw new Error('Зөвхөн зураг файл оруулна уу.')
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Зургийн хэмжээ ${MAX_MB}MB-аас хэтрэхгүй байх ёстой.`)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Зураг оруулахын тулд нэвтэрнэ үү.')
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  // RLS: хэрэглэгч зөвхөн өөрийн id-тай хавтас руу бичнэ
  const path = `${user.id}/${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('museum').upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from('museum').getPublicUrl(path).data.publicUrl
}
