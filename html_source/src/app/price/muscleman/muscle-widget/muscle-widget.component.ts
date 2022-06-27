import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core'
import { Chart } from 'angular-highcharts'
import { SeriesOptionsType } from 'highcharts';
import { combineLatest, EMPTY, forkJoin, of, Subscription, timer } from 'rxjs';
import { catchError, mergeMap, tap , switchMap, flatMap, map, concatMap, exhaustMap} from 'rxjs/operators'
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
  width1: number = 0
  width1a: number = 0
  width2: number = 0
  width2a: number = 0
  _chartConfig: ChartConfiguration
  subscription: Subscription = new Subscription()
 
  @Input() set chartConfig(chartConfig: ChartConfiguration) {
    this._chartConfig = chartConfig
    this.setupChart()
    this.renderChart()
  }

  @HostListener('window:resize', ['$event'])
  resizeWindow(): void {
    this.width1 = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition)
    this.width1a = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition + 100)
    this.width2 = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition)
    this.width2a = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition + 100)

    if (this.group) {
      this.label1.attr('translateX', this.width1)
      this.label1a.attr('translateX', this.width1 + 85)
      this.label2.attr('translateX', this.width2)
      this.label2a.attr('translateX', this.width2 + 85)
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
    }
    this.chart = new Chart({
      chart: {
        backgroundColor: this._chartConfig.backgroundColor,
        type: 'line',
        height: 600
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
      navigator: {enabled: true},
      responsive: {
        rules: [
            {
                condition: {
                    maxWidth: 575
                },
                chartOptions: {
                    chart: {
                        width: 575
                    },
                    rangeSelector: {
                        inputPosition: {
                            align: 'left'
                        }
                    }
                }
            }
        ]
      }
    })
  }

  renderChart() {
    this.width1 = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition)
    this.width1a = (window.innerWidth - this._chartConfig.primaryPercentageLabelXPosition + 100)
    this.width2 = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition)
    this.width2a = (window.innerWidth - this._chartConfig.secondaryPercentageLabelXPosition + 100)

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
          this.group.renderer.image(this._chartConfig.imageLocation, this._chartConfig.imageXPosition, this._chartConfig.imageYPosition, this._chartConfig.imageHeight, this._chartConfig.imageWidth).add()
          this.group.renderer.label(this._chartConfig.coin, this._chartConfig.coinXPosition, this._chartConfig.coinYPosition).css(this._chartConfig.coinStyle).add()
          this.group.renderer.label(this._chartConfig.coinName, this._chartConfig.coinNameXPosition, this._chartConfig.coinNameYPosition).css(this._chartConfig.coinNameStyle).add()
          this.label1 = this.group.renderer.label(`$ ${price.toFixed(this._chartConfig.primaryDecimalPlaces)}`, this.width1, this._chartConfig.primaryPercentageLabelYPosition).css(this._chartConfig.primaryPercentageLabelStyle).add()
          this.label1a = this.group.renderer.label(`${priceChange.toFixed(this._chartConfig.primaryPercentDecimalPlaces)}%`, this.width1a, this._chartConfig.primaryPercentageLabelYPosition).css(primaryPercentage).add()
          this.label2 = this.group.renderer.label(`B ${btc.toFixed(this._chartConfig.secondaryDecimalPlaces)}`, this.width2, this._chartConfig.secondaryPercentageLabelYPosition).css(this._chartConfig.secondaryPercentageLabelStyle).add()
          this.label2 = this.group.renderer.label(`${btcChange.toFixed(this._chartConfig.secondaryPercentDecimalPlaces)}%`, this.width2a, this._chartConfig.secondaryPercentageLabelYPosition).css(secondaryPercentage).add()
        }
        else {
          this.label1.attr({text: `$ ${price.toFixed(this._chartConfig.primaryDecimalPlaces)}  ${priceChange.toFixed(this._chartConfig.primaryPercentDecimalPlaces)}%`})
          this.label2.attr({text: `B ${btc.toFixed(this._chartConfig.secondaryDecimalPlaces)}    ${btcChange.toFixed(this._chartConfig.secondaryPercentDecimalPlaces)}%`})
        }

      })
  }
}
