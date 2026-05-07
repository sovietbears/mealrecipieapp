import {
  Component,
  inject,
  input,
  computed,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeDetailComponent } from '../../components/recipe-detail/recipe-detail.component';

@Component({
  selector: 'app-recipe-detail-route',
  standalone: true,
  imports: [RecipeDetailComponent],
  templateUrl: './recipe-detail-route.component.html',
  styleUrl: './recipe-detail-route.component.scss',
})
export class RecipeDetailRouteComponent {
  id = input.required<number, string>({ transform: (v) => parseInt(v, 10) });

  private router = inject(Router);
  private recipeService = inject(RecipeService);
  private mealPlanService = inject(MealPlanService);

  recipe = computed(() => this.recipeService.findById(this.id())());

  onAddToPlan(): void {
    const r = this.recipe();
    if (!r) return;
    this.mealPlanService.addMeal({
      recipeId: r.id,
      day: 'mon',
      mealType: 'dinner',
      servings: r.servings,
    });
    this.router.navigate(['/plan']);
  }

  onClose(): void {
    this.router.navigate(['/recipes']);
  }
}
