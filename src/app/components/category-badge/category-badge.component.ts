import { Component, input } from '@angular/core';
import { RecipeCategory } from '../../models/recipe.model';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  templateUrl: './category-badge.component.html',
  styleUrl: './category-badge.component.scss',
})
export class CategoryBadgeComponent {
  category = input.required<RecipeCategory>();

  get label(): string {
    const c = this.category();
    return c === 'General Meal' ? 'General' : c;
  }

  get styleClass(): string {
    switch (this.category()) {
      case 'Snack':
        return 'badge--snack';
      case 'Refuel Meal':
        return 'badge--refuel';
      default:
        return 'badge--general';
    }
  }
}
