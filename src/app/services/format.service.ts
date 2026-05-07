import { Injectable } from '@angular/core';
import { Unit } from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class FormatService {
  formatAmount(amount: number, unit: Unit): string {
    if (unit === 'to_taste' || unit === 'to taste') return 'to taste';

    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (abs === 0.25) return sign + '¼';
    if (abs === 0.5) return sign + '½';
    if (abs === 0.75) return sign + '¾';
    if (abs === 1.5) return sign + '1½';
    if (abs === 2.5) return sign + '2½';

    if (Number.isInteger(abs)) return sign + abs.toString();
    return sign + abs.toFixed(1).replace(/\.0$/, '');
  }
}
