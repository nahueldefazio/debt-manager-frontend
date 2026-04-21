import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Debt } from '../../models/debt.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/debts`;

  getDebts(): Promise<Debt[]> {
    return firstValueFrom(this.http.get<Debt[]>(this.apiUrl));
  }

  createDebt(debt: any): Promise<Debt[]> {
    return firstValueFrom(this.http.post<Debt[]>(this.apiUrl, debt));
  }

  getWhatsAppLink(debtId: number): Promise<{link: string}> {
    return firstValueFrom(this.http.get<{link: string}>(`${this.apiUrl}/${debtId}/whatsapp-link`));
  }

  updateDebt(id: number, debt: any): Promise<Debt> {
    return firstValueFrom(this.http.patch<Debt>(`${this.apiUrl}/${id}`, debt));
  }

  deleteDebt(id: number): Promise<Debt> {
    return firstValueFrom(this.http.delete<Debt>(`${this.apiUrl}/${id}`));
  }
}
