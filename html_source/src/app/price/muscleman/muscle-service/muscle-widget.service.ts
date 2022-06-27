import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { Observable, throwError } from 'rxjs';
import { ChartModel, Currency } from '../models/chart-model';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MuscleWidgetService {
  constructor(private httpClient: HttpClient) { }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  getChartData(days: number = 7, pointPerDay: number = 24, coin: string = 'EVOX'): Observable<ChartModel> {
    let now = new Date()
    let end = now.getTime()
    let start = new Date().setDate(now.getDate() - days)
    let points = pointPerDay * days
    return this.httpClient.get<ChartModel>(`https://http-api.livecoinwatch.com/widgets/coins/history/range?coin=${coin}&start=${start}&end=${end}&currency=USD&points=${points}`).pipe(catchError(this.handleError))
  }

  getCurrencyData(coin: string = 'EVOX'): Observable<Currency> {
    return this.httpClient.get<Currency>(`https://http-api.livecoinwatch.com/widgets/coins?only=${coin},BTC&currency=USD`).pipe(catchError(this.handleError))
  }
}
