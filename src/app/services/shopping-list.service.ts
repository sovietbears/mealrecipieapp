import { Injectable, inject } from '@angular/core';
import {
  ShoppingListItem,
  ShoppingSource,
  ShoppingListExport,
  MealPlanSummary,
} from '../models/shopping-list.model';
import { MealPlanEntry } from '../models/meal-plan.model';
import { Recipe } from '../models/recipe.model';
import { ServingsService } from './servings.service';

@Injectable({ providedIn: 'root' })
export class ShoppingListService {
  private servingsService = inject(ServingsService);

  generate(
    mealPlan: MealPlanEntry[],
    recipes: Recipe[]
  ): ShoppingListItem[] {
    type Accumulator = {
      item: string;
      unit: string;
      totalAmount: number;
      sources: ShoppingSource[];
    };

    const accumulator = new Map<string, Accumulator>();

    for (const entry of mealPlan) {
      const recipe = recipes.find((r) => r.id === entry.recipeId);
      if (!recipe) continue;

      for (const ingredient of recipe.ingredients) {
        const scaled = this.servingsService.scaleIngredient(
          ingredient,
          recipe.servings,
          entry.servings
        );

        const key = `${ingredient.item}::${ingredient.unit}`;

        if (!accumulator.has(key)) {
          accumulator.set(key, {
            item: ingredient.item,
            unit: ingredient.unit,
            totalAmount: 0,
            sources: [],
          });
        }

        const acc = accumulator.get(key)!;
        acc.totalAmount += scaled.scaledAmount;
        acc.sources.push({
          recipeName: recipe.name,
          amount: scaled.scaledAmount,
          unit: ingredient.unit,
        });
      }
    }

    return Array.from(accumulator.values()).map((a) => ({
      item: a.item,
      totalAmount: Math.round(a.totalAmount * 100) / 100,
      unit: a.unit,
      sources: a.sources,
    }));
  }

  buildExport(
    mealPlan: MealPlanEntry[],
    recipes: Recipe[],
    items: ShoppingListItem[]
  ): ShoppingListExport {
    const summary: MealPlanSummary[] = mealPlan.map((entry) => {
      const recipe = recipes.find((r) => r.id === entry.recipeId);
      return {
        recipeName: recipe?.name ?? 'Unknown Recipe',
        servings: entry.servings,
        day: entry.day,
        mealType: entry.mealType,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      mealPlanSummary: summary,
      shoppingList: items,
    };
  }
}
