import { Component, input } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
})
export class StarRatingComponent {
  rating = input<number>(0);
  count = input<number>(0);

  get fullStars(): number[] {
    return Array(Math.floor(this.rating())).fill(0);
  }

  get hasHalfStar(): boolean {
    return this.rating() % 1 >= 0.5;
  }

  get emptyStars(): number[] {
    const filled = this.fullStars.length + (this.hasHalfStar ? 1 : 0);
    return Array(Math.max(0, 5 - filled)).fill(0);
  }
}
