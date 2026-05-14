import { Injectable } from '@angular/core';
import { ShoppingListExport } from '../models/shopping-list.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadCSV(items: { item: string; totalAmount: number; unit: string; sources: { recipeName: string }[] }[]): void {
    const header = 'Item,Amount,Unit,Source Recipes\n';
    const rows = items.map(
      (item) =>
        `"${item.item}",${item.totalAmount},${item.unit},"${item.sources.map((s) => s.recipeName).join(', ')}"`
    );
    const csv = header + rows.join('\n');
    this.downloadBlob(csv, 'shopping-list.csv', 'text/csv');
  }

  downloadJSON(data: ShoppingListExport): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadBlob(json, 'shopping-list.json', 'application/json');
  }

  private downloadBlob(
    content: string,
    filename: string,
    type: string
  ): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
