# Meal Recipe Planner — Implementation Plan (Angular 21)

## 1. Overview & Goals

Build a **simple, beautiful, single-page Angular 21 web application** that allows the user to:

1. **Browse** all recipes in a visually appealing card grid.
2. **View** individual recipe details with ingredients and cooking steps.
3. **Adjust servings** dynamically — ingredient amounts scale in real-time.
4. **Plan meals for the week** by selecting recipes and specifying servings per meal.
5. **Generate a Shopping List** — all ingredients from the week's meals are aggregated, grouped by item name, totals computed, and exported as **CSV** or **JSON** for use by humans or AI shopping agents.

**Out of scope:** Recipe creation/editing. Recipe data is static (loaded from `recipes.json`).

---

## 2. Tech Stack

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| **Framework** | Angular 21 | Modern, signal-based, zoneless reactivity, excellent TypeScript DX |
| **Build Tool** | Angular CLI (v21) | Zero-config, SSR/SSG support, production optimizations built-in |
| **Change Detection** | Zoneless (`provideExperimentalZonelessChangeDetection`) | Fine-grained signals reactivity — only what changes re-renders |
| **Styling** | SCSS + Angular Encapsulation | Component-scoped styles, CSS custom properties for theming |
| **State** | Angular Signals (`signal()`, `computed()`) | Built-in, no extra libraries needed |
| **Routing** | Angular Router | Clean tab navigation (/recipes, /plan, /list) |
| **Data** | Static `recipes.json` fetched via `HttpClient` | No backend needed |
| **Persistence** | Custom `StorageService` wrapping `localStorage` | Meal plan survives page reload |
| **Icons** | Inline SVGs via Angular components | Zero extra dependencies |

> **Angular 21 key features we leverage:**
> - Standalone components (no `NgModule` boilerplate)
> - Signal inputs (`input.required<T>()`)
> - Signal outputs (`output()`)
> - `computed()` for derived state (shopping list, filtered recipes)
> - `effect()` for localStorage side-effects
> - Built-in control flow (`@if`, `@for`, `@switch`) — no `*ngIf` / `*ngFor`
> - Resource API (`resource()` / `rxResource()`) for async data loading
> 
> **Component file convention:** Every component has its own **`.ts`**, **`.html`**, and **`.scss`** file — never inline templates or styles. This keeps the codebase clean, maintainable, and enables IDE tooling (HTML autocomplete, CSS intellisense, AoT template checking).

---

## 2.5. AI-Assisted UX/UI Design (Anthropic Claude)

Claude is used **throughout development** as a design partner to make the app genuinely *pretty and easy to use* — not just functional. This is design-time AI assistance (Option A), not a runtime API integration.

### How Claude contributes to UX/UI:

| Area | What Claude Does | When |
|------|------------------|------|
| **Visual Design** | Generates and refines color palettes, gradient combinations, shadow scales, spacing rhythms — checked against accessibility contrast ratios | Phase 1 + ongoing |
| **Microcopy** | Writes friendly, concise UI text: button labels, empty states, error messages, tooltips, onboarding hints | Every component |
| **Layout Critique** | Reviews each component visually (via screenshots if needed) and suggests improvements to spacing, hierarchy, alignment, density | After each component |
| **SVG Illustrations** | Generates inline SVG for category icons, empty states, decorative elements (no external image deps) | Phase 2 + 6 |
| **Animation Design** | Suggests tasteful micro-interactions: card hover lifts, dialog entrance, list reorder, button feedback — respecting `prefers-reduced-motion` | Phase 6 |
| **Accessibility Review** | Audits keyboard navigation flow, ARIA labels, focus management, color contrast | Phase 6 |
| **Information Architecture** | Critiques navigation, label clarity, task flows (e.g. "can a user plan a week and export in <60 seconds?") | Each phase |
| **Design Rationale** | Explains *why* each design choice was made (writes inline code comments, README design notes) | Throughout |

### Design principles enforced:

1. **Warmth over sterility** — kitchens and food are warm; the UI should feel inviting, not clinical
2. **One primary action per view** — no decision paralysis
3. **Show, don't tell** — visual feedback over text labels where possible (icons, color, motion)
4. **Progressive disclosure** — recipe summary on cards, details on click; servings adjustable but defaulted sensibly
5. **Forgiving** — every action reversible (undo remove from plan, clear with confirmation)
6. **Delightful, not loud** — subtle animations, restrained color palette, ample whitespace

### Concrete examples Claude will produce:

- A friendly empty-state illustration for the meal planner: *"No meals planned yet — tap a day to add your first recipe 🍽️"*
- Recipe card hover: 4px lift + soft shadow growth + 1.05x image zoom over 200ms ease-out
- Servings stepper with smooth number-roll animation when changed
- Shopping list "item ticked off" with strikethrough + fade to 50% opacity
- Microcopy: button reads "Add to my week" rather than "Add to meal plan" — warmer, more personal

---

## 3. Data Model

### 3.1 Domain Models (`src/app/models/`)

```typescript
// recipe.model.ts
export interface Recipe {
  id: number;
  name: string;
  category: RecipeCategory;
  rating?: number;
  ratingCount?: number;
  cookTime?: string;           // e.g. "25 min"
  cookingMethod?: string;      // e.g. "Batch cooking"
  servings: number;            // base servings the recipe is written for; defaults to 4 if missing in source data
  note?: string;
  ingredients: Ingredient[];
  method: MethodStep[];
}

// Default servings when source data is missing the field
export const DEFAULT_SERVINGS = 4;

export type RecipeCategory = 'Snack' | 'General Meal' | 'Refuel Meal';

export interface Ingredient {
  item: string;                // e.g. "unsalted butter"
  amount: number;              // base amount for `recipe.servings`
  unit: Unit;
}

export type Unit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'oz' | 'lb' | 'kg' | 'l' | 
                   'whole' | 'pinch' | 'handful' | 'small_bunch' | 'bunch' | 
                   'serving' | 'slices' | 'to_taste' | 'cup' | 'stick';

export interface MethodStep {
  step: number;
  instruction: string;
}
```

```typescript
// meal-plan.model.ts
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlanEntry {
  id: string;                  // unique entry ID (crypto.randomUUID or nanoid)
  recipeId: number;
  servings: number;
  day: DayOfWeek;
  mealType: MealType;
}
```

```typescript
// shopping-list.model.ts
export interface ShoppingListItem {
  item: string;
  totalAmount: number;
  unit: string;
  sources: ShoppingSource[];
}

export interface ShoppingSource {
  recipeName: string;
  amount: number;
  unit: string;
}

export interface ShoppingListExport {
  generatedAt: string;
  mealPlanSummary: MealPlanSummary[];
  shoppingList: ShoppingListItem[];
}

export interface MealPlanSummary {
  recipeName: string;
  servings: number;
  day: string;
  mealType: string;
}
```

---

## 4. Core Business Logic

### 4.1 Serving Scaling Engine

```typescript
// servings.service.ts
export class ServingsService {
  scaleIngredient(ingredient: Ingredient, baseServings: number, targetServings: number): ScaledIngredient {
    if (ingredient.unit === 'to_taste') {
      return { ...ingredient, scaledAmount: 0, display: 'to taste' };
    }

    const ratio = targetServings / baseServings;
    const scaled = ingredient.amount * ratio;

    return {
      ...ingredient,
      scaledAmount: this.roundForUnit(scaled, ingredient.unit),
      originalAmount: ingredient.amount,
    };
  }

  private roundForUnit(amount: number, unit: Unit): number {
    switch (unit) {
      case 'whole':
      case 'slices':
        return Math.ceil(amount);             // always round up
      case 'pinch':
      case 'handful':
      case 'small_bunch':
      case 'bunch':
        return Math.round(amount * 2) / 2;    // nearest half
      case 'to_taste':
        return 0;
      default:
        return Math.round(amount * 10) / 10;  // 1 decimal for weight/volume
    }
  }
}
```

### 4.2 Smart Fraction Formatting

```typescript
// format.service.ts
export class FormatService {
  formatAmount(amount: number, unit: Unit): string {
    if (unit === 'to_taste') return 'to taste';
    
    // For common fractions
    if (amount === 0.25) return '¼';
    if (amount === 0.5) return '½';
    if (amount === 0.75) return '¾';
    if (amount === 1.5) return '1½';
    if (amount === 2.5) return '2½';
    
    if (Number.isInteger(amount)) return amount.toString();
    return amount.toFixed(1).replace(/\.0$/, '');
  }
}
```

### 4.3 Shopping List Aggregation

```typescript
// shopping-list.service.ts
export class ShoppingListService {
  generate(mealPlan: MealPlanEntry[], recipes: Recipe[]): ShoppingListItem[] {
    const accumulator = new Map<string, ShoppingAccumulator>();

    for (const entry of mealPlan) {
      const recipe = recipes.find(r => r.id === entry.recipeId);
      if (!recipe) continue;

      for (const ingredient of recipe.ingredients) {
        const scaled = this.servingsService.scaleIngredient(
          ingredient, recipe.servings, entry.servings
        );

        const key = `${ingredient.item}::${ingredient.unit}`;
        
        if (!accumulator.has(key)) {
          accumulator.set(key, {
            item: ingredient.item,
            unit: ingredient.unit,
            totalAmount: 0,
            sources: [],
          });
        }
        
        const acc = accumulator.get(key)!;
        acc.totalAmount += scaled.scaledAmount;
        acc.sources.push({
          recipeName: recipe.name,
          amount: scaled.scaledAmount,
          unit: ingredient.unit,
        });
      }
    }

    return Array.from(accumulator.values()).map(a => ({
      item: a.item,
      totalAmount: Math.round(a.totalAmount * 100) / 100,
      unit: a.unit,
      sources: a.sources,
    }));
  }
}
```

---

## 5. Services

### 5.1 `RecipeService` — Data Loading

```typescript
@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  
  // Using Angular 21's resource() for declarative async data
  recipes = resource({
    loader: async () => {
      const raw = await firstValueFrom(
        this.http.get<Recipe[]>('/data/recipes.json')
      );
      // Normalize: fill in default servings (4) for any recipe missing it
      return raw.map(r => ({
        ...r,
        servings: r.servings ?? DEFAULT_SERVINGS,
      }));
    },
  });

  findById(id: number): Signal<Recipe | undefined> {
    return computed(() => this.recipes.value()?.find(r => r.id === id));
  }
}
```

> **Default servings policy:** If a recipe's `servings` field is missing from `recipes.json`, the loader sets it to `4`. Users can override at any time via the `ServingsControl` (range: 1 – 50, integer).

### 5.2 `MealPlanService` — State & Persistence

```typescript
@Injectable({ providedIn: 'root' })
export class MealPlanService {
  private storage = inject(StorageService);
  
  // Signal-based state
  mealPlan = signal<MealPlanEntry[]>([]);
  
  // Computed derived state
  totalMeals = computed(() => this.mealPlan().length);
  totalServings = computed(() => this.mealPlan().reduce((sum, m) => sum + m.servings, 0));
  mealsByDay = computed(() => {
    const grouped = new Map<DayOfWeek, MealPlanEntry[]>();
    for (const entry of this.mealPlan()) {
      if (!grouped.has(entry.day)) grouped.set(entry.day, []);
      grouped.get(entry.day)!.push(entry);
    }
    return grouped;
  });

  constructor() {
    // Load from localStorage on init
    const saved = this.storage.getItem<MealPlanEntry[]>('meal-plan');
    if (saved) this.mealPlan.set(saved);
    
    // Auto-save to localStorage whenever mealPlan changes
    effect(() => {
      this.storage.setItem('meal-plan', this.mealPlan());
    });
  }

  addMeal(entry: Omit<MealPlanEntry, 'id'>): void {
    this.mealPlan.update(plan => [
      ...plan,
      { ...entry, id: crypto.randomUUID() },
    ]);
  }

  removeMeal(id: string): void {
    this.mealPlan.update(plan => plan.filter(m => m.id !== id));
  }

  updateServings(id: string, servings: number): void {
    this.mealPlan.update(plan =>
      plan.map(m => m.id === id ? { ...m, servings } : m)
    );
  }

  clearPlan(): void {
    this.mealPlan.set([]);
  }
}
```

### 5.3 `StorageService` — localStorage Wrapper

```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Graceful degradation if storage is full
    }
  }
}
```

### 5.4 `ExportService` — CSV/JSON Generation

```typescript
@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadCSV(items: ShoppingListItem[]): void {
    const header = 'Item,Amount,Unit,Source Recipes\n';
    const rows = items.map(item =>
      `"${item.item}",${item.totalAmount},${item.unit},"${item.sources.map(s => s.recipeName).join(', ')}"`
    );
    const csv = header + rows.join('\n');
    this.downloadBlob(csv, 'shopping-list.csv', 'text/csv');
  }

  downloadJSON(data: ShoppingListExport): void {
    const json = JSON.stringify(data, null, 2);
    this.downloadBlob(json, 'shopping-list.json', 'application/json');
  }

  private downloadBlob(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 6. Component Architecture

### 6.1 Page Components (Route Level)

| Component | Route | Description |
|-----------|-------|-------------|
| `RecipesPageComponent` | `/recipes` | Recipe browser grid + filters |
| `MealPlanPageComponent` | `/plan` | Weekly meal planner |
| `ShoppingListPageComponent` | `/list` | Aggregated shopping list + exports |

### 6.2 Shared Components

| Component | Inputs | Outputs | Description |
|-----------|--------|---------|-------------|
| `AppHeaderComponent` | — | `tabChange` | Top nav with tab links (Recipes, Plan, List) + badge counts |
| `RecipeCardComponent` | `recipe: Recipe` | `view`, `addToPlan` | Grid card with image, name, rating, cook time, category |
| `RecipeDetailComponent` | `recipeId: number` | `close`, `addToPlan` | Full-screen modal/dialog with scaled ingredients, method |
| `ServingsControlComponent` | `servings: number` | `servingsChange` | +/- stepper with number input |
| `IngredientListComponent` | `ingredients: Ingredient[]`, `baseServings`, `targetServings` | — | Live-scaled ingredient list with checkboxes |
| `MethodStepsComponent` | `steps: MethodStep[]` | — | Numbered cooking instructions |
| `MealSlotComponent` | `day: DayOfWeek`, `mealType: MealType`, `entries: MealPlanEntry[]` | `remove`, `editServings` | Single slot in weekly planner |
| `AddMealDialogComponent` | — | `addMeal` | Recipe picker + servings + day/mealType selection |
| `ShoppingListTableComponent` | `items: ShoppingListItem[]` | — | Sortable table of aggregated ingredients |
| `CategoryBadgeComponent` | `category: RecipeCategory` | — | Colored pill badge per category |
| `StarRatingComponent` | `rating: number`, `count: number` | — | Star display with count |
| `EmptyStateComponent` | `message: string`, `icon: string` | — | Friendly empty state illustration |

### 6.3 Component File Conventions

Every component follows the **three-file rule** — no exceptions:

```
my-component/
├── my-component.component.ts      ← Component class + metadata (templateUrl / styleUrls only)
├── my-component.component.html    ← External template — all markup
└── my-component.component.scss    ← Encapsulated styles
```

**Rules:**
- **Never** use `template: ` inline strings — always `templateUrl: './my-component.component.html'`
- **Never** use `styles: []` inline arrays — always `styleUrls: ['./my-component.component.scss']` (or `styleUrl` for single file)
- Component `.ts` files contain **only** TypeScript logic — imports, class, signals, methods, computed properties
- Templates handle **all** markup and Angular control flow (`@if`, `@for`, `@switch`)
- `.scss` files use component-scoped styles with BEM-like naming (`recipe-card__title`)

This ensures:
- HTML syntax highlighting and autocomplete in all editors
- AoT template type-checking catches binding errors at build time
- Designers can work in `.html`/`.scss` without touching `.ts` files
- Cleaner diffs in version control

### 6.4 Component Examples

**RecipeCard — TypeScript:** `recipe-card.component.ts`
```typescript
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

  onView(): void { this.view.emit(this.recipe()); }
  onAddToPlan(): void { this.addToPlan.emit(this.recipe()); }
}
```

**RecipeCard — Template:** `recipe-card.component.html`
```html
<article class="recipe-card" (click)="onView()">
  <div class="recipe-card__image">
    <app-category-icon [category]="recipe.category" />
  </div>

  <div class="recipe-card__content">
    <app-category-badge [category]="recipe.category" />
    <h3 class="recipe-card__title">{{ recipe.name }}</h3>

    @if (recipe.rating) {
      <app-star-rating [rating]="recipe.rating" [count]="recipe.ratingCount" />
    }

    <div class="recipe-card__meta">
      @if (recipe.cookTime) {
        <span class="meta-item">{{ recipe.cookTime }}</span>
      }
      <span class="meta-item">Serves {{ recipe.servings }}</span>
    </div>

    <div class="recipe-card__actions">
      <button class="btn-ghost" type="button" (click)="onView(); $event.stopPropagation()">
        View Recipe
      </button>
      <button class="btn-primary" type="button" (click)="onAddToPlan(); $event.stopPropagation()">
        Add to Plan
      </button>
    </div>
  </div>
</article>
```

**RecipeCard — Styles:** `recipe-card.component.scss`
```scss
@use '../../../styles/mixins' as *;

:host {
  display: block;
}

.recipe-card {
  background: var(--color-surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

    .recipe-card__image ::ng-deep svg {
      transform: scale(1.05);
    }
  }

  &__image {
    height: 180px;
    background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
    display: grid;
    place-items: center;

    ::ng-deep svg {
      transition: transform 0.3s ease;
    }
  }

  &__content {
    padding: 1rem;
  }

  &__title {
    font-family: var(--font-display);
    font-size: var(--text-h3);
    font-weight: 600;
    color: var(--color-text);
    margin: 0.5rem 0;
    line-height: 1.3;
  }

  &__meta {
    display: flex;
    gap: 0.75rem;
    color: var(--color-text-muted);
    font-size: var(--text-small);
    margin-bottom: 1rem;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
  }
}
```

---

## 7. App State (Signals)

### Global State (Services)

```
RecipeService
  └── recipes: Resource<Recipe[]>          ← async-loaded from recipes.json

MealPlanService
  ├── mealPlan: Signal<MealPlanEntry[]>    ← user-created plan
  ├── totalMeals: Computed<number>
  ├── totalServings: Computed<number>
  └── mealsByDay: Computed<Map<DayOfWeek, MealPlanEntry[]>>
```

### Local/UI State (Component-level signals)

```
RecipesPageComponent
  ├── searchQuery: Signal<string>
  ├── selectedCategory: Signal<RecipeCategory | 'all'>
  ├── filteredRecipes: Computed<Recipe[]>  ← filters recipes.value()
  └── selectedRecipeId: Signal<number | null>

RecipeDetailComponent (inside dialog)
  ├── currentServings: Signal<number>
  └── scaledIngredients: Computed<ScaledIngredient[]>
```

---

## 8. Routing

Deep-linkable URLs throughout — every meaningful state has a shareable URL.

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  {
    path: 'recipes',
    component: RecipesPageComponent,
    data: { tab: 'recipes' },
    children: [
      // /recipes/5  →  list view + detail dialog open for recipe 5
      { path: ':id', component: RecipeDetailComponent },
    ],
  },
  { path: 'plan', component: MealPlanPageComponent, data: { tab: 'plan' } },
  { path: 'list', component: ShoppingListPageComponent, data: { tab: 'list' } },
  { path: '**', redirectTo: '/recipes' },  // 404 fallback
];
```

### URL Patterns

| URL | View | Shareable? |
|-----|------|-----------|
| `/` | Redirects to `/recipes` | n/a |
| `/recipes` | Recipe browser grid | ✅ |
| `/recipes/5` | Recipe browser **with detail dialog open** for recipe id 5 | ✅ Direct link to a recipe |
| `/plan` | Weekly meal planner | ✅ |
| `/list` | Shopping list + exports | ✅ |

### Detail-Dialog-on-Route Pattern (Angular 21)

The recipe detail is a **child route** rendered inside a `<dialog>` overlay on top of the recipes page. This gives us:
- Shareable URLs (`/recipes/5` opens directly to the dialog)
- Browser back button closes the dialog naturally
- Smooth UX — list stays in place behind the modal

```typescript
// Use withComponentInputBinding() in app.config.ts
provideRouter(routes, withComponentInputBinding())

// RecipeDetailComponent receives id as signal input from route param
export class RecipeDetailComponent {
  id = input.required<number, string>({ transform: (v) => parseInt(v, 10) });
  // ...
}
```

In `recipes-page.component.html`:
```html
<!-- list grid here -->
<router-outlet />  <!-- renders RecipeDetailComponent dialog when /recipes/:id matches -->
```

---

## 9. UI Design Plan

### 9.1 Color Palette (Warm & Appetizing)

```scss
// styles/_variables.scss
:root {
  --color-bg: #FDF8F3;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FFFFFF;
  --color-primary: #E86A33;
  --color-primary-dark: #C4552A;
  --color-primary-light: #F4A574;
  --color-secondary: #4A7C59;
  --color-secondary-dark: #3A6347;
  --color-accent: #D4A373;
  --color-text: #2D2D2D;
  --color-text-muted: #6B6B6B;
  --color-border: #E8DDD0;
  --color-star: #F4B942;
  --color-error: #D94646;
  --color-success: #4A7C59;
  
  // Category colors
  --color-snack: #D4A373;
  --color-general: #4A7C59;
  --color-refuel: #E86A33;
}
```

### 9.2 Typography

```scss
// styles/_typography.scss
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');

:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  
  --text-hero: 2rem;      // 32px
  --text-h1: 1.75rem;     // 28px
  --text-h2: 1.375rem;    // 22px
  --text-h3: 1.125rem;    // 18px
  --text-body: 1rem;      // 16px
  --text-small: 0.875rem; // 14px
  --text-xs: 0.75rem;     // 12px
}
```

### 9.3 Category Icon System (No Images Needed)

Each recipe category renders a programmatic SVG with a unique warm gradient:

| Category | Gradient | Icon |
|----------|----------|------|
| **Snack** | Amber→Orange | Cookie/muffin silhouette |
| **General Meal** | Sage→Forest green | Plate with cutlery |
| **Refuel Meal** | Terracotta→Deep red | Protein/chicken drumstick |

---

## 10. File Structure (Angular 21) — Component Files Split

Every component folder contains **exactly three files**: `.ts`, `.html`, `.scss`.

```
mealrecipieapp/
├── public/
│   └── data/
│       └── recipes.json              ← Static recipe data (copied to dist/)
├── src/
│   ├── app/
│   │   ├── app.component.ts          ← Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts             ← provideRouter, provideHttpClient, zoneless CD
│   │   ├── app.routes.ts             ← Route definitions
│   │   ├── models/
│   │   │   ├── recipe.model.ts
│   │   │   ├── meal-plan.model.ts
│   │   │   └── shopping-list.model.ts
│   │   ├── services/
│   │   │   ├── recipe.service.ts
│   │   │   ├── meal-plan.service.ts
│   │   │   ├── servings.service.ts
│   │   │   ├── format.service.ts
│   │   │   ├── shopping-list.service.ts
│   │   │   ├── export.service.ts
│   │   │   └── storage.service.ts
│   │   ├── pages/
│   │   │   ├── recipes-page/
│   │   │   │   ├── recipes-page.component.ts
│   │   │   │   ├── recipes-page.component.html
│   │   │   │   └── recipes-page.component.scss
│   │   │   ├── meal-plan-page/
│   │   │   │   ├── meal-plan-page.component.ts
│   │   │   │   ├── meal-plan-page.component.html
│   │   │   │   └── meal-plan-page.component.scss
│   │   │   └── shopping-list-page/
│   │   │       ├── shopping-list-page.component.ts
│   │   │       ├── shopping-list-page.component.html
│   │   │       └── shopping-list-page.component.scss
│   │   └── components/
│   │       ├── app-header/
│   │       │   ├── app-header.component.ts
│   │       │   ├── app-header.component.html
│   │       │   └── app-header.component.scss
│   │       ├── recipe-card/
│   │       │   ├── recipe-card.component.ts
│   │       │   ├── recipe-card.component.html
│   │       │   └── recipe-card.component.scss
│   │       ├── recipe-detail/
│   │       │   ├── recipe-detail.component.ts
│   │       │   ├── recipe-detail.component.html
│   │       │   └── recipe-detail.component.scss
│   │       ├── servings-control/
│   │       │   ├── servings-control.component.ts
│   │       │   ├── servings-control.component.html
│   │       │   └── servings-control.component.scss
│   │       ├── ingredient-list/
│   │       │   ├── ingredient-list.component.ts
│   │       │   ├── ingredient-list.component.html
│   │       │   └── ingredient-list.component.scss
│   │       ├── method-steps/
│   │       │   ├── method-steps.component.ts
│   │       │   ├── method-steps.component.html
│   │       │   └── method-steps.component.scss
│   │       ├── meal-slot/
│   │       │   ├── meal-slot.component.ts
│   │       │   ├── meal-slot.component.html
│   │       │   └── meal-slot.component.scss
│   │       ├── add-meal-dialog/
│   │       │   ├── add-meal-dialog.component.ts
│   │       │   ├── add-meal-dialog.component.html
│   │       │   └── add-meal-dialog.component.scss
│   │       ├── shopping-list-table/
│   │       │   ├── shopping-list-table.component.ts
│   │       │   ├── shopping-list-table.component.html
│   │       │   └── shopping-list-table.component.scss
│   │       ├── category-badge/
│   │       │   ├── category-badge.component.ts
│   │       │   ├── category-badge.component.html
│   │       │   └── category-badge.component.scss
│   │       ├── category-icon/
│   │       │   ├── category-icon.component.ts
│   │       │   ├── category-icon.component.html
│   │       │   └── category-icon.component.scss
│   │       ├── star-rating/
│   │       │   ├── star-rating.component.ts
│   │       │   ├── star-rating.component.html
│   │       │   └── star-rating.component.scss
│   │       └── empty-state/
│   │           ├── empty-state.component.ts
│   │           ├── empty-state.component.html
│   │           └── empty-state.component.scss
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _typography.scss
│   │   ├── _mixins.scss
│   │   ├── _utilities.scss
│   │   ├── _reset.scss
│   │   └── global.scss
│   ├── index.html
│   └── main.ts
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

> **File naming convention:** `kebab-case.component.ext` — e.g. `recipe-card.component.html`
> 
> **Angular CLI generator:** `ng g c components/recipe-card` creates all 3 files automatically.

---

## 11. Page Specifications

### 11.1 Recipes Page (`/recipes`)

```
┌─────────────────────────────────────────────────────┐
│  🍽️  MealPlanner    [Recipes] [Plan(3)] [List]      │  ← AppHeader
├─────────────────────────────────────────────────────┤
│  🔍 Search recipes...  [All] [General] [Refuel][Snack] │  ← Search + filters
├─────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ RECIPE  │ │ RECIPE  │ │ RECIPE  │ │ RECIPE  │  │  ← RecipeCard grid
│  │  CARD   │ │  CARD   │ │  CARD   │ │  CARD   │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ RECIPE  │ │ ...     │ │         │ │         │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Search filters recipes by name (case-insensitive)
- Category pills toggle filter
- "Results: N recipes" count
- Responsive grid: 1 col (mobile) → 2 col (tablet) → 3 col (desktop) → 4 col (wide)
- Click card → RecipeDetail dialog overlay

### 11.2 Meal Plan Page (`/plan`)

```
┌──────────────────────────────────────────────────────────────┐
│  Your Weekly Meal Plan                        [Clear All]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┬────────────┬────────────┬──────...──────┐   │
│  │   Monday   │  Tuesday   │ Wednesday  │ ...            │   │
│  ├────────────┼────────────┼────────────┼────────────────┤   │
│  │ 🌅 Breaky  │ 🌅 Breaky  │ 🌅 Breaky  │                │   │
│  │ [+ Add]    │ [Pancakes] │ [+ Add]    │                │   │
│  │            │ Serves 2   │            │                │   │
│  ├────────────┼────────────┼────────────┤                │   │
│  │ 🌞 Lunch   │ 🌞 Lunch   │ 🌞 Lunch   │                │   │
│  │ [+ Add]    │ [+ Add]    │ [+ Add]    │                │   │
│  ├────────────┼────────────┼────────────┤                │   │
│  │ 🌙 Dinner  │ 🌙 Dinner  │ 🌙 Dinner  │                │   │
│  │ [Jalfrezi] │ [+ Add]    │ [+ Add]    │                │   │
│  │ Serves 4   │            │            │                │   │
│  ├────────────┼────────────┼────────────┤                │   │
│  │ 🍪 Snack   │ 🍪 Snack   │ 🍪 Snack   │                │   │
│  │ [Flapjack] │ [+ Add]    │ [+ Add]    │                │   │
│  │ Serves 6   │            │            │                │   │
│  └────────────┴────────────┴────────────┴────────────────┘   │
│                                                              │
│  📊 Summary: 7 meals · 28 total servings · 5 unique recipes  │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- 7-day grid with 4 meal slots each
- Empty slots show "+ Add Meal" button → opens AddMealDialog
- Filled slots show recipe name, servings, quick actions (edit servings, remove)
- Responsive: grid on desktop, vertical day cards on mobile
- Summary footer with stats
- "Clear All" confirmation

### 11.3 Shopping List Page (`/list`)

```
┌─────────────────────────────────────────────────────────────┐
│  Your Shopping List                                          │
│                                                              │
│  [📥 Download CSV]  [📥 Download JSON]                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑️ │ Item                  │ Amount │ Unit │ From    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ [ ]│ unsalted butter       │ 180    │ g    │ 2 recipes│   │
│  │ [ ]│ rolled oats           │ 380    │ g    │ 1 recipe │   │
│  │ [ ]│ large egg             │ 4      │ whole│ 2 recipes│   │
│  │ [ ]│ honey                 │ 35     │ g    │ 3 recipes│   │
│  │ [ ]│ salt and pepper       │ —      │ taste│ 2 recipes│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Generated: 7 May 2026                                      │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Auto-generated from meal plan (computed signal)
- Checkboxes to tick items off (not persisted)
- Expandable rows showing which recipes contributed
- Export buttons trigger browser downloads
- Sortable by item name (optional)
- "From" column shows recipe names (hover for details)

---

## 12. Key Behaviors & Edge Cases

| Scenario | Behavior |
|----------|----------|
| Recipe has no `rating` | Hide `StarRatingComponent` entirely |
| Recipe has no `cookTime` | Hide cook time badge |
| Recipe has `note` about batch size | Display as callout banner in `RecipeDetail` |
| Ingredient unit is `"whole"` scaled to 1.3 | `ceil()` → 2, show "rounded up" tooltip |
| User scales to 0.5 servings | Allow (0.5 egg), show warning chip |
| Two recipes use "butter" (g) vs "butter" (tbsp) | Keep separate in shopping list |
| localStorage is full/disabled | App works; just doesn't persist |
| Meal plan empty on `/list` | Show `EmptyStateComponent`: "Add meals to generate your list" |
| recipes.json fails to load | Show error state with retry button |
| Duplicate meal added to same slot | Allow it (user might want 2 batches) |

---

## 12.5. Deployment — Azure Static Web Apps (Free Plan)

Deployment target: **Azure Static Web Apps Free** with **GitHub Actions** for CI/CD on every push to `main`.

### Why Azure SWA Free?
- 100 GB bandwidth/month — way more than this app needs
- Free SSL + custom domain
- Built-in GitHub Actions integration (workflow auto-generated when you create the resource)
- Global CDN
- SPA routing fallback support

### Required Files

#### `staticwebapp.config.json` (project root)
Handles SPA fallback so deep links like `/recipes/5` work after a hard refresh:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/data/*", "/*.{css,js,ico,png,jpg,svg,json,woff2}"]
  },
  "mimeTypes": {
    ".json": "application/json"
  },
  "globalHeaders": {
    "cache-control": "public, max-age=3600"
  }
}
```

#### `.github/workflows/azure-static-web-apps.yml`
Triggered on push to `main` + PRs (preview environments):
```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches: [main]

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install & Build
        run: |
          npm ci
          npm run build -- --configuration=production

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: '/'
          output_location: 'dist/mealrecipieapp/browser'
          skip_app_build: true   # we built it ourselves above
```

### Setup Steps (one-time)

1. **Create Azure SWA resource** in Azure Portal → Static Web Apps → Create
   - Plan: **Free**
   - Source: GitHub → `mealrecipieapp` repo, `main` branch
   - Build presets: **Angular**
   - App location: `/`
   - Output location: `dist/mealrecipieapp/browser`
2. Azure auto-creates the workflow file in `.github/workflows/` and commits it (we'll customize it as above)
3. Azure auto-adds the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to GitHub repo secrets
4. First deploy happens automatically on next push

### Verifying `angular.json` build output path

Angular 17+ outputs to `dist/<app-name>/browser` by default. Confirm in `angular.json`:
```json
"outputPath": {
  "base": "dist/mealrecipieapp"
}
```
The deploy action targets `dist/mealrecipieapp/browser` which is the actual generated SPA bundle.

### PR Preview Environments (free with SWA)

Every PR gets a unique preview URL like `https://orange-rock-12345-preview.azurestaticapps.net` — useful for design reviews with Claude.

---

## 13. Accessibility Checklist

- [ ] All `<button>` elements have `type="button"` (or appropriate type)
- [ ] Icon buttons have `aria-label`
- [ ] Dialog uses `<dialog>` element with `showModal()` / `close()`
- [ ] Focus trap inside dialogs
- [ ] `aria-current="page"` on active nav tab
- [ ] Recipe cards are `<article>` with proper heading hierarchy
- [ ] Shopping list uses `<table>` with `<caption>`
- [ ] Color contrast ≥ 4.5:1 for all text
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Keyboard navigation: Tab through all controls, Enter/Space activate
- [ ] Servings control: arrow keys adjust when focused

---

## 14. Development Phases

### Phase 1 — Angular 21 Foundation (1-2 hrs)
- [ ] `ng new mealrecipieapp --style=scss --ssr=false --routing --skip-tests` (Angular 21 — standalone is default)
- [ ] Enable zoneless: add `provideZonelessChangeDetection()` in `app.config.ts`
- [ ] Add `withComponentInputBinding()` to `provideRouter()` for route-param signal inputs
- [ ] Set up SCSS variables, typography, base styles
- [ ] Create `recipes.json` in `public/data/` (16 recipes from source, with **Recipe 7 fixed** and **default `servings: 4`** filled in for missing entries — see Appendix A)
- [ ] Define all TypeScript interfaces in `src/app/models/`
- [ ] Create services: `RecipeService`, `StorageService`
- [ ] Add `staticwebapp.config.json` for SPA fallback
- [ ] Add `.github/workflows/azure-static-web-apps.yml`

> **Note:** Testing is intentionally skipped (`--skip-tests`) — this is a personal app. No `.spec.ts` files generated.

### Phase 2 — Recipe Browser (2-3 hrs)
- [ ] `CategoryBadgeComponent` + `CategoryIconComponent`
- [ ] `StarRatingComponent`
- [ ] `RecipeCardComponent` with responsive grid
- [ ] `RecipesPageComponent`: search + category filter (computed signal)
- [ ] `RecipeDetailComponent` as `<dialog>` overlay
- [ ] Wire router for `/recipes`

### Phase 3 — Servings Scaling (1 hr)
- [ ] `ServingsService` with unit-aware rounding
- [ ] `FormatService` for fraction display
- [ ] `ServingsControlComponent` (+/- stepper)
- [ ] `IngredientListComponent` with live scaling
- [ ] Integrate into `RecipeDetailComponent`

### Phase 4 — Meal Planner (2-3 hrs)
- [ ] `MealPlanService` with signals + localStorage
- [ ] `MealSlotComponent`
- [ ] `AddMealDialogComponent` (recipe picker, servings, day, meal type)
- [ ] `MealPlanPageComponent` — 7-day grid
- [ ] Wire `/plan` route

### Phase 5 — Shopping List (1-2 hrs)
- [ ] `ShoppingListService` aggregation logic
- [ ] `ExportService` CSV/JSON generation
- [ ] `ShoppingListTableComponent`
- [ ] `ShoppingListPageComponent`
- [ ] Wire `/list` route

### Phase 6 — Polish & Navigation (1-2 hrs)
- [ ] `AppHeaderComponent` with tab navigation + badge counts
- [ ] Empty states for all pages
- [ ] Mobile responsive layout
- [ ] Animations (card hover, dialog open, list transitions)
- [ ] Accessibility pass
- [ ] Build for production (`ng build`)

**Estimated total: ~10-15 hours**

---

## 15. Angular 21 Specific Patterns

### Signals in Components

```typescript
// Reactive local state with signals
export class RecipesPageComponent {
  searchQuery = signal('');
  selectedCategory = signal<RecipeCategory | 'all'>('all');
  selectedRecipeId = signal<number | null>(null);

  recipeService = inject(RecipeService);

  // Computed filtered list — automatically re-calculates when dependencies change
  filteredRecipes = computed(() => {
    const all = this.recipeService.recipes.value() ?? [];
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return all.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || recipe.category === category;
      return matchesSearch && matchesCategory;
    });
  });

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
```

### Effect for Side Effects

```typescript
export class MealPlanPageComponent {
  mealPlanService = inject(MealPlanService);

  constructor() {
    // Automatically update page title when meal count changes
    effect(() => {
      const count = this.mealPlanService.totalMeals();
      document.title = count > 0 
        ? `Meal Planner (${count} meals)` 
        : 'Meal Planner';
    });
  }
}
```

### Resource API for Async Data

```typescript
export class RecipeService {
  private http = inject(HttpClient);

  // Angular 21 resource() automatically handles loading/error states
  recipes = resource({
    loader: () => firstValueFrom(
      this.http.get<Recipe[]>('/assets/data/recipes.json')
    ),
  });

  isLoading = computed(() => this.recipes.isLoading());
  hasError = computed(() => !!this.recipes.error());
}
```

---

## 16. Future Enhancements (Not in scope)

- [ ] Recipe image upload / AI image generation
- [ ] Nutritional info per recipe + per meal plan
- [ ] Favorites/bookmarks with cross-session persistence
- [ ] Print-friendly CSS for recipes and shopping list
- [ ] Share meal plan via URL (serialize to query param)
- [ ] Recipe tags (dietary: GF, vegan, keto, etc.)
- [ ] Drag-and-drop meal reordering (Angular CDK DragDrop)
- [ ] Multiple meal plans (save/load named plans)
- [ ] AI shopping assistant prompt generator ("Buy me these ingredients...")

---

## Appendix A — Source Data Fixes

Before loading into the app, `recipes.json` is corrected as follows:

### A.1 Default Servings (set to `4` where missing)

These recipes in your source data have no `servings` field — defaulted to `4` based on ingredient quantities (which already look scaled for ~4 people):

| Recipe ID | Name | Default Servings |
|-----------|------|------------------|
| 5 | Chicken Jalfrezi with Poppadoms | **4** |
| 7 | Creamy Chicken Pie *(renamed — see A.2)* | **4** |
| 8 | Salmon Pappardelle with Asparagus | **4** |
| 9 | Ginger Chicken Udon | **4** |
| 11 | Simple One Pan Chicken Curry | **4** |
| 12 | Summer Chunky Couscous Salad with Chicken | **4** |
| 13 | BBQ Chicken Pizza | **4** |
| 14 | Chicken Mayo Sandwich | **4** |
| 15 | Beef Lasagne | **4** |
| 16 | Thai Coconut Chicken | **4** |

Users can change to any positive integer (1–50) via the `ServingsControl`.

### A.2 Recipe #7 Fix — "Creamy Chicken Curry with Coconut Rice"

**Problem:** The original `name` says *Creamy Chicken Curry with Coconut Rice*, but:
- `ingredients` are puff pastry, butter, onion, carrot, celery, thyme, chicken, flour, milk, mustard, vegetable stock, peas → **classic chicken pie**
- `method` is copy-pasted from a beef chilli recipe (mentions beef, tortilla crisps, chopped tomatoes, soured cream — **none of which are in the ingredients**)

**Fix:** Rename to **"Creamy Chicken Pie"** (matches ingredients) and rewrite the method to actually describe how to make a chicken pie.

**Corrected Recipe 7:**
```json
{
  "id": 7,
  "name": "Creamy Chicken Pie",
  "category": "General Meal",
  "rating": 4.7,
  "ratingCount": 80,
  "servings": 4,
  "ingredients": [
    { "item": "ready-rolled light puff pastry, cut into a circle", "amount": 140, "unit": "g" },
    { "item": "unsalted butter", "amount": 40, "unit": "g" },
    { "item": "onion, peeled and diced", "amount": 2, "unit": "whole" },
    { "item": "carrot, peeled and diced", "amount": 2, "unit": "whole" },
    { "item": "stick celery, diced", "amount": 2, "unit": "whole" },
    { "item": "fresh thyme leaves", "amount": 4, "unit": "small bunches" },
    { "item": "skinless chicken breast, cut into small chunks", "amount": 300, "unit": "g" },
    { "item": "plain flour", "amount": 40, "unit": "g" },
    { "item": "whole milk", "amount": 180, "unit": "ml" },
    { "item": "wholegrain mustard", "amount": 8, "unit": "tsp" },
    { "item": "vegetable stock", "amount": 300, "unit": "ml" },
    { "item": "peas", "amount": 120, "unit": "g" }
  ],
  "method": [
    { "step": 1, "instruction": "Preheat the oven to 200°C. Melt the butter in a large saucepan, add the onion, carrot, celery and thyme and cook gently for 8–10 minutes until softened." },
    { "step": 2, "instruction": "Increase the heat, add the chicken and fry for 4–5 minutes until lightly golden. Sprinkle over the flour and stir for a minute to coat everything." },
    { "step": 3, "instruction": "Gradually pour in the milk and stock, stirring continuously to avoid lumps. Stir in the mustard and bring to a gentle simmer for 8–10 minutes until thickened and the chicken is cooked through." },
    { "step": 4, "instruction": "Stir through the peas, season with salt and pepper, then tip the filling into a pie dish." },
    { "step": 5, "instruction": "Lay the puff pastry over the top, trim the edges, brush with a little milk and cut a small slit in the centre to let steam escape. Bake for 20–25 minutes until the pastry is golden and puffed." }
  ]
}
```

> If you actually wanted a coconut chicken curry recipe in slot #7, let me know and I'll write a proper one instead — but the existing ingredients only support a chicken pie.
