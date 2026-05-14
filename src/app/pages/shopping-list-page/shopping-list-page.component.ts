import { Component, inject, computed } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { MealPlanService } from '../../services/meal-plan.service';
import { RecipeService } from '../../services/recipe.service';
import { ShoppingListService } from '../../services/shopping-list.service';
import { ExportService } from '../../services/export.service';
import { ShoppingListTableComponent } from '../../components/shopping-list-table/shopping-list-table.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-shopping-list-page',
  standalone: true,
  imports: [ShoppingListTableComponent, EmptyStateComponent],
  templateUrl: './shopping-list-page.component.html',
  styleUrl: './shopping-list-page.component.scss',
})
export class ShoppingListPageComponent {
  private mealPlanService = inject(MealPlanService);
  private recipeService = inject(RecipeService);
  private shoppingListService = inject(ShoppingListService);
  private exportService = inject(ExportService);

  constructor(title: Title) {
    title.setTitle('Shopping List — MealPlanner');
  }

  recipes = computed(() => this.recipeService.recipes.value() ?? []);

  generatedDate = computed(() => new Date().toLocaleDateString());

  shoppingList = computed(() =>
    this.shoppingListService.generate(
      this.mealPlanService.mealPlan(),
      this.recipes()
    )
  );

  hasItems = computed(() => this.shoppingList().length > 0);

  onExportCSV(): void {
    this.exportService.downloadCSV(this.shoppingList());
  }

  onExportJSON(): void {
    const exportData = this.shoppingListService.buildExport(
      this.mealPlanService.mealPlan(),
      this.recipes(),
      this.shoppingList()
    );
    this.exportService.downloadJSON(exportData);
  }
}
