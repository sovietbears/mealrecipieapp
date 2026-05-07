import { Injectable } from '@angular/core';
import { Ingredient, ScaledIngredient, Unit } from '../models/recipe.model';
import { FormatService } from './format.service';

@Injectable({ providedIn: 'root' })
export class ServingsService {
  constructor(private formatService: FormatService) {}

  scaleIngredient(
    ingredient: Ingredient,
    baseServings: number,
    targetServings: number
  ): ScaledIngredient {
    if (ingredient.unit === 'to_taste' || ingredient.unit === 'to taste') {
      return {
        ...ingredient,
        scaledAmount: 0,
        originalAmount: ingredient.amount,
        display: 'to taste',
      };
    }

    const ratio = targetServings / baseServings;
    const scaled = ingredient.amount * ratio;
    const rounded = this.roundForUnit(scaled, ingredient.unit);

    return {
      ...ingredient,
      scaledAmount: rounded,
      originalAmount: ingredient.amount,
      display: this.formatService.formatAmount(rounded, ingredient.unit),
    };
  }

  private roundForUnit(amount: number, unit: Unit): number {
    switch (unit) {
      case 'whole':
      case 'slices':
        return Math.ceil(amount);
      case 'pinch':
      case 'handful':
      case 'small_bunch':
      case 'bunch':
        return Math.round(amount * 2) / 2;
      case 'to_taste':
      case 'to taste':
        return 0;
      default:
        return Math.round(amount * 10) / 10;
    }
  }
}
