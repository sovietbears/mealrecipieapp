import { Component, input } from '@angular/core';
import { RecipeCategory } from '../../models/recipe.model';

@Component({
  selector: 'app-category-icon',
  standalone: true,
  templateUrl: './category-icon.component.html',
  styleUrl: './category-icon.component.scss',
})
export class CategoryIconComponent {
  category = input.required<RecipeCategory>();
}
