import { Injectable, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Signal, computed } from '@angular/core';
import { Recipe, DEFAULT_SERVINGS } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);

  recipes = resource({
    loader: async () => {
      const raw = await firstValueFrom(
        this.http.get<{ recipes: Recipe[] }>('/data/recipes.json')
      );
      return raw.recipes.map((r) => ({
        ...r,
        servings: r.servings ?? DEFAULT_SERVINGS,
      }));
    },
  });

  findById(id: number): Signal<Recipe | undefined> {
    return computed(() => this.recipes.value()?.find((r) => r.id === id));
  }
}
