import { Component } from '@angular/core';
import { DebtDashboardComponent } from './features/debts/debt-dashboard/debt-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DebtDashboardComponent],
  template: `<app-debt-dashboard></app-debt-dashboard>`,
})
export class AppComponent {
  title = 'frontend';
}
