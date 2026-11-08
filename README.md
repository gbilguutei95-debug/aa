# ISM Digital Museum

Мэдээллийн Системийн Менежментийн тэнхимийн дижитал музей. React + Vite + Supabase, Vercel дээр байршуулна.

## Боломжууд
- Нүүр, дижитал үзэсгэлэн (хайлт: нэр/технологи/ангилал/он)
- Үзмэрийн дэлгэрэнгүй, нэмэх/засах/устгах (зөвхөн эзэн эсвэл админ)
- Багш нар, арга хэмжээ + зурагт цомог
- ISM Time Machine (түүх + арга хэмжээ + бүтээл, он цагийн дарааллаар)
- ISM Creators, Миний бүтээл (dashboard)
- Бүртгэл / нэвтрэлт (Supabase Auth), админ самбар
- Зураг upload (Supabase Storage, 5MB хүртэл), mobile responsive

## Суулгах
1. https://supabase.com дээр project үүсгэнэ.
2. SQL Editor дээр `supabase/schema.sql`-г бүхэлд нь ажиллуулна (хүснэгт, RLS, storage bucket, seed).
3. Authentication → Providers → Email идэвхтэй эсэхийг шалгана (хөгжүүлэлтэд "Confirm email"-г унтрааж болно).
4. `.env.example`-ийг `.env` болгон хуулж, Settings → API хэсгээс **Project URL** ба **anon public** түлхүүрийг бөглөнө.
   Service role түлхүүрийг frontend-д ХЭЗЭЭ Ч бүү ашигла.
5. Өөрөө бүртгүүлсний дараа админ болгох:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'ТАНЫ@EMAIL');
   ```

## Локал ажиллуулах
```bash
npm install
npm run dev
```

## Vercel deploy
```bash
npm i -g vercel
vercel login
vercel --prod
```
Vercel → Project → Settings → Environment Variables хэсэгт `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`-г нэмээд дахин deploy хийнэ.
`vercel.json` нь SPA route-уудыг (`/exhibits/...`) `index.html` рүү чиглүүлнэ.

## Аюулгүй байдал
Бүх эрхийн хяналт Supabase RLS policy-ээр серверт хийгддэг (`supabase/schema.sql`): нийтлэгдсэн үзмэрийг бүгд харна, өөрийнхөө үзмэрийг л засна, нийтийн агуулгыг зөвхөн админ өөрчилнө, `role`-г хэрэглэгч өөрөө өөрчилж чадахгүй.
