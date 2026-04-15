
-- Búsqueda difusa
CREATE OR REPLACE FUNCTION search_food(query TEXT, threshold FLOAT DEFAULT 0.3)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  calories_per_100g FLOAT,
  protein_per_100g  FLOAT,
  carbs_per_100g    FLOAT,
  fat_per_100g      FLOAT,
  fiber_per_100g    FLOAT,
  source            TEXT,
  confidence_score  FLOAT,
  similarity_score  FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.calories_per_100g,
    f.protein_per_100g,
    f.carbs_per_100g,
    f.fat_per_100g,
    f.fiber_per_100g,
    f.source,
    f.confidence_score,
    GREATEST(
      similarity(f.name, query),
      COALESCE(
        (SELECT MAX(similarity(alias, query))
         FROM unnest(f.name_aliases) AS alias),
        0.0
      )
    ) AS similarity_score
  FROM foods f
  WHERE
    similarity(f.name, query) > threshold
    OR EXISTS (
      SELECT 1 FROM unnest(f.name_aliases) AS alias
      WHERE similarity(alias, query) > threshold
    )
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Totales del día
CREATE OR REPLACE FUNCTION get_daily_totals(p_user_id TEXT, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_calories FLOAT,
  total_protein  FLOAT,
  total_carbs    FLOAT,
  total_fat      FLOAT,
  entry_count    INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein_g), 0),
    COALESCE(SUM(carbs_g), 0),
    COALESCE(SUM(fat_g), 0),
    COUNT(*)::INT
  FROM food_log
  WHERE user_id = p_user_id
    AND DATE(logged_at) = p_date;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-verificar alimento al usarse 3+ veces
CREATE OR REPLACE FUNCTION auto_verify_food()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE foods
  SET
    use_count = use_count + 1,
    source    = CASE
                  WHEN use_count + 1 >= 3 AND source = 'ai_estimated'
                  THEN 'verified'
                  ELSE source
                END,
    updated_at = NOW()
  WHERE id = NEW.food_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_verify
AFTER INSERT ON food_log
FOR EACH ROW EXECUTE FUNCTION auto_verify_food();

DROP FUNCTION IF EXISTS search_food(TEXT, FLOAT);

CREATE OR REPLACE FUNCTION search_food(query TEXT, threshold FLOAT DEFAULT 0.3)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  calories_per_100g FLOAT,
  protein_per_100g  FLOAT,
  carbs_per_100g    FLOAT,
  fat_per_100g      FLOAT,
  fiber_per_100g    FLOAT,
  source            TEXT,
  confidence_score  FLOAT,
  similarity_score  FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.calories_per_100g,
    f.protein_per_100g,
    f.carbs_per_100g,
    f.fat_per_100g,
    f.fiber_per_100g,
    f.source,
    f.confidence_score,
    GREATEST(
      similarity(f.name, query),
      COALESCE(
        (SELECT MAX(similarity(alias, query))
         FROM unnest(f.name_aliases) AS alias),
        0.0
      )
    )::FLOAT AS similarity_score
  FROM foods f
  WHERE
    similarity(f.name, query) > threshold::REAL
    OR EXISTS (
      SELECT 1 FROM unnest(f.name_aliases) AS alias
      WHERE similarity(alias, query) > threshold::REAL
    )
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;
