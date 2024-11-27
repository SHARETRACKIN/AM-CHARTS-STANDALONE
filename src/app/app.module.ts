import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { FieldsetModule } from 'primeng/fieldset';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import {DropdownModule} from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
//import { DetailGridInformationComponent } from './detail-grid-information/detail-grid-information.component'

@NgModule({
  declarations: [
    AppComponent,
    //DetailGridInformationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    SidebarModule,
    ButtonModule,
    SkeletonModule,
    TableModule,
    TooltipModule,
    CardModule,
    ToastModule,
    TabViewModule,
    ScrollPanelModule,
    FieldsetModule,
    ReactiveFormsModule,
    InputTextModule,
    PanelModule,
    DropdownModule,
    ConfirmDialogModule 

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
