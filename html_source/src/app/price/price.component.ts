import { Component, ViewEncapsulation } from '@angular/core';
import { ChartConfiguration, SelectValue } from './muscleman/models/chart-model';

@Component({
  selector: 'app-root',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PriceComponent {
  title = 'widget';
  coins = [new SelectValue('ARQ', 'RandomArq', 'Arqma Price', '/assets/arqma-310x310.png')
         , new SelectValue('ETH', 'Ethereum', 'Ethereum Price', '/assets/ethereum.webp')
         , new SelectValue('EVOX', 'Evolution', 'Evox Price', '/assets/images/256x256.png')
         , new SelectValue('ZANO', 'Progpow', 'Zano Price', '/assets/zano.webp')]

  private _value: any
  set coin(value: any) {
    this._value = value
    this.chartConfiguration = new ChartConfiguration()
    this.chartConfiguration.coin = value.displayName
    this.chartConfiguration.coinName = value.coinName
    this.chartConfiguration.imageLocation = value.imageLocation
    this.chartConfiguration.dataSeriesName = value.dataSeriesName  
  }
  get coin(): any {
    return this._value
  }
  chartConfiguration: ChartConfiguration

  constructor() {
    this.coin = this.coins[0]
  }
}
