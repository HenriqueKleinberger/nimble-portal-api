import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import axios from 'axios';

export interface CurrencyRatesResponse {
  date: string;
  base: string;
  rates: Record<string, string>;
}

@Injectable()
export class CurrencyService {
  private readonly API_URL = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${process.env.CURRENCYFREAKS_API_KEY}`;
  private readonly CACHE_KEY = 'currency_rates';
  private readonly CACHE_TTL = 86_400_000;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getRates(): Promise<Record<string, string>> {
    const cached = await this.cacheManager.get<Record<string, string>>(
      this.CACHE_KEY,
    );

    if (cached) return cached;

    const response = await axios.get(this.API_URL);
    const rates: Record<string, string> = response.data.rates;

    await this.cacheManager.set(this.CACHE_KEY, rates, this.CACHE_TTL);

    return rates;
  }

  async getRate(currency: string): Promise<number | undefined> {
    const rates = await this.getRates();
    return parseFloat(rates[currency]);
  }
}
