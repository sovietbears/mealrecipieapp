import { Component, input, output } from '@angular/core';
import { DayOfWeek, MealType, MealPlanEntry, MEAL_LABELS } from '../../models/meal-plan.model';

@Component({
  selector: 'app-meal-slot',
  standalone: true,
  templateUrl: './meal-slot.component.html',
  styleUrl: './meal-slot.component.scss',
})
export class MealSlotComponent {
  day = input.required<DayOfWeek>();
  mealType = input.required<MealType>();
  entries = input.required<MealPlanEntry[]>();
  remove = output<string>();
  editServings = output<{ id: string; servings: number }>();
  addMeal = output<void>();

  get label(): string {
    return MEAL_LABELS[this.mealType()];
  }

  get slotId(): string {
    return `${this.day()}-${this.mealType()}`;
  }

  onRemove(id: string): void {
    this.remove.emit(id);
  }

  onServingsChange(id: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.editServings.emit({ id, servings: val });
    }
  }

  onAdd(): void {
    this.addMeal.emit();
  }
}
