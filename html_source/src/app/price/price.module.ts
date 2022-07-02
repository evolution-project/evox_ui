import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'

import { PriceRoutingModule } from './price-routing.module';
import { PriceComponent } from './price.component';

import { ChartModule } from 'angular-highcharts';
import { MuscleWidgetModule } from './muscleman/muscle-widget.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    PriceComponent
  ],
  imports: [
    BrowserModule,
    PriceRoutingModule,
    ChartModule,
    HttpClientModule,
    MuscleWidgetModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [PriceComponent]
})
export class PriceModule { }
