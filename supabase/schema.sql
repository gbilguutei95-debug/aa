-- ISM Digital Museum: schema + RLS + storage
-- Supabase Dashboard -> SQL Editor дээр бүхлээр нь ажиллуулна.

-- ========== TABLES ==========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'creator' check (role in ('creator','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.exhibition_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.exhibits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  category_id uuid references public.exhibition_categories(id) on delete set null,
  technology_stack text,
  year_created int,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  demo_url text,
  github_url text,
  status text not null default 'published' check (status in ('draft','published','hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  courses text,
  bio text,
  photo_url text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  description text,
  cover_image_url text
);

create table if not exists public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text
);

create table if not exists public.history_milestones (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  title text not null,
  description text
);

-- ========== HELPERS ==========
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profile автоматаар үүсгэх
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- role баганыг хэрэглэгч өөрөө өөрчилж болохгүй
create or replace function public.protect_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end; $$;

drop trigger if exists protect_role_trg on public.profiles;
create trigger protect_role_trg before update on public.profiles
  for each row execute function public.protect_role();

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.exhibition_categories enable row level security;
alter table public.exhibits enable row level security;
alter table public.teachers enable row level security;
alter table public.events enable row level security;
alter table public.event_photos enable row level security;
alter table public.history_milestones enable row level security;

-- profiles
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

-- exhibits: нийтлэгдсэнийг бүгд, өөрийнхийг эзэн, бүгдийг админ харна
create policy "exhibits read" on public.exhibits for select
  using (status = 'published' or creator_id = auth.uid() or public.is_admin());
create policy "exhibits insert own" on public.exhibits for insert
  with check (creator_id = auth.uid());
create policy "exhibits update own" on public.exhibits for update
  using (creator_id = auth.uid() or public.is_admin())
  with check (creator_id = auth.uid() or public.is_admin());
create policy "exhibits delete own" on public.exhibits for delete
  using (creator_id = auth.uid() or public.is_admin());

-- нийтийн агуулга: бүгд уншина, зөвхөн админ бичнэ
do $$
declare t text;
begin
  foreach t in array array['exhibition_categories','teachers','events','event_photos','history_milestones'] loop
    execute format('create policy "%1$s read" on public.%1$s for select using (true)', t);
    execute format('create policy "%1$s admin insert" on public.%1$s for insert with check (public.is_admin())', t);
    execute format('create policy "%1$s admin update" on public.%1$s for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "%1$s admin delete" on public.%1$s for delete using (public.is_admin())', t);
  end loop;
end $$;

-- ========== STORAGE ==========
insert into storage.buckets (id, name, public) values ('museum', 'museum', true)
on conflict (id) do nothing;

create policy "museum public read" on storage.objects for select using (bucket_id = 'museum');
-- хэрэглэгч зөвхөн өөрийн id нэртэй хавтас руу оруулна: museum/<user_id>/...
create policy "museum upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'museum' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "museum update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'museum' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "museum delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'museum' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ========== SEED ==========
insert into public.exhibition_categories (name, description) values
  ('Вэб аппликейшн','Вэб дээр суурилсан бүтээл'),
  ('Гар утасны апп','Android / iOS бүтээл'),
  ('Өгөгдлийн шинжилгээ','Дата, BI, ML төслүүд'),
  ('Судалгаа','Эрдэм шинжилгээний ажил')
on conflict (name) do nothing;

insert into public.history_milestones (year, title, description) values
  (2005,'Тэнхим байгуулагдсан','Мэдээллийн Системийн Менежментийн тэнхим үүсэн байгуулагдсан.'),
  (2012,'Эхний төгсөгчид','Анхны төгсөгчид ажил мэргэжлийн замналаа эхэлсэн.'),
  (2018,'Вэб технологийн хөтөлбөр','Орчин үеийн вэб хөгжүүлэлтийн хичээлүүд шинэчлэгдсэн.'),
  (2024,'ISM Digital Museum','Тэнхимийн түүх, бүтээлийг хадгалах дижитал музей санаачилсан.');

-- ========== ADMIN ОЛГОХ ==========
-- Өөрөө бүртгүүлсний дараа ажиллуулна:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'ТАНЫ@EMAIL');
