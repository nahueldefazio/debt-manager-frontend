import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Debt } from '../../../models/debt.model';
import { DebtService } from '../../../core/services/debt.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-debt-dashboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './debt-dashboard.component.html',
  styleUrl: './debt-dashboard.component.css'
})
export class DebtDashboardComponent implements OnInit {
  private debtService = inject(DebtService);
  private currencyService = inject(CurrencyService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  logout() {
    this.authService.logout();
  }

  debts = signal<Debt[]>([]);
  usdRate = signal<number | null>(null);
  eurRate = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  selectedCurrency = signal<string>('ARS');
  currentMonthDate = signal<Date>(new Date());
  
  // Computed: Filtra por no pagadas Y que correspondan al mes actual
  activeDebts = computed(() => {
    const currentMonth = this.currentMonthDate().getMonth();
    const currentYear = this.currentMonthDate().getFullYear();
    return this.debts().filter(d => {
      if (d.isPaid) return false;
      if (!d.dueDate) return true; // Retrocompatibilidad
      const dDate = new Date(d.dueDate);
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    });
  });

  nextMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() + 1);
    this.currentMonthDate.set(d);
  }

  prevMonth() {
    const d = new Date(this.currentMonthDate());
    d.setMonth(d.getMonth() - 1);
    this.currentMonthDate.set(d);
  }
  
  // Computed: Reacciona automáticamente cuando activeDebts, tasas o moneda seleccionada cambian
  totalAmount = computed(() => {
    const targetCurrency = this.selectedCurrency();
    return this.activeDebts().reduce((total, debt) => {
      // 1. Convertir a ARS (moneda base)
      let amountInArs = debt.amount;
      if (debt.currency === 'USD') amountInArs = debt.amount * (this.usdRate() || 1);
      else if (debt.currency === 'EUR') amountInArs = debt.amount * (this.eurRate() || 1);

      // 2. Convertir de ARS a la moneda objetivo
      if (targetCurrency === 'USD') return total + (amountInArs / (this.usdRate() || 1));
      if (targetCurrency === 'EUR') return total + (amountInArs / (this.eurRate() || 1));
      return total + amountInArs;
    }, 0);
  });

  getConvertedAmount(amount: number, currency: string): number {
    if (currency === 'USD') return amount * (this.usdRate() || 1);
    if (currency === 'EUR') return amount * (this.eurRate() || 1);
    return amount;
  }

  // --- Estado del Formulario ---
  isSubmitting = signal(false);
  editingDebtId = signal<number | null>(null);
  newDebt = {
    description: '',
    amount: null as number | null,
    currency: 'USD',
    debtorPhone: '',
    totalInstallments: 1,
    dueDate: new Date().toISOString().split('T')[0]
  };

  async ngOnInit() {
    this.isLoading.set(true);
    await Promise.all([
      this.loadExchangeRates(),
      this.loadDebts()
    ]);
    this.isLoading.set(false);
  }

  async loadExchangeRates() {
    this.usdRate.set(await this.currencyService.getUsdRate());
    this.eurRate.set(await this.currencyService.getEurRate());
  }

  async loadDebts() {
    try {
      const data = await this.debtService.getDebts();
      this.debts.set(data);
    } catch (error) {
      console.error('Error cargando deudas:', error);
      // Fallback para testing de la UI
      this.debts.set([
        { id: 1, description: 'Desarrollo de Landing Page', amount: 350.00, currency: 'USD', debtorPhone: '+5491112345678', isPaid: false },
        { id: 2, description: 'Mantenimiento Mensual', amount: 80.50, currency: 'USD', debtorPhone: '+5491187654321', isPaid: false }
      ]);
    }
  }

  editDebt(debt: Debt) {
    this.editingDebtId.set(debt.id);
    this.newDebt = {
      description: debt.description,
      amount: debt.amount,
      currency: debt.currency,
      debtorPhone: debt.debtorPhone,
      totalInstallments: debt.totalInstallments || 1,
      dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingDebtId.set(null);
    this.newDebt = { 
      description: '', amount: null, currency: 'USD', debtorPhone: '',
      totalInstallments: 1, dueDate: new Date().toISOString().split('T')[0]
    };
  }

  debtToDelete = signal<number | null>(null);
  isDeleting = signal<boolean>(false);
  isGeneratingWa = signal<number | null>(null);

  deleteDebt(id: number) {
    this.debtToDelete.set(id);
  }

  cancelDelete() {
    this.debtToDelete.set(null);
  }

  async confirmDelete() {
    const id = this.debtToDelete();
    if (!id) return;
    
    this.isDeleting.set(true);
    try {
      await this.debtService.deleteDebt(id);
      this.debts.update(current => current.filter(d => d.id !== id));
      this.debtToDelete.set(null);
    } catch (error) {
      console.error('Error eliminando deuda:', error);
      alert('Hubo un error al eliminar la deuda.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  async saveDebt() {
    if (!this.newDebt.description || !this.newDebt.amount || !this.newDebt.debtorPhone) return;
    
    this.isSubmitting.set(true);
    try {
      if (this.editingDebtId()) {
        const updated = await this.debtService.updateDebt(this.editingDebtId()!, this.newDebt);
        this.debts.update(current => current.map(d => d.id === updated.id ? updated : d));
        this.cancelEdit();
      } else {
        const createdDebts = await this.debtService.createDebt(this.newDebt);
        if (Array.isArray(createdDebts)) {
          this.debts.update(currentDebts => [...createdDebts, ...currentDebts]);
        } else {
          this.debts.update(currentDebts => [createdDebts, ...currentDebts]);
        }
        this.cancelEdit(); // Reset form
      }
    } catch (error: any) {
      console.error('Error creando deuda:', error);
      if (error.status === 403) {
        alert('Límite del plan gratuito alcanzado (5 deudas activas). ¡Pásate a Pro!');
      } else {
        alert('Hubo un error al crear la deuda.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async sendWhatsAppReminder(debtId: number) {
    this.isGeneratingWa.set(debtId);
    try {
      const response = await this.debtService.getWhatsAppLink(debtId);
      window.open(response.link, '_blank');
    } catch (error) {
      console.error('Error generando enlace:', error);
      alert('Hubo un error al generar el enlace de WhatsApp.');
    } finally {
      this.isGeneratingWa.set(null);
    }
  }
}
