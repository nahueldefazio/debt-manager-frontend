import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/currency`;

  async getUsdRate(): Promise<number> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/usd`));
      return response.venta;
    } catch (e) {
      console.error('Error fetching USD rate from backend:', e);
      return 1400; // Fallback aproximado
    }
  }

  async getEurRate(): Promise<number> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/eur`));
      return response.venta;
    } catch (e) {
      console.error('Error fetching EUR rate from backend:', e);
      return 1500; // Fallback aproximado
    }
  }
}
