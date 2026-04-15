create table public.food_log (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  food_id uuid null,
  quantity_g double precision not null,
  meal_type text null default 'unspecified'::text,
  calories double precision not null,
  protein_g double precision not null default 0,
  carbs_g double precision not null default 0,
  fat_g double precision not null default 0,
  fiber_g double precision not null default 0,
  raw_input text null,
  logged_at timestamp with time zone null default now(),
  constraint food_log_pkey primary key (id),
  constraint food_log_food_id_fkey foreign KEY (food_id) references foods (id),
  constraint food_log_meal_type_check check (
    (
      meal_type = any (
        array[
          'breakfast'::text,
          'lunch'::text,
          'dinner'::text,
          'snack'::text,
          'unspecified'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_food_log_user_date on public.food_log using btree (user_id, logged_at) TABLESPACE pg_default;
