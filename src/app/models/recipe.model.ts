export interface Recipe {
  id: number;
  name: string;
  category: RecipeCategory;
  image?: string;
  rating?: number;
  ratingCount?: number;
  cookTime?: string;
  cookingMethod?: string;
  servings: number;
  note?: string;
  ingredients: Ingredient[];
  method: MethodStep[];
}

export const DEFAULT_SERVINGS = 4;

export type RecipeCategory = 'Snack' | 'General Meal' | 'Refuel Meal';

export interface Ingredient {
  item: string;
  amount: number;
  unit: Unit;
}

export type Unit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'oz' | 'lb' | 'kg' | 'l' |
  'whole' | 'pinch' | 'handful' | 'small_bunch' | 'bunch' |
  'serving' | 'slices' | 'to_taste' | 'to taste' | 'cup' | 'stick';

export interface MethodStep {
  step: number;
  instruction: string;
}

export interface ScaledIngredient extends Ingredient {
  scaledAmount: number;
  originalAmount: number;
  display: string;
}
