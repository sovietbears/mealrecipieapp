import { Recipe } from './recipe.model';

export interface ShoppingListItem {
  item: string;
  totalAmount: number;
  unit: string;
  sources: ShoppingSource[];
}

export interface ShoppingSource {
  recipeName: string;
  amount: number;
  unit: string;
}

export interface ShoppingListExport {
  generatedAt: string;
  mealPlanSummary: MealPlanSummary[];
  shoppingList: ShoppingListItem[];
}

export interface MealPlanSummary {
  recipeName: string;
  servings: number;
  day: string;
  mealType: string;
}
