import { Component, input } from '@angular/core';
import { MethodStep } from '../../models/recipe.model';

@Component({
  selector: 'app-method-steps',
  standalone: true,
  templateUrl: './method-steps.component.html',
  styleUrl: './method-steps.component.scss',
})
export class MethodStepsComponent {
  steps = input.required<MethodStep[]>();
}
