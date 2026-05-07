import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { MealPlanEntry, DayOfWeek, MealType } from '../models/meal-plan.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private storage = inject(StorageService);

  mealPlan = signal<MealPlanEntry[]>([]);

  totalMeals = computed(() => this.mealPlan().length);
  totalServings = computed(() =>
    this.mealPlan().reduce((sum, m) => sum + m.servings, 0)
  );
  mealsByDay = computed(() => {
    const grouped = new Map<DayOfWeek, MealPlanEntry[]>();
    for (const entry of this.mealPlan()) {
      if (!grouped.has(entry.day)) grouped.set(entry.day, []);
      grouped.get(entry.day)!.push(entry);
    }
    return grouped;
  });
  uniqueRecipes = computed(() => {
    const ids = new Set(this.mealPlan().map((m) => m.recipeId));
    return ids.size;
  });

  constructor() {
    const saved = this.storage.getItem<MealPlanEntry[]>('meal-plan');
    if (saved) this.mealPlan.set(saved);

    effect(() => {
      this.storage.setItem('meal-plan', this.mealPlan());
    });
  }

  addMeal(entry: Omit<MealPlanEntry, 'id'>): void {
    this.mealPlan.update((plan) => [
      ...plan,
      { ...entry, id: crypto.randomUUID() },
    ]);
  }

  removeMeal(id: string): void {
    this.mealPlan.update((plan) => plan.filter((m) => m.id !== id));
  }

  updateServings(id: string, servings: number): void {
    this.mealPlan.update((plan) =>
      plan.map((m) => (m.id === id ? { ...m, servings } : m))
    );
  }

  clearPlan(): void {
    this.mealPlan.set([]);
  }

  getEntriesForDayMeal(day: DayOfWeek, mealType: MealType): MealPlanEntry[] {
    return this.mealPlan().filter(
      (m) => m.day === day && m.mealType === mealType
    );
  }
}
