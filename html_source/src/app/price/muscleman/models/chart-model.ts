import { CSSObject } from "highcharts"

export class ChartModel
{
    success: boolean
    coin: string
    data: Array<ChartData> = new Array<ChartData>()
}

export class ChartData {
    date: number
    rate: number
}


export class Currency 
{
    codes: []
    currency: string
    data: Array<CurrencyData> = new Array<CurrencyData>()
    extra: []
    limit: number
    offset: number
    only: Array<string> = new Array<string>()
    order: string
    sort: string
    success: boolean
    total: number
}

export class CurrencyData
{
    code: string
    delta: PeriodData
    name: string
    price: number
}

export class PeriodData
{
    hour: number
    day: number
    week: number
    month: number
    quarter: number
    year: number
}

export class SelectValue {
    constructor(public displayName: string,
                public coinName: string,
                public dataSeriesName: string,
                public imageLocation: string){}
}

export class ChartConfiguration
{
    constructor(public points: number=24, 
                public days: number=7,
                public primaryPercentageLabelXPosition: number=200,
                public primaryPercentageLabelYPosition: number=20,
                public primaryPercentageLabelStyle: Object={fontSize: '16px', color: 'white', fontWeight:'800'},
                public primaryDecimalPlaces: number=5,
                public primaryPercentDecimalPlaces: number=2,
                public secondaryPercentageLabelXPosition: number=200,
                public secondaryPercentageLabelYPosition: number=40,
                public secondaryPercentageLabelStyle: Object={fontSize: '16px', color: 'white'},
                public secondaryPercentDecimalPlaces: number=2,
                public secondaryDecimalPlaces: number=8,
                public imageXPosition: number=100,
                public imageYPosition: number=12,
                public imageWidth: number=50,
                public imageHeight: number=50,
                public imageLocation: string='/assets/scripts/lcw-widget.js',
                public coinXPosition: number=160,
                public coinYPosition: number=10,
                public coin: string='EvoX',
                public coinStyle: Object={fontSize: '22px', color: 'white', fontWeight:'800'},
                public coinNameXPosition: number=160,
                public coinNameYPosition: number=33,
                public coinName: string='Evolution',
                public coinNameStyle: Object={fontSize: '18px', color: 'white'},
                public dataSeriesName: string='EVOX Price',
                public backgroundColor: string='',
                public xAxisStyle: CSSObject={color: 'white', fontSize: '14px', fontWeight: '800'},
                public xAxisText: string='Date',
                public yAxisStyle: CSSObject={color: 'white', fontSize: '14px', fontWeight: '800'},
                public yAxisText: string='Price',
                public colors: Array<string>=new Array<string>('blueviolet'),
                public refreshRateMs: number=60000)
            {}
}