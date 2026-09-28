-- Neon SQL Editor에서 한 번 실행합니다. 비밀값은 이 파일에 넣지 않습니다.
create table if not exists polls (
  id uuid primary key,
  question text not null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists options (
  id uuid primary key,
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  sort_order integer not null,
  vote_count integer not null default 0 check (vote_count >= 0)
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references options(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);

create index if not exists options_poll_order on options (poll_id, sort_order);
