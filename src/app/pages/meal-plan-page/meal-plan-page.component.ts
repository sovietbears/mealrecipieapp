import { Title } from '@angular/platform-browser';
import {
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  MEAL_TYPES,
  DAY_LABELS,
  DAYS,
  MEAL_LABELS,
  MEAL_EMOJIS,
  DayOfWeek,
  MealType,
} from '../../models/meal-plan.model';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeService } from '../../services/recipe.service';
import { AddMealDialogComponent } from '../../components/add-meal-dialog/add-meal-dialog.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-meal-plan-page',
  standalone: true,
  imports: [AddMealDialogComponent, EmptyStateComponent],
  templateUrl: './meal-plan-page.component.html',
  styleUrl: './meal-plan-page.component.scss',
})
export class MealPlanPageComponent {
  mealPlanService = inject(MealPlanService);
  recipeService = inject(RecipeService);

  constructor(title: Title) {
    title.setTitle('Weekly Plan — MealPlanner');
  }

  days = DAYS;
  dayLabels = DAY_LABELS;
  mealTypes = MEAL_TYPES;
  mealLabels = MEAL_LABELS;
  mealEmojis = MEAL_EMOJIS;

  showDialog = signal(false);
  dialogDay = signal<DayOfWeek>('mon');
  dialogMealType = signal<MealType>('dinner');

  recipes = computed(() => this.recipeService.recipes.value() ?? []);

  getMealsCountForDay(day: string): number {
    return this.mealTypes.reduce(
      (sum, mt) => sum + this.mealPlanService.getEntriesForDayMeal(day as DayOfWeek, mt as MealType).length,
      0
    );
  }

  getMealsForDayMeal(day: string, mealType: string) {
    return this.mealPlanService.getEntriesForDayMeal(
      day as DayOfWeek,
      mealType as MealType
    );
  }

  getRecipeName(recipeId: number): string {
    const recipe = this.recipes().find((r) => r.id === recipeId);
    return recipe?.name ?? 'Recipe #' + recipeId;
  }

  openAddDialog(day?: string, mealType?: string): void {
    if (day) this.dialogDay.set(day as DayOfWeek);
    if (mealType) this.dialogMealType.set(mealType as MealType);
    this.showDialog.set(true);
  }

  closeAddDialog(): void {
    this.showDialog.set(false);
  }

  removeMeal(entryId: string): void {
    this.mealPlanService.removeMeal(entryId);
  }

  onServingsInput(id: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.mealPlanService.updateServings(id, val);
    }
  }

  clearAll(): void {
    if (confirm('Clear your entire meal plan?')) {
      this.mealPlanService.clearPlan();
    }
  }
}
