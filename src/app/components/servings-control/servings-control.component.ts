import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-servings-control',
  standalone: true,
  templateUrl: './servings-control.component.html',
  styleUrl: './servings-control.component.scss',
})
export class ServingsControlComponent {
  servings = input.required<number>();
  servingsChange = output<number>();
  min = input<number>(1);
  max = input<number>(50);

  decrease(): void {
    const newVal = this.servings() - 1;
    if (newVal >= this.min()) {
      this.servingsChange.emit(newVal);
    }
  }

  increase(): void {
    const newVal = this.servings() + 1;
    if (newVal <= this.max()) {
      this.servingsChange.emit(newVal);
    }
  }

  onInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= this.min() && val <= this.max()) {
      this.servingsChange.emit(val);
    }
  }
}
