import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MealPlanService } from '../../services/meal-plan.service';

@Component({
  selector: 'app-app-header',
  standalone: true,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  constructor(
    private router: Router,
    public mealPlanService: MealPlanService
  ) {}

  get currentTab(): string {
    const path = this.router.url.split('/')[1] || 'recipes';
    return path;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  isActive(tab: string): boolean {
    return this.currentTab === tab;
  }
}
