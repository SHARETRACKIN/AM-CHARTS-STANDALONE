import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class WatchlistService {

  constructor() { }
  
  private watchlistTickers: any[] = [];

  ngOnInit() {
  }

  getWatchlist(): string[] {
    return this.watchlistTickers;
  }

  addToWatchlist(ticker: string) {
    this.watchlistTickers.push(ticker);
  }

  updateInternalWatchlist(workingWatchlist: any[]) {
    this.watchlistTickers = [];
    this.watchlistTickers = workingWatchlist;
  }

  removeFromWatchlistByShareCode(ticker: string) {
    const index = this.watchlistTickers.indexOf(ticker);
    if (index !== -1) {
      this.watchlistTickers.splice(index, 1);
    }
  }  

  removeFromWatchlistByIndex(index: number) {
    this.watchlistTickers.splice(index, 1);
  }  
}
