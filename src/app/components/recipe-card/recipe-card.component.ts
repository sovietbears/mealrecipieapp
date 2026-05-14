import { Component, input, output, HostListener } from '@angular/core';
import { Recipe } from '../../models/recipe.model';
import { CategoryBadgeComponent } from '../category-badge/category-badge.component';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { CategoryIconComponent } from '../category-icon/category-icon.component';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CategoryBadgeComponent, StarRatingComponent, CategoryIconComponent],
  templateUrl: './recipe-card.component.html',
  styleUrl: './recipe-card.component.scss',
})
export class RecipeCardComponent {
  recipe = input.required<Recipe>();
  view = output<Recipe>();
  addToPlan = output<Recipe>();

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event): void {
    event.preventDefault();
    this.onView();
  }

  onView(): void {
    this.view.emit(this.recipe());
  }

  onAddToPlan(): void {
    this.addToPlan.emit(this.recipe());
  }
}
