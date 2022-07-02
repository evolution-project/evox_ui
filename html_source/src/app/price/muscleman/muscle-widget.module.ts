import { CommonModule } from "@angular/common"
import { NgModule } from "@angular/core"
import { MuscleWidgetService } from './muscle-service/muscle-widget.service'
import { MuscleWidgetComponent } from './muscle-widget/muscle-widget.component'
import { ChartModule } from 'angular-highcharts'

@NgModule({
    imports: [
        CommonModule,
        ChartModule
    ],
    declarations: [
        MuscleWidgetComponent
    ],
    exports: [
        MuscleWidgetComponent
    ],
    entryComponents: [
        MuscleWidgetComponent
    ],
    providers: [MuscleWidgetService]
})

export class MuscleWidgetModule {}