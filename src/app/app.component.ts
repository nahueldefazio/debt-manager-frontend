import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebtDashboardComponent } from './features/debts/debt-dashboard/debt-dashboard.component';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DebtDashboardComponent, LoginComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (authService.isLoggedIn()) {
      <app-debt-dashboard />
    } @else {
      <app-login />
    }
  `,
})
export class AppComponent {
  authService = inject(AuthService);
  title = 'frontend';
}
