import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core'
import { Chart } from 'angular-highcharts'
import { SeriesOptionsType } from 'highcharts';
import { EMPTY, forkJoin, Subscription, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators'
import { ChartConfiguration } from '../models/chart-model';
import { MuscleWidgetService } from '../muscle-service/muscle-widget.service';


@Component({
  selector: 'muscle-widget',
  templateUrl: './muscle-widget.component.html',
  styleUrls: ['./muscle-widget.component.scss']
})
export class MuscleWidgetComponent implements OnInit, OnDestroy {

  group: any
  label1: any
  label1a: any
  label2: any
  label2a: any
  label3: any
  width1: number = 0
  width1a: number = 0
  width2: number = 0
  width2a: number = 0
  height3: number = 0
  bottomMargin: number = 85
  _chartConfig: ChartConfiguration
  subscription: Subscription = new Subscription()
 
  @Input() set chartConfig(chartConfig: ChartConfiguration) {
    this._chartConfig = chartConfig
    this.setupChart()
    this.renderChart()
  }

  @HostListener('window:redrawLabels', ['$event'])
  resizeWindow(event): void {
    this.width1 = (event.detail.containerWidth - this._chartConfig.primaryPercentageLabelXPosition)
    this.width1a = (event.detail.containerWidth - this._chartConfig.primaryPercentageLabelXPosition + 100)

    this.width2 = (event.detail.containerWidth - this._chartConfig.secondaryPercentageLabelXPosition)
    this.width2a = (event.detail.containerWidth - this._chartConfig.secondaryPercentageLabelXPosition + 100)

    this.height3 = (event.detail.containerHeight - this.bottomMargin)

    if (this.group) {
      if (this.label1)
        this.label1.attr('translateX', this.width1)
      if (this.label1a)
        this.label1a.attr('translateX', this.width1a)
      if (this.label2)
        this.label2.attr('translateX', this.width2)
      if (this.label2a)
        this.label2a.attr('translateX', this.width2a)
        if (this.label3)
        this.label3.attr('translateY', this.height3)
    }

  }

  chartsData: SeriesOptionsType[] = []
  chart: Chart

  constructor(private muscleWidgetService: MuscleWidgetService) {
  }

  ngOnDestroy(): void {
    if (this.subscription)
      this.subscription.unsubscribe()
  }
 
  ngOnInit() {  
  }

  setupChart()
  {
    if (this.chart) {
      this.chart.destroy()
      this.group = null
      this.label1 = null
      this.label1a = null
      this.label2 = null
      this.label2a = null
      this.label3 = null
    }
    this.chart = new Chart({
      chart: {
        backgroundColor: this._chartConfig.backgroundColor,
        type: 'line',
        events: {
          redraw: function(event: any) {
            //window.dispatchEvent(new CustomEvent('redrawLabels', {detail: {containerWidth: event.target.containerWidth, containerHeight: event.target.containerHeight}}))
          }
        }
      },
      accessibility: {
        enabled: false
      },
      title: {
        text: null
      },
      credits: {
        enabled: false
      },
      exporting: {
        enabled: false
      },
      series: this.chartsData,
      xAxis: {
        lineWidth: 0,
        gridLineWidth: 0,     
        type: 'datetime',
        ordinal: true,
        labels: {
          enabled: false,
          style: this._chartConfig.xAxisStyle
        },
        title: {
          text: this._chartConfig.xAxisText,
          style: this._chartConfig.xAxisStyle
        }
      },
      colors: this._chartConfig.colors,
      plotOptions: {
        series: {
          marker: {
            enabled: false
          }
        }
      },
      yAxis: {
        lineWidth: 0,
        floor: 0,
        labels: {
          enabled: false
        },
        title: {
          text: this._chartConfig.yAxisText,
          style: this._chartConfig.yAxisStyle
        }
      },
      navigator: {enabled: true}
    })
  }

  renderChart() {
    this.width1 = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition)
    this.width1a = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition + 100)
    this.width2 = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition)
    this.width2a = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition + 100)
    this.height3 = (window.innerHeight - this.bottomMargin)

    timer(0, this._chartConfig.refreshRateMs).pipe(
      switchMap(_ => forkJoin([
        this.muscleWidgetService.getCurrencyData(this._chartConfig.coin),
        this.muscleWidgetService.getChartData(this._chartConfig.days, this._chartConfig.points, this._chartConfig.coin)
      ])),
      catchError(_ => EMPTY))
      .subscribe(([currency, chartData]) => {
        const data = []
        for (const value of chartData.data) {
          data.push([value.date, value.rate])
        }

        this.chartsData = [
          {type: 'area', name: this._chartConfig.dataSeriesName, data}
        ]
        if (this.chart && this.chart.ref.series) {
          while (this.chart.ref.series.length > 0)
            this.chart.ref.series[0].remove(false)
        }
        
        this.chart.addSeries(this.chartsData[0], true, true)

        let price = currency.data[0].price
        let FV = data[data.length - 1][1]
        let IV = data[data.length - this._chartConfig.points][1]
        let priceChange = (FV - IV) / IV * 100
        let btc = currency.data[0].price / currency.data[1].price
        // FV = data[data.length - 1][1]
        // IV = data[data.length - this._chartConfig.points - 1][1]
        let btcChange = 0 //(FV - IV) / IV * 100

        let primaryPercentage = {fontSize: '16px', color: priceChange >=0 ? 'green' : 'red', fontWeight:'600'}
        let secondaryPercentage = {fontSize: '12px', color: btcChange >=0 ? 'green' : 'red'}

        if (!this.group) {
          this.group = this.chart.ref.renderer.g('customLabels')
          this.group.renderer.image(this._chartConfig.imageLocation, this._chartConfig.imageXPosition, this._chartConfig.imageYPosition, this._chartConfig.imageHeight, this._chartConfig.imageWidth).attr({zIndex: 90}).add()
          this.group.renderer.label(this._chartConfig.coin, this._chartConfig.coinXPosition, this._chartConfig.coinYPosition).css(this._chartConfig.coinStyle).attr({zIndex: 91}).add()
          this.group.renderer.label(this._chartConfig.coinName, this._chartConfig.coinNameXPosition, this._chartConfig.coinNameYPosition).css(this._chartConfig.coinNameStyle).attr({zIndex: 92}).add()
          
          this.label1 = this.group.renderer.label(`$ ${price.toFixed(this._chartConfig.primaryDecimalPlaces)}`, this.width1, this._chartConfig.primaryPercentageLabelYPosition).css(this._chartConfig.primaryPercentageLabelStyle).attr({zIndex: 93}).add()
          this.label1a = this.group.renderer.label(`${priceChange.toFixed(this._chartConfig.primaryPercentDecimalPlaces)}%`, this.width1a, this._chartConfig.primaryPercentageLabelYPosition).css(primaryPercentage).attr({zIndex: 94}).add()
          
          this.label2 = this.group.renderer.label(`BTC ${btc.toFixed(this._chartConfig.secondaryDecimalPlaces)}`, this.width2, this._chartConfig.secondaryPercentageLabelYPosition).css(this._chartConfig.secondaryPercentageLabelStyle).attr({zIndex: 95}).add()
          //this.label2a = this.group.renderer.label(`${btcChange.toFixed(this._chartConfig.secondaryPercentDecimalPlaces)}%`, this.width2a, this._chartConfig.secondaryPercentageLabelYPosition).css(secondaryPercentage).attr({zIndex: 96}).add()

          this.label3 = this.group.renderer.label(`This widget fetch data from Live Coin Watch [LCW]`, 50, this.height3).css({fontSize: '14px', color: 'white', fontWeight: '600'}).attr({zIndex: 97}).add()

        }
        else {
          this.label1.attr({text: `$ ${price.toFixed(this._chartConfig.primaryDecimalPlaces)}`})
          this.label1a.attr({text: `${priceChange.toFixed(this._chartConfig.primaryPercentDecimalPlaces)}%`})
          this.label2.attr({text: `BTC ${btc.toFixed(this._chartConfig.secondaryDecimalPlaces)}`})
          this.label2a.attr({text: `${btcChange.toFixed(this._chartConfig.secondaryPercentDecimalPlaces)}%`})
        }

      })
  }
}
