import { Component, input, computed, signal } from '@angular/core';
import { ShoppingListItem } from '../../models/shopping-list.model';

@Component({
  selector: 'app-shopping-list-table',
  standalone: true,
  templateUrl: './shopping-list-table.component.html',
  styleUrl: './shopping-list-table.component.scss',
})
export class ShoppingListTableComponent {
  items = input.required<ShoppingListItem[]>();

  checkedItems = signal<Set<number>>(new Set());
  expandedRow = signal<number | null>(null);

  toggleCheck(index: number): void {
    this.checkedItems.update((set) => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  toggleExpand(index: number): void {
    this.expandedRow.update((current) => (current === index ? null : index));
  }

  isChecked(index: number): boolean {
    return this.checkedItems().has(index);
  }

  isExpanded(index: number): boolean {
    return this.expandedRow() === index;
  }

  sourceRecipes(item: ShoppingListItem): string {
    return item.sources.map((s) => s.recipeName).join(', ');
  }
}
