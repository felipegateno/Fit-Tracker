create table public.pending_confirmations (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  original_text text not null,
  quantity_g double precision null,
  meal_type text null,
  suggested_food_id uuid null,
  status text null default 'pending'::text,
  expires_at timestamp with time zone null default (now() + '00:10:00'::interval),
  created_at timestamp with time zone null default now(),
  extra_data jsonb null,
  constraint pending_confirmations_pkey primary key (id),
  constraint pending_confirmations_suggested_food_id_fkey foreign KEY (suggested_food_id) references foods (id),
  constraint pending_confirmations_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'confirmed'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
