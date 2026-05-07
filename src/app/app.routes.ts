import { Routes } from '@angular/router';
import { RecipesPageComponent } from './pages/recipes-page/recipes-page.component';
import { MealPlanPageComponent } from './pages/meal-plan-page/meal-plan-page.component';
import { ShoppingListPageComponent } from './pages/shopping-list-page/shopping-list-page.component';
import { RecipeDetailRouteComponent } from './pages/recipes-page/recipe-detail-route.component';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  {
    path: 'recipes',
    component: RecipesPageComponent,
    children: [
      { path: ':id', component: RecipeDetailRouteComponent },
    ],
  },
  { path: 'plan', component: MealPlanPageComponent },
  { path: 'list', component: ShoppingListPageComponent },
  { path: '**', redirectTo: '/recipes' },
];
