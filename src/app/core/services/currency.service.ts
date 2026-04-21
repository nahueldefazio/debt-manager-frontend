import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);

  async getUsdRate(): Promise<number> {
    try {
      const response = await firstValueFrom(this.http.get<any>('https://dolarapi.com/v1/dolares/blue'));
      return response.venta;
    } catch (e) {
      console.error('Error fetching USD rate:', e);
      return 1400; // Fallback aproximado
    }
  }

  async getEurRate(): Promise<number> {
    try {
      const response = await firstValueFrom(this.http.get<any>('https://dolarapi.com/v1/cotizaciones/eur'));
      return response.venta;
    } catch (e) {
      console.error('Error fetching EUR rate:', e);
      return 1500; // Fallback aproximado
    }
  }
}
