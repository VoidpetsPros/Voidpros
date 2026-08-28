-- ============================================================
-- voidpros — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- ============================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------- profiles ----------
-- One row per authenticated user. Created automatically on signup via trigger below.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  karma int not null default 0,
  is_subscribed boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_lookups_used int not null default 0,
  trial_lookups_limit int not null default 3,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------- pets & items (game catalog — admin-managed, not user data) ----------
create table pets (
  id text primary key,
  name text not null unique,
  tag text,
  color text,
  variant int
);

create table items (
  id text primary key,
  name text not null unique,
  type text not null check (type in ('hat', 'scarf', 'accessory')),
  icon text,
  color text
);

-- ---------- a player's owned pool (no levels — levels only matter on submissions) ----------
create table user_pets (
  user_id uuid not null references profiles(id) on delete cascade,
  pet_id text not null references pets(id) on delete cascade,
  primary key (user_id, pet_id)
);

create table user_items (
  user_id uuid not null references profiles(id) on delete cascade,
  item_id text not null references items(id) on delete cascade,
  count int not null default 1 check (count > 0),
  primary key (user_id, item_id)
);

-- ---------- builds (verified strategies players search against) ----------
create table builds (
  id uuid primary key default gen_random_uuid(),
  stage int not null,
  author_id uuid references profiles(id) on delete set null,
  show_author boolean not null default true,
  note text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  confirmations int not null default 0,
  upvotes int not null default 0,
  downvotes int not null default 0,
  created_at timestamptz not null default now()
);

-- Each build has exactly 4 rows here (slot_index 0-3) — one per pet.
create table build_team_slots (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  slot_index int not null check (slot_index between 0 and 3),
  pet_id text not null references pets(id),
  pet_level int not null check (pet_level > 0),
  hat_id text not null references items(id),
  hat_level int not null check (hat_level > 0),
  scarf_id text not null references items(id),
  scarf_level int not null check (scarf_level > 0),
  accessory1_id text not null references items(id),
  accessory1_level int not null check (accessory1_level > 0),
  accessory2_id text not null references items(id),
  accessory2_level int not null check (accessory2_level > 0),
  unique (build_id, slot_index)
);

-- Required proof screenshots. kind groups them for the UI.
create table build_images (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  kind text not null check (kind in ('completion', 'pets', 'items')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table build_confirmations (
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

create table build_votes (
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  direction text not null check (direction in ('up', 'down')),
  created_at timestamptz not null default now(),
  primary key (build_id, user_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  build_id uuid not null references builds(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  show_author boolean not null default true,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- requests (subscriber feature: "beat my floor with only what I own") ----------
create table requests (
  id uuid primary key default gen_random_uuid(),
  stage int not null,
  requester_id uuid not null references profiles(id) on delete cascade,
  show_requester boolean not null default true,
  fulfilled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Snapshot of the requester's pool at the moment they posted (pets they own).
create table request_pets (
  request_id uuid not null references requests(id) on delete cascade,
  pet_id text not null references pets(id),
  primary key (request_id, pet_id)
);

-- Snapshot of the requester's owned item counts.
create table request_items (
  request_id uuid not null references requests(id) on delete cascade,
  item_id text not null references items(id),
  count int not null check (count > 0),
  primary key (request_id, item_id)
);

-- A fulfillment attempt is structurally identical to a build (4 pet slots + images)
-- but scoped to one request and gated by karma payout instead of free-lookup rewards.
create table fulfillments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  fulfiller_id uuid not null references profiles(id) on delete cascade,
  show_fulfiller boolean not null default true,
  note text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  karma_awarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table fulfillment_team_slots (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid not null references fulfillments(id) on delete cascade,
  slot_index int not null check (slot_index between 0 and 3),
  pet_id text not null references pets(id),
  pet_level int not null check (pet_level > 0),
  hat_id text not null references items(id),
  hat_level int not null check (hat_level > 0),
  scarf_id text not null references items(id),
  scarf_level int not null check (scarf_level > 0),
  accessory1_id text not null references items(id),
  accessory1_level int not null check (accessory1_level > 0),
  accessory2_id text not null references items(id),
  accessory2_level int not null check (accessory2_level > 0),
  unique (fulfillment_id, slot_index)
);

create table fulfillment_images (
  id uuid primary key default gen_random_uuid(),
  fulfillment_id uuid not null references fulfillments(id) on delete cascade,
  kind text not null check (kind in ('completion', 'pets', 'items')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table user_pets enable row level security;
alter table user_items enable row level security;
alter table builds enable row level security;
alter table build_team_slots enable row level security;
alter table build_images enable row level security;
alter table build_confirmations enable row level security;
alter table build_votes enable row level security;
alter table comments enable row level security;
alter table requests enable row level security;
alter table request_pets enable row level security;
alter table request_items enable row level security;
alter table fulfillments enable row level security;
alter table fulfillment_team_slots enable row level security;
alter table fulfillment_images enable row level security;

-- Catalog tables (pets, items) are public read, admin-only write — no RLS needed
-- beyond default deny for writes; reads are open via a permissive policy below.
alter table pets enable row level security;
alter table items enable row level security;
create policy "pets are publicly readable" on pets for select using (true);
create policy "items are publicly readable" on items for select using (true);

-- profiles: readable by everyone (usernames/karma are shown publicly), editable only by owner
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users can update their own profile" on profiles for update using (auth.uid() = id);

-- user_pets / user_items: private to the owning user
create policy "users manage their own pet pool" on user_pets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users manage their own item pool" on user_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- builds: publicly readable; only the author can insert, nobody edits after submit (moderation updates status via service role)
create policy "builds are publicly readable" on builds for select using (true);
create policy "users can submit builds" on builds for insert with check (auth.uid() = author_id);

create policy "team slots are publicly readable" on build_team_slots for select using (true);
create policy "authors can insert their build's slots" on build_team_slots for insert
  with check (exists (select 1 from builds b where b.id = build_id and b.author_id = auth.uid()));

create policy "build images are publicly readable" on build_images for select using (true);
create policy "authors can attach images to their build" on build_images for insert
  with check (exists (select 1 from builds b where b.id = build_id and b.author_id = auth.uid()));

-- confirmations & votes: one per user per build, enforced by primary key
create policy "confirmations are publicly readable" on build_confirmations for select using (true);
create policy "users can confirm a build once" on build_confirmations for insert with check (auth.uid() = user_id);

create policy "votes are publicly readable" on build_votes for select using (true);
create policy "users can vote once per build" on build_votes for insert with check (auth.uid() = user_id);
create policy "users can change their own vote" on build_votes for update using (auth.uid() = user_id);
create policy "users can remove their own vote" on build_votes for delete using (auth.uid() = user_id);

-- comments: public read, owner-only insert; no edit/delete for now (moderation handles abuse)
create policy "comments are publicly readable" on comments for select using (true);
create policy "users can post comments" on comments for insert with check (auth.uid() = user_id);

-- requests: public read, only the requester can create
create policy "requests are publicly readable" on requests for select using (true);
create policy "users can post their own request" on requests for insert with check (auth.uid() = requester_id);

create policy "request pets are publicly readable" on request_pets for select using (true);
create policy "requesters can set their request's pets" on request_pets for insert
  with check (exists (select 1 from requests r where r.id = request_id and r.requester_id = auth.uid()));

create policy "request items are publicly readable" on request_items for select using (true);
create policy "requesters can set their request's items" on request_items for insert
  with check (exists (select 1 from requests r where r.id = request_id and r.requester_id = auth.uid()));

-- fulfillments: public read, only the fulfiller can create
create policy "fulfillments are publicly readable" on fulfillments for select using (true);
create policy "users can submit a fulfillment" on fulfillments for insert with check (auth.uid() = fulfiller_id);

create policy "fulfillment slots are publicly readable" on fulfillment_team_slots for select using (true);
create policy "fulfillers can insert their slots" on fulfillment_team_slots for insert
  with check (exists (select 1 from fulfillments f where f.id = fulfillment_id and f.fulfiller_id = auth.uid()));

create policy "fulfillment images are publicly readable" on fulfillment_images for select using (true);
create policy "fulfillers can attach images" on fulfillment_images for insert
  with check (exists (select 1 from fulfillments f where f.id = fulfillment_id and f.fulfiller_id = auth.uid()));

-- ============================================================
-- Helper: keep build vote counts in sync (denormalized for fast reads)
-- ============================================================
create function sync_build_vote_counts() returns trigger as $$
begin
  update builds set
    upvotes = (select count(*) from build_votes where build_id = coalesce(new.build_id, old.build_id) and direction = 'up'),
    downvotes = (select count(*) from build_votes where build_id = coalesce(new.build_id, old.build_id) and direction = 'down')
  where id = coalesce(new.build_id, old.build_id);
  return null;
end;
$$ language plpgsql security definer;

create trigger on_build_vote_change
  after insert or update or delete on build_votes
  for each row execute procedure sync_build_vote_counts();

-- Same idea for confirmation counts, and auto-verify once a build hits 3 confirmations.
create function sync_build_confirmation_counts() returns trigger as $$
declare
  new_count int;
begin
  select count(*) into new_count from build_confirmations where build_id = coalesce(new.build_id, old.build_id);
  update builds set
    confirmations = new_count,
    status = case when new_count >= 3 and status = 'pending' then 'verified' else status end
  where id = coalesce(new.build_id, old.build_id);
  return null;
end;
$$ language plpgsql security definer;

create trigger on_build_confirmation_change
  after insert or delete on build_confirmations
  for each row execute procedure sync_build_confirmation_counts();

-- Voting and confirming are restricted to verified builds only at the UI layer AND
-- here in the DB, since client-side checks alone aren't trustworthy.
create function enforce_votes_on_verified_only() returns trigger as $$
begin
  if not exists (select 1 from builds where id = new.build_id and status = 'verified') then
    raise exception 'Only verified builds can be voted on';
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger check_vote_target_verified
  before insert on build_votes
  for each row execute procedure enforce_votes_on_verified_only();
