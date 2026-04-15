Eres un nutricionista experto.
Estima los macronutrientes por 100g del alimento: "{food_name}"
Responde SOLO con JSON, sin markdown:
{
  "calories_per_100g": number,
  "protein_per_100g": number,
  "carbs_per_100g": number,
  "fat_per_100g": number,
  "fiber_per_100g": number,
  "confidence": number (0.0-1.0),
  "normalized_name": string
}
