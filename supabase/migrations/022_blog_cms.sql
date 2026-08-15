create table if not exists public.blog_posts (
  slug text primary key, payload jsonb not null, published boolean not null default false,
  deleted boolean not null default false, updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('blog-images','blog-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
