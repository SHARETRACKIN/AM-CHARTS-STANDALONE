import { any } from '@amcharts/amcharts5/.internal/core/util/Array';
import { AfterViewInit, Component, Input, NgModule, OnInit } from '@angular/core';
//import { Router } from '@angular/router';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';
import { DxDataGridModule, DxDropDownBoxModule, DxFormModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextAreaModule, DxTextBoxModule } from 'devextreme-angular';
//import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-detail-grid-information',
  templateUrl: './detail-grid-information.component.html',
  styleUrls: ['./detail-grid-information.component.scss'],
})

//  @NgModule({
//    declarations: [
//      //DetailGridInformationComponent,
//    ],
//   imports: [
//     DxDataGridModule
//   ],
//   providers: [],
//   bootstrap: [DetailGridInformationComponent]
//  })

export class DetailGridInformationComponent implements OnInit, AfterViewInit {

  @Input() key: string = '';

  selectedShareCode: string = '';
  CKS_SharetDirectorDealingsDataSource: any;
  
  constructor() {}

  // open(content: any) {
  //   //throw new Error('Method not implemented.');
  // }

  ngAfterViewInit() {

    const CKS_SharetDirectorDealingsStore = new ODataStore({
      url: `https://localhost:5003/api/odata/CKS_SharetDirectorDealings`,
      key: 'ID',
      keyType: "long",
      version: 4,
      withCredentials: true,
      beforeSend: function (e: { headers: { Authorization: string; }; }) {
        e.headers = {
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImRkZjgzMjFhLTQyMDctNGJmMi05N2Q3LWNmZDAwYWYyYTJlNyIsIlhhZlNlY3VyaXR5QXV0aFBhc3NlZCI6IlhhZlNlY3VyaXR5QXV0aFBhc3NlZCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJBZG1pbiIsIlhhZlNlY3VyaXR5IjoiWGFmU2VjdXJpdHkiLCJYYWZMb2dvblBhcmFtcyI6InExWXFMVTR0OGt2TVRWV3lVa3BNeWMzTVU5SlJLa2dzTGk3UEwwb0JDam1DaEJRTmpZeE5USlZxQVE9PSIsImV4cCI6MTY5NzYyNDc5NywiaXNzIjoiU2hhcmV0cmFja2luIiwiYXVkIjoiaHR0cDovL2xvY2FsaG9zdDo0MjAwIn0.UhOAk9UdWE8MU_jvAf2J3sUz1s3gZrJ53ubb3zLpuOw"
        };
      },
      //onLoaded: (items) => this.setDefaultProduct(items)
      onLoaded: () => {
        // Event handling commands go here
        //this.selectedShareCode = this.key;
      }
    });

    this.CKS_SharetDirectorDealingsDataSource = new DataSource({
      store: CKS_SharetDirectorDealingsStore,
      select: [
        'ID, ShareCode, DirectorInitials, DirectorLastName, Price, TransactionDate, TransactionDescription, Volume, CompanyFullName'
      ],
      map: function (dataItem) {
        return {
          ID: dataItem.ID,
          ShareCode: dataItem.ShareCode,
          DirectorInitials: dataItem.DirectorInitials,
          DirectorLastName: dataItem.DirectorLastName,
          Price: dataItem.Price,
          TransactionDate: dataItem.TransactionDate,
          TransactionDescription: dataItem.TransactionDescription,
          Volume: dataItem.Volume,
          CompanyFullName: dataItem.CompanyFullName,
        };
      },
      sort: 'NotificationTypeName',
      filter: ['ShareCode', '=', this.selectedShareCode]
    });

  }

  ngOnInit(): void {


  }

}
