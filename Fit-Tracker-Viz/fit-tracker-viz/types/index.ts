// NutriBot
export interface FoodLog {
  id: string
  user_id: string
  food_id: string
  quantity_g: number
  meal_type: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  raw_input: string
  logged_at: string
}

export interface DailyGoals {
  id: string
  user_id: string
  calories_goal: number
  protein_goal_g: number
  carbs_goal_g: number
  fat_goal_g: number
  active_from: string
}

export interface DailyTotals {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  entry_count: number
}

// Garmin
export interface GarminActivity {
  id: string
  user_id: string | null
  activity_id: number
  date: string
  activity_type: string
  name: string
  duration_seconds: number
  distance_meters: number
  avg_hr: number | null
  max_hr: number | null
  calories: number | null
  training_load: number | null
  training_effect_aerobic: number | null
  training_effect_anaerobic: number | null
  vo2max_value: number | null
  avg_pace_sec_km: number | null
  avg_power_watts: number | null
  elevation_gain_m: number | null
  synced_at: string
}

export interface GarminDailyHealth {
  id: string
  user_id: string | null
  date: string
  total_steps: number
  step_goal: number
  active_calories: number
  total_calories: number
  resting_hr: number | null
  min_hr: number | null
  max_hr: number | null
  avg_stress: number | null
  max_stress: number | null
  body_battery_charged: number | null
  body_battery_drained: number | null
  body_battery_highest: number | null
  body_battery_lowest: number | null
  floors_climbed: number | null
  intensity_minutes: number | null
  synced_at: string
}

export interface GarminSleep {
  id: string
  user_id: string | null
  date: string
  sleep_start: string
  sleep_end: string
  total_sleep_seconds: number
  deep_sleep_seconds: number
  light_sleep_seconds: number
  rem_sleep_seconds: number
  awake_seconds: number
  sleep_score: number | null
  avg_spo2: number | null
  avg_respiration: number | null
  avg_sleeping_hr: number | null
  synced_at: string
}

export interface GarminHrv {
  id: string
  user_id: string | null
  date: string
  hrv_weekly_avg: number | null
  hrv_last_night: number | null
  hrv_status: string | null
  hrv_baseline_low: number | null
  hrv_baseline_high: number | null
  synced_at: string
}

export interface GarminTrainingReadiness {
  id: string
  user_id: string | null
  date: string
  score: number
  level: string
  hrv_factor: number | null
  sleep_factor: number | null
  stress_factor: number | null
  recovery_factor: number | null
  synced_at: string
}

// Dashboard
export type ActivityCategory = 'gimnasio' | 'running' | 'trekking' | 'bicicleta' | 'caminata' | 'natacion' | 'descanso'

export const ACTIVITY_COLOR_MAP: Record<ActivityCategory, string> = {
  gimnasio: '#534AB7',
  running: '#D85A30',
  trekking: '#0F6E56',
  bicicleta: '#BA7517',
  caminata: '#85B7EB',
  natacion: '#4A9CC4',
  descanso: '#374151',
}

export const GARMIN_TYPE_TO_CATEGORY: Record<string, ActivityCategory> = {
  strength_training: 'gimnasio',
  yoga: 'gimnasio',
  other: 'gimnasio',
  running: 'running',
  treadmill_running: 'running',
  trail_running: 'running',
  hiking: 'trekking',
  cycling: 'bicicleta',
  indoor_cycling: 'bicicleta',
  walking: 'caminata',
  open_water_swimming: 'natacion',
}

export const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  gimnasio: 'Gimnasio',
  running: 'Running',
  trekking: 'Trekking',
  bicicleta: 'Bicicleta',
  caminata: 'Caminata',
  natacion: 'Natación',
  descanso: 'Descanso',
}

export const MACRO_COLORS = {
  proteina: '#1D9E75',
  carbohidratos: '#378ADD',
  grasas: '#EF9F27',
  fibra: '#97C459',
}
