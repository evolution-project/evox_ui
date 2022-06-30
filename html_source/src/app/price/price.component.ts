import { Component, ViewEncapsulation } from '@angular/core';
import { ChartConfiguration, SelectValue } from './muscleman/models/chart-model';
import { VariablesService } from '../_helpers/services/variables.service';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class PriceComponent {
  title = 'widget';
  coins = new SelectValue('EvoX', 'Evolution', 'EvoX Price', 'assets/images/256x256.png')

  private _value: any
  set coin(value: any) {
    this._value = value
    this.chartConfiguration = new ChartConfiguration()
    this.chartConfiguration.coin = value.displayName
    this.chartConfiguration.coinName = value.coinName
    this.chartConfiguration.imageLocation = value.imageLocation
    this.chartConfiguration.dataSeriesName = value.dataSeriesName
    this.chartConfiguration.xAxisText = ''
  }
  get coin(): any {
    return this._value
  }
  chartConfiguration: ChartConfiguration

  constructor(
    public variablesService: VariablesService
  ) {
    this.coin = this.coins
  }
}
