import { Component, input, computed, inject } from '@angular/core';
import { Ingredient } from '../../models/recipe.model';
import { ServingsService } from '../../services/servings.service';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  templateUrl: './ingredient-list.component.html',
  styleUrl: './ingredient-list.component.scss',
})
export class IngredientListComponent {
  ingredients = input.required<Ingredient[]>();
  baseServings = input.required<number>();
  targetServings = input.required<number>();

  private servingsService = inject(ServingsService);

  scaledIngredients = computed(() => {
    return this.ingredients().map((ing) =>
      this.servingsService.scaleIngredient(
        ing,
        this.baseServings(),
        this.targetServings()
      )
    );
  });
}
