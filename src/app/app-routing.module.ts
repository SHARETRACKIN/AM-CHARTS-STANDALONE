import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetailGridInformationComponent } from './detail-grid-information/detail-grid-information.component';

const routes: Routes = [
  //{ path: 'detail-grid-information', component:DetailGridInformationComponent },  // you must add your component here
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
