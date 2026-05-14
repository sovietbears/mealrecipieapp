import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { RecipeService } from '../../services/recipe.service';
import { MealPlanService } from '../../services/meal-plan.service';
import { Recipe, RecipeCategory } from '../../models/recipe.model';
import { RecipeCardComponent } from '../../components/recipe-card/recipe-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-recipes-page',
  standalone: true,
  imports: [
    RouterOutlet,
    RecipeCardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './recipes-page.component.html',
  styleUrl: './recipes-page.component.scss',
})
export class RecipesPageComponent {
  private recipeService = inject(RecipeService);
  private mealPlanService = inject(MealPlanService);
  private router = inject(Router);

  searchQuery = signal('');
  selectedCategory = signal<RecipeCategory | 'all'>('all');

  recipes = computed(() => this.recipeService.recipes.value() ?? []);
  isLoading = computed(() => this.recipeService.recipes.isLoading());
  hasError = computed(() => !!this.recipeService.recipes.error());

  constructor(title: Title) {
    title.setTitle('Recipes — MealPlanner');
  }

  categories: (RecipeCategory | 'all')[] = ['all', 'General Meal', 'Refuel Meal', 'Snack'];
  categoryLabels: Record<string, string> = {
    all: 'All',
    'General Meal': 'General',
    'Refuel Meal': 'Refuel',
    'Snack': 'Snack',
  };

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private rawSearch = signal('');

  filteredRecipes = computed(() => {
    const all = this.recipes();
    const query = this.rawSearch().toLowerCase().trim();
    const category = this.selectedCategory();

    return all.filter((recipe) => {
      const matchesSearch = query === '' || recipe.name.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || recipe.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.rawSearch.set(value);
    }, 150);
  }

  onCategoryChange(category: RecipeCategory | 'all'): void {
    this.selectedCategory.set(category);
  }

  onViewRecipe(recipe: Recipe): void {
    this.router.navigate(['/recipes', recipe.id]);
  }

  onAddToPlanFromPopup(recipe: Recipe): void {
    this.mealPlanService.addMeal({
      recipeId: recipe.id,
      day: 'mon',
      mealType: 'dinner',
      servings: recipe.servings,
    });
    this.router.navigate(['/plan']);
  }
}
