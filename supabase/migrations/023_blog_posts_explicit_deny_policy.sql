-- Blogbeheer loopt uitsluitend via server-side routes met de service role.
-- Deze expliciete deny-policy houdt directe browsertoegang geblokkeerd en
-- maakt de bedoelde RLS-afbakening zichtbaar voor de database-linter.
drop policy if exists "Blog posts: deny client access" on public.blog_posts;

create policy "Blog posts: deny client access"
  on public.blog_posts
  for all
  to anon, authenticated
  using (false)
  with check (false);
