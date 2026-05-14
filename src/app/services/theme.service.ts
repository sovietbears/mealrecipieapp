import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';
const THEME_KEY = 'mealplanner-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initialTheme());
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Apply theme attribute on init
      this.applyTheme(this.theme());

      // Listen for OS preference changes
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          // Only auto-switch if the user hasn't manually set a preference
          if (!localStorage.getItem(THEME_KEY)) {
            this.theme.set(e.matches ? 'dark' : 'light');
          }
        });
    }
  }

  /**
   * Resolve initial theme: stored preference > OS preference > light
   */
  private initialTheme(): Theme {
    if (!this.isBrowser) return 'light';

    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  toggle(): void {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    this.persist(next);
    this.applyTheme(next);
  }

  private persist(theme: Theme): void {
    if (this.isBrowser) {
      localStorage.setItem(THEME_KEY, theme);
    }
  }

  private applyTheme(theme: Theme): void {
    if (this.isBrowser) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
