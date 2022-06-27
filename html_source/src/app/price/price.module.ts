import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './price-routing.module';
import { PriceComponent } from './price.component';

import { ChartModule } from 'angular-highcharts';
import { MuscleWidgetModule } from './muscleman/muscle-widget.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select'
import { MatFormFieldModule } from '@angular/material'
import { MatInputModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    PriceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ChartModule,
    HttpClientModule,
    MuscleWidgetModule,
    BrowserAnimationsModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [PriceComponent]
})
export class AppModule { }
