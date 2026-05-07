import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { Recipe } from '../../models/recipe.model';
import { ServingsControlComponent } from '../servings-control/servings-control.component';
import { IngredientListComponent } from '../ingredient-list/ingredient-list.component';
import { MethodStepsComponent } from '../method-steps/method-steps.component';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    ServingsControlComponent,
    IngredientListComponent,
    MethodStepsComponent,
    CategoryBadgeComponent,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent {
  recipe = input.required<Recipe>();
  close = output<void>();
  addToPlan = output<Recipe>();

  private router = inject(Router);

  currentServings = signal(4);

  servingsText = computed(() => {
    const s = this.currentServings();
    const base = this.recipe().servings;
    return s === base ? `Serves ${s}` : `Serves ${s} (originally ${base})`;
  });

  constructor() {
    effect(() => {
      this.currentServings.set(this.recipe().servings);
    });
  }

  onServingsChange(servings: number): void {
    this.currentServings.set(servings);
  }

  onAddToPlan(): void {
    this.addToPlan.emit(this.recipe());
  }

  onClose(): void {
    this.close.emit();
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }
}
