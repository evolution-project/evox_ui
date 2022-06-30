import { Component, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { ChartConfiguration, SelectValue } from './muscleman/models/chart-model';
import { VariablesService } from '../_helpers/services/variables.service';
import { DOCUMENT } from '@angular/common';
import { BackendService } from '../_helpers/services/backend.service';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class PriceComponent implements OnInit, OnDestroy {
  title = 'widget';
  coins = new SelectValue('EVOX', 'Evolution', 'EvoX Price', 'assets/images/256x256.png');
  textScript = null;

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
    public variablesService: VariablesService,
    private backend: BackendService,
    @Inject(DOCUMENT) private document: Document,
    private renderer2: Renderer2
  ) {
    this.coin = this.coins
  }
  
  ngOnInit(): void {
    this.textScript = this.renderer2.createElement('script');
    this.textScript.src = 'C:/Users/cosmos/Documents/GitHub/EvoX_ui/html_source/src/assets/scripts/lcw-widget.js';
    this.renderer2.appendChild(this.document.body, this.textScript);
  }
  ngOnDestroy(): void {
    this.renderer2.removeChild(this.document.body, this.textScript);
  }
}
