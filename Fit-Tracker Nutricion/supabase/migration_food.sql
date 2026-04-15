create table public.foods (
  id uuid not null default gen_random_uuid (),
  name text not null,
  name_aliases text[] null default '{}'::text[],
  calories_per_100g double precision not null,
  protein_per_100g double precision not null default 0,
  carbs_per_100g double precision not null default 0,
  fat_per_100g double precision not null default 0,
  fiber_per_100g double precision not null default 0,
  source text not null default 'manual'::text,
  confidence_score double precision null default 1.0,
  use_count integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint foods_pkey primary key (id),
  constraint foods_source_check check (
    (
      source = any (
        array[
          'manual'::text,
          'ai_estimated'::text,
          'verified'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_foods_name_trgm on public.foods using gin (name extensions.gin_trgm_ops) TABLESPACE pg_default;
