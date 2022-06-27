import { Component, ViewEncapsulation } from '@angular/core';
import { ChartConfiguration, SelectValue } from './muscleman/models/chart-model';
import { BackendService } from '../_helpers/services/backend.service';
import { VariablesService } from '../_helpers/services/variables.service';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class PriceComponent {
  title = 'widget';
  coins = new SelectValue('EvoX', 'Evolution', 'EvoX Price', '/assets/images/256x256.png')

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

  constructor(
    private backend: BackendService,
    public variablesService: VariablesService
  ) {
    this.coin = this.coins
  }
}
