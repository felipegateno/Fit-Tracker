create table public.daily_goals (
  id uuid not null default gen_random_uuid (),
  user_id text not null,
  calories_goal integer null default 2000,
  protein_goal_g integer null default 150,
  carbs_goal_g integer null default 200,
  fat_goal_g integer null default 65,
  active_from date null default CURRENT_DATE,
  constraint daily_goals_pkey primary key (id),
  constraint daily_goals_user_id_key unique (user_id)
) TABLESPACE pg_default;
