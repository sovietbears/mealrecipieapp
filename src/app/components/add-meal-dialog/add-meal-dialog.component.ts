import {
  Component,
  inject,
  output,
  signal,
  computed,
  input,
  effect,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { MealPlanService } from '../../services/meal-plan.service';
import { DayOfWeek, MealType, DAYS, DAY_LABELS, MEAL_TYPES, MEAL_LABELS } from '../../models/meal-plan.model';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-add-meal-dialog',
  standalone: true,
  templateUrl: './add-meal-dialog.component.html',
  styleUrl: './add-meal-dialog.component.scss',
})
export class AddMealDialogComponent implements OnInit, OnDestroy {
  close = output<void>();
  initialDay = input<DayOfWeek>('mon');
  initialMealType = input<MealType>('dinner');

  private recipeService = inject(RecipeService);
  private mealPlanService = inject(MealPlanService);

  selectedRecipeId = signal<number | null>(null);
  selectedDay = signal<DayOfWeek>('mon');
  selectedMealType = signal<MealType>('dinner');
  servings = signal(4);

  days = DAYS;
  dayLabels = DAY_LABELS;
  mealTypes = MEAL_TYPES;
  mealLabels = MEAL_LABELS;

  recipes = computed(() => this.recipeService.recipes.value() ?? []);

  constructor() {
    effect(() => this.selectedDay.set(this.initialDay()));
    effect(() => this.selectedMealType.set(this.initialMealType()));
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    event.preventDefault();
    this.close.emit();
  }

  onSelectRecipe(recipe: Recipe): void {
    this.selectedRecipeId.set(recipe.id);
    this.servings.set(recipe.servings);
  }

  onServingsInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.servings.set(val);
    }
  }

  onAdd(): void {
    const recipeId = this.selectedRecipeId();
    const day = this.selectedDay();
    const mealType = this.selectedMealType();
    const servingsVal = this.servings();

    if (recipeId == null) return;

    this.mealPlanService.addMeal({
      recipeId,
      day,
      mealType,
      servings: servingsVal,
    });

    this.close.emit();
  }

  onCancel(): void {
    this.close.emit();
  }
}
