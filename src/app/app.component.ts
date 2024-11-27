import { Component, OnInit, OnDestroy, Renderer2, ElementRef, AfterViewInit, Directive, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHandler, HttpHeaders, HttpParams, HttpXhrBackend } from '@angular/common/http';
import { AuthenticationRequest } from './models/authentication-request';
import * as am5plugins_exporting from "@amcharts/amcharts5/plugins/exporting";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
//import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";
// import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
// import am5themes_Responsive from "@amcharts/amcharts5/themes/Animated";
import { environment } from './environment.prod';
import { DatePipe, formatDate } from '@angular/common';
import { LocalService } from './local.service';
import { ConfirmationService, MessageService } from 'primeng/api';
//import { Observable } from 'rxjs';
//import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { WatchlistService } from './watchlist.service';

interface Column {
  field: string;
  header: string;
}

interface Watchlist {
  ShareCode: string;
  label: string;
}

interface CompanyInformation {
  ShareCode: string;
  NatureOfBusiness: string;
  CompanyFullName: string;
  Email: string;
  Fax: string;
  Tel: string;
  Industry: string;
  Sector: string;
  SubSector: string;
  YearEnd: string;
  ShortName: string;
  PostalAddress: string;
  PostalCode: string;
  PostalRegion: string;
  PostalSuburb: string;
  PostalTown: string;
  ResidentialAddress: string;
  ResidentialCode: string;
  ResidentialRegion: string;
  ResidentialSuburb: string;
  ResidentialTown: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService, ConfirmationService]
})

export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input('detail-grid-information') inData: any;

  // fg!: FormGroup;
  // fgWatchlist!: FormGroup;

  isSkeletonLoading: boolean = true;
  isSkeletonLoadingWL: boolean = true;
  hasMarketNews: boolean = false;
  hasCompanyInformation: boolean = false;
  hasDirectorsDealings: boolean = false;
  hasDevidendsHistory: boolean = false;
  hasFinantialResults: boolean = false;

  // Watchlist 1 HTML Properties
  hasSelectedWatchlist1Items: boolean = true;
  selectedWatchlist1Items: Watchlist[] = [];

  // Watchlist 2 HTML Properties
  hasSelectedWatchlist2Items: boolean = true;
  selectedWatchlist2Items: Watchlist[] = [];

  // Watchlist 3 HTML Properties
  hasSelectedWatchlist3Items: boolean = true;
  selectedWatchlist3Items: Watchlist[] = [];

  // Watchlist 4 HTML Properties
  hasSelectedWatchlist4Items: boolean = true;
  selectedWatchlist4Items: Watchlist[] = [];

  // Watchlist 45HTML Properties
  hasSelectedWatchlist5Items: boolean = true;
  selectedWatchlist5Items: Watchlist[] = [];


  FinancialYear1: number = 0; // Declare the year1 property
  FinancialYear2: number = 0; // Declare the year2 property
  FinancialYear3: number = 0; // Declare the year3 property

  public sidebarOpen = false;
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  public isLightTheme = false;
  version = am5.registry.version;
  isModalOpen: { [key: string]: boolean } = {};

  private mainHttpClient: HttpClient;

  public arrayResponse: any[] = [];
  public equitiesTickers: any[] = [];
  public indicesTickers: any[] = [];
  public etfTickers: any[] = [];
  public satrixTickers: any[] = [];
  public commoditiesTickers: any[] = [];
  //public unitTrustsTickers: any[] = [];
  public winningSharesTickers: any[] = [];
  public allIndicatorsList: any[] = [];
  public setToken: string = '';
  public lastTradeArrayResponse: any[] = [];

  public watchlistTickers: any[] = []; // This is now the Main Holding Array for All Watchlists
  public myWatchlist1Tickers: any[] = [];
  public myWatchlist2Tickers: any[] = [];
  public myWatchlist3Tickers: any[] = [];
  public myWatchlist4Tickers: any[] = [];
  public myWatchlist5Tickers: any[] = [];
  public checkWatchlist: any[] = [];
  //public watchlistMenu: { id: string; label: string; subLabel: string; className: string }[] = [];

  public defaultTicker: string = 'J203'
  public defaultTickerName: string = '(J203) FTSE/JSE All Share';

  public selectedperiod: am5stock.IPeriod = { timeUnit: "month", count: 12, name: "1Y" } // Default is 1 Year

  DirectorsDealingsArrayResponse!: any[];
  DividendsHistoryArrayResponse!: any[];
  MarketNewsArrayResponse!: any[];
  CompanyFinancialResultsArrayResponse!: any[];
  CompanyInformationArrayResponse!: any[];

  DirectorDealingsColumns!: Column[];
  DividendsHistoryColumns!: Column[];
  MarketNewsColumns!: Column[];

  CompanyFinancialResultsColumns!: Column[];
  setSeriesTypeCount: Number = 0;
  myZoomType: number = 0.5;

  selectedShareCode: string = 'J203';

  userObject: AuthenticationRequest = {
    UserName: "Encompass Admin",
    Password: "3ykw0AlS!5"
  }

  // constructor(httpClient: HttpClient, private el: ElementRef, private messageService: MessageService, private cdr: ChangeDetectorRef, private fb: FormBuilder, private fbWatchlist: FormBuilder, private watchlistService: WatchlistService)
  constructor(httpClient: HttpClient, private el: ElementRef, private messageService: MessageService, private confirmationService: ConfirmationService, private cdr: ChangeDetectorRef, private watchlistService: WatchlistService)
  {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      this.isLightTheme = savedTheme === 'light';
      document.body.setAttribute('data-theme', savedTheme);
    }
    this.mainHttpClient = httpClient;
  }

  startLoading() {
    this.isSkeletonLoading = true;
    // Simulate a 5-second loading delay
    setTimeout(() => {
      this.isSkeletonLoading = false;
      this.cdr.detectChanges(); // Trigger change detection manually
    }, 2000);
  }

  startLoadingWL() {
    this.isSkeletonLoadingWL = true;
    // Simulate a 5-second loading delay
    setTimeout(() => {
      this.isSkeletonLoadingWL = false;
      this.cdr.detectChanges(); // Trigger change detection manually
    }, 500);
  }

  // Used for Holding the Global List of Shares for All Watchlists in the Model
  allWatchlistTickers: Watchlist[] = [
    {
      ShareCode: '',
      label: ''
    }
  ];

  // Watchlist 1 Structure
  enteredWatchlist1Name: string = 'Watchlist 1';
  selectedWatchlist1Item: Watchlist | undefined;
  
  // Watchlist 2 Structure
  enteredWatchlist2Name: string = 'Watchlist 2';
  selectedWatchlist2Item: Watchlist | undefined;
  
  // Watchlist 3 Structure
  enteredWatchlist3Name: string = 'Watchlist 3';
  selectedWatchlist3Item: Watchlist | undefined;
  
  // Watchlist 4 Structure
  enteredWatchlist4Name: string = 'Watchlist 4';
  selectedWatchlist4Item: Watchlist | undefined;
  
  // Watchlist 5 Structure
  enteredWatchlist5Name: string = 'Watchlist 5';
  selectedWatchlist5Item: Watchlist | undefined;

  companyInformation: CompanyInformation[] = [
    {
      ShareCode: '',
      NatureOfBusiness: '',
      CompanyFullName: '',
      Email: '',
      Fax: '',
      Tel: '',
      Industry: '',
      Sector: '',
      SubSector: '',
      YearEnd: '',
      ShortName: '',
      PostalAddress: '',
      PostalCode: '',
      PostalRegion: '',
      PostalSuburb: '',
      PostalTown: '',
      ResidentialAddress: '',
      ResidentialCode: '',
      ResidentialRegion: '',
      ResidentialSuburb: '',
      ResidentialTown: '',
    }
  ];

  // get ShareCodeField(): FormControl {
  //   return this.fg.get('dbValueShareCode') as FormControl;
  // }

  // get LongNameField(): FormControl {
  //   return this.fg.get('label') as FormControl;
  // }
    
  //key: string = '';

  // gotoDetailGridInformation(){
  //   this.router.navigate(['/detail-grid-information']);  // define your component where you want to go
  // }

  ngOnDestroy(): void {

    // Dispose previously created Root element
    maybeDisposeRoot('chartdiv');
    
  }


  ngOnInit(): void {

    // this.initForm();

    localStorage.removeItem("am5-stock-https://charts.sharetrackin.com/-chartdiv-autosave");

    // Do this to make sure the user has No Unit Trust Backup Data Stored
    let unitTrustsTickersEncrypted = localStorage.getItem("unitTrustsTickers_Backup") || ""
    if (unitTrustsTickersEncrypted.length > 0) {
      localStorage.removeItem("unitTrustsTickers_Backup");
    }

    // Load Any Saved Drawings
    this.setDrawingsOn("false");

    setComparisonAdded('0');

    am5.addLicense("AM5S418949442");
    // console.log(am5.registry.version)


    let getDefaultLastSavedShareName = localStorage.getItem("myLastShareName") || "";
    if (getDefaultLastSavedShareName.length == 0) {
      // Save the Selected Share Name
      localStorage.setItem("myLastShareName", encrypt(this.defaultTickerName.toString(), "myLastShareName"));
    }

    let getDefaultLastSavedShareCode = localStorage.getItem("myLastShare") || "";
    if (getDefaultLastSavedShareCode.length == 0) {
      // Save the Selected Share Code
      localStorage.setItem("myLastShare", encrypt(this.defaultTicker.toString(), "myLastShare"));
    }

    // Get the User Saved Period for the periodSelector - Default is YTD
    // var userSelectedPeriod = localStorage.getItem("periodSelector");
    // if (userSelectedPeriod == "month1") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 1, name: "1M" };
    // } else 
    // if (userSelectedPeriod == "month3") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 3, name: "3M" };
    // } else
    // if (userSelectedPeriod == "month6") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 6, name: "6M" };
    // } else
    // if (userSelectedPeriod == "ytd") {
    //   this.setUserSelectedPeriod = { timeUnit: "ytd", name: "YTD" };
    // } else
    // if (userSelectedPeriod == "month12") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 12, name: "1Y" };
    // } else
    // if (userSelectedPeriod == "month24") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 24, name: "2Y" };
    // } else
    // if (userSelectedPeriod == "month60") {
    //   this.setUserSelectedPeriod = { timeUnit: "month", count: 60, name: "5Y" };
    // } else
    // if (userSelectedPeriod == "max") {
    //   this.setUserSelectedPeriod = { timeUnit: "max", name: "Max" };
    // }

    // Dispose previously created Root element if there is one already deined/created
    maybeDisposeRoot('chartdiv');
    
    // Create root element
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/getting-started/#Root_element
    let root = am5.Root.new("chartdiv");

    root.fps = 30; // Frames Per Second

    const myTheme = am5.Theme.new(root);

    myTheme.rule("Label").setAll({
      fill: am5.color(0x71848d),
      fontSize: "1em"
    });


    myTheme.rule("StockPanel").setAll({
      wheelStep:0.05
    });

    //CHANGES 7 nOV
    myTheme.rule("Candlestick").setAll({
      width:am5.percent(68),
      strokeWidth: 0.8,
      fillOpacity:0.7,
    })

    myTheme.rule("StockChart").setAll({

      stockPositiveColor:am5.color(0x188000),
    
      stockNegativeColor:am5.color(0xce0000)

    });
     //CHANGES 7nOV

    
    myTheme.rule("PanelControls").setAll({
      x: 0, 
      centerX: 0,
      y:am5.percent(100),
      centerY:am5.percent(90)
    })

    //CHANGES 7nOV
    myTheme.rule("XYChart", ["stock"]).setAll({

      paddingTop: 0
    
    })
    

    myTheme.rule("Rectangle", ["panelresizer"]).setAll({  //George - 06 Nov 2023
      height: 5
    });
    //CHANGES 7nOV
    
    
    myTheme.rule("Graphics", ["series", "parallelchannel", "fill", "drawing"]).setAll({
      forceInactive:true
    });


    myTheme.rule("RoundedRectangle", ["legend", "itemcontainer", "background", "stocklegend"]).setAll({
      forceHidden: true
    })
    

    if (localStorage.getItem("selectedTheme") === "dark") {

      myTheme.rule("Rectangle", ["xy", "indicator", "background"]).setAll({
        stroke:am5.color(0xffffff),
        strokeOpacity:.5
      });

      myTheme.rule("Label").setAll({
        fill: am5.color(0xe9e9e9),
        fontSize: "1em"
      });

      myTheme.rule("InterfaceColors").setAll({
        background: am5.color("rgba(0, 0, 0, 0)"),
       // Transparent background
        // background: am5.color(0xffffff), // Transparent background

        // fill: am5.color("rgba(236, 236, 236, 0)"), // Transparent background
        // grid: am5.color(0x0a0a0a),
        // alternativeBackground: am5.color(0x0a0a0a),
        // text: am5.color(0xffffff),
        secondaryButtonText: am5.color(0xffffff)
        // fill: am5.color(0x0a0a0a),
      });
    
    } else {

      myTheme.rule("Rectangle", ["xy", "indicator", "background"]).setAll({
        stroke:am5.color(0x000000),
        strokeOpacity:.5
      });

      myTheme.rule("Label").setAll({
        fill: am5.color(0x00000),
        fontSize: "1em"
      });

      myTheme.rule("InterfaceColors").setAll({
        background: am5.color(0xffffff), // Transparent background
        // fill: am5.color("rgba(236, 236, 236, 0)"), // Transparent background
        // grid: am5.color(0x0a0a0a),
        // alternativeBackground: am5.color(0x0a0a0a),
        stroke: am5.color(0xffffff),
        secondaryButtonText: am5.color(0x000000),
        // fill: am5.color(0x0a0a0a),
      });
        
    }


    root.setThemes([
      //am5themes_Responsive.new(root),
      //am5themes_Frozen.new(root)
      // am5themes_Animated.new(root),
      //STATheme.new(root),
      FibonacciTheme.new(root),
      myTheme
    ]);


    // Create a stock chart
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
    let stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {
        paddingRight: 45,
        paddingBottom: 5,
        // background: am5.Graphics.new(root, {
        //   fill: getUserSelectedThemeColour()
        // })
      })
    );


    // Set global number format
    // -------------------------------------------------------------------------------
    // https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
    root.numberFormatter.set("numberFormat", "#,###.00");


    const headers = new HttpHeaders({
      'Content-Type': 'application/json;odata.metadata=minimal;odata.streaming=true',
      'mode': 'cors',
      'rejectUnauthorized': 'false',
      'credentials': 'include'
    });


    // // Create a loading indicator
    // var indicator = root.container.children.push(am5.Container.new(root, {
    //   width: am5.p100,
    //   height: am5.p100,
    //   layer: 1000,
    //   background: am5.Rectangle.new(root, {
    //     fill: am5.color(0xffffff),
    //     fillOpacity: 0.7
    //   })
    // }));

    // var hourglass = indicator.children.push(am5.Graphics.new(root, {
    //   width: 32,
    //   height: 32,
    //   fill: am5.color(0x000000),
    //   x: am5.p50,
    //   y: am5.p50,
    //   centerX: am5.p50,
    //   centerY: am5.p50,
    //   dy: -45,
    //   svgPath: "M12 5v10l9 9-9 9v10h24V33l-9-9 9-9V5H12zm20 29v5H16v-5l8-8 8 8zm-8-12-8-8V9h16v5l-8 8z"
    // }));

    // var hourglassanimation = hourglass.animate({
    //   key: "rotation",
    //   to: 180,
    //   loops: Infinity,
    //   duration: 2000,
    //   easing: am5.ease.inOut(am5.ease.cubic)
    // });

    // indicator.children.push(am5.Label.new(root, {
    //   text: "Loading...",
    //   fontSize: 25,
    //   x: am5.p50,
    //   y: am5.p50,
    //   centerX: am5.p50,
    //   centerY: am5.p50
    // }));


    let endpoint = `${environment.apiUrl}/api/Authentication/Authenticate`;
    this.mainHttpClient.post(endpoint, JSON.stringify(this.userObject), { headers })
    .subscribe(
      (response: any) => {
        // Check if the response contains the 'serialnumber' property with value -2
        if (response.serialnumber === -2) {
          return;

        } else {

          this.setToken = response.token

          let headers = new HttpHeaders()
          headers = headers.append('content-type','application/json');
          headers = headers.append('mode', 'cors');
          headers = headers.append('credentials', 'include');
          headers = headers.append('rejectUnauthorized', 'false');
          headers = headers.append('Authorization', 'Bearer ' + this.setToken);

          // Change the Display Name for the Equities, Indices and Winning Shares Lists
          const modifyEquitiesListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ShareCode === targetId) {
                    obj.CompanyName = newProperty;
                }
            });
          };

          const modifyIndicesListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ShareCode === targetId) {
                    obj.Name = newProperty;
                }
            });
          };

          const modifyETFListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ShareCode === targetId) {
                    obj.LongName = newProperty;
                }
            });
          };

          const modifySatrixListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ShareCode === targetId) {
                    obj.LongName = newProperty;
                }
            });
          };

          const modifyCommoditiesListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ResourceCode === targetId) {
                    obj.Name = newProperty;
                }
            });
          };

          // const modifyUnitTrustsListProperty = (arr: any[], targetId: any, newProperty: string) => {
          //   arr.forEach(obj => {
          //       if (obj.Code === targetId) {
          //           obj.Name = newProperty;
          //       }
          //   });
          // };

          
          const modifyWinningSharesListProperty = (arr: any[], targetId: any, newProperty: string) => {
            arr.forEach(obj => {
                if (obj.ShareCode === targetId) {
                    obj.LongName = newProperty;
                }
            });
          };

          // *** LOAD SHARE NAMES - EQUITIES ***
          if (this.equitiesTickers === undefined || this.equitiesTickers.length === 0) {
            let tickersArrayResponse: any[] = [];
            let tickersStringResponse: string = "";

            // %24orderby=Date&
            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquities?%24select=ShareCode%2CShareCodeID%2CCompanyName`;
            const httpClient = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClient.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                  if (tickersArrayResponse.length > 0) {

                    // // Add the ShareCode as an Additional Property to the JSON Array
                    // for (const obj of tickersArrayResponse) {
                    //   obj.form = "radio" // or "checkbox"
                    //   obj.checked = false;
                    //   obj.value = "1";
                    // }

                    for (const obj of tickersArrayResponse) {
                      modifyEquitiesListProperty(tickersArrayResponse, obj.ShareCode, '(' + obj.ShareCode + ') ' + obj.CompanyName)
                    }

                    tickersStringResponse = JSON.stringify(tickersArrayResponse);
                    tickersStringResponse = tickersStringResponse.replace(new RegExp('CompanyName', 'g'), 'label')
                    tickersStringResponse = tickersStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                    //tickersStringResponse = tickersStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                    tickersArrayResponse = JSON.parse(tickersStringResponse)

                    this.equitiesTickers = tickersArrayResponse;
                    this.equitiesTickers.forEach( (item) => {
                      this.allIndicatorsList.push(item);
                    });

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.equitiesTickers;

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // Load All Share Names into it's Series Control
                    equitiesMainSeriesControl.set('items', this.equitiesTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("equitiesTickers_Backup", encrypt(JSON.stringify(this.equitiesTickers), "equitiesTickers_Backup"));

                  } else {
                    this.equitiesTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // *** LOAD SHARE NAMES - INDICES ***
          if (this.indicesTickers === undefined || this.indicesTickers.length === 0) {
            let tickersIndicesArrayResponse: any[] = [];
            let tickersIndicesStringResponse: string = "";

            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetIndices?%24select=ShareCode%2CShareCodeID%2CName&%24apply=groupby((ShareCode%2CShareCodeID%2CName))`;
            const httpClientIndices = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClientIndices.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersIndicesArrayResponse = JSON.parse(JSON.stringify(response))
                  if (tickersIndicesArrayResponse.length > 0) {

                    for (const obj of tickersIndicesArrayResponse) {
                      modifyIndicesListProperty(tickersIndicesArrayResponse, obj.ShareCode, '(' + obj.ShareCode + ') ' + obj.Name)
                    }

                    tickersIndicesStringResponse = JSON.stringify(tickersIndicesArrayResponse);
                    tickersIndicesStringResponse = tickersIndicesStringResponse.replace(new RegExp('Name', 'g'), 'label')
                    tickersIndicesStringResponse = tickersIndicesStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                    //tickersIndicesStringResponse = tickersIndicesStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                    tickersIndicesArrayResponse = JSON.parse(tickersIndicesStringResponse)

                    this.indicesTickers = tickersIndicesArrayResponse;
                    this.indicesTickers.forEach( (item) => {
                      this.allIndicatorsList.push(item);
                    });

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.indicesTickers;

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // Load All Share Names into it's Series Control
                    indicesMainSeriesControl.set('items', this.indicesTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("indicesTickers_Backup", encrypt(JSON.stringify(this.indicesTickers), "indicesTickers_Backup"));

                  } else {
                    this.indicesTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // *** LOAD SHARE NAMES - Exchange Traded Funds (ETF) ***
          if (this.etfTickers === undefined || this.etfTickers.length === 0) {
            let tickersETFArrayResponse: any[] = [];
            let tickersETFStringResponse: string = "";

            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetETFHistory?%24select=ShareCode%2CShareCodeID%2CLongName&%24apply=groupby((ShareCode%2CShareCodeID%2CLongName))`;
            const httpClientETF = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClientETF.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersETFArrayResponse = JSON.parse(JSON.stringify(response))
                  if (tickersETFArrayResponse.length > 0) {

                    for (const obj of tickersETFArrayResponse) {
                      modifyETFListProperty(tickersETFArrayResponse, obj.ShareCode, '(' + obj.ShareCode + ') ' + obj.LongName)
                    }

                    tickersETFStringResponse = JSON.stringify(tickersETFArrayResponse);
                    tickersETFStringResponse = tickersETFStringResponse.replace(new RegExp('LongName', 'g'), 'label')
                    tickersETFStringResponse = tickersETFStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                    //tickersETFStringResponse = tickersETFStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                    tickersETFArrayResponse = JSON.parse(tickersETFStringResponse)

                    this.etfTickers = tickersETFArrayResponse;
                    this.etfTickers.forEach( (item) => {
                      this.allIndicatorsList.push(item);
                    });

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.allIndicatorsList;

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // Load All Share Names into it's Series Control
                    ETFMainSeriesControl.set('items', this.etfTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("etfTickers_Backup", encrypt(JSON.stringify(this.etfTickers), "etfTickers_Backup"));

                  } else {
                    this.etfTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // *** LOAD SHARE NAMES - SATRIX ***
          if (this.satrixTickers === undefined || this.satrixTickers.length === 0) {
            let tickersSatrixArrayResponse: any[] = [];
            let tickersSatrixStringResponse: string = "";

            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetSatrix?%24select=ShareCode%2CShareCodeID%2CLongName&%24apply=groupby((ShareCode%2CShareCodeID%2CLongName))`;
            const httpClientSatrix = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClientSatrix.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersSatrixArrayResponse = JSON.parse(JSON.stringify(response))
                  if (tickersSatrixArrayResponse.length > 0) {

                    for (const obj of tickersSatrixArrayResponse) {
                      modifySatrixListProperty(tickersSatrixArrayResponse, obj.ShareCode, '(' + obj.ShareCode + ') ' + obj.LongName)
                    }

                    tickersSatrixStringResponse = JSON.stringify(tickersSatrixArrayResponse);
                    tickersSatrixStringResponse = tickersSatrixStringResponse.replace(new RegExp('LongName', 'g'), 'label')
                    tickersSatrixStringResponse = tickersSatrixStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                    //tickersSatrixStringResponse = tickersSatrixStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                    tickersSatrixArrayResponse = JSON.parse(tickersSatrixStringResponse)

                    this.satrixTickers = tickersSatrixArrayResponse;
                    this.satrixTickers.forEach( (item) => {
                      this.allIndicatorsList.push(item);
                    });

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.allIndicatorsList;

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // Load All Share Names into it's Series Control
                    satrixMainSeriesControl.set('items', this.satrixTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("satrixTickers_Backup", encrypt(JSON.stringify(this.satrixTickers), "satrixTickers_Backup"));

                  } else {
                    this.satrixTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // *** LOAD SHARE NAMES - COMMODITIES ***
          if (this.commoditiesTickers === undefined || this.commoditiesTickers.length === 0) {
            let tickersCommoditiesArrayResponse: any[] = [];
            let tickersCommoditiesStringResponse: string = "";

            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetResourcesDelayed?%24select=ResourceCode%2CResourceCodeID%2CName&%24apply=groupby((ResourceCode%2CResourceCodeID%2CName))`;
            const httpClientCommodities = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClientCommodities.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersCommoditiesArrayResponse = JSON.parse(JSON.stringify(response))
                  if (tickersCommoditiesArrayResponse.length > 0) {

                    for (const obj of tickersCommoditiesArrayResponse) {
                      modifyCommoditiesListProperty(tickersCommoditiesArrayResponse, obj.ResourceCode, '(' + obj.ResourceCode + ') ' + obj.Name)
                    }

                    tickersCommoditiesStringResponse = JSON.stringify(tickersCommoditiesArrayResponse);
                    tickersCommoditiesStringResponse = tickersCommoditiesStringResponse.replace(new RegExp('Name', 'g'), 'label')
                    tickersCommoditiesStringResponse = tickersCommoditiesStringResponse.replace(new RegExp('ResourceCodeID', 'g'), 'id')
                    //tickersCommoditiesStringResponse = tickersCommoditiesStringResponse.replace(new RegExp('ResourceCode', 'g'), 'subLabel')
                    tickersCommoditiesArrayResponse = JSON.parse(tickersCommoditiesStringResponse)

                    this.commoditiesTickers = tickersCommoditiesArrayResponse;
                    this.commoditiesTickers.forEach( (item) => {
                      this.allIndicatorsList.push(item);
                    });

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.allIndicatorsList;

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // Load All Share Names into it's Series Control
                    commoditiesMainSeriesControl.set('items', this.commoditiesTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("commoditiesTickers_Backup", encrypt(JSON.stringify(this.commoditiesTickers), "commoditiesTickers_Backup"));

                  } else {
                    this.commoditiesTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // // *** LOAD SHARE NAMES - UNIT TRUSTS ***
          // if (this.unitTrustsTickers === undefined || this.unitTrustsTickers.length === 0) {
          //   let tickersUnitTrustsArrayResponse: any[] = [];
          //   let tickersUnitTrustsStringResponse: string = "";

          //   let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetUnitTrusts?%24select=Code%2CCodeID%2CFullName&%24apply=groupby((Code%2CCodeID%2CFullName))`;
          //   const httpClientUnitTrusts = new HttpClient(new HttpXhrBackend({
          //     build: () => new XMLHttpRequest()
          //   }));
          //   httpClientUnitTrusts.get<any>(endpoint, { headers })
          //     .subscribe(
          //       (response: { [x: string]: any; }) => {
          //         tickersUnitTrustsArrayResponse = JSON.parse(JSON.stringify(response))
          //         if (tickersUnitTrustsArrayResponse.length > 0) {

          //           for (const obj of tickersUnitTrustsArrayResponse) {
          //             modifyUnitTrustsListProperty(tickersUnitTrustsArrayResponse, obj.ResourceCode, '(' + obj.ResourceCode + ') ' + obj.Name)
          //           }

          //           tickersUnitTrustsStringResponse = JSON.stringify(tickersUnitTrustsArrayResponse);
          //           tickersUnitTrustsStringResponse = tickersUnitTrustsStringResponse.replace(new RegExp('Name', 'g'), 'label')
          //           tickersUnitTrustsStringResponse = tickersUnitTrustsStringResponse.replace(new RegExp('ResourceCodeID', 'g'), 'id')
          //           //tickersUnitTrustsStringResponse = tickersUnitTrustsStringResponse.replace(new RegExp('ResourceCode', 'g'), 'subLabel')
          //           tickersUnitTrustsArrayResponse = JSON.parse(tickersUnitTrustsStringResponse)

          //           this.unitTrustsTickers = tickersUnitTrustsArrayResponse;
          //           this.unitTrustsTickers.forEach( (item) => {
          //             this.allIndicatorsList.push(item);
          //           });

          //           // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
          //           this.allWatchlistTickers = this.allIndicatorsList;

          //           // Update the working Internal Watchlist
          //           this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

          //           // Load All Share Names into it's Series Control
          //           unitTrustsMainSeriesControl.set('items', this.unitTrustsTickers);

          //           // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
          //           localStorage.setItem("unitTrustsTickers_Backup", encrypt(JSON.stringify(this.unitTrustsTickers), "unitTrustsTickers_Backup"));

          //         } else {
          //           this.unitTrustsTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
          //         }
          //     },
          //     (error: any) => {
          //       console.log(error);
          //     }
          //   ),
          //   (error: any) => {
          //     console.log(error);
          //   }
          // }


          // *** LOAD SHARE NAMES - WINNING SHARES ***
          if (this.winningSharesTickers === undefined || this.winningSharesTickers.length === 0) {
            let tickersWinningSharesArrayResponse: any[] = [];
            let tickersWinningSharesStringResponse: string = "";

            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetWinningSharesList?$select=ShareCodeID%2CLongName&%24apply=groupby((ShareCodeID,LongName))`; //&%24expand=ShareCode($select=ShareCode)
            const httpClientWinningShares = new HttpClient(new HttpXhrBackend({
              build: () => new XMLHttpRequest()
            }));
            httpClientWinningShares.get<any>(endpoint, { headers })
              .subscribe(
                (response: { [x: string]: any; }) => {
                  tickersWinningSharesArrayResponse = JSON.parse(JSON.stringify(response))
                  if (tickersWinningSharesArrayResponse.length > 0) {

                    // Add the ShareCode as an Additional Property to the JSON Array
                    for (const obj of tickersWinningSharesArrayResponse) {
                      obj.ShareCode = obj.ShareCodeID;
                    }

                    for (const obj of tickersWinningSharesArrayResponse) {
                      modifyWinningSharesListProperty(tickersWinningSharesArrayResponse, obj.ShareCode, '(' + obj.ShareCode + ') ' + obj.LongName)
                    }

                    tickersWinningSharesStringResponse = JSON.stringify(tickersWinningSharesArrayResponse);
                    tickersWinningSharesStringResponse = tickersWinningSharesStringResponse.replace(new RegExp('LongName', 'g'), 'label')
                    tickersWinningSharesStringResponse = tickersWinningSharesStringResponse.replace(new RegExp('ShareCodeID', 'g'), 'id')
                    //tickersWinningSharesStringResponse = tickersWinningSharesStringResponse.replace(new RegExp('ShareCode', 'g'), 'subLabel')
                    tickersWinningSharesArrayResponse = JSON.parse(tickersWinningSharesStringResponse)

                    this.winningSharesTickers = tickersWinningSharesArrayResponse;

                    // Load All Share Names into it's Series Control
                    winningSharesMainSeriesControl.set('items', this.winningSharesTickers);


                    //Sort the Array List Alphabetically excluding the Headings and Stuff
                    this.equitiesTickers.sort(sortAlph);
                    this.indicesTickers.sort(sortAlph);
                    this.etfTickers.sort(sortAlph);
                    this.satrixTickers.sort(sortAlph);
                    this.commoditiesTickers.sort(sortAlph);
                    //this.unitTrustsTickers.sort(sortAlph);
                    this.winningSharesTickers.sort(sortAlph);
                    this.allIndicatorsList.sort(sortAlph);

                    // Load All Share Names into it's Series Control
                    comparisonControl.set('items', this.allIndicatorsList);

                    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                    this.allWatchlistTickers = this.allIndicatorsList;

                    this.allWatchlistTickers.sort(sortAlph);

                    // Update the working Internal Watchlist
                    this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("winningSharesTickers_Backup", encrypt(JSON.stringify(this.winningSharesTickers), "winningSharesTickers_Backup"));

                    // // Make a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
                    // localStorage.setItem("allIndicatorsList_Backup", encrypt(JSON.stringify(this.allIndicatorsList), "allIndicatorsList_Backup"));
                  } else {
                    this.winningSharesTickers = [ { id: this.defaultTicker, label: this.defaultTickerName } ]
                  }


                  // // Load data for all series (main series + comparisons)
                  // const promises: any[] = [];
                  // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
                  //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
                  //     promises.push(loadData(series.get("name")!, [series], "day"));
                  // });

                  // // // set data to all series
                  // // valueSeries.data.setAll(this.arrayResponse);
                  // // volumeSeries.data.setAll(this.arrayResponse);
                  // // sbSeries.data.setAll(this.arrayResponse);
                  // am5.array.each([valueSeries, volumeSeries], (item) => {
                  //   item.data.setAll(this.arrayResponse);
                  // });
              },
              (error: any) => {
                console.log(error);
              }
            ),
            (error: any) => {
              console.log(error);
            }
          }


          // Create a Custom Zoom Type Button Control for the xAxis on the Main Chart
          const zoomTypeButtonControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Zoom to Middle or to Last Price.',
            name: 'Zoom Type',
            active: false,
            id: 'zoomTypeButton',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Show Extension")
          });
          const zoomTypeContainer = document.createElement("div");
          zoomTypeContainer.className = "am5stock-control-drawing-tools";
          zoomTypeContainer.style.display = "none";

          zoomTypeContainer.appendChild(zoomTypeButtonControl.getPrivate("button")!);
          zoomTypeButtonControl.on("active", (_ev) => {
            const active = zoomTypeButtonControl.get("active", false);
          });

          zoomTypeButtonControl.events.on("click", function (ev) {

            if (zoomTypeButtonControl.get("active") === true) {

              mainPanel.set("wheelZoomPositionX", 1);
              
              localStorage.setItem("wheelZoomPositionX", "1");

            } else {
  
              mainPanel.set("wheelZoomPositionX", 0.5);
              
              localStorage.setItem("wheelZoomPositionX", "0.5");

            }

          });


          const getZoomType = () => {
            let zoomTypeValue = localStorage.getItem("wheelZoomPositionX");

            if (zoomTypeValue === null) {

              zoomTypeButtonControl.set("active", false);
                
              localStorage.setItem("wheelZoomPositionX", "0.5");

              zoomTypeValue = "0.5";
              
            } else if (zoomTypeValue === "1") {
  
              zoomTypeButtonControl.set("active", true);
                
              localStorage.setItem("wheelZoomPositionX", "1");

              zoomTypeValue = "1";
              
            } else {
  
              zoomTypeButtonControl.set("active", false);
                
              localStorage.setItem("wheelZoomPositionX", "0.5");

              zoomTypeValue = "0.5";
              
            }

            return Number(zoomTypeValue);
          }

          // Create a main stock panel (chart)
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
          this.myZoomType = getZoomType();
          let mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
            //wheelZoomPositionX: 1,
            // background: am5.Rectangle.new(root, {
            //   fill: getUserSelectedThemeColour(),
            //   //fillOpacity: 0.2
            // }),
            //wheelX: "panX",
            pinchZoomX: true,
            pinchZoomY: true,
            crisp: true,
            wheelY: "zoomX",
            wheelZoomPositionX: Number(this.myZoomType),
            wheelZoomPositionY: 0.5,
            paddingBottom: 3,
            panX: true,
            panY: true,
            layout: root.gridLayout,
            maxTooltipDistance: 0
          }));


          // mainPanel.plotContainer.events.on("wheel", function(ev) {
          //   if (ev.originalEvent.ctrlKey) {
          //     ev.originalEvent.preventDefault();
          //     mainPanel.set("wheelX", "panX");
          //     mainPanel.set("wheelY", "zoomX");
          //   }
          //   else {
          //     mainPanel.set("wheelX", "none");
          //     mainPanel.set("wheelY", "none");
          //   }
          // });

          // // Create curtain + message to show when wheel is used over chart without CTRL
          // let overlay = root.container.children.push(am5.Container.new(root, {
          //   width: am5.p100,
          //   height: am5.p100,
          //   layer: 100,
          //   visible: false
          // }));
                                                    
          // let curtain = overlay.children.push(am5.Rectangle.new(root, {
          //   width: am5.p100,
          //   height: am5.p100,
          //   fill: am5.color(0x000000),
          //   fillOpacity: 0.3
          // }));


          //root.interfaceColors.set("background", am5.color(0xff0000));
          //root.interfaceColors.set("grid", am5.color(0xff0000));
          //root.interfaceColors.set("alternativeBackground", am5.color(0xff0000));
          //root.interfaceColors.set("fill", am5.color(0xff0000));
          //root.interfaceColors.set("stroke", am5.color(0xff0000));

          // stockChart.events.on("click", function(ev) {
            
          //   // mainPanel.setAll({
          //   //   background: am5.Rectangle.new(root, {
          //   //     fill: am5.color(0x171b29), //root.interfaceColors.get("alternativeBackground"),
          //   //     fillOpacity: 0.7
          //   //   })
          //   // });

          //   root.interfaceColors.set("background", am5.color(0xff0000));

          //   // mainPanel.chartContainer.set("background", am5.Graphics.new(root, {
          //   //     //stroke: am5.color(0x000000),
          //   //     fill: am5.color(0x171b29)
          //   //   })
          //   // );
            

          //   //setUserSelectedThemeColour(mainPanel, root);

          //   // stockChart.set("background", am5.Graphics.new(root, {
          //   //   //stroke: am5.color(0x000000),
          //   //   fill: am5.color(0x171b29)
          //   // }));
        
          // });


          // Create value axis
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
          let valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
            renderer: am5xy.AxisRendererY.new(root, {
              inversed: false,
              pan: "zoom",
            }),
            // background: am5.Rectangle.new(root, {
            //   fill: getUserSelectedThemeColour(),
            //   fillOpacity: 0.2,
            // }),
            //maxZoomFactor: 100,
            maxDeviation: 1,
            extraMin: 0.1, // adds some space for the main series
            tooltip: am5.Tooltip.new(root, {}),
            numberFormat: "#,###.00",
            extraTooltipPrecision: 2,
          }));

          // valueAxis.get("renderer").labels.template.setup = function(target) {
          //   target.set("background", am5.Rectangle.new(root, {
          //     fill: getUserSelectedThemeColour()
          //   }))
          // }

          //setUserSelectedThemeColour(mainPanel, root);
          // mainPanel.set("colors", am5.ColorSet._new(root, {
          //   colors: [am5.color(0x171b29)]
          // }))
      

          let dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
            renderer: am5xy.AxisRendererX.new(root, {
              pan: "zoom",
              minorGridEnabled: true,
              // minGridDistance: 50,
            }),
            // background: am5.Rectangle.new(root, {
            //   fill: getUserSelectedThemeColour(),
            //   fillOpacity: 0.2
            // }),
            maxDeviation: 0.5,
            maxZoomFactor: 100,
            // extraMin: -0.2,
            // extraMax: 0.2,
            groupData: true,
            groupInterval: {timeUnit:"day", count:1},
            baseInterval: {
              timeUnit: "day",
              count: 1,
            },
            wheelable: true,
            //groupCount: 1,
            tooltip: am5.Tooltip.new(root, {})
          }));


          // *** MAKE LABELS ***
          function createRange(value: any, endValue: any, color: any, addline: boolean) {
            if (value === undefined) {
              return;
            }

            if (valueAxis.axisRanges.length > 1) {
              for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                valueAxis.axisRanges.getIndex(i)?.dispose();
              }
            }
            var rangeDataItem = valueAxis.makeDataItem({
              value: value,
              endValue: endValue
            });

            var range = valueAxis.createAxisRange(rangeDataItem);

            if (endValue) {
              range.get("axisFill")?.setAll({
                fill: color,
                fillOpacity: 0.1,
                visible: true
              });

              range.get("label")?.setAll({
                fill: am5.color(0xffffff),
                text: value + "-" + endValue,
                location: 1,
                inside: true,
                centerX: 0,
                dx: 1,
                background: am5.PointedRectangle.new(root, {
                  fill: color
                })
              });
            }
            else {
              range.get("label")?.setAll({
                fill: am5.color(0xffffff),
                text: value,
                inside: true,
                centerX: 0,
                dx: 1,
                lineHeight: 1,
                background: am5.PointedRectangle.new(root, {
                  fill: color
                })
              });
            }

            if (addline === true) {
              range.get("grid")?.setAll({
                stroke: color,
                strokeOpacity: 1,
                location: 1
              });
            }

            // range.get("label")?.adapters.add("x", (x, target)=>{
            //   return mainPanel.plotContainer.width();
            // });

            mainPanel.plotContainer.onPrivate("width", ()=>{
              range.get("label")?.markDirtyPosition();
            });
          }

          // Remove All Labels except for the First one
          valueAxis.events.on("click", function(ev) {

            for (let i = 1; i < valueAxis.axisRanges.length; i++) {
              valueAxis.axisRanges.getIndex(i)?.dispose();
            }

            // for (let i = 1; i < valueAxis.axisRanges.length; i++) {
            //   // Get the Label Value
            //   var getValue = valueAxis.axisRanges.values[i]._settings.value;
            //   if (getValue) {
            //     valueAxis.axisRanges.getIndex(i)?.dispose();
            //   }
            // }

            //valueAxis.axisRanges.clear;
            //ev.target.axisRanges.clear();
            //loadData(valueSeries.get("name") as string, [valueSeries], "day");
          });

          // // Get the Closing Price
          // const closePrices = valueSeries.dataItems.map((dataItem) => dataItem.get("valueWorkingClose"));

          // createRange(closePrices, undefined, am5.color(0xff621f));
          //createRange(230, undefined, am5.color(0x297373));


          // exporting.getCSV().then(function(csvData) {
          //   document.getElementById("myData")!.innerHTML = csvData;
          // });

          // let cursorGraphics = am5.Graphics.new(root, {
          //   stroke: am5.color("0xff0000"),
          //   fill: am5.color(0x990000)
          // })

          // Add cursor(s)
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
          mainPanel.set("cursor", am5xy.XYCursor.new(root, {
            yAxis: valueAxis,
            xAxis: dateAxis,
            //snapToSeries: [valueSeries],
            behavior: "none",
            snapToSeriesBy: "y!",
            exportable: false,
            hue:180,
            // background: cursorGraphics,
            // invert: 0,
            visible: true,
          }));

          let cursor = mainPanel.get("cursor");

          cursor?.lineX.setAll({
            stroke: am5.color(0x7d7d7d),
            strokeWidth: 2,
            // strokeDasharray: []
          });

          cursor?.lineY.setAll({
            visible: true,
            stroke: am5.color(0x7d7d7d),
            strokeWidth: 2,
          });

          // mainPanel.set("colors", am5.ColorSet.new(root, {colors: [am5.color(0xfffff)]}) )

          // mainPanel.set('invert', 1)


          // const getValueY = (): Number => {
          //   return Number(valueSeries.get("valueYField"));
          // }

          // const getOpenValueY = (): Number => {
          //   return Number(valueSeries.get("openValueYField"));
          // }

          // Add series
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
          let valueSeries = mainPanel.series.push(am5xy.CandlestickSeries.new(root, {
            name: getLastSavedShareName(this.allIndicatorsList).toString(), //this.defaultTicker,
            clustered: false,
            valueXField: "Date",
            valueYField: "Close",
            highValueYField: "High",
            lowValueYField: "Low",
            openValueYField: "Open",
            calculateAggregates: true,
            xAxis: dateAxis,
            yAxis: valueAxis,
            legendValueText: `[bold]O: [bold]{openValueY}[/]   [bold]H: [bold]{highValueY}[/]   [bold]L: [bold]{lowValueY}[/]   [bold]C: [bold]{valueY}[/]`,
            //legendValueText: `[bold]O: [bold]{openValueY}[/]   [bold]H: [bold]{highValueY}[/]   [bold]L: [bold]{lowValueY}[/]   [bold]C: [bold]{valueY}[/]   [bold]${((Number(getValueY()) / Number(getOpenValueY())) * 100).toFixed(2)}%[/]`,
            legendRangeValueText: "{valueYClose}",
            // tooltip: am5.Tooltip.new(root, {
            //   pointerOrientation: "horizontal",
            //   labelText: "open: {openValueY}\nlow: {lowValueY}\nhigh: {highValueY}\nclose: {valueY}",
            // })
          }));


          // mainPanel.events.on("click", function (ev) { 

          //   // Calculate the percentage
          //   const percentage = ((Number(valueSeries.get("valueYField")) / Number(valueSeries.get("openValueYField"))) * 100).toFixed(2);

          //   // Define the legend value text with the calculated percentage
          //   const legendValueText = `[bold]O: [bold]{openValueY}[/]   [bold]H: [bold]{highValueY}[/]   [bold]L: [bold]{lowValueY}[/]   [bold]C: [bold]{valueY}[/]   [bold]${percentage}%[/]`;

          //   // Assign the legendValueText to your amCharts configuration
          //   valueSeries.set("legendValueText", legendValueText);

          // });

          // Set main value series
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
          stockChart.set("stockSeries", valueSeries);


          // Add a stock legend
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
          let valueLegend = mainPanel.plotContainer.children.push(am5stock.StockLegend.new(root, {
            stockChart: stockChart
          }));


          // Create volume axis
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
          let volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
            inside: true,
            pan: "zoom"
          });

          volumeAxisRenderer.labels.template.set("forceHidden", true);
          volumeAxisRenderer.grid.template.set("forceHidden", true);

          let volumeValueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
            numberFormat: "#.#a",
            height: am5.percent(20),
            y: am5.percent(100),
            centerY: am5.percent(100),
            renderer: volumeAxisRenderer,
          }));

          // Add series
          // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
          let volumeSeries = mainPanel.series.push(am5xy.ColumnSeries.new(root, {
            name: "Volume",
            clustered: false,
            valueXField: "Date",
            valueYField: "Volume",
            xAxis: dateAxis,
            yAxis: volumeValueAxis,
            visible: false,
            legendValueText: "Volume: [bold]{valueY.formatNumber('#,###.0a')}[/]"
          }));

          volumeSeries.columns.template.setAll({
            strokeOpacity: 0,
            fillOpacity: 0.5
          });

          // color columns by stock rules
          volumeSeries.columns.template.adapters.add("fill", function(fill, target) {
            let dataItem = target.dataItem;
            if (dataItem) {
              return stockChart.getVolumeColor(dataItem);
            }
            return fill;
          })

          let periodSelector = am5stock.PeriodSelector.new(root, {
            stockChart: stockChart,
            periods: [
              // { timeUnit: "day", count: 1, name: "1D" },
              // { timeUnit: "day", count: 5, name: "5D" },
              { timeUnit: "month", count: 1, name: "1M" },
              { timeUnit: "month", count: 3, name: "3M" },
              { timeUnit: "month", count: 6, name: "6M" },
              { timeUnit: "ytd", name: "YTD" },
              { timeUnit: "month", count: 12, name: "1Y" },
              { timeUnit: "month", count: 24, name: "2Y" },
              { timeUnit: "month", count: 60, name: "5Y" },
              { timeUnit: "max", name: "Max" },
              // { timeUnit: "minute", count: 60, name: "1 Minute" },
              // { timeUnit: "minute", count: 120, name: "2 Minute" },
              // { timeUnit: "minute", count: 300, name: "5 Minute" },
              // { timeUnit: "minute", count: 900, name: "15 Minute" },
              // { timeUnit: "minute", count: 1800, name: "30 Minute" },
              // { timeUnit: "hour", count: 1, name: "1 Hour" },
              // { timeUnit: "hour", count: 4, name: "4 Hours" },
              ],
          })

          periodSelector.selectPeriod({ timeUnit: "month", count: 12 });
          valueSeries.events.once("datavalidated", function() {
            periodSelector.selectPeriod({ timeUnit: "month", count: 12 });
          });


          // Set main series
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
          stockChart.set("volumeSeries", volumeSeries);
          valueLegend.data.setAll([valueSeries]); // Hide the volumeSeries by removing it from the ValueLegend


          // Add export menu
          let menu = am5plugins_exporting.ExportingMenu.new(root, {});

          // let menuContiner = am5.Container.new(root, {
          //    HTMLElement: document.getElementById("exportdiv"),
          // })

          let exporting = am5plugins_exporting.Exporting.new(root, {
            menu: am5plugins_exporting.ExportingMenu.new(root, {
              //container: document.getElementById("exportdiv")!,
              align: "right",
              valign: "top",
            }),
            dataSource: this.arrayResponse,
            pngOptions: {
              quality: 0.8,
              maintainPixelRatio: true
            },
            htmlOptions: {
              disabled: false // Change this to true to Disable/Hide the Export to HTML Option
            },
            xlsxOptions: {
              addColumnNames: true,
            }
          });

          exporting.events.on("dataprocessed", function(ev) {
            for(var i = 0; i < ev.data.length; i++) {
              ev.data[i].sum = ev.data[i].value + ev.data[i].value2;
            }
          });


          // // Add custom menu buttons
          // let cursorShowHideButton = document.createElement("a");
          // cursorShowHideButton.innerHTML = "Show Crosshairs";
          // cursorShowHideButton.className = "am5exporting am5exporting-icon am5exporting-align-right";
          // cursorShowHideButton.style.top = "-20px";
          // cursorShowHideButton.style.right = "35px";
          // cursorShowHideButton.style.width = "107px";
          // cursorShowHideButton.style.height = "31px";
          // cursorShowHideButton.style.color = "black";
          // cursorShowHideButton.style.fontSize = "13px";
          // cursorShowHideButton.id = "customButton"; // Add an id to the button
          // // cursorShowHideButton.style.fontWeight = "bold";
          // menu.getPrivate("menuElement")?.appendChild(cursorShowHideButton);

          // cursorShowHideButton.addEventListener("click", function(ev) {

          //   if (cursorShowHideButton.innerHTML === "Show Crosshairs") {

          //     cursorShowHideButton.innerHTML = "Hide Crosshairs";

          //     // Add cursor(s)
          //     // -------------------------------------------------------------------------------
          //     // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
          //     // mainPanel.set("cursor", am5xy.XYCursor.new(root, {
          //     //   behavior: "zoomX"
          //     // }));
          //     mainPanel.set("cursor", am5xy.XYCursor.new(root, {
          //       yAxis: valueAxis,
          //       xAxis: dateAxis,
          //       snapToSeries: [valueSeries],
          //       snapToSeriesBy: "y!",
          //       exportable: false,
          //       visible: true,
          //     }));

          //   } else {

          //     cursorShowHideButton.innerHTML = "Show Crosshairs";
          //     mainPanel.remove("cursor");

          //     tooltipShowHideButton.innerHTML = "Show Tooltip";
          //     valueSeries.remove("tooltip");

          //   }
          // });


          // Create a Custom Tooltip Button Control
          const myTooltipButtonControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Show/Hide the Main Chart Tooltip.',
            name: 'Tooltip',
            active: false,
            id: 'myTooltipButton',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Show Extension")
          });
          const tooltipContainer = document.createElement("div");
          tooltipContainer.className = "am5stock-control-drawing-tools";
          tooltipContainer.style.display = "none";

          tooltipContainer.appendChild(myTooltipButtonControl.getPrivate("button")!);
          myTooltipButtonControl.on("active", (_ev) => {
            const active = myTooltipButtonControl.get("active", false);
          });

          myTooltipButtonControl.events.on("click", function (ev) {

            if (myTooltipButtonControl.get("active") === true) {

              var tooltip = am5.Tooltip.new(root, {
                pointerOrientation: "vertical",
                tooltipPosition: "pointer",
                tooltipText: "a",
                forceInactive: true,
              });

              tooltip.get("background")?.setAll({
                fill: am5.color(0xeeeeee),
              })

              valueSeries.set("tooltip", tooltip);

              // *** New Tooltip with Volume ***
              // root.dateFormatter.format(???, "yyyy-MM-dd")
              tooltip.label.adapters.add("text", function(text, target) {
                text = "";
                var tooltipDataItem = valueSeries.get("tooltipDataItem");
                var shareName = getTickerFromShareLongName(valueSeries.get("name")?.toString() || getLastSavedShareCode());
                var tooltipVolumeDataItem = volumeSeries.get("tooltipDataItem");
                if (tooltipDataItem && tooltipVolumeDataItem) {
                  let stockItemDate = setTooltipDateTime(tooltipDataItem.get('valueX')?.toString());
                  text = '[/][bold]' + shareName +
                         '[/]\nDate     : [bold]' + formatDate(stockItemDate, 'yyyy-MM-dd' , 'en-ZA') +
                         '[/]\nOpen    : ' + tooltipDataItem.get('openValueY') +
                         '[/]\nHigh     : ' + tooltipDataItem.get('highValueY') +
                         '[/]\nLow      : ' + tooltipDataItem.get('lowValueY') +
                         '[/]\nClose    : ' + tooltipDataItem.get('valueY') +
                         '[/]\nVolume : [bold]' + tooltipVolumeDataItem.get('valueY');
                }
                return text;
              });

              localStorage.setItem("ShowTooltip", "true");

            } else {

              valueSeries.remove("tooltip");

              localStorage.setItem("ShowTooltip", "false");

            }

          });


          // // Add custom menu button
          // let tooltipShowHideButton = document.createElement("a");
          // tooltipShowHideButton.innerHTML = "Show Tooltip";
          // tooltipShowHideButton.className = "am5exporting am5exporting-icon am5exporting-align-right";
          // tooltipShowHideButton.style.top = "-23px";
          // tooltipShowHideButton.style.right = "200px";
          // tooltipShowHideButton.style.width = "88px";
          // tooltipShowHideButton.style.height = "21px";
          // tooltipShowHideButton.style.color = "black";
          // tooltipShowHideButton.style.backgroundColor = "#8dc045";
          // tooltipShowHideButton.style.fontSize = "13px";
          // menu.getPrivate("menuElement")?.appendChild(tooltipShowHideButton);

          // tooltipShowHideButton.addEventListener("click", function(ev) {

          //   if (tooltipShowHideButton.innerHTML === "Show Tooltip") {

          //     tooltipShowHideButton.innerHTML = "Hide Tooltip";

          //     // *** Original Tooltip with No Volume ***
          //     // valueSeries.set("tooltip", am5.Tooltip.new(root, {
          //     //   pointerOrientation: "horizontal",
          //     //   labelText: "[bold]{valueX.formatDate()}[/]\nOpen: {openValueY}\nHigh: {highValueY}\nLow: {lowValueY}\nClose: {valueY}", //\nVolume: [bold]{volumeSeries.valueY.formatNumber('#,###.0a')}[/]
          //     //   //legendValueText: "Volume: [bold]{valueY.formatNumber('#,###.0a')}[/]"
          //     //   // labelText: "open: {openValueY}\nlow: {lowValueY}\nhigh: {highValueY}\nclose: {valueY}",
          //     // }));

          //     var tooltip = am5.Tooltip.new(root, {
          //       pointerOrientation: "vertical",
          //       tooltipPosition: "pointer",
          //       tooltipText: "a",
          //     });

          //     tooltip.get("background")?.setAll({
          //       fill: am5.color(0xeeeeee),
          //     })

          //     // mainPanel.plotContainer.set("tooltipPosition", "pointer");
          //     // mainPanel.plotContainervalueSeries.set("tooltipText", "a");
          //     valueSeries.set("tooltip", tooltip);

          //     // var tooltipDataItem = volumeSeries.get("tooltipDataItem");
          //     // if (tooltipDataItem) {
          //     //   mainPanel.set("tooltip", am5.Tooltip.new(root, {
          //     //   pointerOrientation: "horizontal",
          //     //   labelText: "[bold]{valueX.formatDate()}[/]\nOpen: {openValueY}\nHigh: {highValueY}\nLow: {lowValueY}\nClose: {valueY}\nVolume: [bold]" + tooltipDataItem.get("valueY"), //, //\nVolume: [bold]{volumeSeries.valueY.formatNumber('#,###.0a')}[/]
          //     // }));

          //     // *** New Tooltip with Volume ***
          //     // root.dateFormatter.format(???, "yyyy-MM-dd")
          //     tooltip.label.adapters.add("text", function(text, target) {
          //       text = "";
          //       var tooltipDataItem = valueSeries.get("tooltipDataItem");
          //       var tooltipVolumeDataItem = volumeSeries.get("tooltipDataItem");
          //       if (tooltipDataItem && tooltipVolumeDataItem) {
          //         let stockItemDate = setTooltipDateTime(tooltipDataItem.get('valueX')?.toString());
          //         text = '[/][bold]{name}' +
          //                '[/]\nDate     : [bold]' + formatDate(stockItemDate, 'yyyy-MM-dd' , 'en-ZA') +
          //                '[/]\nOpen    : ' + tooltipDataItem.get('openValueY') +
          //                '[/]\nHigh     : ' + tooltipDataItem.get('highValueY') +
          //                '[/]\nLow      : ' + tooltipDataItem.get('lowValueY') +
          //                '[/]\nClose    : ' + tooltipDataItem.get('valueY') +
          //                '[/]\nVolume : [bold]' + tooltipVolumeDataItem.get('valueY');
          //       }
          //       return text;
          //     });
          //     localStorage.setItem("ShowTooltip", "true");

          //   } else {

          //     tooltipShowHideButton.innerHTML = "Show Tooltip";
          //     valueSeries.remove("tooltip");

          //     localStorage.setItem("ShowTooltip", "false");

          //   }
          // });


          // This will check to see if the user wants the Tooltip to show when the Browser is Loaded/Reloaded
          let showTooltip = localStorage.getItem("ShowTooltip");
          if (showTooltip === "true") {

            //tooltipShowHideButton.innerHTML = "Hide Tooltip";
            myTooltipButtonControl.set("active", true);

            var tooltip = am5.Tooltip.new(root, {
              pointerOrientation: "vertical",
              tooltipPosition: "pointer",
              tooltipText: "a",
            });

            tooltip.get("background")?.setAll({
              fill: am5.color(0xeeeeee),
            })

            valueSeries.set("tooltip", tooltip);

            // *** New Tooltip with Volume ***
            // root.dateFormatter.format(???, "yyyy-MM-dd")
            tooltip.label.adapters.add("text", function(text, target) {
              text = "";
              var tooltipDataItem = valueSeries.get("tooltipDataItem");
              var shareName = getTickerFromShareLongName(valueSeries.get("name")?.toString() || getLastSavedShareCode());
              var tooltipVolumeDataItem = volumeSeries.get("tooltipDataItem");
              if (tooltipDataItem && tooltipVolumeDataItem) {
                let stockItemDate = setTooltipDateTime(tooltipDataItem.get('valueX')?.toString());
                text = '[/][bold]' + shareName +
                       '[/]\nDate     : [bold]' + formatDate(stockItemDate, 'yyyy-MM-dd' , 'en-ZA') +
                       '[/]\nOpen    : ' + tooltipDataItem.get('openValueY') +
                       '[/]\nHigh     : ' + tooltipDataItem.get('highValueY') +
                       '[/]\nLow      : ' + tooltipDataItem.get('lowValueY') +
                       '[/]\nClose    : ' + tooltipDataItem.get('valueY') +
                       '[/]\nVolume : [bold]' + tooltipVolumeDataItem.get('valueY');
              }
              return text;
            });

          }


          // Create a Custom Grid Lines Show/Hide Button Control
          const gridLinesShowHideButtonControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Show/Hide the Main Chart Gridlines.',
            name: 'Gridlines',
            active: false,
            id: 'gridLinesShowHideButton',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Show Extension")
          });
          const gridLinesShowHideContainer = document.createElement("div");
          gridLinesShowHideContainer.className = "am5stock-control-drawing-tools";
          gridLinesShowHideContainer.style.display = "none";

          gridLinesShowHideContainer.appendChild(gridLinesShowHideButtonControl.getPrivate("button")!);
          gridLinesShowHideButtonControl.on("active", (_ev) => {
            const active = gridLinesShowHideButtonControl.get("active", false);
          });

          gridLinesShowHideButtonControl.events.on("click", function (ev) {

            if (gridLinesShowHideButtonControl.get("active") === true) {

              if (localStorage.getItem("selectedTheme") === "dark") {

                // Show the Grid Lines
                let yRenderer = valueAxis.get("renderer");
                yRenderer.grid.template.setAll({
                  stroke: am5.color(0x474747), //0x151825
                  strokeOpacity: 1,
                  //strokeWidth: 1
                });

                let xRenderer = dateAxis.get("renderer");
                xRenderer.grid.template.setAll({
                  stroke: am5.color(0x474747), //0x151825
                  strokeOpacity: 1,
                  //strokeWidth: 1
                });

              } else {

                // Show the Grid Lines
                let yRenderer = valueAxis.get("renderer");
                yRenderer.grid.template.setAll({
                  stroke: am5.color(0xd3d3d3),
                  strokeOpacity: 1,
                  //strokeWidth: 1
                });

                let xRenderer = dateAxis.get("renderer");
                xRenderer.grid.template.setAll({
                  stroke: am5.color(0xd3d3d3),
                  strokeOpacity: 1,
                  //strokeWidth: 1
                });

              }

              localStorage.setItem("GridLines", "true");

            } else {

              // Hide the Grid Lines
              let yRenderer = valueAxis.get("renderer");
              yRenderer.grid.template.setAll({
                stroke: am5.color(0xd3d3d3),
                strokeOpacity: 0
              });

              let xRenderer = dateAxis.get("renderer");
              xRenderer.grid.template.setAll({
                stroke: am5.color(0xd3d3d3),
                strokeOpacity: 0
              });

              localStorage.setItem("GridLines", "false");

            }

          });


          // // Add custom menu button
          // let gridLinesShowHideButton = document.createElement("a");
          // gridLinesShowHideButton.innerHTML = "Hide Grid Lines";
          // gridLinesShowHideButton.className = "am5exporting am5exporting-icon am5exporting-align-right";
          // gridLinesShowHideButton.style.top = "-23px";
          // gridLinesShowHideButton.style.right = "80px";
          // gridLinesShowHideButton.style.width = "110px";
          // gridLinesShowHideButton.style.height = "21px";
          // gridLinesShowHideButton.style.color = "black";
          // gridLinesShowHideButton.style.backgroundColor = "#8dc045";
          // gridLinesShowHideButton.style.fontSize = "13px";
          // menu.getPrivate("menuElement")?.appendChild(gridLinesShowHideButton);

          // gridLinesShowHideButton.addEventListener("click", function(ev) {

          //   if (gridLinesShowHideButton.innerHTML === "Show Grid Lines") {

          //     gridLinesShowHideButton.innerHTML = "Hide Grid Lines";

          //     if (localStorage.getItem("selectedTheme") === "dark") {

          //       // Show the Grid Lines
          //       let yRenderer = valueAxis.get("renderer");
          //       yRenderer.grid.template.setAll({
          //         stroke: am5.color(0x151825), //0x151926
          //         strokeOpacity: 1,
          //         //strokeWidth: 1
          //       });

          //       let xRenderer = dateAxis.get("renderer");
          //       xRenderer.grid.template.setAll({
          //         stroke: am5.color(0x151825), //0x151926
          //         strokeOpacity: 1,
          //         //strokeWidth: 1
          //       });

          //     } else {

          //       // Show the Grid Lines
          //       let yRenderer = valueAxis.get("renderer");
          //       yRenderer.grid.template.setAll({
          //         stroke: am5.color(0xECECEC),
          //         strokeOpacity: 1,
          //         //strokeWidth: 1
          //       });

          //       let xRenderer = dateAxis.get("renderer");
          //       xRenderer.grid.template.setAll({
          //         stroke: am5.color(0xECECEC),
          //         strokeOpacity: 1,
          //         //strokeWidth: 1
          //       });

          //     }

          //     localStorage.setItem("GridLines", "true");

          //   } else {

          //     gridLinesShowHideButton.innerHTML = "Show Grid Lines";

          //     // Hide the Grid Lines
          //     let yRenderer = valueAxis.get("renderer");
          //     yRenderer.grid.template.setAll({
          //       stroke: am5.color(0xECECEC),
          //       strokeOpacity: 0
          //     });

          //     let xRenderer = dateAxis.get("renderer");
          //     xRenderer.grid.template.setAll({
          //       stroke: am5.color(0xECECEC),
          //       strokeOpacity: 0
          //     });

          //     localStorage.setItem("GridLines", "false");

          //   }
          // });


          // This will check to see if the user wants the Gridlines to show when the Browser is Loaded/Reloaded
          let showGridLines = localStorage.getItem("GridLines");
          if (showGridLines === "true") {

            //gridLinesShowHideButton.innerHTML = "Hide Grid Lines";
            gridLinesShowHideButtonControl.set("active", true);

            if (localStorage.getItem("selectedTheme") === "dark") {

              // Show the Grid Lines
              let yRenderer = valueAxis.get("renderer");
              yRenderer.grid.template.setAll({
                stroke: am5.color(0x474747),
                strokeOpacity: 1,
                //strokeWidth: 1
              });

              let xRenderer = dateAxis.get("renderer");
              xRenderer.grid.template.setAll({
                stroke: am5.color(0x474747),
                strokeOpacity: 1,
                //strokeWidth: 1
              });

            } else {

              // Show the Grid Lines
              let yRenderer = valueAxis.get("renderer");
              yRenderer.grid.template.setAll({
                stroke: am5.color(0xd3d3d3),
                strokeOpacity: 1,
                //strokeWidth: 1
              });

              let xRenderer = dateAxis.get("renderer");
              xRenderer.grid.template.setAll({
                stroke: am5.color(0xd3d3d3),
                strokeOpacity: 1,
                //strokeWidth: 1
              });

            }

          } else {

            //gridLinesShowHideButton.innerHTML = "Show Grid Lines";
            gridLinesShowHideButtonControl.set("active", false);

            // Hide the Grid Lines
            let yRenderer = valueAxis.get("renderer");
            yRenderer.grid.template.setAll({
              stroke: am5.color(0xd3d3d3),
              strokeOpacity: 0
            });

            let xRenderer = dateAxis.get("renderer");
            xRenderer.grid.template.setAll({
              stroke: am5.color(0xd3d3d3),
              strokeOpacity: 0
            });

            
          }
          valueAxis.set("treatZeroAs", 0.01)

          // Create a Custom Auto Zoom Enable/Disable Button Control
          const autoZoomEnableDisableButtonControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Enable/Disable the Main Chart Fit to Screen function.',
            name: 'Fit Chart',
            active: true,
            id: 'autoZoomEnableDisableButton',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Show Extension")
          });
          const autoZoomEnableDisableContainer = document.createElement("div");
          autoZoomEnableDisableContainer.className = "am5stock-control-drawing-tools";
          autoZoomEnableDisableContainer.style.display = "none";

          autoZoomEnableDisableContainer.appendChild(autoZoomEnableDisableButtonControl.getPrivate("button")!);
          autoZoomEnableDisableButtonControl.on("active", (_ev) => {
            const active = autoZoomEnableDisableButtonControl.get("active", false);
          });

          autoZoomEnableDisableButtonControl.events.on("click", function (ev) {

            if (autoZoomEnableDisableButtonControl.get("active") === true) {

              valueAxis.set("autoZoom", true);

              localStorage.setItem("AutoZoom", "true");

            } else {

              valueAxis.set("autoZoom", false);

              localStorage.setItem("AutoZoom", "false");

            }

          });


          // This will check to see if the user wants the Auto Zoom to enable when the Browser is Loaded/Reloaded
          let enableAutoZoom = localStorage.getItem("AutoZoom");
          if (enableAutoZoom === null) {

            autoZoomEnableDisableButtonControl.set("active", true);

            valueAxis.set("autoZoom", true);

            localStorage.setItem("AutoZoom", "true");
            
          } else if (enableAutoZoom === "true") {

            autoZoomEnableDisableButtonControl.set("active", true);

            valueAxis.set("autoZoom", true);

            localStorage.setItem("AutoZoom", "true");

          } else {

            autoZoomEnableDisableButtonControl.set("active", false);

            valueAxis.set("autoZoom", false);

            localStorage.setItem("AutoZoom", "false");

          }


          const getAllEquitiesData = () => {
            return this.arrayResponse;
          }

          const getUserSelectedPeriod = () => {
            return this.selectedperiod;
            //return this.setUserSelectedPeriod;
          }

          // Create a Custom Show/Hide Button Control for the Axis Lable on the Main Chart for the Closing Price
          const closingLabelVisibleButtonControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Show/Hide the Main Chart Price Line.',
            name: 'Price Line',
            active: false,
            id: 'closingLabelVisibleButton',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Show Extension")
          });
          const closingLabelVisibleContainer = document.createElement("div");
          closingLabelVisibleContainer.className = "am5stock-control-drawing-tools";
          closingLabelVisibleContainer.style.display = "none";

          closingLabelVisibleContainer.appendChild(closingLabelVisibleButtonControl.getPrivate("button")!);
          closingLabelVisibleButtonControl.on("active", (_ev) => {
            const active = closingLabelVisibleButtonControl.get("active", false);
          });

          closingLabelVisibleButtonControl.events.on("click", function (ev) {

            if (closingLabelVisibleButtonControl.get("active") === true) {

              //Get the last close value
              const lastClose = getAllEquitiesData()
                .filter((item) => item.Close)
                .map((item) => item.Close)
                .pop();

              //Draw the Last Closing Price as a Label
              createRange(lastClose, undefined, am5.color(0xff621f), true);

              localStorage.setItem("ClosingLabelVisible", "true");

            } else {

              //Get the last close value
              const lastClose = getAllEquitiesData()
                .filter((item) => item.Close)
                .map((item) => item.Close)
                .pop();

              //Draw the Last Closing Price as a Label without the Line
              createRange(lastClose, undefined, am5.color(0xff621f), false);

              // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
              //   valueAxis.axisRanges.getIndex(i)?.dispose();
              // }
  
              localStorage.setItem("ClosingLabelVisible", "false");

            }

          });


          // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
          let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
          if (visibleClosingLabelVisible === null) {

            closingLabelVisibleButtonControl.set("active", true);

            //Get the last close value
            const lastClose = getAllEquitiesData()
              .filter((item) => item.Close)
              .map((item) => item.Close)
              .pop();

            //Draw the Last Closing Price as a Label
            createRange(lastClose, undefined, am5.color(0xff621f), true);

            localStorage.setItem("ClosingLabelVisible", "true");
            
          } else if (visibleClosingLabelVisible === "true") {

            closingLabelVisibleButtonControl.set("active", true);

            //Get the last close value
            const lastClose = getAllEquitiesData()
              .filter((item) => item.Close)
              .map((item) => item.Close)
              .pop();

            //Draw the Last Closing Price as a Label
            createRange(lastClose, undefined, am5.color(0xff621f), true);

            localStorage.setItem("ClosingLabelVisible", "true");

          } else {

            closingLabelVisibleButtonControl.set("active", false);

            //Get the last close value
            const lastClose = getAllEquitiesData()
              .filter((item) => item.Close)
              .map((item) => item.Close)
              .pop();

            //Draw the Last Closing Price as a Label without the Line
            createRange(lastClose, undefined, am5.color(0xff621f), false);

            // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
            //   valueAxis.axisRanges.getIndex(i)?.dispose();
            // }

            localStorage.setItem("ClosingLabelVisible", "false");

          }


          // // This will check to see if the user wants the Custom Zoom Type Button Control for the xAxis on the Main Chart
          // let zoomType = localStorage.getItem("wheelZoomPositionX");
          // if (zoomType === null) {

          //   zoomTypeButtonControl.set("active", true);

          //   mainPanel.set("wheelZoomPositionX", 1);
              
          //   localStorage.setItem("wheelZoomPositionX", "1");
            
          // } else if (zoomType === "1") {

          //   zoomTypeButtonControl.set("active", true);

          //   mainPanel.set("wheelZoomPositionX", 1);
              
          //   localStorage.setItem("wheelZoomPositionX", "1");

          // } else {

          //   zoomTypeButtonControl.set("active", false);

          //   mainPanel.set("wheelZoomPositionX", 0.5);
              
          //   localStorage.setItem("wheelZoomPositionX", "0.5");

          // }


          // Add scrollbar
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/xy-chart/scrollbars/
          // let scrollbar = mainPanel.set("scrollbarX", am5xy.XYChartScrollbar.new(root, {
          //   orientation: "horizontal",
          //   height: 10
          // }));
          // stockChart.toolsContainer.children.push(scrollbar);

          // let sbDateAxis = scrollbar.chart.xAxes.push(am5xy.GaplessDateAxis.new(root, {
          //   groupData:true,
          //   groupInterval: {timeUnit:"day", count:1},
          //   baseInterval: {
          //     timeUnit: "day",
          //     count: 1
          //   },
          //   //groupCount: 1,
          //   renderer: am5xy.AxisRendererX.new(root, {})
          // }));

          // let sbValueAxis = scrollbar.chart.yAxes.push(am5xy.ValueAxis.new(root, {
          //   renderer: am5xy.AxisRendererY.new(root, {})
          // }));

          // let sbSeries = scrollbar.chart.series.push(am5xy.LineSeries.new(root, {
          //   valueYField: "Close",
          //   valueXField: "Date",
          //   xAxis: sbDateAxis,
          //   yAxis: sbValueAxis
          // }));

          // sbSeries.fills.template.setAll({
          //   visible: true,
          //   fillOpacity: 0
          // });


          // Function that dynamically loads data
          const loadData = (ticker: string, series: am5xy.XYSeries[], granularity: string) =>{

            ticker = getTickerFromShareLongName(ticker);

            if (ticker === "headingOptions" || ticker === "addToWatchlist" ||
                ticker === "removeFromWatchlist" || ticker === "headingSharesList" ||
                ticker === "myWatchlistName1" || ticker === "myWatchlistName2" ||
                ticker === "myWatchlistName3" || ticker === "myWatchlistName4" ||
                ticker === "myWatchlistName5") {
              return 
            }

            this.selectedShareCode = ticker;

            // if (valueSeries.get("name") != undefined || valueSeries.get("name") != '') {

            //   // If an Unexpected issue arrises, Try to Restore All Share codes from their Backup.

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.equitiesTickers.length === 0) {
            //     this.equitiesTickers = JSON.parse(decrypt(localStorage.getItem("equitiesTickers_Backup") || "", "equitiesTickers_Backup"))
            //     if (this.equitiesTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       equitiesMainSeriesControl.set('items', this.equitiesTickers);
            //     }
            //   }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.indicesTickers.length === 0) {
            //     this.indicesTickers = JSON.parse(decrypt(localStorage.getItem("indicesTickers_Backup") || "", "indicesTickers_Backup"))
            //     if (this.indicesTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       indicesMainSeriesControl.set('items', this.indicesTickers);
            //     }
            //   }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.etfTickers.length === 0) {
            //     this.etfTickers = JSON.parse(decrypt(localStorage.getItem("etfTickers_Backup") || "", "etfTickers_Backup"))
            //     if (this.etfTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       ETFMainSeriesControl.set('items', this.etfTickers);
            //     }
            //   }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.satrixTickers.length === 0) {
            //     this.satrixTickers = JSON.parse(decrypt(localStorage.getItem("satrixTickers_Backup") || "", "satrixTickers_Backup"))
            //     if (this.satrixTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       satrixMainSeriesControl.set('items', this.satrixTickers);
            //     }
            //   }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.commoditiesTickers.length === 0) {
            //     this.commoditiesTickers = JSON.parse(decrypt(localStorage.getItem("commoditiesTickers_Backup") || "", "commoditiesTickers_Backup"))
            //     if (this.commoditiesTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       commoditiesMainSeriesControl.set('items', this.commoditiesTickers);
            //     }
            //   }

            //   // // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   // if (this.unitTrustsTickers.length === 0) {
            //   //   this.unitTrustsTickers = JSON.parse(decrypt(localStorage.getItem("unitTrustsTickers_Backup") || "", "unitTrustsTickers_Backup"))
            //   //   if (this.unitTrustsTickers.length > 0) {
            //   //     // Load All Share Names into it's Series Control
            //   //     unitTrustsMainSeriesControl.set('items', this.unitTrustsTickers);
            //   //   }
            //   // }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.winningSharesTickers.length === 0) {
            //     this.winningSharesTickers = JSON.parse(decrypt(localStorage.getItem("winningSharesTickers_Backup") || "", "winningSharesTickers_Backup"))
            //     if (this.winningSharesTickers.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       winningSharesMainSeriesControl.set('items', this.winningSharesTickers);
            //     }
            //   }

            //   // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //   if (this.allIndicatorsList.length === 0) {
            //     this.allIndicatorsList = JSON.parse(decrypt(localStorage.getItem("allIndicatorsList_Backup") || "", "allIndicatorsList_Backup"))
            //     if (this.allIndicatorsList.length > 0) {
            //       // Load All Share Names into it's Series Control
            //       comparisonControl.set('items', this.allIndicatorsList);
            //     }
            //   }


            //   if (valueSeries.get("name") === undefined || valueSeries.get("name") === '') {
            //     let myLastShareName = getLastSavedShareName(this.allIndicatorsList); //getLastSavedShareCode();
            //     if (myLastShareName != undefined || myLastShareName != '') {
            //       // Load the valueSeries with the Selected Share Code
            //       valueSeries.set("name", myLastShareName);
            //     }
            //     else {
            //       // Load the valueSeries with the Selected Share Code
            //       valueSeries.set("name", this.defaultTicker);
            //     }
            //   }

            //   // // Make sure we still load some data for the Charts even if the LastTradeArray is Nothing
            //   // if (this.arrayResponse.length > 0) {
            //   //   // Process data (convert dates and values)
            //   //   let granularity = "day";
            //   //   var processor = am5.DataProcessor.new(root, {
            //   //     dateFields: ["Date"],
            //   //     dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
            //   //     numericFields: ["Open", "High", "Low", "Close", "Volume"]
            //   //   });
            //   //   processor.processMany(this.arrayResponse);

            //   //   am5.array.each([valueSeries, volumeSeries], (item) => {
            //   //     item.data.setAll(this.arrayResponse);
            //   //   });

            //   //   //Get the last close value
            //   //   const lastClose = this.arrayResponse
            //   //     .filter((item) => item.Close)
            //   //     .map((item) => item.Close)
            //   //     .pop();

            //   //   //Draw the Last Closing Price as a Label
            //   //   createRange(lastClose, undefined, am5.color(0xff621f));

            //   //   // Make period selector refresh to default period (ytd)
                // periodSelector.selectPeriod({ timeUnit: "month", count: 12 });
                // valueSeries.events.once("datavalidated", function() {
                //   periodSelector.selectPeriod({ timeUnit: "month", count: 12 });
                // });
              // }

            //   //return;
            // }

            // hourglassanimation.play();
            // indicator.show();n

            let headers = new HttpHeaders()
            headers = headers.append('content-type','application/json')
            headers = headers.append('mode', 'cors');
            headers = headers.append('credentials', 'include');
            headers = headers.append('rejectUnauthorized', 'false');
            headers = headers.append('Authorization', 'Bearer ' + this.setToken);

            const now = new Date();
            const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
            const currentHour = now.getHours();

            // Determine if the Share is an Equity or an Indice
            const equitiesCheckResult = this.equitiesTickers.find( ({ id }) => id === ticker );
            const indicesCheckResult = this.indicesTickers.find( ({ id }) => id === ticker );
            const etfCheckResult = this.etfTickers.find( ({ id }) => id === ticker );
            const satrixcheckResult = this.satrixTickers.find( ({ id} ) => id === ticker);
            const commoditiesCheckResult = this.commoditiesTickers.find( ({ id} ) => id === ticker);
            //const unitTrustsCheckResult = this.unitTrustsTickers.find( ({ id} ) => id === ticker);

            if (indicesCheckResult != undefined) {

              // The selected Share Code is an Indice

              // let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetIndicesHistory?$orderby=Date&$select=Date,OpenInRands,HighInRands,LowInRands,Price,TotalVolume&$filter=(ShareCode eq '${ticker}' and HighInRands gt 0 and LowInRands gt 0 and Price gt 0)`;
              let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetIndicesHistory?%24orderby=Date&%24select=Date%2COpenInRands%2CHighInRands%2CLowInRands%2CPrice%2CTotalVolume&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20HighInRands%20gt%200%20and%20LowInRands%20gt%200%20and%20Price%20gt%200)`;
              const httpClient = new HttpClient(new HttpXhrBackend({
                build: () => new XMLHttpRequest()
              }));
              httpClient.get<any>(endpoint, { headers })
                .subscribe(
                  (response: { [x: string]: any; }) => {
                    this.arrayResponse = [];
                    this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                    if (this.arrayResponse.length > 0) {
                      // changeAllJSONArrayDateToUTCDateString(arrayResponse);
                      // stringResponse = JSON.stringify(arrayResponse);
                      // arrayResponse = JSON.parse(stringResponse)

                      let myStringResponse: string = '';

                      myStringResponse = JSON.stringify(this.arrayResponse);
                      myStringResponse = myStringResponse.replace(new RegExp('OpenInRands', 'g'), 'Open')
                      myStringResponse = myStringResponse.replace(new RegExp('HighInRands', 'g'), 'High')
                      myStringResponse = myStringResponse.replace(new RegExp('LowInRands', 'g'), 'Low')
                      myStringResponse = myStringResponse.replace(new RegExp('Price', 'g'), 'Close')
                      myStringResponse = myStringResponse.replace(new RegExp('TotalVolume', 'g'), 'Volume')
                      this.arrayResponse = JSON.parse(myStringResponse)

                      // Check if it's a weekday (Monday to Friday) and the time is between 09:00 and 23:59
                      if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 23.59) {

                        // Loads data for the Last Delayed Trade/Prices for the Selected Share
                        let tempArrayResponse: any[] = [];
                        let tempStringResponse: string = '';

                        //let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquitiesDelayed?%24select=DBUpdateTime%2COpen%2CHigh%2CLow%2CLastTrade%2CCumulativeVolume&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
                        let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquitiesDelayedHistory?%24select=DateUpdated%2COpen%2CHigh%2CLow%2CLastTrade%2CCumulativeVolume&%24top=1&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)&%24orderby=DateUpdated%20desc`;
                        const httpClient = new HttpClient(new HttpXhrBackend({
                          build: () => new XMLHttpRequest()
                        }));
                        httpClient.get<any>(endpoint, { headers })
                          .subscribe(
                            (response: { [x: string]: any; }) => {
                              tempArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                              if (tempArrayResponse.length > 0) {
                                tempStringResponse = JSON.stringify(tempArrayResponse);
                                tempStringResponse = tempStringResponse.replace(new RegExp('DateUpdated', 'g'), 'Date')
                                tempStringResponse = tempStringResponse.replace(new RegExp('LastTrade', 'g'), 'Close')
                                tempStringResponse = tempStringResponse.replace(new RegExp('CumulativeVolume', 'g'), 'Volume')
                                this.lastTradeArrayResponse = JSON.parse(tempStringResponse)

                                //changeAllJSONArrayDateToUTCDateString(lastTradeArrayResponse);
                                this.arrayResponse.push(this.lastTradeArrayResponse[0]);

                                // Process data (convert dates and values)
                                var processor = am5.DataProcessor.new(root, {
                                  dateFields: ["Date"],
                                  dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                                  numericFields: ["Open", "High", "Low", "Close", "Volume"]
                                });
                                processor.processMany(this.arrayResponse);

                                let seriesArrayResponse: any[] = this.arrayResponse;
                                // am5.array.each(series, function(item) {
                                //   item.data.setAll(seriesArrayResponse);
                                // });

                                if (series[0] != undefined) {
                                  series[0].data.setAll(seriesArrayResponse);
                                }
                                else {
                                  var mainSeries = stockChart.get("stockSeries");
                                  mainSeries?.data.setAll(seriesArrayResponse);
                                }

                                var volumeSeries = stockChart.get("volumeSeries")!;
                                volumeSeries.data.setAll(this.arrayResponse);


                                // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                                let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                                if (visibleClosingLabelVisible === null) {

                                  closingLabelVisibleButtonControl.set("active", true);

                                  //Get the last close value
                                  const lastClose = this.arrayResponse
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label
                                  createRange(lastClose, undefined, am5.color(0xff621f), true);

                                  localStorage.setItem("ClosingLabelVisible", "true");
                                  
                                } else if (visibleClosingLabelVisible === "true") {

                                  closingLabelVisibleButtonControl.set("active", true);

                                  //Get the last close value
                                  const lastClose = this.arrayResponse
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label
                                  createRange(lastClose, undefined, am5.color(0xff621f), true);

                                  localStorage.setItem("ClosingLabelVisible", "true");

                                } else {

                                  closingLabelVisibleButtonControl.set("active", false);

                                  //Get the last close value
                                  const lastClose = getAllEquitiesData()
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label without the Line
                                  createRange(lastClose, undefined, am5.color(0xff621f), false);

                                  // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                                  //   valueAxis.axisRanges.getIndex(i)?.dispose();
                                  // }

                                  localStorage.setItem("ClosingLabelVisible", "false");

                                }

                                // Load the User Selected Interval - Default to 1 day
                                if (this.setSeriesTypeCount === 0) {

                                  let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                                  if (chosenSwitcheritem != undefined) {
                                    if (chosenSwitcheritem == "line") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Line");
                                    } else
                                    if (chosenSwitcheritem == "candlestick") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Candles");
                                    } else
                                    if (chosenSwitcheritem == "procandlestick") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Hollow Candles");
                                    } else
                                    if (chosenSwitcheritem == "ohlc") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Sticks");
                                    }
                                  }

                                  this.setSeriesTypeCount = 1;
                                }
                              }
                            },
                            (error: any) => {
                              console.log(error);
                            })

                      } else {

                          // Process data (convert dates and values)
                          var processor = am5.DataProcessor.new(root, {
                            dateFields: ["Date"],
                            dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                            numericFields: ["Open", "High", "Low", "Close", "Volume"]
                          });
                          processor.processMany(this.arrayResponse);

                          let seriesArrayResponse: any[] = this.arrayResponse;
                          // am5.array.each(series, function(item) {
                          //   item.data.setAll(seriesArrayResponse);
                          // });

                          if (series[0] != undefined) {
                            series[0].data.setAll(seriesArrayResponse);
                          }
                          else {
                            var mainSeries = stockChart.get("stockSeries");
                            mainSeries?.data.setAll(seriesArrayResponse);
                          }

                          var volumeSeries = stockChart.get("volumeSeries")!;
                          volumeSeries.data.setAll(this.arrayResponse);


                          // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                          let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                          if (visibleClosingLabelVisible === null) {

                            closingLabelVisibleButtonControl.set("active", true);

                            //Get the last close value
                            const lastClose = this.arrayResponse
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label
                            createRange(lastClose, undefined, am5.color(0xff621f), true);

                            localStorage.setItem("ClosingLabelVisible", "true");
                            
                          } else if (visibleClosingLabelVisible === "true") {

                            closingLabelVisibleButtonControl.set("active", true);

                            //Get the last close value
                            const lastClose = this.arrayResponse
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label
                            createRange(lastClose, undefined, am5.color(0xff621f), true);

                            localStorage.setItem("ClosingLabelVisible", "true");

                          } else {

                            closingLabelVisibleButtonControl.set("active", false);

                            //Get the last close value
                            const lastClose = getAllEquitiesData()
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label without the Line
                            createRange(lastClose, undefined, am5.color(0xff621f), false);

                            // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                            //   valueAxis.axisRanges.getIndex(i)?.dispose();
                            // }

                            localStorage.setItem("ClosingLabelVisible", "false");

                          }


                          // Load the User Selected Interval - Default to 1 day
                          if (this.setSeriesTypeCount === 0) {

                            let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                            if (chosenSwitcheritem != undefined) {
                              if (chosenSwitcheritem == "line") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Line");
                              } else
                              if (chosenSwitcheritem == "candlestick") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Candles");
                              } else
                              if (chosenSwitcheritem == "procandlestick") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Hollow Candles");
                              } else
                              if (chosenSwitcheritem == "ohlc") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Sticks");
                              }
                            }

                            this.setSeriesTypeCount = 1;
                          }

                      }
                    }
                  },
                  (error: any) => {
                    console.log(error);
                  })

            }  else if (equitiesCheckResult != undefined) {

              // The selected Share Code is an Equity
              let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquitiesHistory?%24orderby=Date&%24select=Date%2COpen%2CHigh%2CLow%2CClose%2CVolume&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
              const httpClient = new HttpClient(new HttpXhrBackend({
                build: () => new XMLHttpRequest()
              }));
              httpClient.get<any>(endpoint, { headers })
                .subscribe(
                  (response: { [x: string]: any; }) => {
                    this.arrayResponse = [];
                    this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                    if (this.arrayResponse.length > 0) {

                      // Check if it's a weekday (Monday to Friday) and the time is between 09:00 and 23:59
                      if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 23.59) {

                        // changeAllJSONArrayDateToUTCDateString(arrayResponse);
                        // stringResponse = JSON.stringify(arrayResponse);
                        // arrayResponse = JSON.parse(stringResponse)

                        // Loads data for the Last Delayed Trade/Prices for the Selected Share
                        let tempArrayResponse: any[] = [];
                        let lastTradeArrayResponse: any[] = [];
                        let tempStringResponse: string = '';

                        //let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquitiesDelayed?%24select=DBUpdateTime%2COpen%2CHigh%2CLow%2CLastTrade%2CCumulativeVolume&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
                        let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetEquitiesDelayedHistory?%24select=DateUpdated%2COpen%2CHigh%2CLow%2CLastTrade%2CCumulativeVolume&%24top=1&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)&%24orderby=DateUpdated%20desc`;
                        const httpClient = new HttpClient(new HttpXhrBackend({
                          build: () => new XMLHttpRequest()
                        }));
                        httpClient.get<any>(endpoint, { headers })
                          .subscribe(
                            (response: { [x: string]: any; }) => {
                              tempArrayResponse = [];
                              tempArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                              if (tempArrayResponse.length > 0) {
                                tempStringResponse = JSON.stringify(tempArrayResponse);
                                tempStringResponse = tempStringResponse.replace(new RegExp('DateUpdated', 'g'), 'Date')
                                tempStringResponse = tempStringResponse.replace(new RegExp('LastTrade', 'g'), 'Close')
                                tempStringResponse = tempStringResponse.replace(new RegExp('CumulativeVolume', 'g'), 'Volume')
                                lastTradeArrayResponse = JSON.parse(tempStringResponse)

                                //changeAllJSONArrayDateToUTCDateString(lastTradeArrayResponse);
                                this.arrayResponse.push(lastTradeArrayResponse[0]);

                                // Process data (convert dates and values)
                                var processor = am5.DataProcessor.new(root, {
                                  dateFields: ["Date"],
                                  dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                                  numericFields: ["Open", "High", "Low", "Close", "Volume"]
                                });
                                processor.processMany(this.arrayResponse);

                                let seriesArrayResponse: any[] = this.arrayResponse;
                                // am5.array.each(series, function(item) {
                                //   item.data.setAll(seriesArrayResponse);
                                // });

                                if (series[0] != undefined) {
                                  series[0].data.setAll(seriesArrayResponse);
                                }
                                else {
                                  var mainSeries = stockChart.get("stockSeries");
                                  mainSeries?.data.setAll(seriesArrayResponse);
                                }

                                var volumeSeries = stockChart.get("volumeSeries")!;
                                volumeSeries.data.setAll(this.arrayResponse);


                                // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                                let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                                if (visibleClosingLabelVisible === null) {

                                  closingLabelVisibleButtonControl.set("active", true);

                                  //Get the last close value
                                  const lastClose = this.arrayResponse
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label
                                  createRange(lastClose, undefined, am5.color(0xff621f), true);
                                  localStorage.setItem("ClosingLabelVisible", "true");
                                  
                                } else if (visibleClosingLabelVisible === "true") {

                                  closingLabelVisibleButtonControl.set("active", true);

                                  //Get the last close value
                                  const lastClose = this.arrayResponse
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label
                                  createRange(lastClose, undefined, am5.color(0xff621f), true);

                                  localStorage.setItem("ClosingLabelVisible", "true");

                                } else {

                                  closingLabelVisibleButtonControl.set("active", false);

                                  //Get the last close value
                                  const lastClose = getAllEquitiesData()
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label without the Line
                                  createRange(lastClose, undefined, am5.color(0xff621f), false);

                                  // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                                  //   valueAxis.axisRanges.getIndex(i)?.dispose();
                                  // }

                                  localStorage.setItem("ClosingLabelVisible", "false");

                                }

                                // Load the User Selected Interval - Default to 1 day
                                if (this.setSeriesTypeCount === 0) {

                                  let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                                  if (chosenSwitcheritem != undefined) {
                                    if (chosenSwitcheritem == "line") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Line");
                                    } else
                                    if (chosenSwitcheritem == "candlestick") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Candles");
                                    } else
                                    if (chosenSwitcheritem == "procandlestick") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Hollow Candles");
                                    } else
                                    if (chosenSwitcheritem == "ohlc") {
                                      setSeriesType(chosenSwitcheritem);
                                      seriesSwitcher.setItem("Sticks");
                                    }
                                  }

                                  this.setSeriesTypeCount = 1;
                                }
                              }
                            },
                            (error: any) => {
                              console.log(error);
                            })          
                            
                      } else {

                          // Process data (convert dates and values)
                          var processor = am5.DataProcessor.new(root, {
                            dateFields: ["Date"],
                            dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                            numericFields: ["Open", "High", "Low", "Close", "Volume"]
                          });
                          processor.processMany(this.arrayResponse);

                          // Load the User Selected Interval - Default to 1 day
                          let seriesArrayResponse: any[] = this.arrayResponse;
                          // am5.array.each(series, function(item) {
                          //   item.data.setAll(seriesArrayResponse);
                          // });

                          if (series[0] != undefined) {
                            series[0].data.setAll(seriesArrayResponse);
                          }
                          else {
                            var mainSeries = stockChart.get("stockSeries");
                            mainSeries?.data.setAll(seriesArrayResponse);
                          }

                          var volumeSeries = stockChart.get("volumeSeries")!;
                          volumeSeries.data.setAll(this.arrayResponse);


                          // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                          let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                          if (visibleClosingLabelVisible === null) {

                            closingLabelVisibleButtonControl.set("active", true);

                            //Get the last close value
                            const lastClose = this.arrayResponse
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label
                            createRange(lastClose, undefined, am5.color(0xff621f), true);

                            localStorage.setItem("ClosingLabelVisible", "true");
                            
                          } else if (visibleClosingLabelVisible === "true") {

                            closingLabelVisibleButtonControl.set("active", true);

                            //Get the last close value
                            const lastClose = this.arrayResponse
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label
                            createRange(lastClose, undefined, am5.color(0xff621f), true);

                            localStorage.setItem("ClosingLabelVisible", "true");

                          } else {

                            closingLabelVisibleButtonControl.set("active", false);

                            //Get the last close value
                            const lastClose = getAllEquitiesData()
                              .filter((item) => item.Close)
                              .map((item) => item.Close)
                              .pop();

                            //Draw the Last Closing Price as a Label without the Line
                            createRange(lastClose, undefined, am5.color(0xff621f), false);

                            // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                            //   valueAxis.axisRanges.getIndex(i)?.dispose();
                            // }

                            localStorage.setItem("ClosingLabelVisible", "false");

                          }


                          // Load the User Selected Interval - Default to 1 day
                          if (this.setSeriesTypeCount === 0) {

                            let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                            if (chosenSwitcheritem != undefined) {
                              if (chosenSwitcheritem == "line") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Line");
                              } else
                              if (chosenSwitcheritem == "candlestick") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Candles");
                              } else
                              if (chosenSwitcheritem == "procandlestick") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Hollow Candles");
                              } else
                              if (chosenSwitcheritem == "ohlc") {
                                setSeriesType(chosenSwitcheritem);
                                seriesSwitcher.setItem("Sticks");
                              }
                            }

                            this.setSeriesTypeCount = 1;
                          }
                      }
                    }
                  },
                  (error: any) => {
                    console.log(error);
                  })

            } else if (etfCheckResult != undefined) {

              // The selected Share Code is an Exchange Traded Funds (ETF)

              let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetETFHistory?%24orderby=LastModifiedDate&%24select=LastModifiedDate%2COpen%2CHigh%2CLow%2CClose%2CCumulativeValue&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
              const httpClient = new HttpClient(new HttpXhrBackend({
                build: () => new XMLHttpRequest()
              }));
              httpClient.get<any>(endpoint, { headers })
                .subscribe(
                  (response: { [x: string]: any; }) => {
                    this.arrayResponse = [];
                    this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                    if (this.arrayResponse.length > 0) {
                      // changeAllJSONArrayDateToUTCDateString(arrayResponse);
                      // stringResponse = JSON.stringify(arrayResponse);
                      // arrayResponse = JSON.parse(stringResponse)

                      let myStringResponse: string = '';

                      myStringResponse = JSON.stringify(this.arrayResponse);
                      myStringResponse = myStringResponse.replace(new RegExp('LastModifiedDate', 'g'), 'Date')
                      myStringResponse = myStringResponse.replace(new RegExp('CumulativeValue', 'g'), 'Volume')
                      this.arrayResponse = JSON.parse(myStringResponse)

                      // Process data (convert dates and values)
                      var processor = am5.DataProcessor.new(root, {
                        dateFields: ["Date"],
                        dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                        numericFields: ["Open", "High", "Low", "Close", "Volume"]
                      });
                      processor.processMany(this.arrayResponse);

                      let seriesArrayResponse: any[] = this.arrayResponse;
                      // am5.array.each(series, function(item) {
                      //   item.data.setAll(seriesArrayResponse);
                      // });

                      if (series[0] != undefined) {
                        series[0].data.setAll(seriesArrayResponse);
                      }
                      else {
                        var mainSeries = stockChart.get("stockSeries");
                        mainSeries?.data.setAll(seriesArrayResponse);
                      }

                      var volumeSeries = stockChart.get("volumeSeries")!;
                      volumeSeries.data.setAll(this.arrayResponse);


                      // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                      let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                      if (visibleClosingLabelVisible === null) {

                        closingLabelVisibleButtonControl.set("active", true);

                        //Get the last close value
                        const lastClose = this.arrayResponse
                          .filter((item) => item.Close)
                          .map((item) => item.Close)
                          .pop();

                        //Draw the Last Closing Price as a Label
                        createRange(lastClose, undefined, am5.color(0xff621f), true);

                        localStorage.setItem("ClosingLabelVisible", "true");
                        
                      } else if (visibleClosingLabelVisible === "true") {

                        closingLabelVisibleButtonControl.set("active", true);

                        //Get the last close value
                        const lastClose = this.arrayResponse
                          .filter((item) => item.Close)
                          .map((item) => item.Close)
                          .pop();

                        //Draw the Last Closing Price as a Label
                        createRange(lastClose, undefined, am5.color(0xff621f), true);

                        localStorage.setItem("ClosingLabelVisible", "true");

                      } else {

                        closingLabelVisibleButtonControl.set("active", false);

                        //Get the last close value
                        const lastClose = getAllEquitiesData()
                          .filter((item) => item.Close)
                          .map((item) => item.Close)
                          .pop();

                        //Draw the Last Closing Price as a Label without the Line
                        createRange(lastClose, undefined, am5.color(0xff621f), false);

                        // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                        //   valueAxis.axisRanges.getIndex(i)?.dispose();
                        // }

                        localStorage.setItem("ClosingLabelVisible", "false");

                      }

                      // Load the User Selected Interval - Default to 1 day
                      if (this.setSeriesTypeCount === 0) {

                        let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                        if (chosenSwitcheritem != undefined) {
                          if (chosenSwitcheritem == "line") {
                            setSeriesType(chosenSwitcheritem);
                            seriesSwitcher.setItem("Line");
                          } else
                          if (chosenSwitcheritem == "candlestick") {
                            setSeriesType(chosenSwitcheritem);
                            seriesSwitcher.setItem("Candles");
                          } else
                          if (chosenSwitcheritem == "procandlestick") {
                            setSeriesType(chosenSwitcheritem);
                            seriesSwitcher.setItem("Hollow Candles");
                          } else
                          if (chosenSwitcheritem == "ohlc") {
                            setSeriesType(chosenSwitcheritem);
                            seriesSwitcher.setItem("Sticks");
                          }
                        }

                        this.setSeriesTypeCount = 1;
                      }
                    } else {

                        // Process data (convert dates and values)
                        var processor = am5.DataProcessor.new(root, {
                          dateFields: ["Date"],
                          dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                          numericFields: ["Open", "High", "Low", "Close", "Volume"]
                        });
                        processor.processMany(this.arrayResponse);

                        let seriesArrayResponse: any[] = this.arrayResponse;
                        // am5.array.each(series, function(item) {
                        //   item.data.setAll(seriesArrayResponse);
                        // });

                        if (series[0] != undefined) {
                          series[0].data.setAll(seriesArrayResponse);
                        }
                        else {
                          var mainSeries = stockChart.get("stockSeries");
                          mainSeries?.data.setAll(seriesArrayResponse);
                        }

                        var volumeSeries = stockChart.get("volumeSeries")!;
                        volumeSeries.data.setAll(this.arrayResponse);


                        // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                        let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                        if (visibleClosingLabelVisible === null) {

                          closingLabelVisibleButtonControl.set("active", true);

                          //Get the last close value
                          const lastClose = this.arrayResponse
                            .filter((item) => item.Close)
                            .map((item) => item.Close)
                            .pop();

                          //Draw the Last Closing Price as a Label
                          createRange(lastClose, undefined, am5.color(0xff621f), true);

                          localStorage.setItem("ClosingLabelVisible", "true");
                          
                        } else if (visibleClosingLabelVisible === "true") {

                          closingLabelVisibleButtonControl.set("active", true);

                          //Get the last close value
                          const lastClose = this.arrayResponse
                            .filter((item) => item.Close)
                            .map((item) => item.Close)
                            .pop();

                          //Draw the Last Closing Price as a Label
                          createRange(lastClose, undefined, am5.color(0xff621f), true);

                          localStorage.setItem("ClosingLabelVisible", "true");

                        } else {

                          closingLabelVisibleButtonControl.set("active", false);

                          //Get the last close value
                          const lastClose = getAllEquitiesData()
                            .filter((item) => item.Close)
                            .map((item) => item.Close)
                            .pop();

                          //Draw the Last Closing Price as a Label without the Line
                          createRange(lastClose, undefined, am5.color(0xff621f), false);

                          // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                          //   valueAxis.axisRanges.getIndex(i)?.dispose();
                          // }

                          localStorage.setItem("ClosingLabelVisible", "false");

                        }


                        // Load the User Selected Interval - Default to 1 day
                        if (this.setSeriesTypeCount === 0) {

                          let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                          if (chosenSwitcheritem != undefined) {
                            if (chosenSwitcheritem == "line") {
                              setSeriesType(chosenSwitcheritem);
                              seriesSwitcher.setItem("Line");
                            } else
                            if (chosenSwitcheritem == "candlestick") {
                              setSeriesType(chosenSwitcheritem);
                              seriesSwitcher.setItem("Candles");
                            } else
                            if (chosenSwitcheritem == "procandlestick") {
                              setSeriesType(chosenSwitcheritem);
                              seriesSwitcher.setItem("Hollow Candles");
                            } else
                            if (chosenSwitcheritem == "ohlc") {
                              setSeriesType(chosenSwitcheritem);
                              seriesSwitcher.setItem("Sticks");
                            }
                          }

                          this.setSeriesTypeCount = 1;
                        }

                      }
                  },
                  (error: any) => {
                    console.log(error);
                  })

            } else if (commoditiesCheckResult != undefined) {

                // The selected Share Code is a COMMODITIES

                let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetResourcesHistory?%24orderby=LastModifiedDate&%24select=LastModifiedDate%2COpen%2CHigh%2CLow%2CClose&%24filter=(ResourceCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
                const httpClient = new HttpClient(new HttpXhrBackend({
                  build: () => new XMLHttpRequest()
                }));
                httpClient.get<any>(endpoint, { headers })
                  .subscribe(
                    (response: { [x: string]: any; }) => {
                      this.arrayResponse = [];
                      this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                      if (this.arrayResponse.length > 0) {
                        // changeAllJSONArrayDateToUTCDateString(arrayResponse);
                        // stringResponse = JSON.stringify(arrayResponse);
                        // arrayResponse = JSON.parse(stringResponse)

                        let myStringResponse: string = '';

                        myStringResponse = JSON.stringify(this.arrayResponse);
                        myStringResponse = myStringResponse.replace(new RegExp('LastModifiedDate', 'g'), 'Date')
                        //myStringResponse = myStringResponse.replace(new RegExp('CumulativeValue', 'g'), 'Volume')
                        this.arrayResponse = JSON.parse(myStringResponse)

                        // Check if it's a weekday (Monday to Friday) and the time is between 09:00 and 23:59
                        if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 23.59) {

                          // Loads data for the Last Delayed Trade/Prices for the Selected Share
                          let tempArrayResponse: any[] = [];
                          let tempStringResponse: string = '';

                          let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetResourcesDelayed?%24select=LastModifiedDate%2COpen%2CHigh%2CLow%2CClose&%24top=1&%24filter=(ResourceCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)&%24orderby=LastModifiedDate%20desc`;
                          const httpClient = new HttpClient(new HttpXhrBackend({
                            build: () => new XMLHttpRequest()
                          }));
                          httpClient.get<any>(endpoint, { headers })
                            .subscribe(
                              (response: { [x: string]: any; }) => {
                                tempArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                                if (tempArrayResponse.length > 0) {
                                  tempStringResponse = JSON.stringify(tempArrayResponse);
                                  tempStringResponse = tempStringResponse.replace(new RegExp('LastModifiedDate', 'g'), 'Date')
                                  //tempStringResponse = tempStringResponse.replace(new RegExp('CumulativeValue', 'g'), 'Volume')
                                  this.lastTradeArrayResponse = JSON.parse(tempStringResponse)

                                  //changeAllJSONArrayDateToUTCDateString(lastTradeArrayResponse);
                                  this.arrayResponse.push(this.lastTradeArrayResponse[0]);

                                  // Process data (convert dates and values)
                                  var processor = am5.DataProcessor.new(root, {
                                    dateFields: ["Date"],
                                    dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                                    numericFields: ["Open", "High", "Low", "Close", "Volume"]
                                  });
                                  processor.processMany(this.arrayResponse);

                                  let seriesArrayResponse: any[] = this.arrayResponse;
                                  // am5.array.each(series, function(item) {
                                  //   item.data.setAll(seriesArrayResponse);
                                  // });

                                  if (series[0] != undefined) {
                                    series[0].data.setAll(seriesArrayResponse);
                                  }
                                  else {
                                    var mainSeries = stockChart.get("stockSeries");
                                    mainSeries?.data.setAll(seriesArrayResponse);
                                  }
  
                                  var volumeSeries = stockChart.get("volumeSeries")!;
                                  volumeSeries.data.setAll(this.arrayResponse);
  
                                  //Get the last close value
                                  const lastClose = this.arrayResponse
                                    .filter((item) => item.Close)
                                    .map((item) => item.Close)
                                    .pop();

                                  //Draw the Last Closing Price as a Label
                                  createRange(lastClose, undefined, am5.color(0xff621f), true);

                                  // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                                  let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                                  if (visibleClosingLabelVisible === null) {

                                    closingLabelVisibleButtonControl.set("active", true);

                                    //Get the last close value
                                    const lastClose = this.arrayResponse
                                      .filter((item) => item.Close)
                                      .map((item) => item.Close)
                                      .pop();

                                    //Draw the Last Closing Price as a Label
                                    createRange(lastClose, undefined, am5.color(0xff621f), true);

                                    localStorage.setItem("ClosingLabelVisible", "true");
                                    
                                  } else if (visibleClosingLabelVisible === "true") {

                                    closingLabelVisibleButtonControl.set("active", true);

                                    //Get the last close value
                                    const lastClose = this.arrayResponse
                                      .filter((item) => item.Close)
                                      .map((item) => item.Close)
                                      .pop();

                                    //Draw the Last Closing Price as a Label
                                    createRange(lastClose, undefined, am5.color(0xff621f), true);

                                    localStorage.setItem("ClosingLabelVisible", "true");

                                  } else {

                                    closingLabelVisibleButtonControl.set("active", false);

                                    //Get the last close value
                                    const lastClose = getAllEquitiesData()
                                      .filter((item) => item.Close)
                                      .map((item) => item.Close)
                                      .pop();

                                    //Draw the Last Closing Price as a Label without the Line
                                    createRange(lastClose, undefined, am5.color(0xff621f), false);

                                    // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                                    //   valueAxis.axisRanges.getIndex(i)?.dispose();
                                    // }

                                    localStorage.setItem("ClosingLabelVisible", "false");

                                  }

                                  // Load the User Selected Interval - Default to 1 day
                                  if (this.setSeriesTypeCount === 0) {

                                    let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                                    if (chosenSwitcheritem != undefined) {
                                      if (chosenSwitcheritem == "line") {
                                        setSeriesType(chosenSwitcheritem);
                                        seriesSwitcher.setItem("Line");
                                      } else
                                      if (chosenSwitcheritem == "candlestick") {
                                        setSeriesType(chosenSwitcheritem);
                                        seriesSwitcher.setItem("Candles");
                                      } else
                                      if (chosenSwitcheritem == "procandlestick") {
                                        setSeriesType(chosenSwitcheritem);
                                        seriesSwitcher.setItem("Hollow Candles");
                                      } else
                                      if (chosenSwitcheritem == "ohlc") {
                                        setSeriesType(chosenSwitcheritem);
                                        seriesSwitcher.setItem("Sticks");
                                      }
                                    }

                                    this.setSeriesTypeCount = 1;
                                  }
                                }
                              },
                              (error: any) => {
                                console.log(error);
                              })

                        } else {

                            // Process data (convert dates and values)
                            var processor = am5.DataProcessor.new(root, {
                              dateFields: ["Date"],
                              dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                              numericFields: ["Open", "High", "Low", "Close", "Volume"]
                            });
                            processor.processMany(this.arrayResponse);

                            let seriesArrayResponse: any[] = this.arrayResponse;
                            // am5.array.each(series, function(item) {
                            //   item.data.setAll(seriesArrayResponse);
                            // });

                            if (series[0] != undefined) {
                              series[0].data.setAll(seriesArrayResponse);
                            }
                            else {
                              var mainSeries = stockChart.get("stockSeries");
                              mainSeries?.data.setAll(seriesArrayResponse);
                            }

                            var volumeSeries = stockChart.get("volumeSeries")!;
                            volumeSeries.data.setAll(this.arrayResponse);


                            // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                            let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                            if (visibleClosingLabelVisible === null) {

                              closingLabelVisibleButtonControl.set("active", true);

                              //Get the last close value
                              const lastClose = this.arrayResponse
                                .filter((item) => item.Close)
                                .map((item) => item.Close)
                                .pop();

                              //Draw the Last Closing Price as a Label
                              createRange(lastClose, undefined, am5.color(0xff621f), true);

                              localStorage.setItem("ClosingLabelVisible", "true");
                              
                            } else if (visibleClosingLabelVisible === "true") {

                              closingLabelVisibleButtonControl.set("active", true);

                              //Get the last close value
                              const lastClose = this.arrayResponse
                                .filter((item) => item.Close)
                                .map((item) => item.Close)
                                .pop();

                              //Draw the Last Closing Price as a Label
                              createRange(lastClose, undefined, am5.color(0xff621f), true);

                              localStorage.setItem("ClosingLabelVisible", "true");

                            } else {

                              closingLabelVisibleButtonControl.set("active", false);

                              //Get the last close value
                              const lastClose = getAllEquitiesData()
                                .filter((item) => item.Close)
                                .map((item) => item.Close)
                                .pop();

                              //Draw the Last Closing Price as a Label without the Line
                              createRange(lastClose, undefined, am5.color(0xff621f), false);

                              // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                              //   valueAxis.axisRanges.getIndex(i)?.dispose();
                              // }

                              localStorage.setItem("ClosingLabelVisible", "false");

                            }


                            // Load the User Selected Interval - Default to 1 day
                            if (this.setSeriesTypeCount === 0) {

                              let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                              if (chosenSwitcheritem != undefined) {
                                if (chosenSwitcheritem == "line") {
                                  setSeriesType(chosenSwitcheritem);
                                  seriesSwitcher.setItem("Line");
                                } else
                                if (chosenSwitcheritem == "candlestick") {
                                  setSeriesType(chosenSwitcheritem);
                                  seriesSwitcher.setItem("Candles");
                                } else
                                if (chosenSwitcheritem == "procandlestick") {
                                  setSeriesType(chosenSwitcheritem);
                                  seriesSwitcher.setItem("Hollow Candles");
                                } else
                                if (chosenSwitcheritem == "ohlc") {
                                  setSeriesType(chosenSwitcheritem);
                                  seriesSwitcher.setItem("Sticks");
                                }
                              }

                              this.setSeriesTypeCount = 1;
                            }

                        }
                      }
                    },
                    (error: any) => {
                      console.log(error);
                    })

            } 
            else if (satrixcheckResult != undefined) {

                  // The selected Share Code is a SATRIX

                  let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetSatrixHistory?%24select=LastModifiedDate%2COpen%2CHigh%2CLow%2CClose%2CCumulativeValue&%24top=1&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)&%24orderby=LastModifiedDate%20desc`;
                  const httpClient = new HttpClient(new HttpXhrBackend({
                    build: () => new XMLHttpRequest()
                  }));
                  httpClient.get<any>(endpoint, { headers })
                    .subscribe(
                      (response: { [x: string]: any; }) => {
                        this.arrayResponse = [];
                        this.arrayResponse = JSON.parse(JSON.stringify(response["value"]))
                        if (this.arrayResponse.length > 0) {
                          // changeAllJSONArrayDateToUTCDateString(arrayResponse);
                          // stringResponse = JSON.stringify(arrayResponse);
                          // arrayResponse = JSON.parse(stringResponse)

                          let myStringResponse: string = '';

                          myStringResponse = JSON.stringify(this.arrayResponse);
                          myStringResponse = myStringResponse.replace(new RegExp('LastModifiedDate', 'g'), 'Date')
                          myStringResponse = myStringResponse.replace(new RegExp('CumulativeValue', 'g'), 'Volume')
                          this.arrayResponse = JSON.parse(myStringResponse)

                          // Check if it's a weekday (Monday to Friday) and the time is between 09:00 and 23:59
                          if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 23.59) {

                            // Loads data for the Last Delayed Trade/Prices for the Selected Share
                            let tempArrayResponse: any[] = [];
                            let tempStringResponse: string = '';

                            let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetSatrix?%24orderby=LastModifiedDate&%24select=LastModifiedDate%2COpen%2CHigh%2CLow%2CClose%2CCumulativeValue&%24filter=(ShareCode%20eq%20'${ticker}'%20and%20High%20gt%200%20and%20Low%20gt%200%20and%20Close%20gt%200)`;
                            const httpClient = new HttpClient(new HttpXhrBackend({
                              build: () => new XMLHttpRequest()
                            }));
                            httpClient.get<any>(endpoint, { headers })
                              .subscribe(
                                (response: { [x: string]: any; }) => {
                                  tempArrayResponse = JSON.parse(JSON.stringify(response["value"]))
                                  if (tempArrayResponse.length > 0) {
                                    tempStringResponse = JSON.stringify(tempArrayResponse);
                                    tempStringResponse = tempStringResponse.replace(new RegExp('LastModifiedDate', 'g'), 'Date')
                                    tempStringResponse = tempStringResponse.replace(new RegExp('CumulativeValue', 'g'), 'Volume')
                                    this.lastTradeArrayResponse = JSON.parse(tempStringResponse)

                                    //changeAllJSONArrayDateToUTCDateString(lastTradeArrayResponse);
                                    this.arrayResponse.push(this.lastTradeArrayResponse[0]);

                                    // Process data (convert dates and values)
                                    var processor = am5.DataProcessor.new(root, {
                                      dateFields: ["Date"],
                                      dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                                      numericFields: ["Open", "High", "Low", "Close", "Volume"]
                                    });
                                    processor.processMany(this.arrayResponse);

                                    let seriesArrayResponse: any[] = this.arrayResponse;
                                    // am5.array.each(series, function(item) {
                                    //   item.data.setAll(seriesArrayResponse);
                                    // });

                                    if (series[0] != undefined) {
                                      series[0].data.setAll(seriesArrayResponse);
                                    }
                                    else {
                                      var mainSeries = stockChart.get("stockSeries");
                                      mainSeries?.data.setAll(seriesArrayResponse);
                                    }
    
                                    var volumeSeries = stockChart.get("volumeSeries")!;
                                    volumeSeries.data.setAll(this.arrayResponse);
    

                                    // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                                    let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                                    if (visibleClosingLabelVisible === null) {

                                      closingLabelVisibleButtonControl.set("active", true);

                                      //Get the last close value
                                      const lastClose = this.arrayResponse
                                        .filter((item) => item.Close)
                                        .map((item) => item.Close)
                                        .pop();

                                      //Draw the Last Closing Price as a Label
                                      createRange(lastClose, undefined, am5.color(0xff621f), true);

                                      localStorage.setItem("ClosingLabelVisible", "true");
                                      
                                    } else if (visibleClosingLabelVisible === "true") {

                                      closingLabelVisibleButtonControl.set("active", true);

                                      //Get the last close value
                                      const lastClose = this.arrayResponse
                                        .filter((item) => item.Close)
                                        .map((item) => item.Close)
                                        .pop();

                                      //Draw the Last Closing Price as a Label
                                      createRange(lastClose, undefined, am5.color(0xff621f), true);

                                      localStorage.setItem("ClosingLabelVisible", "true");

                                    } else {

                                      closingLabelVisibleButtonControl.set("active", false);

                                      //Get the last close value
                                      const lastClose = getAllEquitiesData()
                                        .filter((item) => item.Close)
                                        .map((item) => item.Close)
                                        .pop();

                                      //Draw the Last Closing Price as a Label without the Line
                                      createRange(lastClose, undefined, am5.color(0xff621f), false);

                                      // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                                      //   valueAxis.axisRanges.getIndex(i)?.dispose();
                                      // }

                                      localStorage.setItem("ClosingLabelVisible", "false");

                                    }

                                    // Load the User Selected Interval - Default to 1 day
                                    if (this.setSeriesTypeCount === 0) {

                                      let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                                      if (chosenSwitcheritem != undefined) {
                                        if (chosenSwitcheritem == "line") {
                                          setSeriesType(chosenSwitcheritem);
                                          seriesSwitcher.setItem("Line");
                                        } else
                                        if (chosenSwitcheritem == "candlestick") {
                                          setSeriesType(chosenSwitcheritem);
                                          seriesSwitcher.setItem("Candles");
                                        } else
                                        if (chosenSwitcheritem == "procandlestick") {
                                          setSeriesType(chosenSwitcheritem);
                                          seriesSwitcher.setItem("Hollow Candles");
                                        } else
                                        if (chosenSwitcheritem == "ohlc") {
                                          setSeriesType(chosenSwitcheritem);
                                          seriesSwitcher.setItem("Sticks");
                                        }
                                      }

                                      this.setSeriesTypeCount = 1;
                                    }
                                  }
                                },
                                (error: any) => {
                                  console.log(error);
                                })

                          } else {

                              // Process data (convert dates and values)
                              var processor = am5.DataProcessor.new(root, {
                                dateFields: ["Date"],
                                dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                                numericFields: ["Open", "High", "Low", "Close", "Volume"]
                              });
                              processor.processMany(this.arrayResponse);

                              let seriesArrayResponse: any[] = this.arrayResponse;
                              // am5.array.each(series, function(item) {
                              //   item.data.setAll(seriesArrayResponse);
                              // });

                              if (series[0] != undefined) {
                                series[0].data.setAll(seriesArrayResponse);
                              }
                              else {
                                var mainSeries = stockChart.get("stockSeries");
                                mainSeries?.data.setAll(seriesArrayResponse);
                              }

                              var volumeSeries = stockChart.get("volumeSeries")!;
                              volumeSeries.data.setAll(this.arrayResponse);


                              // This will check to see if the user wants the Closing Label Visible when the Browser is Loaded/Reloaded
                              let visibleClosingLabelVisible = localStorage.getItem("ClosingLabelVisible");
                              if (visibleClosingLabelVisible === null) {

                                closingLabelVisibleButtonControl.set("active", true);

                                //Get the last close value
                                const lastClose = this.arrayResponse
                                  .filter((item) => item.Close)
                                  .map((item) => item.Close)
                                  .pop();

                                //Draw the Last Closing Price as a Label
                                createRange(lastClose, undefined, am5.color(0xff621f), true);

                                localStorage.setItem("ClosingLabelVisible", "true");
                                
                              } else if (visibleClosingLabelVisible === "true") {

                                closingLabelVisibleButtonControl.set("active", true);

                                //Get the last close value
                                const lastClose = this.arrayResponse
                                  .filter((item) => item.Close)
                                  .map((item) => item.Close)
                                  .pop();

                                //Draw the Last Closing Price as a Label
                                createRange(lastClose, undefined, am5.color(0xff621f), true);

                                localStorage.setItem("ClosingLabelVisible", "true");

                              } else {

                                closingLabelVisibleButtonControl.set("active", false);

                                //Get the last close value
                                const lastClose = getAllEquitiesData()
                                  .filter((item) => item.Close)
                                  .map((item) => item.Close)
                                  .pop();

                                //Draw the Last Closing Price as a Label without the Line
                                createRange(lastClose, undefined, am5.color(0xff621f), false);

                                // for (let i = 0; i < valueAxis.axisRanges.length; i++) {
                                //   valueAxis.axisRanges.getIndex(i)?.dispose();
                                // }

                                localStorage.setItem("ClosingLabelVisible", "false");

                              }


                              // Load the User Selected Interval - Default to 1 day
                              if (this.setSeriesTypeCount === 0) {

                                let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
                                if (chosenSwitcheritem != undefined) {
                                  if (chosenSwitcheritem == "line") {
                                    setSeriesType(chosenSwitcheritem);
                                    seriesSwitcher.setItem("Line");
                                  } else
                                  if (chosenSwitcheritem == "candlestick") {
                                    setSeriesType(chosenSwitcheritem);
                                    seriesSwitcher.setItem("Candles");
                                  } else
                                  if (chosenSwitcheritem == "procandlestick") {
                                    setSeriesType(chosenSwitcheritem);
                                    seriesSwitcher.setItem("Hollow Candles");
                                  } else
                                  if (chosenSwitcheritem == "ohlc") {
                                    setSeriesType(chosenSwitcheritem);
                                    seriesSwitcher.setItem("Sticks");
                                  }
                                }

                                this.setSeriesTypeCount = 1;
                              }

                          }
                        }
                      },
                      (error: any) => {
                        console.log(error);
                      })

            } 
            // else {

            //     // If an Unexpected issue arrises, Try to Restore All Share codes from their Backup.

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.equitiesTickers.length === 0) {
            //       this.equitiesTickers = JSON.parse(decrypt(localStorage.getItem("equitiesTickers_Backup") || "", "equitiesTickers_Backup"))
            //       if (this.equitiesTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         equitiesMainSeriesControl.set('items', this.equitiesTickers);
            //       }
            //     }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.indicesTickers.length === 0) {
            //       this.indicesTickers = JSON.parse(decrypt(localStorage.getItem("indicesTickers_Backup") || "", "indicesTickers_Backup"))
            //       if (this.indicesTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         indicesMainSeriesControl.set('items', this.indicesTickers);
            //       }
            //     }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.etfTickers.length === 0) {
            //       this.etfTickers = JSON.parse(decrypt(localStorage.getItem("etfTickers_Backup") || "", "etfTickers_Backup"))
            //       if (this.etfTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         ETFMainSeriesControl.set('items', this.etfTickers);
            //       }
            //     }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.satrixTickers.length === 0) {
            //       this.satrixTickers = JSON.parse(decrypt(localStorage.getItem("satrixTickers_Backup") || "", "satrixTickers_Backup"))
            //       if (this.satrixTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         satrixMainSeriesControl.set('items', this.satrixTickers);
            //       }
            //     }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.commoditiesTickers.length === 0) {
            //       this.commoditiesTickers = JSON.parse(decrypt(localStorage.getItem("commoditiesTickers_Backup") || "", "commoditiesTickers_Backup"))
            //       if (this.commoditiesTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         commoditiesMainSeriesControl.set('items', this.commoditiesTickers);
            //       }
            //     }

            //     // // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     // if (this.unitTrustsTickers.length === 0) {
            //     //   this.unitTrustsTickers = JSON.parse(decrypt(localStorage.getItem("unitTrustsTickers_Backup") || "", "unitTrustsTickers_Backup"))
            //     //   if (this.unitTrustsTickers.length > 0) {
            //     //     // Load All Share Names into it's Series Control
            //     //     unitTrustsMainSeriesControl.set('items', this.unitTrustsTickers);
            //     //   }
            //     // }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.winningSharesTickers.length === 0) {
            //       this.winningSharesTickers = JSON.parse(decrypt(localStorage.getItem("winningSharesTickers_Backup") || "", "winningSharesTickers_Backup"))
            //       if (this.winningSharesTickers.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         winningSharesMainSeriesControl.set('items', this.winningSharesTickers);
            //       }
            //     }

            //     // Restore from a Backup because sometimes the Callback Delay can interfear with the Populating of this list before it Loads the Data
            //     if (this.allIndicatorsList.length === 0) {
            //       this.allIndicatorsList = JSON.parse(decrypt(localStorage.getItem("allIndicatorsList_Backup") || "", "allIndicatorsList_Backup"))
            //       if (this.allIndicatorsList.length > 0) {
            //         // Load All Share Names into it's Series Control
            //         comparisonControl.set('items', this.allIndicatorsList);
            //       }
            //     }


            //     if (valueSeries.get("name") != undefined || valueSeries.get("name") != '') {
            //       // Load data for all series (main series + comparisons)
            //       const promises: any[] = [];
            //       promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //         am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //           promises.push(loadData(series.get("name")!, [series], "day"));
            //       });

            //       // // set data to all series
            //       // valueSeries.data.setAll(this.arrayResponse);
            //       // volumeSeries.data.setAll(this.arrayResponse);
            //       // //sbSeries.data.setAll(this.arrayResponse);
            //       // am5.array.each([valueSeries, volumeSeries], (item) => {
            //       //   item.data.setAll(this.arrayResponse);
            //       // });
            //     } else {
            //       let myLastShare = getLastSavedShareCode().toString();
            //       if (myLastShare != undefined || myLastShare != '') {
            //         // Load data for all series (main series + comparisons)
            //         const promises: any[] = [];
            //         promises.push(loadData(myLastShare, [valueSeries, volumeSeries], "day"))
            //           am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //             promises.push(loadData(series.get("name")!, [series], "day"));
            //         });
            //       }
            //       else {
            //         // Load data for all series (main series + comparisons)
            //         const promises: any[] = [];
            //         promises.push(loadData(this.defaultTicker, [valueSeries, volumeSeries], "day"))
            //           am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //             promises.push(loadData(series.get("name")!, [series], "day"));
            //         });
            //       }
            //     }
            // }


            // Find and/or Set the Last Saved Share Name based on the Last Saved Share Code otherwise set it to the Default
            let findMyLastShareName = getLastSavedShareNameInternally().toString() || this.defaultTickerName;
            if (findMyLastShareName != undefined || findMyLastShareName != '') {
              valueSeries.set("name", findMyLastShareName);

              // Save the Selected Share Name
              localStorage.setItem("myLastShareName", encrypt(findMyLastShareName, "myLastShareName"));
            } else {
              localStorage.setItem("myLastShareName", encrypt(getLastSavedShareCode().toString(), "myLastShareName"));
            }


            // // Make sure the Period does not change when the Auto-Refresh/Timer executes
            // if (getSkipPeriodonTimerReload() === "0") {

            //   // Get the User Saved Period for the periodSelector - Default is 1 year
            //   // var userSelectedPeriod = localStorage.getItem("periodSelector");
            //   // if (userSelectedPeriod == "month1") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 1, name: "1M" };
            //   // } else 
            //   // if (userSelectedPeriod == "month3") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 3, name: "3M" };
            //   // } else
            //   // if (userSelectedPeriod == "month6") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 6, name: "6M" };
            //   // } else
            //   // if (userSelectedPeriod == "ytd") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "ytd", name: "YTD" };
            //   // } else
            //   // if (userSelectedPeriod == "month12") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 12, name: "1Y" };
            //   // } else
            //   // if (userSelectedPeriod == "month24") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 24, name: "2Y" };
            //   // } else
            //   // if (userSelectedPeriod == "month60") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "month", count: 60, name: "5Y" };
            //   // } else
            //   // if (userSelectedPeriod == "max") {
            //   //   this.setUserSelectedPeriod = { timeUnit: "max", name: "Max" };
            //   // }

            //   // // Set the Selected Period the user choose, otherwise set the Default
            //   // periodSelector.selectPeriod(this.setUserSelectedPeriod);

            // }


          //   // Make sure we still load some data for the Charts even if the LastTradeArray is Nothing
          //   if (this.arrayResponse.length > 0) {

          //     if (this.lastTradeArrayResponse.length === undefined || this.lastTradeArrayResponse.length === 0) {

          //       // Process data (convert dates and values)
          //       let granularity = "day";
          //       var processor = am5.DataProcessor.new(root, {
          //         dateFields: ["Date"],
          //         dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
          //         numericFields: ["Open", "High", "Low", "Close", "Volume"]
          //       });
          //       processor.processMany(this.arrayResponse);

          //       // am5.array.each([valueSeries, volumeSeries], (item) => {
          //       //   item.data.setAll(this.arrayResponse);
          //       // });

          //       if (valueSeries != undefined) {
          //         valueSeries.data.setAll(this.arrayResponse);
          //       }
          //       else {
          //         var mainSeries = stockChart.get("stockSeries");
          //         mainSeries?.data.setAll(this.arrayResponse);
          //       }

          //       if (volumeSeries != undefined) {
          //         volumeSeries.data.setAll(this.arrayResponse);
          //       }
          //       else {
          //         var mainSeries = stockChart.get("stockSeries");
          //         mainSeries?.data.setAll(this.arrayResponse);
          //       }
          //     }


          //     // Load Any Saved Drawings
          //     this.setDrawingsOn("false");
          //     drawingControl.set("active", false);

          //     // drawingControl.clearDrawings();
          //     let getSavedDrawingsData = localStorage.getItem("myDrawings_" + ticker) || "";
          //     if (getSavedDrawingsData.length > 0) {
          //       //drawingControl.unserializeDrawings(JSON.parse(getSavedDrawingsData));

          //       // let myDrawingsData = JSON.parse(decrypt(getSavedDrawingsData, "myDrawings_" + ticker) || "");
          //       let myDrawingsData = JSON.parse(getSavedDrawingsData || "");
          //       try {
          //         drawingControl.unserializeDrawings(myDrawingsData);

          //         //periodSelector.selectPeriod(getUserSelectedPeriod());
          //       } catch (error) {
          //         //console.log(error);
          //       }
          //     }

          //   }

          // }

            // Make sure we still load some data for the Charts even if the LastTradeArray is Nothing
            if (this.arrayResponse.length > 0) {
              if (this.lastTradeArrayResponse.length === undefined || this.lastTradeArrayResponse.length === 0) {

                // Process data (convert dates and values)
                let granularity = "day";
                var processor = am5.DataProcessor.new(root, {
                  dateFields: ["Date"],
                  dateFormat: granularity == "minute" ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd",
                  numericFields: ["Open", "High", "Low", "Close", "Volume"]
                });
                processor.processMany(this.arrayResponse);

                // am5.array.each([valueSeries, volumeSeries], (item) => {
                //   item.data.setAll(this.arrayResponse);
                // });

              }
            }

            if (valueSeries != undefined) {
              valueSeries.data.setAll(this.arrayResponse);
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(this.arrayResponse);
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(this.arrayResponse);
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(this.arrayResponse);
            }

            // Load Any Saved Drawings
            this.setDrawingsOn("false");
            drawingControl.set("active", false);

            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {

              let comparisonAdded = getComparisonAdded();
              if (comparisonAdded == '0') {

                let getSavedDrawingsData = localStorage.getItem("myDrawings_" + ticker) || "";
                if (getSavedDrawingsData.length > 0) {
                  drawingControl.clearDrawings();
                  //drawingControl.unserializeDrawings(JSON.parse(getSavedDrawingsData));
  
                  // let myDrawingsData = JSON.parse(decrypt(getSavedDrawingsData, "myDrawings_" + ticker) || "");
                  let myDrawingsData = JSON.parse(getSavedDrawingsData || "");
                  try {
                    drawingControl.unserializeDrawings(myDrawingsData);
  
                    periodSelector.selectPeriod(getUserSelectedPeriod());
                  } catch (error) {
                    //console.log(error);
                  }
                } else {
                  drawingControl.clearDrawings();

                  // Make period selector refresh to default period (ytd)
                  if (periodSelector != undefined) {
                    periodSelector.selectPeriod(getUserSelectedPeriod());
                  }
            }

              }

            } 
            // else {

            //   if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
            //     if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {

            //       let getSavedDrawingsData = localStorage.getItem("myDrawings_" + getLastSavedShareCode()) || "";
            //       if (getSavedDrawingsData.length > 0) {
            //         drawingControl.clearDrawings();
            //       }
            //     }
            //   }

            // }

            // stockChart.panels.each((panel) => {
            //   if (panel.series.length == 5) {
            //     if (getSavedDrawingsData.length > 0) {
            //       let myDrawingsData = JSON.parse(getSavedDrawingsData || "");
            //       try {
            //         drawingControl.unserializeDrawings(myDrawingsData);
            //       } catch (error) {
            //         //console.log(error);
            //       }
            //     }
            //   }
            // });          
          }


          // Set up main Equities selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var equitiesMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Equities", // valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true ,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var list = getEquitiesTicker(query);

              if (list != undefined ) {
                am5.array.each(list, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
              } else {
                list = getAllEquitiesTickers();
              }

              return list;
            }
          });

          // equitiesMainSeriesControl.events.on("click", function(ev) {
          //   console.log(ev);
          // });

          // stockChart.events.on("click", function(ev) {
          //   //toggleSidebarMenu(false);
          //   // console.log(ev);

          //   // const selectedDrawingTool = stockChart.toolsContainer.children.getIndex(ev.point.x);
          // });

          // valueSeries.events.on("click", function(ev) {
          //   console.log(ev);
          // });

          // valueAxis.events.on("click", function(ev) {
          //   console.log(ev);
          // });

          // // Create a custom button for the Eraser tool
          // const eraserButton = .addButton("Eraser");
          // eraserButton.events.on("click", function () {
          //   // Get the selected drawing tool (e.g., Ruler or TrendLine)
          //   const selectedDrawingTool = stockChart.toolsContainer.children

          //   // Check if there is a selected item
          //   if (selectedDrawingTool.selected) {
          //     // Remove the selected drawing item
          //     selectedDrawingTool.selected.dispose();
          //   }
          // });


          equitiesMainSeriesControl.events.on("selected", function(ev) {
            
            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {
              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //equitiesMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // var setComparedSeriesData = stockChart.getPrivate("comparedSeries");
            // if (setComparedSeriesData != undefined) {
            //   const promises: any[] = [];
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //          promises.push(loadData(series.get("name")!, [series], "day"));
            //   });
            // }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });



          // Set up main Indices selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var indicesMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Indices", //valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listIndices = getIndicesTicker(query);

              if (listIndices != undefined ) {
                am5.array.each(listIndices, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
              } else {
                listIndices = getAllIndicesTickers();
              }

              return listIndices;
            }
          });

          indicesMainSeriesControl.events.on("selected", function(ev) {

            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {
              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //indicesMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);
            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });


          // Set up main Exchange Traded Funds (ETF) selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var ETFMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "ETF", //valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listETF = getETFTicker(query);

              if (listETF != undefined ) {
                am5.array.each(listETF, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
              } else {
                listETF = getAllETFTickers();
              }

              return listETF;
            }
          });

          ETFMainSeriesControl.events.on("selected", function(ev) {

            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {
              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //ETFMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });


          // Set up main Exchange SATRIX selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var satrixMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Satrix", //valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listSatrix = getSatrixTicker(query);

              if (listSatrix != undefined ) {
                am5.array.each(listSatrix, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
              } else {
                listSatrix = getAllSatrixTickers();
              }

              return listSatrix;
            }
          });

          satrixMainSeriesControl.events.on("selected", function(ev) {

            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {
              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //satrixMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });


          // Set up main Exchange COMMODITIES selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var commoditiesMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Commodities", //valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listCommodities = getCommoditiesTicker(query);

              if (listCommodities != undefined ) {
                am5.array.each(listCommodities, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
              } else {
                listCommodities = getAllCommoditiesTickers();
              }

              return listCommodities;
            }
          });

          commoditiesMainSeriesControl.events.on("selected", function(ev) {

            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {
              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //commoditiesMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });


          // // Set up main Exchange UNIT TRUSTS selector
          // // -------------------------------------------------------------------------------
          // // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          // var unitTrustsMainSeriesControl = am5stock.DropdownListControl.new(root, {
          //   stockChart: stockChart,
          //   name: "UnitTrusts", //valueSeries.get("name"),
          //   icon: am5stock.StockIcons.getIcon("Search"),
          //   maxSearchItems: 2000,
          //   fixedLabel: true,
          //   searchable: true,
          //   scrollable: true,
          //   searchCallback: function(query) {
          //     var mainSeries = stockChart.get("stockSeries");
          //     var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
          //     var listUnitTrusts = getUnitTrustsTicker(query);

          //     if (listUnitTrusts != undefined ) {
          //       am5.array.each(listUnitTrusts, function(item) {
          //         if (item.label == mainSeriesID) {
          //           (item as am5stock.IDropdownListItem).disabled = true;
          //         } else {
          //           (item as am5stock.IDropdownListItem).disabled = false;
          //         }
          //       })
          //     } else {
          //       listUnitTrusts = getAllUnitTrustsTickers();
          //     }

          //     return listUnitTrusts;
          //   }
          // });

          // unitTrustsMainSeriesControl.events.on("selected", function(ev) {

          //   var valueSeries = stockChart.get("stockSeries")!;
          //   var volumeSeries = stockChart.get("volumeSeries")!;
            
          //   // Switch the Tooltip Off
          //   valueSeries.remove("tooltip");
          //   myTooltipButtonControl.set("active", false);

          //   //unitTrustsMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

          //   // Save the Selected Share Code
          //   localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

          //   // Save the Selected Share Name
          //   localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

          //   // Load the valueSeries with the Selected Share Code
          //   valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
          //   //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

          //   // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
          //   setLoadSeriesTypeCount();

          //   // Load data for all series (main series + comparisons)
          //   const promises: any[] = [];
          //   promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
          //     am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
          //       promises.push(loadData(series.get("name")!, [series], "day"));
          //   });

          //   periodSelector.selectPeriod(getUserSelectedPeriod());
          //   // // Make period selector refresh to default period (ytd)
          //   // valueSeries.events.once("datavalidated", function() {
          //   //   periodSelector.selectPeriod(setUserSelectedPeriod);
          //   // });
          // });


          // Set up main winningShares selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var winningSharesMainSeriesControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Winning Shares", //valueSeries.get("name"),
            icon: am5stock.StockIcons.getIcon("Search"),
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listWinningShares = getWinningSharesTicker(query);

              if (listWinningShares != undefined ) {
                am5.array.each(listWinningShares, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
                // if (listWinningShares.length === 0) {
                //   listWinningShares = getWinningSharesList();
                // }
              } else {
                listWinningShares = getAllWinningSharesTickers();
              }

              return listWinningShares;
            }
          });

          winningSharesMainSeriesControl.events.on("selected", function(ev) {

            var valueSeries = stockChart.get("stockSeries")!;
            var volumeSeries = stockChart.get("volumeSeries")!;
            
            let comparisonAdded = getComparisonAdded();
            if (comparisonAdded == '0') {

              if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              }
  
            }

            // Switch the Tooltip Off
            valueSeries.remove("tooltip");
            myTooltipButtonControl.set("active", false);

            //winningSharesMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

            // Save the Selected Share Code
            localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

            // Save the Selected Share Name
            localStorage.setItem("myLastShareName", encrypt((ev.item as am5stock.IDropdownListItem).label, "myLastShareName"));

            // Load the valueSeries with the Selected Share Code
            valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).label);
            //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

            // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
            //setLoadSeriesTypeCount();

            // Load data for all series (main series + comparisons)
            // const promises: any[] = [];
            // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
            //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
            //     promises.push(loadData(series.get("name")!, [series], "day"));
            // });

            loadData(valueSeries.get("name") as string, [valueSeries], "day");
            if (valueSeries != undefined) {
              valueSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            if (volumeSeries != undefined) {
              volumeSeries.data.setAll(getAllEquitiesData());
            }
            else {
              var mainSeries = stockChart.get("stockSeries");
              mainSeries?.data.setAll(getAllEquitiesData());
            }

            // periodSelector.selectPeriod(getUserSelectedPeriod());
            // // Make period selector refresh to default period (ytd)
            periodSelector.selectPeriod(getUserSelectedPeriod());
            // valueSeries.events.once("datavalidated", function() {
            //   periodSelector.selectPeriod(setUserSelectedPeriod);
            // });
          });



          // Set up main Watchlist selector
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          var watchlistDropdownControl = am5stock.DropdownListControl.new(root, {
            stockChart: stockChart,
            name: "Watchlist", //valueSeries.get("name"),
            //icon: am5stock.StockIcons.getIcon("Search"),
            //maxSearchItems: 20,
            fixedLabel: true,
            scrollable: true,
            //searchable: true,
          //   searchCallback: function(query) {
          //     var mainSeries = stockChart.get("stockSeries");
          //     var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
          //     var listIndices = getIndicesTicker(query);
          //     am5.array.each(listIndices, function(item) {
          //       if (item.id == mainSeriesID) {
          //         (item as am5stock.IDropdownListItem).disabled = true;
          //       } else {
          //         (item as am5stock.IDropdownListItem).disabled = false;
          //       }
          //     })
          //     return listIndices;
          //   }
          });


          // Load the Saved Watchlist
          let getSavedWatchlistData = localStorage.getItem("myWatchlist") || "";
          if (getSavedWatchlistData.length > 0) {
            let myWatchlistData = JSON.parse(decrypt(getSavedWatchlistData, "myWatchlist") || "");
            try {
              this.watchlistTickers = [];
              this.watchlistTickers = myWatchlistData;
              watchlistDropdownControl.set('items', myWatchlistData);
            } catch (error) {
              console.log(error);
            }
          }

          // Adding our default functionality items
          if (this.watchlistTickers.length === 0) {
            let watchlistMenuItem = {
              id: "myWatchlistName1",
              label: "Watchlist 1",
              subLabel: "",
              className: "am5stock-list-info am5stock-list-heading"
            };

            // Add the Watchlist menu items
            this.watchlistTickers = JSON.parse(JSON.stringify(watchlistMenuItem));

            // Add the Watchlist menu items
            this.watchlistTickers = [watchlistMenuItem];

            // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
            //this.allWatchlistTickers = this.allIndicatorsList;

            // Update the working Internal Watchlist
            this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

            // Save the Selected Share to myWatchlist LocalStorage
            localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

            // Update the Items in the Watchlist
            watchlistDropdownControl.set('items', JSON.parse(JSON.stringify(this.watchlistTickers)));

          } else {

            // Update the Old Style to the New Watchlist Style if necessary
            const menuIndex1 = this.watchlistTickers.findIndex((item) => item.id === "headingOptions");
            if (menuIndex1 !== -1) {
              this.watchlistTickers.splice(menuIndex1, 1);
            }
  
            // Update the Old Style to the New Watchlist Style if necessary
            const menuIndex2 = this.watchlistTickers.findIndex((item) => item.id === "addToWatchlist");
            if (menuIndex2 !== -1) {
              this.watchlistTickers.splice(menuIndex2, 1);
            }
  
            // Update the Old Style to the New Watchlist Style if necessary
            const menuIndex3 = this.watchlistTickers.findIndex((item) => item.id === "removeFromWatchlist");
            if (menuIndex3 !== -1) {
              this.watchlistTickers.splice(menuIndex3, 1);
            }
  
            // Update the Old Style to the New Watchlist Style if necessary
            const menuIndex4 = this.watchlistTickers.findIndex((item) => item.id === "headingSharesList");
            if (menuIndex4 !== -1) {
              this.watchlistTickers.splice(menuIndex4, 1);
            }
  

            // Update the Old Style to the New Watchlist Style if necessary
            const newMenuIndex1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
            if (newMenuIndex1 === -1) {
              let watchlistMenuItem = {
                id: "myWatchlistName1",
                label: "Watchlist 1",
                subLabel: "",
                className: "am5stock-list-info am5stock-list-heading"
              };
  
              this.myWatchlist1Tickers = this.watchlistTickers;

              // Save the Selected Internal Watchlist for Watchlist 1
              localStorage.setItem("myWatchlist1Tickers", encrypt(JSON.stringify(this.myWatchlist1Tickers), "myWatchlist1Tickers"));

              // Add the Watchlist menu items
              this.watchlistTickers = [watchlistMenuItem, ...this.watchlistTickers];
            }
  
            // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
            this.allWatchlistTickers = this.allIndicatorsList;

            // Update the working Internal Watchlist
            this.watchlistService.updateInternalWatchlist(this.allWatchlistTickers);

            // Get the Selected Internal Watchlist for Watchlist 1
            let getSavedWatchlistData1 = localStorage.getItem("myWatchlist1Tickers") || "";
            if (getSavedWatchlistData1.length > 0) {
              let myWatchlist1Data = JSON.parse(decrypt(getSavedWatchlistData1, "myWatchlist1Tickers") || "");
              this.myWatchlist1Tickers = [];
              this.myWatchlist1Tickers = myWatchlist1Data;
            }

            // Get the Selected Internal Watchlist for Watchlist 2
            let getSavedWatchlistData2 = localStorage.getItem("myWatchlist2Tickers") || "";
            if (getSavedWatchlistData2.length > 1) {
              let myWatchlist2Data = JSON.parse(decrypt(getSavedWatchlistData2, "myWatchlist2Tickers") || "");
              this.myWatchlist2Tickers = [];
              this.myWatchlist2Tickers = myWatchlist2Data;
            }

            // Get the Selected Internal Watchlist for Watchlist 3
            let getSavedWatchlistData3 = localStorage.getItem("myWatchlist3Tickers") || "";
            if (getSavedWatchlistData3.length > 1) {
              let myWatchlist3Data = JSON.parse(decrypt(getSavedWatchlistData3, "myWatchlist3Tickers") || "");
              this.myWatchlist3Tickers = [];
              this.myWatchlist3Tickers = myWatchlist3Data;
            }

            // Get the Selected Internal Watchlist for Watchlist 4
            let getSavedWatchlistData4 = localStorage.getItem("myWatchlist4Tickers") || "";
            if (getSavedWatchlistData4.length > 1) {
              let myWatchlist4Data = JSON.parse(decrypt(getSavedWatchlistData4, "myWatchlist4Tickers") || "");
              this.myWatchlist4Tickers = [];
              this.myWatchlist4Tickers = myWatchlist4Data;
            }

            // Get the Selected Internal Watchlist for Watchlist 5
            let getSavedWatchlistData5 = localStorage.getItem("myWatchlist5Tickers") || "";
            if (getSavedWatchlistData5.length > 1) {
              let myWatchlist5Data = JSON.parse(decrypt(getSavedWatchlistData5, "myWatchlist5Tickers") || "");
              this.myWatchlist5Tickers = [];
              this.myWatchlist5Tickers = myWatchlist5Data;
            }

            // Save the Selected Share to myWatchlist LocalStorage
            localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

            // Update the Items in the Watchlist
            watchlistDropdownControl.set('items', JSON.parse(JSON.stringify(this.watchlistTickers)));

          }

          const sortAlph = (a: any, b: any) => {
              if (a.id === "headingOptions") {
                return 0;
              }

              if (a.id === "addToWatchlist") {
                return 0;
              }

              if (a.id === "removeFromWatchlist") {
                return 0;
              }

              if (a.id === "headingSharesList") {
                return 0;
              }

              if (a.id === "myWatchlistName1") {
                return 0;
              }

              if (a.id === "myWatchlistName2") {
                return 0;
              }

              if (a.id === "myWatchlistName3") {
                return 0;
              }

              if (a.id === "myWatchlistName4") {
                return 0;
              }

              if (a.id === "myWatchlistName5") {
                return 0;
              }

              if (a.label != undefined && b.label != undefined) {

                if (a.label.toLowerCase() > b.label.toLowerCase()) {
                  return 1;
                }

                if (a.label.toLowerCase() < b.label.toLowerCase()) {
                  return -1;
                }

              } else {
                
                if (a.id != undefined && b.id != undefined) { 

                  if (a.id.toLowerCase() > b.id.toLowerCase()) {
                    return 1;
                  }
  
                  if (a.id.toLowerCase() < b.id.toLowerCase()) {
                    return -1;
                  }
  
                }

              }

              return 0;
          }

          // Get the selected item from the Equities List to the Watchlist if they have not Already been added.
          const manageWatchlistItem = (itemData: any) => {

            let itemSelected = itemData.item;
            var main = stockChart.get("stockSeries") as any;
            var selectedLabel = main.get("name");

            // It the selected Menu/Dropdown Item is a Hearder Item, Just Exit
            if (itemSelected.id === "headingOptions" || itemSelected.id === "addToWatchlist" ||
                itemSelected.id === "removeFromWatchlist" || itemSelected.id === "headingSharesList" ||
                itemSelected.id === "myWatchlistName1" || itemSelected.id === "myWatchlistName2" ||
                itemSelected.id === "myWatchlistName3" || itemSelected.id === "myWatchlistName4" ||
                itemSelected.id === "myWatchlistName5") {
              return ;
            }

            if (itemSelected.id === "addToWatchlist") {
              const found = this.watchlistTickers.find((itemName) => {
                if (itemName.id != "headingOptions" || itemName.id != "addToWatchlist" ||
                    itemName.id != "removeFromWatchlist" || itemName.id != "headingSharesList") {
                      return itemName.id === selectedLabel;
                    } else {
                      return undefined;
                    }
              });

              if (found === undefined) {
                const equitiesCheckResult = this.equitiesTickers.find( ({ id }) => id === selectedLabel );
                const indicesCheckResult = this.indicesTickers.find( ({ id }) => id === selectedLabel );
                const etfCheckResult = this.etfTickers.find( ({ id }) => id === selectedLabel );
                const satrixCheckResult = this.satrixTickers.find( ({ id} ) => id === selectedLabel);
                const commoditiesCheckResult = this.commoditiesTickers.find( ({ id} ) => id === selectedLabel);

                if (equitiesCheckResult != undefined) {

                  let currentShare = {
                    id: equitiesCheckResult.id,
                    label: equitiesCheckResult.label,
                    subLabel: "",
                    className: ""
                  };

                  // Add and Update the Watchlist menu items
                  this.watchlistTickers = [...this.watchlistTickers, currentShare];

                } else if (indicesCheckResult != undefined) {

                  let currentShare = {
                    id: indicesCheckResult.id,
                    label: indicesCheckResult.label,
                    subLabel: "",
                    className: ""
                  };

                  // Add and Update the Watchlist menu items
                  this.watchlistTickers = [...this.watchlistTickers, currentShare];

                } else if (etfCheckResult != undefined) {

                  let currentShare = {
                    id: etfCheckResult.id,
                    label: etfCheckResult.label,
                    subLabel: "",
                    className: ""
                  };

                  // Add and Update the Watchlist menu items
                  this.watchlistTickers = [...this.watchlistTickers, currentShare];

                } else if (satrixCheckResult != undefined) {

                  let currentShare = {
                    id: satrixCheckResult.id,
                    label: satrixCheckResult.label,
                    subLabel: "",
                    className: ""
                  };

                  // Add and Update the Watchlist menu items
                  this.watchlistTickers = [...this.watchlistTickers, currentShare];

                } else if (commoditiesCheckResult != undefined) {

                  let currentShare = {
                    id: commoditiesCheckResult.id,
                    label: commoditiesCheckResult.label,
                    subLabel: "",
                    className: ""
                  };

                  // Add and Update the Watchlist menu items
                  this.watchlistTickers = [...this.watchlistTickers, currentShare];

                } else {

                  // Something Wierd Went Wrong.
                  return;

                }

                // Update the Items in the Watchlist
                watchlistDropdownControl.set('items', JSON.parse(JSON.stringify(this.watchlistTickers)));

                // Save the Selected Share to myWatchlist LocalStorage
                localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

                // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
                this.allWatchlistTickers = this.allIndicatorsList;

                // Update the working Internal Watchlist
                this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

                this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code: ' + selectedLabel + ', has been Succsessfully added to your watchlist.' });
                return;
              }
            }
            else if (itemSelected.id === "removeFromWatchlist")
            {
              // Remove the Selected Item from the Watchlist
              this.watchlistTickers = this.watchlistTickers.filter(item => item.label !== valueSeries.get("name"));

              // Reset the items in the Watchlist menu
              watchlistDropdownControl.set('items', this.watchlistTickers);

              // Save the Selected Share to myWatchlist LocalStorage
              localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

              // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
              this.allWatchlistTickers = this.allIndicatorsList;

              // Update the working Internal Watchlist
              this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

              this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code: ' + selectedLabel + ', has been removed from your watchlist.' });
              return;
            }
            else {
              // Save the Selected Share Code
              localStorage.setItem("myLastShare", encrypt(itemData.item.id, "myLastShare"));

              // Save the Selected Share Name
              localStorage.setItem("myLastShareName", encrypt((itemData.item as am5stock.IDropdownListItem).label, "myLastShareName"));

              var valueSeries = stockChart.get("stockSeries")!;
              var volumeSeries = stockChart.get("volumeSeries")!;
              
                // Load the valueSeries with the Selected Share Code
              valueSeries.set("name", itemData.item.label);

              // Reset the Series Type Count to Zero (0) otherwise it will cause a loop when re-loading the chart!
              //setLoadSeriesTypeCount();

              // Load data for all series (main series + comparisons)
              // const promises: any[] = [];
              // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
              //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
              //     promises.push(loadData(series.get("name")!, [series], "day"));
              // });

              loadData(valueSeries.get("name") as string, [valueSeries], "day");
              if (valueSeries != undefined) {
                valueSeries.data.setAll(getAllEquitiesData());
              }
              else {
                var mainSeries = stockChart.get("stockSeries");
                mainSeries?.data.setAll(getAllEquitiesData());
              }
  
              if (volumeSeries != undefined) {
                volumeSeries.data.setAll(getAllEquitiesData());
              }
              else {
                var mainSeries = stockChart.get("stockSeries");
                mainSeries?.data.setAll(getAllEquitiesData());
              }
  
                // periodSelector.selectPeriod(getUserSelectedPeriod());
              // Make period selector refresh to default period (ytd)
              // valueSeries.events.once("datavalidated", function() {
                // periodSelector.selectPeriod(setUserSelectedPeriod);
              // });
              // localStorage.setItem("periodselector", chosenitem || "")
            }
          }

          var updateWatchlistItems = (selectedWatchlistItem: string | undefined) => { 
            if (selectedWatchlistItem != undefined || selectedWatchlistItem != '') {
              // Load the Saved Watchlist
              let getSavedWatchlistData = localStorage.getItem("myWatchlist") || "";
              if (getSavedWatchlistData.length > 0) {
                let myWatchlistData = JSON.parse(decrypt(getSavedWatchlistData, "myWatchlist") || "");
                try {
                  this.watchlistTickers = [];
                  this.watchlistTickers = myWatchlistData;
                  watchlistDropdownControl.set('items', myWatchlistData);
                } catch (error) {
                  console.log(error);
                }
              }
            }
          }

          watchlistDropdownControl.events.on("selected", function(ev) {
            // Create and/or manage the Watchlist dropdown list menu items
            manageWatchlistItem(ev);
          });

          watchlistDropdownControl.events.on("click", function(ev) {
            // Create and/or manage the Watchlist dropdown list menu items
            updateWatchlistItems('');
          });

          // watchlistDropdownControl.getPrivate("dropdown")?.events.on("changed", function(ev) {
          //   // ev.value = true or false
          //   // ev.item = the json object

          //   // Load All Share Names into it's Series Control
          //   manageWatchlistItem(ev);
          // });

          // watchlistMainSeriesControl.events.on("selected", function(ev) {
          //   //indicesMainSeriesControl.set("name", (ev.item as am5stock.IDropdownListItem).subLabel);

          //   // Save the Selected Share Code
          //   localStorage.setItem("myLastShare", encrypt((ev.item as am5stock.IDropdownListItem).id, "myLastShare"));

          //   // Load the valueSeries with the Selected Share Code
          //   valueSeries.set("name", (ev.item as am5stock.IDropdownListItem).id);
          //   //loadData(((ev.item as am5stock.IDropdownListItem).subLabel as string), [valueSeries, volumeSeries], "day");

          //   // Load data for all series (main series + comparisons)
          //   const promises: any[] = [];
          //   promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
          //     am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
          //       promises.push(loadData(series.get("name")!, [series], "day"));
          //   });

          //   // Make period selector refresh to default period (ytd)
          //   valueSeries.events.once("datavalidated", function() {
          //     periodSelector.selectPeriod({ timeUnit: "ytd", name: "YTD" });
          //   });
          // });



          // Set up comparison control
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/comparison-control/
          let comparisonControl = am5stock.ComparisonControl.new(root, {
            stockChart: stockChart,
            maxSearchItems: 2000,
            fixedLabel: true,
            searchable: true,
            scrollable: true,
            searchCallback: function(query) {
              var compared = stockChart.getPrivate("comparedSeries", []);
              if (compared.length > 4) {
                return [{
                  label: "A maximum of 5 comparisons is already selected. Remove some to add new ones.",
                  id: "count",
                  info: true
                }];
              };

              var mainSeries = stockChart.get("stockSeries");
              var mainSeriesID = mainSeries ? mainSeries.get("name") : "";
              var listComparisons = getComparisonTicker(query);

              if (listComparisons != undefined ) {
                am5.array.each(listComparisons, function(item) {
                  if (item.label == mainSeriesID) {
                    (item as am5stock.IDropdownListItem).disabled = true;
                  } else {
                    (item as am5stock.IDropdownListItem).disabled = false;
                  }
                })
                // if (listComparisons.length === 0) {
                //   listComparisons = getWinningSharesList();
                // }
              } else {
                listComparisons = getAllComparisonTickers();
              }

              return listComparisons;
            }


            // searchCallback: (query) => {
            //   var compared = stockChart.getPrivate("comparedSeries", []);
            //   var main = stockChart.get("stockSeries") as any;
            //   if (compared.length > 4) {
            //     return [{
            //       label: "A maximum of 5 comparisons is already selected. Remove some to add new ones.",
            //       id: "count",
            //       info: true
            //     }];
            //   };

            //   var comparedIds: (string | undefined)[] = [];
            //   am5.array.each(compared, function(series) {
            //     comparedIds.push(series.get("name"));
            //   });

            //   var list = getAllTickers(query);
            //   am5.array.each(list, function(item) {
            //     if (comparedIds.indexOf(item.id) !== -1 || main.get("name") == item.id) {
            //       (item as am5stock.IDropdownListItem).disabled = true;
            //     } else {
            //       (item as am5stock.IDropdownListItem).disabled = false;
            //     }
            //   })
            //   return list;
            // }
          });

          comparisonControl.events.on("click", function(ev) {
            var listComparisons = getAllComparisonTickers();
            // Load All Share Names into it's Series Control
            comparisonControl.set('items', listComparisons);
          });

          comparisonControl.events.on("selected", function(ev) {

            //let item = ev.item
            let series = am5xy.LineSeries.new(root, {
              name: (ev.item as am5stock.IDropdownListItem).id,
              valueYField: "Close",
              calculateAggregates: true,
              valueXField: "Date",
              xAxis: dateAxis,
              yAxis: valueAxis,
              legendValueText: "{valueY.formatNumber('#.00')}"
            });

            let comparingSeries = stockChart.addComparingSeries(series);
            comparingSeries.set("tooltip", am5.Tooltip.new(root, {
              pointerOrientation: "horizontal",
              labelText: "[bold]{name}[/]\nDate: [bold]{valueX.formatDate()}[/]\nClose: {valueY}"
            }));

            setComparisonAdded('1');

            loadData((ev.item as am5stock.IDropdownListItem).label, [comparingSeries], "day");
            //comparingSeries.data.setAll(getAllEquitiesData());

            //addComparingSeries((ev.item as am5stock.IDropdownListItem).id as string);

          });

          // function addComparingSeries(label: string) {
          //   let item = ev.item
          //   let series = am5xy.LineSeries.new(root, {
          //     name: label,
          //     valueYField: "Close",
          //     calculateAggregates: true,
          //     valueXField: "Date",
          //     xAxis: dateAxis,
          //     yAxis: valueAxis,
          //     legendValueText: "{valueY.formatNumber('#.00')}"
          //   });

          //   let comparingSeries = stockChart.addComparingSeries(series);
          //   comparingSeries.set("tooltip", am5.Tooltip.new(root, {
          //     pointerOrientation: "horizontal",
          //     labelText: "[bold]{name}[/]\nDate: [bold]{valueX.formatDate()}[/]\nClose: {valueY}"
          //   }));

          //   loadData(label, [comparingSeries], "day");
          // }

          const getAllEquitiesTickers = () => {
            return this.equitiesTickers;
          }
          
          const getAllIndicesTickers = () => {
            return this.indicesTickers;
          }
          
          const getAllETFTickers = () => {
            return this.etfTickers;
          }
          
          const getAllSatrixTickers = () => {
            return this.satrixTickers;
          }
          
          const getAllCommoditiesTickers = () => {
            return this.commoditiesTickers;
          }
          
          // const getAllUnitTrustsTickers = () => {
          //   return this.unitTrustsTickers;
          // }
          
          const getAllWinningSharesTickers = () => {
            return this.winningSharesTickers;
          }
          
          const getAllComparisonTickers = () => {

            this.allIndicatorsList = [];

            this.equitiesTickers.forEach( (item) => {
              this.allIndicatorsList.push(item);
            });

            this.indicesTickers.forEach( (item) => {
              this.allIndicatorsList.push(item);
            });

            this.etfTickers.forEach( (item) => {
              this.allIndicatorsList.push(item);
            });

            this.satrixTickers.forEach( (item) => {
              this.allIndicatorsList.push(item);
            });

            this.commoditiesTickers.forEach( (item) => {
              this.allIndicatorsList.push(item);
            });

            // NOT WORKING AS YET BECAUSE WE NEED TO GET ALL THE CORRECT DATA FIRST
            // this.unitTrustsTickers.forEach( (item) => {
            //   this.allIndicatorsList.push(item);
            // });

            this.allIndicatorsList.sort(sortAlph);

            return this.allIndicatorsList;
          }
          
          // const getSelectedShareCode = () => {
          //   return this.selectedShareCode;
          // }

          const getEquitiesTicker = (search: string) => {
            search = search.toLowerCase();
            return this.equitiesTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          const getIndicesTicker = (search: string) => {
            search = search.toLowerCase();
            return this.indicesTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          const getETFTicker = (search: string) => {
            search = search.toLowerCase();
            return this.etfTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          const getSatrixTicker = (search: string) => {
            search = search.toLowerCase();
            return this.satrixTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          const getCommoditiesTicker = (search: string) => {
            search = search.toLowerCase();
            return this.commoditiesTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          // const getUnitTrustsTicker = (search: string) => {
          //   search = search.toLowerCase();
          //   return this.unitTrustsTickers.filter((item) => {
          //     return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
          //   });
          // }

          const getWinningSharesTicker = (search: string) => {
            search = search.toLowerCase();
            return this.winningSharesTickers.filter((item) => {
              return item.label.toLowerCase().match(search) || item.id.toLowerCase().match(search);
            });
          }

          // const getWinningSharesList = () => {
          //   return this.winningSharesTickers.slice(0, 20);
          // }

          const getComparisonTicker = (search: string) => {
            search = search.toLowerCase();
            return this.allIndicatorsList.filter((item) => {
              return item.label.toLowerCase().match(search); // || item.id.toLowerCase().match(search);
            });
          }
         
          const getTickerFromShareLongName = (ticker: string) => {
            const inputString = ticker;
            const regex = /\((.*?)\)/; // Regular expression to match text within parentheses
            const match = inputString.match(regex);
            
            if (match && match[1]) {
              return match[1];
            } else {
              return "J203" // The Default Value if the Share Code is Not Found
            }
          }


          // Load Any Saved Share Name Internally
          const getLastSavedShareNameInternally = () => {
            let getLastSavedShareName = localStorage.getItem("myLastShareName") || "";
            if (getLastSavedShareName.length > 0) {
              return decrypt(getLastSavedShareName, "myLastShareName") || "";
            }

            let getLastSavedShareCode = localStorage.getItem("myLastShare") || "";
            if (getLastSavedShareCode.length > 0) {
              getLastSavedShareCode = decrypt(getLastSavedShareCode, "myLastShare") || "";
            }

            if (getLastSavedShareCode != undefined || getLastSavedShareCode != null || getLastSavedShareCode != '') {
              if (this.allIndicatorsList.length > 0) {
                // Find the last saved share code in the [allIndicatorsList] in an attempt to find the share name
                var foundMatch = getShareNameByShareCodeID(getLastSavedShareCode, this.allIndicatorsList);
                return foundMatch.label;
                // am5.array.each(foundMatch, function(item) {
                //   return item.label;
                // })
              } else {
                return getLastSavedShareCode;
              }
            }

            return '(J203) FTSE/JSE All Share'; // The Default Ticker Name
          }


          // Set up series type switcher
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/series-type-control/
          let seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
            stockChart: stockChart
          });

          // // Load the User Selected Interval - Default to 1 day
          // let chosenSwitcheritem = localStorage.getItem("seriesSwitcher");
          // if (chosenSwitcheritem != undefined) {
          //   if (chosenSwitcheritem == "line") {
          //     seriesSwitcher.setItem("Line");
          //     setSeriesType(chosenSwitcheritem);
          //   } else
          //   if (chosenSwitcheritem == "candlestick") {
          //     seriesSwitcher.setItem("Candles");
          //     setSeriesType(chosenSwitcheritem);
          //   } else
          //   if (chosenSwitcheritem == "procandlestick") {
          //     seriesSwitcher.setItem("Hollow Candles");
          //     setSeriesType(chosenSwitcheritem);
          //   } else
          //   if (chosenSwitcheritem == "ohlc") {
          //     seriesSwitcher.setItem("Sticks");
          //     setSeriesType(chosenSwitcheritem);
          //   }
          // }

          function getSavedNewSettings(series: am5xy.XYSeries) {
            let newSettings: any = [];

            // am5.array.each(["name", "valueYField", "highValueYField", "lowValueYField", "openValueYField", "calculateAggregates", "valueXField", "xAxis", "yAxis", "legendValueText", "stroke", "fill"], function(setting: any) {
            //   newSettings[setting] = series.get(setting);
            // });

            newSettings = series._settings;
            return newSettings;
          }

          seriesSwitcher.events.on("selected", function (ev) {
            setSeriesType((ev.item as am5stock.IDropdownListItem).id);
          });

          // function getNewSettings(series: am5xy.XYSeries) {
          //   let newSettings: any = [];
          //   am5.array.each(["name", "valueYField", "highValueYField", "lowValueYField", "openValueYField", "calculateAggregates", "valueXField", "xAxis", "yAxis", "legendValueText", "stroke", "fill"], function(setting: any) {
          //     newSettings[setting] = series.get(setting);
          //   });
          //   return newSettings;
          // }

          function setSeriesType(seriesType: string) {
            // Get current series and its settings
            let currentSeries = stockChart.get("stockSeries")!;
            let newSettings = getSavedNewSettings(currentSeries);

            // Remove previous series
            let data = currentSeries.data.values;
            mainPanel.series.removeValue(currentSeries);

            // Create new series
            let series;
            switch (seriesType) {
              case "line":
                series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
                break;
              case "candlestick":
              case "procandlestick":
                newSettings.clustered = false;
                series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
                if (seriesType == "procandlestick") {
                  series.columns.template.get("themeTags")!.push("pro");
                }
                break;
              case "ohlc":
                newSettings.clustered = false;
                series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
                break;
            }

            // Set new series as stockSeries
            if (series) {
              valueLegend.data.removeValue(currentSeries);
              series.data.setAll(data);
              stockChart.set("stockSeries", series);
              // let cursor = mainPanel.get("cursor");
              // if (cursor) {
              //   cursor.set("snapToSeries", [series]);
              // }
              valueLegend.data.insertIndex(0, series);

              // Save the User Selected Series Switcher Item
              localStorage.setItem("seriesSwitcher", seriesType);

              // // Make period selector refresh to default period (ytd)
              // if (periodSelector != undefined) {
              //   periodSelector.selectPeriod(getUserSelectedPeriod());
              // }
            }

            
            // This will check to see if the user wants the Tooltip to show when the Browser is Loaded/Reloaded
            let showTooltip = localStorage.getItem("ShowTooltip");
            if (showTooltip === "true") {

              //tooltipShowHideButton.innerHTML = "Hide Tooltip";
              myTooltipButtonControl.set("active", true);

              var tooltip = am5.Tooltip.new(root, {
                pointerOrientation: "vertical",
                tooltipPosition: "pointer",
                tooltipText: "a",
                forceInactive: true
              });

              tooltip.get("background")?.setAll({
                fill: am5.color(0xeeeeee),
              })

              valueSeries.set("tooltip", tooltip);

              // *** New Tooltip with Volume ***
              // root.dateFormatter.format(???, "yyyy-MM-dd")
              tooltip.label.adapters.add("text", function(text, target) {
                text = "";
                var tooltipDataItem = valueSeries.get("tooltipDataItem");
                var shareName = getTickerFromShareLongName(valueSeries.get("name")?.toString() || getLastSavedShareCode().toString());
                var tooltipVolumeDataItem = volumeSeries.get("tooltipDataItem");
                if (tooltipDataItem && tooltipVolumeDataItem) {
                  let stockItemDate = setTooltipDateTime(tooltipDataItem.get('valueX')?.toString());
                  text = '[/][bold]' + shareName +
                         '[/]\nDate     : [bold]' + formatDate(stockItemDate, 'yyyy-MM-dd' , 'en-ZA') +
                         '[/]\nOpen    : ' + tooltipDataItem.get('openValueY') +
                         '[/]\nHigh     : ' + tooltipDataItem.get('highValueY') +
                         '[/]\nLow      : ' + tooltipDataItem.get('lowValueY') +
                         '[/]\nClose    : ' + tooltipDataItem.get('valueY') +
                         '[/]\nVolume : [bold]' + tooltipVolumeDataItem.get('valueY');
                }
                return text;
              });

            }
          }
          

          // const setLoadSeriesTypeCount = () => {
          //   this.setSeriesTypeCount = 0;
          // }

             
          //     // //valueLegend.data.removeValue(currentSeries);
          //     // series.data.setAll(getAllEquitiesData());
          //     // stockChart.set("stockSeries", stockChart.get("stockSeries"));
          //     // // var cursor = mainPanel.get("cursor");
          //     // // if (cursor) {
          //     // //   cursor.set("snapToSeries", [series]);
          //     // // }
          //     // //valueLegend.data.insertIndex(0, series);
          //     // //valueLegend.set("name", getSelectedShareCode())
          //     // //valueLegend.data.setAll([stockChart.get("stockSeries")]); // Hide the volumeSeries by removing it from the ValueLegend
          //   }


          //   // This will check to see if the user wants the Tooltip to show when the Browser is Loaded/Reloaded
          //   let showTooltip = localStorage.getItem("ShowTooltip");
          //   if (showTooltip === "true") {

          //     //tooltipShowHideButton.innerHTML = "Hide Tooltip";
          //     myTooltipButtonControl.set("active", true);

          //     var tooltip = am5.Tooltip.new(root, {
          //       pointerOrientation: "vertical",
          //       tooltipPosition: "pointer",
          //       tooltipText: "a",
          //     });

          //     tooltip.get("background")?.setAll({
          //       fill: am5.color(0xeeeeee),
          //     })

          //     valueSeries.set("tooltip", tooltip);

          //     // *** New Tooltip with Volume ***
          //     // root.dateFormatter.format(???, "yyyy-MM-dd")
          //     tooltip.label.adapters.add("text", function(text, target) {
          //       text = "";
          //       var tooltipDataItem = valueSeries.get("tooltipDataItem");
          //       var tooltipVolumeDataItem = volumeSeries.get("tooltipDataItem");
          //       if (tooltipDataItem && tooltipVolumeDataItem) {
          //         let stockItemDate = setTooltipDateTime(tooltipDataItem.get('valueX')?.toString());
          //         text = '[/][bold]{name}' +
          //               '[/]\nDate     : [bold]' + formatDate(stockItemDate, 'yyyy-MM-dd' , 'en-ZA') +
          //               '[/]\nOpen    : ' + tooltipDataItem.get('openValueY') +
          //               '[/]\nHigh     : ' + tooltipDataItem.get('highValueY') +
          //               '[/]\nLow      : ' + tooltipDataItem.get('lowValueY') +
          //               '[/]\nClose    : ' + tooltipDataItem.get('valueY') +
          //               '[/]\nVolume : [bold]' + tooltipVolumeDataItem.get('valueY');
          //       }
          //       return text;
          //     });

          //   }
          // }
          
          // function setSeriesType(seriesType: string) {
          //   // Get current series and its settings
          //   var currentSeries = stockChart.get("stockSeries")!;
          //   var newSettings = getNewSettings(currentSeries);

          //   // var valueSeries = stockChart.get("stockSeries")!;
          //   // var volumeSeries = stockChart.get("volumeSeries")!;

          //   // Load data for all series (main series + comparisons)
          //   //loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day");

          //   // Remove previous series
          //   let data = currentSeries.data.values;

          //   if (data.length === 0) {
          //     data = getAllEquitiesData();

          //     if (data.length === 0) {
          //       return;
          //     }
          //   }

          //   // Create new series
          //   let series;
          //   switch (seriesType) {
          //     case "line":
          //       series = mainPanel.series.push(am5xy.LineSeries.new(root, newSettings));
          //       break;
          //     case "candlestick":
          //     case "procandlestick":
          //       newSettings.clustered = false;
          //       series = mainPanel.series.push(am5xy.CandlestickSeries.new(root, newSettings));
          //       if (seriesType == "procandlestick") {
          //         series.columns.template.get("themeTags")!.push("pro");
          //       }
          //       break;
          //     case "ohlc":
          //       newSettings.clustered = false;
          //       series = mainPanel.series.push(am5xy.OHLCSeries.new(root, newSettings));
          //       break;
          //   }

          //   // Set new series as stockSeries
          //   if (series) {
          //     //valueLegend.data.removeValue(currentSeries);
          //     series.data.setAll(data);
          //     stockChart.set("stockSeries", series);
          //     // let cursor = mainPanel.get("cursor");
          //     // if (cursor) {
          //     //   cursor.set("snapToSeries", [series]);
          //     // }
          //     valueLegend.data.insertIndex(0, series);

          //     mainPanel.series.removeValue(currentSeries);

          //     // Load data for all series (main series + comparisons)
          //     const promises: any[] = [];
          //     promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], 'day'))
          //     am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
          //       promises.push(loadData(series.get("name")!, [series], 'day'));
          //     });

          //     // let seriesArrayResponse: any[] = this.arrayResponse;
          //     // am5.array.each(series, function(item) {
          //     //   item.data.setAll(seriesArrayResponse);
          //     // });

          //     // Save the User Selected Series Switcher Item
          //     localStorage.setItem("seriesSwitcher", seriesType);
          //   }
          // }


          // let periodSelector = am5stock.PeriodSelector.new(root, {
          //   stockChart: stockChart,
          //   periods: [
          //     // { timeUnit: "day", count: 1, name: "1D" },
          //     // { timeUnit: "day", count: 5, name: "5D" },
          //     { timeUnit: "month", count: 1, name: "1M" },
          //     { timeUnit: "month", count: 3, name: "3M" },
          //     { timeUnit: "month", count: 6, name: "6M" },
          //     { timeUnit: "ytd", name: "YTD" },
          //     { timeUnit: "month", count: 12, name: "1Y" },
          //     { timeUnit: "month", count: 24, name: "2Y" },
          //     { timeUnit: "month", count: 60, name: "5Y" },
          //     { timeUnit: "max", name: "Max" },
          //     // { timeUnit: "minute", count: 60, name: "1 Minute" },
          //     // { timeUnit: "minute", count: 120, name: "2 Minute" },
          //     // { timeUnit: "minute", count: 300, name: "5 Minute" },
          //     // { timeUnit: "minute", count: 900, name: "15 Minute" },
          //     // { timeUnit: "minute", count: 1800, name: "30 Minute" },
          //     // { timeUnit: "hour", count: 1, name: "1 Hour" },
          //     // { timeUnit: "hour", count: 4, name: "4 Hours" },
          //     ],
          // })
         

          // periodSelector.events.on("click", function (ev) {

          //   const container = periodSelector.getPrivate("label")!;
          //   const buttons = container.getElementsByTagName("a");
          //   for (let i = 0; i < buttons.length; i++) {
          //     const button = buttons[i];
              
          //     // Get the Actively Selected Period Button
          //     if (button.className == "am5stock-link am5stock-active") {
          //       let selectedPeriod = button.getAttribute("data-period")?.toString();
          //       localStorage.setItem("periodSelector", selectedPeriod || "")
          //     }

          //   }

          // });


          // Interval switcher
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/interval-control/
          let intervalSwitcher = am5stock.IntervalControl.new(root, {
            stockChart: stockChart,
            items: [
              //{ id: "1 minute", label: "1 minute", interval: { timeUnit: "minute", count: 1 } },
              { id: "1 day", label: "1 day", interval: { timeUnit: "day", count: 1 } },
              { id: "1 week", label: "1 week", interval: { timeUnit: "week", count: 1 } },
              { id: "1 month", label: "1 month", interval: { timeUnit: "month", count: 1 } }
            ]
          });

          // Load the User Selected Interval - Default to 1 day
          let chosenitem = localStorage.getItem("intervalSwitcher");
          if (chosenitem != undefined) {
            if (chosenitem == "day") {
              intervalSwitcher.setItem("1 day");
              dateAxis.set("groupInterval", {timeUnit:"day", count:1})
            } else
            if (chosenitem == "month") {
              intervalSwitcher.setItem("1 month");
              dateAxis.set("groupInterval", {timeUnit:"month", count:1})
            } else
            if (chosenitem == "week") {
              intervalSwitcher.setItem("1 week");
              dateAxis.set("groupInterval", {timeUnit:"week", count:1})
            }
          }
          else {
            intervalSwitcher.setItem("1 day");
            dateAxis.set("groupInterval", {timeUnit:"day", count:1})
          }

          intervalSwitcher.events.on("selected", function(ev: any) {
            // Determine selected granularity
            //currentGranularity = ev.item.interval.timeUnit;

            // Get series
            const valueSeries = stockChart.get("stockSeries")!;
            const volumeSeries = stockChart.get("volumeSeries")!;

            // Set up zoomout
            valueSeries.events.once("datavalidated", function() {
              mainPanel.zoomOut();
            });

            // Load data for all series (main series + comparisons)
            const promises: any[] = [];
            promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], ev.item.interval.timeUnit))
            am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
              promises.push(loadData(series.get("name")!, [series], ev.item.interval.timeUnit));
            });

            // Once data loading is done, set `baseInterval` on the DateAxis
            Promise.all(promises).then(function() {
              let chosenitem: string = ev.item.interval.timeUnit as string;

              if (chosenitem === "day") {
                dateAxis.set("groupInterval", {timeUnit:"day", count:1})
              } else if (chosenitem === "month") {
                dateAxis.set("groupInterval", {timeUnit:"month", count:1})
              } else if (chosenitem === "week") {
                dateAxis.set("groupInterval", {timeUnit:"week", count:1})
              }

              dateAxis.markDirtySize();
              // sbDateAxis.markDirtySize();

              // if (chosenitem === "day") {
              //   dateAxis.set('groupData', false);
              // } else if (chosenitem === "week") {
              //   dateAxis.set('groupData', true);
              // } else if (chosenitem === "month") {
              //   dateAxis.set('groupData', true);
              // }
              // dateAxis.set("baseInterval", ev.item.interval);

              // if (chosenitem === "day") {
              //   sbDateAxis.set('groupData', false);
              // } else if (chosenitem === "week") {
              //   sbDateAxis.set('groupData', true);
              // } else if (chosenitem === "month") {
              //   sbDateAxis.set('groupData', true);
              // }
              // sbDateAxis.set("baseInterval", ev.item.interval);

              localStorage.setItem("intervalSwitcher", chosenitem || "");
            });
          });


          let resetControl = am5stock.ResetControl.new(root, {
            stockChart: stockChart
          });

          resetControl.events.on("click", function (ev) {
            localStorage.removeItem("myDrawings");
            localStorage.removeItem("myDrawings_" + getLastSavedShareCode().toString())
            localStorage.removeItem("myIndicators");
          });


          // // Add custom indicator - THIS ADD'S THE NEW INDICATOR TO THE CHART AT START UP!!!
          // let myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
          //   stockChart: stockChart,
          //   stockSeries: valueSeries,
          //   legend: valueLegend
          // }));


          // Get current indicators
          //let indicators = indicatorControl.get("indicators", []);

          // Add custom indicator to the top of the list - THIS HAS AN ISSUE!!!

          // Create indicator control
          let allIndicatorsControl = am5stock.IndicatorControl.new(root, {
            stockChart: stockChart,
            legend: valueLegend,
            searchable: true,
          });

          let allIndicators = allIndicatorsControl.get("indicators");

          // Set indicator list back
          allIndicatorsControl.set("indicators", allIndicators);
          allIndicatorsControl.set("name", "Indicators")

          // let myIndicators = [{
          //     id: "myIndicator",
          //     name: "My Indicator",
          //     callback: function() {
          //       const myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
          //         stockChart: stockChart,
          //         stockSeries: valueSeries,
          //         legend: valueLegend
          //       }));
          //       return myIndicator;
          //     }
          //   },
          //   {
          //     id: "RSI_EMA",
          //     name: "RSI and EMA",
          //     callback: function() {
          //       const RSI_EMAIndicator = stockChart.indicators.push(RSI_EMA.new(root, {
          //         stockChart: stockChart,
          //         stockSeries: valueSeries,
          //         legend: valueLegend
          //       }));
          //       return RSI_EMAIndicator;
          //     }
          //   },
          //   {
          //     id: "MomentumIndicator",
          //     name: "Momentum",
          //     callback: function() {
          //       const RSI_EMAIndicator = stockChart.indicators.push(MomentumIndicator.new(root, {
          //         stockChart: stockChart,
          //         stockSeries: valueSeries,
          //         legend: valueLegend
          //       }));
          //       return RSI_EMAIndicator;
          //     }
          //   }
          // ]; // = <any[]>([]);

          // indicators = setMyArrayIndicator();
          // function setMyArrayIndicator() {
          //   ([{
          //     id: "myIndicator",
          //     name: "My indicator",
          //     callback: function() {
          //       const myIndicator = stockChart.indicators.push(MyIndicator.new(root, {
          //         stockChart: stockChart,
          //         stockSeries: valueSeries,
          //         legend: valueLegend
          //       }));
          //       return myIndicator;
          //     }
          //   }]);
          //   return indicators;
          // }

          // // Create indicator control
          // let indicatorControl = am5stock.IndicatorControl.new(root, {
          //   stockChart: stockChart,
          //   legend: valueLegend
          // });

          // Set indicator list back
          // indicatorControl.set("indicators", myIndicators);
          // indicatorControl.set("name", "Custom Indicators")

          // Create the Drawing Control
          var drawingControl = am5stock.DrawingControl.new(root, {
            stockChart: stockChart,
          });

          // let menuitems = menubar.get("menu").get("items");

          // menuitems.push({
          //   type: "separator"
          // });

          // menuitems.push({
          //   type: "custom",
          //   label: "Annotate",
          //   callback: function() {
          //     this.close();
          //     annotator.toggle();
          //   }
          // });

          // // Create an annotation over an indicator
          // let annotator = am5plugins_exporting.Annotator.new(root, {
          // });

          // // Create an annotation over an indicator
          // const annotation = chart.createAnnotation({
          //   x: indicator.x, // Set x position to match indicator's x-coordinate
          //   y: indicator.y, // Set y position to match indicator's y-coordinate
          //   type: "Label",
          //   text: "Annotation Text",
          //   fontSize: 12,
          //   background: {
          //     fill: "#FF5733",
          //     opacity: 0.7,
          //   },
          // });

          // // Add the annotation to the chart
          // chart.addAnnotation(annotation);

          // Create the Objects for Saving and Loading Indicators and Drawings on the Chart
          //const myDrawings = drawingControl.serializeDrawings("object", "  ");
          //const myIndicators = allIndicatorsControl.serializeIndicators("object", "  ");

          //localStorage.setItem("myDrawings", encrypt(JSON.stringify(drawingControl.serializeDrawings("object", "  ")), "myDrawings"));

          // drawingControl.events.on("click", function(ev) {
          //   if (ev.target.get("active")) {
          //     console.log(ev);
          //   }
          // })

          stockChart.onPrivate("comparing", function(comparing) {
            // stockChart.panels.each(function(panel) {
            //   panel.series.each(function(series) {
            //     if (series.isType("DrawingSeries")) {
            //       if (comparing) {
            //         series.hide();
            //       }
            //       else {
            //         series.show();
            //       }
            //     }
            //   });
            // });
            
            // Hide Drawing button when in comparison mode
            setTimeout(function() {
              //var drawingControl = stockChart.getControl("DrawingControl");
              if (comparing) {
                drawingControl.hide();
                setComparisonAdded('1');
                drawingControl.clearDrawings();
              }
              else {
                drawingControl.show();
                setComparisonAdded('0');

                // Switch the Tooltip On if Required to
                let showTooltip = localStorage.getItem("ShowTooltip");
                if (showTooltip === "true") {
                  valueSeries.getTooltip();
                  myTooltipButtonControl.set("active", true);
                }

                if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                  if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                    let getSavedDrawingsData = localStorage.getItem("myDrawings_" + getLastSavedShareCode()) || "";
                    if (getSavedDrawingsData.length > 157) {
                      try {
                        drawingControl.unserializeDrawings(getSavedDrawingsData);

                        //periodSelector.selectPeriod(getUserSelectedPeriod());
                      } catch (error) {
                        //console.log(error);
                      }
                    }
                  }
                }
              }
            }, 100)
          });


          stockChart.events.on("drawingsupdated", function(ev) {
              // Create the Objects for Saving and Loading Indicators and Drawings on the Chart
              // const myDrawings = drawingControl.serializeDrawings("object", "  ");
              // localStorage.setItem("myDrawings", encrypt(JSON.stringify(myDrawings), "myDrawings"));
              //let drawingControlbutton = drawingControl.getPrivate("button");

              let comparisonAdded = getComparisonAdded();
              let saveDarwings = localStorage.getItem("setDrawingsOn");
              if (saveDarwings === "true" && comparisonAdded == '0') {
                if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                  //localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                  localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                }
              } else {
                if (comparisonAdded == '0') {
                  if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
                    if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                      //localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                      //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
  
                      // let comparisonAdded = getComparisonAdded();
                      // if (comparisonAdded == '0') {
                      //   localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                      // }
  
                      let getSavedDrawingsData = localStorage.getItem("myDrawings_" + getLastSavedShareCode()) || "";
                      if (getSavedDrawingsData.length > 0) {
                        //drawingControl.clearDrawings();
                        //drawingControl.unserializeDrawings(JSON.parse(getSavedDrawingsData));
  
                        if (getSavedDrawingsData.length > 157) {
                          //localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                          localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                          //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), getSavedDrawingsData);
                        }
                      }
                    }
                  }
                }
            }
          });

          
          //drawingControl.getPrivate("eraserControl")
          drawingControl.on("active", (_ev) => {
            const active = drawingControl.getPrivate("clearControl")?.get("active", false);
            if (active) {
              localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
            }

            // const clearControlVisible = drawingControl.getPrivate("clearControl")?.get("visible", false);
            // if (clearControlVisible) {
            //   drawingControl.getPrivate("clearControl")?.set("visible", false);
            // }

            if (_ev) {
              myEraserControl.set("active", false)
              this.setDrawingsOn("true");
            } else {
              this.setDrawingsOn("false");
              drawingControl.set("active", false);
            }
          });

          // stockChart.events.on("drawingsupdated", function(ev) {
          //     // Create the Objects for Saving and Loading Indicators and Drawings on the Chart
          //     // const myDrawings = drawingControl.serializeDrawings("object", "  ");
          //     // localStorage.setItem("myDrawings", encrypt(JSON.stringify(myDrawings), "myDrawings"));
          //     //let drawingControlbutton = drawingControl.getPrivate("button");

          //     let saveDarwings = localStorage.getItem("setDrawingsOn");
          //     if (saveDarwings === "true") {
          //       if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
          //         localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
          //         //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
          //         localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
          //       }
          //     } else {
          //       if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
          //         if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
          //           localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
          //           //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
          //           localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
          //         }
          //       }
          //   }
          // });

          
          // //drawingControl.getPrivate("eraserControl")
          // drawingControl.on("active", (_ev) => {
          //   const active = drawingControl.getPrivate("clearControl")?.get("active", false);
          //   if (active) {
          //     localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
          //   }

          //   // const clearControlVisible = drawingControl.getPrivate("clearControl")?.get("visible", false);
          //   // if (clearControlVisible) {
          //   //   drawingControl.getPrivate("clearControl")?.set("visible", false);
          //   // }

          //   if (_ev) {
          //     myEraserControl.set("active", false)
          //     this.setDrawingsOn("true");
          //   } else {
          //     this.setDrawingsOn("false");
          //     drawingControl.set("active", false);
          //   }
          // });


          // drawingControl.getPrivate("clearControl", (ev: any) => {
          //   if (ev) {
          //     localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
          //   } 
          // });
          
          // drawingControl.getPrivate("clearControl")?.events.on("click", (ev) => {
          //   localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
          //   //console.log(ev);
          // });

          // mainPanel.events.on("click", function(ev) {
          //   if (localStorage.getItem("myDrawings_" + getLastSavedShareCode()) !== null) {
          //     if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
          //       let getSavedDrawingsData = localStorage.getItem("myDrawings_" + getLastSavedShareCode()) || "";
          //       if (getSavedDrawingsData.length > 0) {
          //         if (getSavedDrawingsData.length > 157) {
          //           try {
          //             drawingControl.unserializeDrawings(getSavedDrawingsData);

          //             //periodSelector.selectPeriod(getUserSelectedPeriod());
          //           } catch (error) {
          //             //console.log(error);
          //           }
          //         }
          //       }
          //     }
          //   }
          // });

          // stockChart.events.on("indicatorsupdated", function(ev) {
          //   // Serialize indicators and store them
          //   // ...
          // });

          // let drawingDebouncer: any;
          // stockChart.events.on("drawingsupdated", function(ev) {
          //   if (drawingDebouncer) {
          //     clearTimeout(drawingDebouncer);
          //   }
          //   drawingDebouncer = setTimeout(function() {

          //     // Create the Objects for Saving and Loading Indicators and Drawings on the Chart
          //     // const myDrawings = drawingControl.serializeDrawings("object", "  ");
          //     // localStorage.setItem("myDrawings", encrypt(JSON.stringify(myDrawings), "myDrawings"));
          //     //localStorage.setItem("myDrawings", JSON.stringify(myDrawings));
          //     localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), encrypt(JSON.stringify(drawingControl.serializeDrawings("object", "  ")), "myDrawings_" + getLastSavedShareCode().toString()));

          //   }, 2000);  // 2 Seconds
          // });


          let indicatorDebouncer: any;
          stockChart.events.on("indicatorsupdated", function(ev) {
            if (indicatorDebouncer) {
              clearTimeout(indicatorDebouncer);
            }
            indicatorDebouncer= setTimeout(function() {

              // Create the Objects for Saving and Loading Indicators and Drawings on the Chart
              const myIndicators = allIndicatorsControl.serializeIndicators("object", "  ");
              localStorage.setItem("myIndicators", encrypt(JSON.stringify(myIndicators), "myIndicators"));
              //localStorage.setItem("myIndicators", JSON.stringify(myIndicators));

            }, 2000);  // 2 Seconds
          });


          // Load Any Saved Drawings
          let getSavedDrawingsData = localStorage.getItem("myDrawings_" + valueSeries.get("name")) || "";
          if (getSavedDrawingsData.length > 0) {
            let myDrawingsData = JSON.parse(getSavedDrawingsData || "");
            try {
              drawingControl.unserializeDrawings(myDrawingsData);
            } catch (error) {
              console.log(error);
            }
          }


          // Load Any Saved Indicators
          //let myIndicatorsData = JSON.parse(localStorage.getItem("myIndicators") || "");
          let getSavedIndicatorsData = localStorage.getItem("myIndicators") || "";
          if (getSavedIndicatorsData.length > 0) {
            let myIndicatorsData = JSON.parse(decrypt(getSavedIndicatorsData, "myIndicators") || "");
            try {
              allIndicatorsControl.unserializeIndicators(myIndicatorsData);
            } catch (error) {
              console.log(error);
            }
          }


          // root.language.setTranslationsAny({
          //   "Eraser": "My Eraser"
          // });

          //drawingControl.setEraser(false);

          // Create a Custom Clear Drawing Control/Button
          const myClearControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Clear All Drawings.',
            name: 'Clear',
            active: false,
            id: 'myClear',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Clear")
          });
          const toolsContainerClear = document.createElement("div");
          toolsContainerClear.className = "am5stock-control-drawing-tools";
          toolsContainerClear.style.display = "none";

          toolsContainerClear.appendChild(myClearControl.getPrivate("button")!);
          drawingControl.setPrivate("clearControl", myClearControl);
          myClearControl.on("active", (_ev) => {
            drawingControl.clearDrawings();
            localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
            myClearControl.set("active", false);
          });


          // Create a Custom Eraser Drawing Control/Button
          const myEraserControl = am5stock.StockControl.new(root, {
            stockChart: stockChart,
            description: 'Eraser/Remove a Selected Drawing item.',
            name: 'Eraser',
            active: false,
            id: 'myEraser',
            //align: 'left',
            visible: true,
            icon: am5stock.StockIcons.getIcon("Eraser")
          });
          const toolsContainer = document.createElement("div");
          toolsContainer.className = "am5stock-control-drawing-tools";
          toolsContainer.style.display = "none";

          toolsContainer.appendChild(myEraserControl.getPrivate("button")!);
          drawingControl.setPrivate("eraserControl", myEraserControl);
          myEraserControl.on("active", (_ev) => {
            const active = myEraserControl.get("active", false);
            drawingControl.setEraser(active)
          });


          myEraserControl.events.on("click", function (ev) {

            if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
              localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
              //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
              // localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), encrypt(JSON.stringify(drawingControl.serializeDrawings("object", "  ")), "myDrawings_" + getLastSavedShareCode().toString()));
            }

          });


           // Disable built-in zoomout button
           mainPanel.zoomOutButton.set("forceHidden", true);

           // Add zoom buttons
           var zoom = mainPanel.plotContainer.children.push(am5.Container.new(root, {
             layout: root.horizontalLayout,
             hoverOnFocus: true,
             paddingTop:20,
             // paddingRight: 100,
             // paddingLeft: 20,
             centerX: am5.p50,
             centerY: am5.p100, 
             x: am5.p50,
             y: am5.p100
             //dx: -10,
             //dy: 10
           }));
 
           var zoomin = zoom.children.push(am5.Button.new(root, {
             width: 36,
             height: 36,
             paddingRight:46,
             paddingBottom:43,
             background: am5.Circle.new(root, {
               fill: am5.color(0x7D7D7D),
               fillOpacity: 0.7,
               shadowColor: am5.color(0x252324),
             }),
             icon: am5.Graphics.new(root, {
               stroke: am5.color(0xffffff),
               x: am5.p50,
               y: am5.p50,
               draw: function(display) {
                 display.moveTo(-4, 0);
                 display.lineTo(4, 0);
                 display.moveTo(0, -4);
                 display.lineTo(0, 4);
               }
             })
           }));
 
           var zoomout = zoom.children.push(am5.Button.new(root, {
             width: 36,
             height: 36,
             paddingRight:46,
             paddingBottom:43,
             background: am5.Circle.new(root, {
               fill: am5.color(0x7D7D7D),
               fillOpacity: 0.7,
               shadowColor: am5.color(0x252324),
             }),
             icon: am5.Graphics.new(root, {
               stroke: am5.color(0xffffff),
               x: am5.p50,
               y: am5.p50,
               draw: function(display) {
                 display.moveTo(-4, 0);
                 display.lineTo(4, 0);
               }
             })
           }));
 
           var zoomStep = 0.01;
 
           zoomin.events.on("click", function() {
             var x1 = dateAxis.get("start")! + zoomStep;
             var x2 = dateAxis.get("end")! //- zoomStep;
             if ((x2 - x1) > zoomStep) {
               dateAxis.zoom(x1, x2);
             }
 
             var y1 = valueAxis.get("start")! //+ zoomStep;
             var y2 = valueAxis.get("end")! //- zoomStep;
             if ((y2 - y1) > zoomStep) {
               valueAxis.zoom(y1, y2);
             }
           });
 
           zoomout.events.on("click", function() {
             var x1 = dateAxis.get("start") !- zoomStep;
             var x2 = dateAxis.get("end")! + zoomStep;
             if (x1 < 0) {
               x1 = 0;
             }
             if (x2 > 1) {
               x2 = 1;
             }
             dateAxis.zoom(x1, x2);
 
             var y1 = valueAxis.get("start")!// - zoomStep;
             var y2 = valueAxis.get("end")!// + zoomStep;
             if (y1 < 0) {
               y1 = 0;
             }
             if (y2 > 1) {
               y2 = 1;
             }
             valueAxis.zoom(y1, y2);
            });
 

           
          // var myDropdownControl = am5stock.DropdownControl.new(root, {
          //   stockChart: stockChart,
          //   name: "My Button",
          //   //icon: am5stock.StockIcons.getIcon(""),
          //   fixedLabel: true,
          //   scrollable: true,
          //   description: 'Testing...',
          //   align: 'left',
          // });

          // // IDropdownControlPrivate
          // var innerDropdown = am5stock.Dropdown.new(root, {
          //   control: watchlistDropdownControl,
          //   id: "watchlistid",
          //   scrollable: true,
          // })


          // const html = `<div class="am5stock-control-icon"><svg viewBox="0 0 50 50" class="am5stock_control_default_icon"><path d="M 25 10 L 25 40 M 10 25 L 41 25"></path></svg></div><div class="am5stock-control-label">Watchlist</div><div class="am5stock-control-list-container" style="display: none;"><div class="am5stock-control-list-arrow"></div><ul class="am5stock-control-list" style="max-height: 763px; overflow: auto;"><li class="am5stock-list-item am5stock-list-info am5stock-list-heading" title="Options"><label>Options</label></li><li class="am5stock-list-item" title="Choose this option to Add the current share to the list."><label>Add to Watchlist</label><label class="am5stock-list-sub">Choose this option to Add the current share to the list.</label></li><li class="am5stock-list-item" title="Choose this option to Remove the current share from the list."><label>Remove from Watchlist</label><label class="am5stock-list-sub">Choose this option to Remove the current share from the list.</label></li><li class="am5stock-list-item am5stock-list-info am5stock-list-heading" title="My Watchlist"><label>My Watchlist</label></li><li class="am5stock-list-item" title="(MTN) MTN GROUP LIMITED"><label>(MTN) MTN GROUP LIMITED</label></li><li class="am5stock-list-item" title="(SOL) SASOL LIMITED"><label>(SOL) SASOL LIMITED</label></li><li class="am5stock-list-item" title="(GLD) NEW GOLD ISSUER LTD"><label>(GLD) NEW GOLD ISSUER LTD</label></li><li class="am5stock-list-item" title="(JA3R) FTSE/JSE All Africa ex SA 30 Index"><label>(JA3R) FTSE/JSE All Africa ex SA 30 Index</label></li><li class="am5stock-list-item" title="(J203) FTSE/JSE All Share"><label>(J203) FTSE/JSE All Share</label></li></ul></div>`;

          // const parser = new DOMParser();
          // const doc = parser.parseFromString(html, 'text/html');
          
          // // Now you can access and manipulate the DOM using doc.
          // // For example, you can access elements like this:
          // const watchlistDiv = doc.querySelector('.am5stock-control-label');
          // //console.log(watchlistDiv?.textContent);

          // let dropdownContent = document.createElement("div");
          // //this.toHTML(watchlistDiv?.textContent?.toString());
          // // dropdownContent.innerHTML = html; // this.toHTML("class="am5stock-control-label">Watchlist");
          // myDropdownControl.getPrivate("container")?.appendChild(dropdownContent);

          // myDropdownControl.setPrivate("dropdown", innerDropdown);


          // Bottom Toolbar
          var bottomtoolbar = am5stock.StockToolbar.new(root, {
            container: document.getElementById("cbottomchartcontrols")!,
            stockChart: stockChart,
            controls: [
              periodSelector,
              autoZoomEnableDisableButtonControl,
              closingLabelVisibleButtonControl,
              zoomTypeButtonControl,
            ]
          })


          // Stock toolbar
          // -------------------------------------------------------------------------------
          // https://www.amcharts.com/docs/v5/charts/stock/toolbar/
          var toolbar = am5stock.StockToolbar.new(root, {
            container: document.getElementById("chartcontrols")!,
            stockChart: stockChart,
            controls: [
              equitiesMainSeriesControl,
              indicesMainSeriesControl,
              ETFMainSeriesControl,
              satrixMainSeriesControl,
              commoditiesMainSeriesControl,
              //unitTrustsMainSeriesControl,
              winningSharesMainSeriesControl,
              watchlistDropdownControl,
              comparisonControl,
              am5stock.DateRangeSelector.new(root, {
                stockChart: stockChart
              }),
              periodSelector,
              intervalSwitcher,
              seriesSwitcher,
              //indicatorControl,
              allIndicatorsControl,
              drawingControl,
              myEraserControl,
              //myClearControl,
              myTooltipButtonControl,
              gridLinesShowHideButtonControl,
              resetControl,
              //settingsControl,
              // am5stock.DataSaveControl.new(root, {
              //   stockChart: stockChart,
              //   storageId: "mySavedChartData"
              // }),
              am5stock.SettingsControl.new(root, {
                stockChart: stockChart,
                exclude: ["autosave"]
              }),
              //myDropdownControl,
            ]
          })


          // var interval: any;
          // function startThemeInterval() {
          //     interval = setInterval(function() {

          //       setUserSelectedThemeColour(mainPanel, root)

          //     }, 1000); //1 Second
          // }


          // Dynamically Load Data Evening n'th Minute
          var interval: any;
          interval = 120000; // 2 minutes in millisecondsinterval
          function setWeekdayTimer() {
            const timer = setInterval(function () {
              const now = new Date();
              const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
              const currentHour = now.getHours();
              //const currentMinute = now.getMinutes();

              // Check if it's a weekday (Monday to Friday) and the time is between 09:00 and 23:59
              if (currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 23.59) {

                let getDarwingsAreOn = localStorage.getItem("setDrawingsOn");
                if (getDarwingsAreOn === "true") {
  
                  if (valueSeries.get("name")?.toString() === getLastSavedShareNameInternally()) {
                    //localStorage.removeItem("myDrawings_" + getLastSavedShareCode());
                    //localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                    localStorage.setItem("myDrawings_" + getLastSavedShareCode().toString(), JSON.stringify(drawingControl.serializeDrawings("object", "  ")));
                  }

                  // localStorage.setItem("setDrawingsOn", "true");
                  // drawingControl.set("active", true);
  
                }
  
  
                // Do Not Perform the Loading of the Period Selector.
                //setSkipPeriodonTimerReload("1");

                // Load data for all series (main series + comparisons)
                // const promises: any[] = [];
                // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
                //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
                //     promises.push(loadData(series.get("name")!, [series], "day"));
                // });

                loadData(valueSeries.get("name") as string, [valueSeries], "day");
                if (valueSeries != undefined) {
                  valueSeries.data.setAll(getAllEquitiesData());
                }
                else {
                  var mainSeries = stockChart.get("stockSeries");
                  mainSeries?.data.setAll(getAllEquitiesData());
                }
    
                if (volumeSeries != undefined) {
                  volumeSeries.data.setAll(getAllEquitiesData());
                }
                else {
                  var mainSeries = stockChart.get("stockSeries");
                  mainSeries?.data.setAll(getAllEquitiesData());
                }
    
                // Perform the Loading of the Period Selector.
                //setSkipPeriodonTimerReload("0");

              };
              // else 
              // {
              //  // console.log('Timer skipped - not a weekday or outside of 09:00-23:59');
              // }

              // Stop the timer if you no longer need it
              if (currentHour >= 23.59) {
                clearInterval(timer);
              }
            }, interval);
          }


          var intervalOnce: any;
          function startInterval() {
            intervalOnce = setInterval(function() {

              // Do Not Perform the Loading of the Period Selector.
              //setSkipPeriodonTimerReload("1");

              // Load data for all series (main series + comparisons)
              // const promises: any[] = [];
              // promises.push(loadData(valueSeries.get("name") as string, [valueSeries, volumeSeries], "day"))
              //   am5.array.each(stockChart.getPrivate("comparedSeries", []), function(series) {
              //     promises.push(loadData(series.get("name")!, [series], "day"));
              //   });

                loadData(valueSeries.get("name") as string, [valueSeries], "day");
                if (valueSeries != undefined) {
                  valueSeries.data.setAll(getAllEquitiesData());
                }
                else {
                  var mainSeries = stockChart.get("stockSeries");
                  mainSeries?.data.setAll(getAllEquitiesData());
                }
    
                if (volumeSeries != undefined) {
                  volumeSeries.data.setAll(getAllEquitiesData());
                }
                else {
                  var mainSeries = stockChart.get("stockSeries");
                  mainSeries?.data.setAll(getAllEquitiesData());
                }
  
                // Make period selector refresh to default period (ytd)
                //periodSelector.selectPeriod(getUserSelectedPeriod());
                // valueSeries.events.once("datavalidated", function() {
                //   periodSelector.selectPeriod(getUserSelectedPeriod());
                // });

                // Perform the Loading of the Period Selector.
                //setSkipPeriodonTimerReload("0");

                //clearStartInterval();

            }, 1000);  // Do Not Ever Change This Time, it works with the below intervalClear Timer Function.
          }


          var intervalClear: any;
          function clearStartTimeout() {
            intervalClear = setTimeout(function() {

              clearInterval(intervalOnce);
              clearTimeout(intervalClear);

              // Make period selector refresh to default period (ytd)
              periodSelector.selectPeriod(getUserSelectedPeriod());
              // valueSeries.events.once("datavalidated", function() {
              //   periodSelector.selectPeriod(getUserSelectedPeriod());
              // });

            }, 4000);  // Do Not Ever Change This Time, it works with the above intervalOnce Timer Function.
          }


          document.addEventListener("visibilitychange", function() {
            if (document.hidden) {
                if (interval) {
                    clearInterval(interval);
                    clearInterval(intervalOnce);
                    clearTimeout(intervalClear);
                }
            }
            // else {
            //     startInterval();
            //     setWeekdayTimer();
            // }
          }, false);


          // // Make period selector refresh to default period (ytd)
          // valueSeries.events.once("datavalidated", function() {
          //   periodSelector.selectPeriod(getUserSelectedPeriod());
          // });


          // Make stuff animate on load
          // https://www.amcharts.com/docs/v5/concepts/animations/
          //valueSeries.appear(1000);
          //stockChart.appear(1000, 100);
          //stockChart.appear(500);  //this is where chart is done initializing for loading screen to stop---------------------------------------------------------------


          // Start the Dynamic Timer for Loading the Data every n'th Minute
          startInterval();
          setWeekdayTimer();
          
          clearStartTimeout();
          //startThemeInterval();
        }
      },
      (error: any) => {
        console.log(error);
      }
    );


    // function setSkipPeriodonTimerReload(value: string) {
    //   localStorage.setItem("SkipPeriodOnTimerReload", value);
    // }


    // function getSkipPeriodonTimerReload() {
    //   let getSkipPeriodOnTimerReload = localStorage.getItem("SkipPeriodOnTimerReload") || "0";
    //   if (getSkipPeriodOnTimerReload.length > 0) {
    //     return getSkipPeriodOnTimerReload;
    //   }
    //   return "0"; // Default
    // }


    // //Covert datetime by GMT offset
    // //If toUTC is true then return UTC time other wise return local time
    // function convertLocalDateToUTCAndReturnUTC(date: string | number | Date, toUTC: boolean) {
    //   date = new Date(date);
    //   //Local time converted to UTC
    //   //console.log("Time: " + date);

    //   //let date2 = new Date(date.toLocaleDateString("en-ZA") + " " + date.toLocaleTimeString("en-ZA"));
    //   let pipe = new DatePipe('en-US');

    //   const time = pipe.transform(date, 'mediumTime', 'UTC');
    //   const date2 = pipe.transform(date, 'yyyy/MM/dd', 'UTC');

    //   //return date + ' ' + time;
    //   let newDate = new Date(date2 + ' ' + time);

    //   var localOffset = newDate.getTimezoneOffset() * 60000 * 5;
    //   var localTime = newDate.getTime();
    //   if (toUTC) {
    //       date = localTime + localOffset;
    //   } else {
    //       date = localTime - localOffset;
    //   }

    //   //var testdate = new Date(date);
    //   return date;
    // }

    // function changeAllJSONArrayDateToUTCDateString(arrayResponseToUse: any[]) {
    //   arrayResponseToUse.forEach(function (item) {

    //     item.Date = convertLocalDateToUTCAndReturnUTC(item.Date, true);

    //     // item.Close = item.Close /100;
    //     // item.Open = item.Open / 100;
    //   });
    // }

    // Load Any Saved Share Code
    function getLastSavedShareCode() {
      let getLastSavedShareCode = localStorage.getItem("myLastShare") || "";
      if (getLastSavedShareCode.length > 0) {
        return decrypt(getLastSavedShareCode, "myLastShare") || "";
      }
      return 'J203'; // Default
    }


    // Load Any Saved Share Name
    function getLastSavedShareName(allIndicatorsList: any[]) {
      let getLastSavedShareName = localStorage.getItem("myLastShareName") || "";
      if (getLastSavedShareName.length > 0) {
        return decrypt(getLastSavedShareName, "myLastShareName") || "";
      }

      let getLastSavedShareCode = localStorage.getItem("myLastShare") || "";
      if (getLastSavedShareCode.length > 0) {
        getLastSavedShareCode = decrypt(getLastSavedShareCode, "myLastShare") || "";
      }

      if (getLastSavedShareCode != undefined || getLastSavedShareCode != null || getLastSavedShareCode != '') {
        if (allIndicatorsList.length > 0) {
          // Find the last saved share code in the [allIndicatorsList] in an attempt to find the share name
          var foundMatch = getShareNameByShareCodeID(getLastSavedShareCode, allIndicatorsList);
          // am5.array.each(foundMatch, function(item) {
          //   return item.label;
          // })
        } else {
          return getLastSavedShareCode;
        }
      }

      return '(J203) FTSE/JSE All Share'; // The Default Ticker Name
    }


    function setTooltipDateTime(dateTime: string | undefined) {
      let pipe = new DatePipe('en-ZA');

      const time = pipe.transform(dateTime, 'mediumTime', 'UTC');
      const date = pipe.transform(dateTime, 'yyyy/MM/dd', 'UTC');

      //return date + ' ' + time;
      let newDate = date + ' ' + time;
      formatDate(newDate, 'dd MMM yyyy' , 'en-US')
      const currentDate = new Date(newDate);
      currentDate.setDate(currentDate.getDate() + 1);
      return currentDate;
    }

    // function setDateTime(dateTime: string | number | Date) {
    //   let pipe = new DatePipe('en-US');

    //   const time = pipe.transform(dateTime, 'mediumTime', 'UTC');
    //   const date = pipe.transform(dateTime, 'yyyy/MM/dd', 'UTC');

    //   //return date + ' ' + time;
    //   let newDate = date + ' ' + time;
    //   return new Date(newDate);
    // }

    // function changeAllJSONArrayDateToUTCDateStringFromLocalTime(arrayResponseToUse: any[]) {
    //   arrayResponseToUse.forEach(function (item) {
    //     var date1 = setDateTime(item.DateUpdated);
    //     item.Date = convertLocalDateToUTCAndReturnUTC(date1, true);
    //   });
    // }
  


  }

  // initForm() {
  //   this.fg = this.fb.group({
  //     dbValueShareCode: ['', [Validators.required]],
  //   });
  //   this.fgWatchlist = this.fbWatchlist.group({
  //     ShareCode: ['', [Validators.required]],
  //     label: ['', [Validators.required]],
  //   });
  // }

  // trackByFn(index: number, item: any) {
  //   return item.id; // Use a unique identifier for your items
  // }
  

  // *** Watchlist 1 Processing - Start ***
  onWatchlist1NameKeyUp(event: any) {

    this.enteredWatchlist1Name = event.target.value;

  }

  saveWatchlist1Item(): void {

    // Update the Users First Watchlist
    if (this.selectedWatchlist1Item) {

      const found = this.myWatchlist1Tickers.find((item) => item.id === this.selectedWatchlist1Item?.ShareCode);
      if (found === undefined) {
        let currentShare = {
          id: this.selectedWatchlist1Item.ShareCode,
          label: this.selectedWatchlist1Item.label,
          subLabel: "",
          className: ""
        };
  
        // Add and Update the Watchlist Menu and items
        this.myWatchlist1Tickers = [...this.myWatchlist1Tickers, currentShare];

        if (this.enteredWatchlist1Name.toString() != '') {
          
          let watchlistMenu1Item = {
            id: "myWatchlistName1",
            label: this.enteredWatchlist1Name,
            subLabel: "",
            className: "am5stock-list-info am5stock-list-heading"
          };

          // Sort the Array List Alphabetically excluding the Headings and Stuff
          this.myWatchlist1Tickers.sort(sortNewAlph)

          // Save the Selected Internal Watchlist for Watchlist 1
          localStorage.setItem("myWatchlist1Tickers", encrypt(JSON.stringify(this.myWatchlist1Tickers), "myWatchlist1Tickers"));


          // Get Watchlist 2 Menu, if it Exists
          let saveWatchlistMenuItem2 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };
    
          const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
          if (index2 !== -1) {
            saveWatchlistMenuItem2 = this.watchlistTickers[index2];
          }

          
          // Get Watchlist 3 Menu, if it Exists
          let saveWatchlistMenuItem3 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };
    
          const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
          if (index3 !== -1) {
            saveWatchlistMenuItem3 = this.watchlistTickers[index3];
          }

          
          // Get Watchlist 4 Menu, if it Exists
          let saveWatchlistMenuItem4 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };
    
          const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
          if (index4 !== -1) {
            saveWatchlistMenuItem4 = this.watchlistTickers[index4];
          }

          
          // Get Watchlist 5 Menu, if it Exists
          let saveWatchlistMenuItem5 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };
    
          const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
          if (index5 !== -1) {
            saveWatchlistMenuItem5 = this.watchlistTickers[index5];
          }

          
          // Add the Watchlist 1 Menu and Items
          if (this.myWatchlist1Tickers.length > 0) {
            this.watchlistTickers = [watchlistMenu1Item, ...this.myWatchlist1Tickers];
          }

          // Add the Watchlist 2 Menu and Items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
            this.watchlistTickers = [watchlistMenu1Item, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
          }

          // Add the Watchlist 3 Menu and Items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length && this.myWatchlist3Tickers.length > 0) {
            this.watchlistTickers = [watchlistMenu1Item, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
          }

          // Add the Watchlist 4 Menu and Items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
            this.watchlistTickers = [watchlistMenu1Item, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
          }

          // Add the Watchlist 5 Menu and Items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
            this.watchlistTickers = [watchlistMenu1Item, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
          }

        }
        else {
          this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
          return;
        }


        // Update the working Internal Watchlist
        this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

        this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code (' + this.selectedWatchlist1Item.ShareCode + '), has been Succsessfully added to your watchlist.' });
      }
    }
  }


  deleteWatchlist1ItemOnly(watchlistItem: any): void {

    const index = this.watchlistTickers.findIndex((item) => item.id === watchlistItem.id);
    if (index !== -1) {
      // Remove the Selected Item from the Watchlist
      this.watchlistTickers.splice(index, 1);
      this.watchlistService.removeFromWatchlistByIndex(index);
  
      // Update the working Internal Watchlist
      this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
      const myWatchlist1ItemIndex = this.myWatchlist1Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (myWatchlist1ItemIndex !== -1) {
        this.myWatchlist1Tickers.splice(myWatchlist1ItemIndex, 1);
      }

      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      // Save the Selected Internal Watchlist for Watchlist 1
      localStorage.setItem("myWatchlist1Tickers", encrypt(JSON.stringify(this.myWatchlist1Tickers), "myWatchlist1Tickers"));

      // Update the local working Watchlist
      this.watchlistTickers = this.watchlistService.getWatchlist();
  
      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });
    }

  }


  deleteSelectedWatchlist1Items(): void {
  	this.confirmationService.confirm({
  		message: 'Are you sure you want to delete all items in  your Watchlist',
  		header: 'Delete Confirmation',
  		icon: 'pi pi-info-circle',
  		accept: () => {

  			let saveWatchlistMenuItem1 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem2 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem3 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem4 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem5 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};


  			const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
  			if (index1 !== -1) {
  				saveWatchlistMenuItem1 = this.watchlistTickers[index1];
  			}

  			const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
  			if (index2 !== -1) {
  				saveWatchlistMenuItem2 = this.watchlistTickers[index2];
  			}

  			const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
  			if (index3 !== -1) {
  				saveWatchlistMenuItem3 = this.watchlistTickers[index3];
  			}

  			const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
  			if (index4 !== -1) {
  				saveWatchlistMenuItem4 = this.watchlistTickers[index4];
  			}

  			const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
  			if (index5 !== -1) {
  				saveWatchlistMenuItem5 = this.watchlistTickers[index5];
  			}

  			this.watchlistTickers = [];
  			this.myWatchlist1Tickers = [];

  			this.watchlistTickers = [saveWatchlistMenuItem1];

  			if (this.myWatchlist2Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
  			}

  			if (this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
  			}

  			if (this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
  			}

  			if (this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
  			}

  			// // Remove the selected items from the Internal watchlist
  			// this.selectedWatchlist1Items.forEach((selectedItem) => {
  			//   const index = this.watchlistTickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.watchlistTickers.splice(index, 1);
  			//   }
  			// });

  			// // Remove the selected items from myWatchlist1
  			// this.selectedWatchlist1Items.forEach((selectedItem) => {
  			//   const index = this.myWatchlist1Tickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.myWatchlist1Tickers.splice(index, 1);
  			//   }
  			// });

  			// Update the working Internal Watchlist
  			this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

  			// Update the local working Watchlist
  			this.watchlistTickers = this.watchlistService.getWatchlist();

  			// Save the updated Watchlist to myWatchlist LocalStorage
  			localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

  			// Save the Selected Internal Watchlist for Watchlist 1
  			localStorage.setItem("myWatchlist1Tickers", encrypt(JSON.stringify(this.myWatchlist1Tickers), "myWatchlist1Tickers"));

  			// Clear the selected items
  			this.selectedWatchlist1Items = [];

  		},

  		reject: () => {
  			// This block will be executed when the user cancels or rejects the deletion
  			this.messageService.add({
  				severity: 'warn',
  				summary: 'Cancelled',
  				detail: 'Deletion was cancelled'
  			});
  		}
  	});
  }

  // *** Watchlist 1 Processing - End ***

  
  // *** Watchlist 2 Processing - Start ***
  onWatchlist2NameKeyUp(event: any) {

    this.enteredWatchlist2Name = event.target.value;
    
  }

  saveWatchlist2Item(): void {

    // Update the Users Second Watchlist
    if (this.selectedWatchlist2Item) {
      const found = this.myWatchlist2Tickers.find((item) => item.id === this.selectedWatchlist2Item?.ShareCode);
      if (found === undefined) {
        let currentShare = {
          id: this.selectedWatchlist2Item.ShareCode,
          label: this.selectedWatchlist2Item.label,
          subLabel: "",
          className: ""
        };
  
        // Add and Update the Watchlist Menu and items
        this.myWatchlist2Tickers = [...this.myWatchlist2Tickers, currentShare];

        if (this.enteredWatchlist2Name.toString() != '') {

          let saveWatchlistMenuItem1 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
          if (index1 !== -1) {
            saveWatchlistMenuItem1 = this.watchlistTickers[index1];
          }


          let saveWatchlistMenuItem3 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
          if (index3 !== -1) {
            saveWatchlistMenuItem3 = this.watchlistTickers[index3];
          }


          let saveWatchlistMenuItem4 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
          if (index4 !== -1) {
            saveWatchlistMenuItem4 = this.watchlistTickers[index4];
          }

          
          let saveWatchlistMenuItem5 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
          if (index5 !== -1) {
            saveWatchlistMenuItem5 = this.watchlistTickers[index5];
          }


          let watchlist2MenuItem = {
            id: "myWatchlistName2",
            label: this.enteredWatchlist2Name,
            subLabel: "",
            className: "am5stock-list-info am5stock-list-heading"
          };

          // Sort the Array List Alphabetically excluding the Headings and Stuff
          this.myWatchlist2Tickers.sort(sortNewAlph)

          // Save the Selected Internal Watchlist for Watchlist 2
          localStorage.setItem("myWatchlist2Tickers", encrypt(JSON.stringify(this.myWatchlist2Tickers), "myWatchlist2Tickers"));

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, watchlist2MenuItem, ...this.myWatchlist2Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, watchlist2MenuItem, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, watchlist2MenuItem, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, watchlist2MenuItem, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
          }

        }
        else {
          this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
          return;
        }

        // Update the working Internal Watchlist
        this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

        this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code (' + this.selectedWatchlist2Item.ShareCode + '), has been Succsessfully added to your watchlist.' });
      }
    }
  }


  deleteWatchlist2ItemOnly(watchlistItem: any): void {

    const index = this.watchlistTickers.findIndex((item) => item.id === watchlistItem.id);
    if (index !== -1) {

      // Remove the Selected Item from the Watchlist
      this.watchlistTickers.splice(index, 1);
      this.watchlistService.removeFromWatchlistByIndex(index);
  
      // Update the working Internal Watchlist
      this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
      const myWatchlist2ItemIndex = this.myWatchlist2Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (myWatchlist2ItemIndex !== -1) {
        this.myWatchlist2Tickers.splice(myWatchlist2ItemIndex, 1);
      }

      const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
      if (index1 !== -1) {
        if (this.myWatchlist2Tickers.length === 0) {
          this.watchlistTickers.splice(index1, 1);
        }
      }

      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      // Save the Selected Internal Watchlist for Watchlist 2
      localStorage.setItem("myWatchlist2Tickers", encrypt(JSON.stringify(this.myWatchlist2Tickers), "myWatchlist2Tickers"));

      // Update the local working Watchlist
      this.watchlistTickers = this.watchlistService.getWatchlist();
  
      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });

    } else {

      const index = this.myWatchlist2Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (index !== -1) {

        // Remove the Selected Item from the Watchlist
        this.myWatchlist2Tickers.splice(index, 1);
    
        const myWatchlist2ItemIndex = this.myWatchlist2Tickers.findIndex((item) => item.id === watchlistItem.id);
        if (myWatchlist2ItemIndex !== -1) {
          this.myWatchlist2Tickers.splice(myWatchlist2ItemIndex, 1);
        }

        const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
        if (index1 !== -1) {
          if (this.myWatchlist2Tickers.length === 0) {
            this.watchlistTickers.splice(index1, 1);
          }
        }

        // Save the Selected Internal Watchlist for Watchlist 2
        localStorage.setItem("myWatchlist2Tickers", encrypt(JSON.stringify(this.myWatchlist2Tickers), "myWatchlist2Tickers"));

        this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });
      }
    }

  }


  deleteSelectedWatchlist2Items(): void {

  	this.confirmationService.confirm({
  		message: 'Are you sure you want to delete all items in  your Watchlist',
  		header: 'Delete Confirmation',
  		icon: 'pi pi-info-circle',
  		accept: () => {

  			let saveWatchlistMenuItem1 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem3 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem4 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem5 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};


  			const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
  			if (index1 !== -1) {
  				saveWatchlistMenuItem1 = this.watchlistTickers[index1];
  			}

  			const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
  			if (index3 !== -1) {
  				saveWatchlistMenuItem3 = this.watchlistTickers[index3];
  			}

  			const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
  			if (index4 !== -1) {
  				saveWatchlistMenuItem4 = this.watchlistTickers[index4];
  			}

  			const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
  			if (index5 !== -1) {
  				saveWatchlistMenuItem5 = this.watchlistTickers[index5];
  			}


  			this.watchlistTickers = [];
  			this.myWatchlist2Tickers = [];

  			if (this.myWatchlist1Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
  			}

  			// // Remove the selected items from the Internal watchlist
  			// this.selectedWatchlist2Items.forEach((selectedItem) => {
  			//   const index = this.watchlistTickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.watchlistTickers.splice(index, 1);
  			//   }
  			// });

  			// // Remove the selected items from myWatchlist2
  			// this.selectedWatchlist2Items.forEach((selectedItem) => {
  			//   const index = this.myWatchlist2Tickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.myWatchlist2Tickers.splice(index, 1);
  			//   }
  			// });

  			// const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
  			// if (index1 !== -1) {
  			//   if (this.myWatchlist2Tickers.length === 0) {
  			//     this.watchlistTickers.splice(index1, 1);
  			//   }
  			// }

  			// Update the working Internal Watchlist
  			this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

  			// Update the local working Watchlist
  			this.watchlistTickers = this.watchlistService.getWatchlist();

  			// Save the updated Watchlist to myWatchlist LocalStorage
  			localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

  			// Save the Selected Internal Watchlist for Watchlist 2
  			localStorage.setItem("myWatchlist2Tickers", encrypt(JSON.stringify(this.myWatchlist2Tickers), "myWatchlist2Tickers"));

  			// Clear the selected items
  			this.selectedWatchlist2Items = [];

  		},
  		reject: () => {
  			// This block will be executed when the user cancels or rejects the deletion
  			this.messageService.add({
  				severity: 'warn',
  				summary: 'Cancelled',
  				detail: 'Deletion was cancelled'
  			});
  		}
  	});
  }

  // *** Watchlist 2 Processing - End ***

  
  // *** Watchlist 3 Processing - Start ***
  onWatchlist3NameKeyUp(event: any) {

    this.enteredWatchlist3Name = event.target.value;
    
  }

  saveWatchlist3Item(): void {

    // Update the Users Second Watchlist
    if (this.selectedWatchlist3Item) {
      const found = this.myWatchlist3Tickers.find((item) => item.id === this.selectedWatchlist3Item?.ShareCode);
      if (found === undefined) {
        let currentShare = {
          id: this.selectedWatchlist3Item.ShareCode,
          label: this.selectedWatchlist3Item.label,
          subLabel: "",
          className: ""
        };
  
        // Add and Update the Watchlist Menu and items
        this.myWatchlist3Tickers = [...this.myWatchlist3Tickers, currentShare];

        if (this.enteredWatchlist3Name.toString() != '') {

          let saveWatchlistMenuItem1 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem2 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem4 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem5 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };


          const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
          if (index1 !== -1) {
            saveWatchlistMenuItem1 = this.watchlistTickers[index1];
          }

          const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
          if (index2 !== -1) {
            saveWatchlistMenuItem2 = this.watchlistTickers[index2];
          }

          const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
          if (index4 !== -1) {
            saveWatchlistMenuItem4 = this.watchlistTickers[index4];
          }

          const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
          if (index5 !== -1) {
            saveWatchlistMenuItem5 = this.watchlistTickers[index5];
          }


          let watchlist3MenuItem = {
            id: "myWatchlistName3",
            label: this.enteredWatchlist3Name,
            subLabel: "",
            className: "am5stock-list-info am5stock-list-heading"
          };

          // Sort the Array List Alphabetically excluding the Headings and Stuff
          this.myWatchlist3Tickers.sort(sortNewAlph)

          // Save the Selected Internal Watchlist for Watchlist 3
          localStorage.setItem("myWatchlist3Tickers", encrypt(JSON.stringify(this.myWatchlist3Tickers), "myWatchlist3Tickers"));

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
          } 

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, watchlist3MenuItem, ...this.myWatchlist3Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, watchlist3MenuItem, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, watchlist3MenuItem, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
          }
        }
        else {
          this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
          return;
        }

        // Update the working Internal Watchlist
        this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

        this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code (' + this.selectedWatchlist3Item.ShareCode + '), has been Succsessfully added to your watchlist.' });
      }
    }
  }


  deleteWatchlist3ItemOnly(watchlistItem: any): void {

    const index = this.watchlistTickers.findIndex((item) => item.id === watchlistItem.id);
    if (index !== -1) {

      // Remove the Selected Item from the Watchlist
      this.watchlistTickers.splice(index, 1);
      this.watchlistService.removeFromWatchlistByIndex(index);
  
      // Update the working Internal Watchlist
      this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
      const myWatchlist3ItemIndex = this.myWatchlist3Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (myWatchlist3ItemIndex !== -1) {
        this.myWatchlist3Tickers.splice(myWatchlist3ItemIndex, 1);
      }

      const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
      if (index1 !== -1) {
        if (this.myWatchlist3Tickers.length === 0) {
          this.watchlistTickers.splice(index1, 1);
        }
      }

      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      // Save the Selected Internal Watchlist for Watchlist 3
      localStorage.setItem("myWatchlist3Tickers", encrypt(JSON.stringify(this.myWatchlist3Tickers), "myWatchlist3Tickers"));

      // Update the local working Watchlist
      this.watchlistTickers = this.watchlistService.getWatchlist();
  
      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });

    } else {

      const index = this.myWatchlist3Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (index !== -1) {

        // Remove the Selected Item from the Watchlist
        this.myWatchlist3Tickers.splice(index, 1);
    
        const myWatchlist3ItemIndex = this.myWatchlist3Tickers.findIndex((item) => item.id === watchlistItem.id);
        if (myWatchlist3ItemIndex !== -1) {
          this.myWatchlist3Tickers.splice(myWatchlist3ItemIndex, 1);
        }

        const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
        if (index1 !== -1) {
          if (this.myWatchlist3Tickers.length === 0) {
            this.watchlistTickers.splice(index1, 1);
          }
        }

        // Save the Selected Internal Watchlist for Watchlist 3
        localStorage.setItem("myWatchlist3Tickers", encrypt(JSON.stringify(this.myWatchlist3Tickers), "myWatchlist3Tickers"));

        this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });
      }
    }

  }


  deleteSelectedWatchlist3Items(): void {

  	this.confirmationService.confirm({
  		message: 'Are you sure you want to delete all items in  your Watchlist',
  		header: 'Delete Confirmation',
  		icon: 'pi pi-info-circle',
  		accept: () => {

  			let saveWatchlistMenuItem1 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem2 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem4 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem5 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};


  			const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
  			if (index1 !== -1) {
  				saveWatchlistMenuItem1 = this.watchlistTickers[index1];
  			}

  			const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
  			if (index2 !== -1) {
  				saveWatchlistMenuItem2 = this.watchlistTickers[index2];
  			}

  			const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
  			if (index4 !== -1) {
  				saveWatchlistMenuItem4 = this.watchlistTickers[index4];
  			}

  			const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
  			if (index5 !== -1) {
  				saveWatchlistMenuItem5 = this.watchlistTickers[index5];
  			}


  			this.watchlistTickers = [];
  			this.myWatchlist3Tickers = [];

  			if (this.myWatchlist1Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
  			}

  			// // Remove the selected items from the Internal watchlist
  			// this.selectedWatchlist3Items.forEach((selectedItem) => {
  			//   const index = this.watchlistTickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.watchlistTickers.splice(index, 1);
  			//   }
  			// });

  			// // Remove the selected items from myWatchlist3
  			// this.selectedWatchlist3Items.forEach((selectedItem) => {
  			//   const index = this.myWatchlist3Tickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.myWatchlist3Tickers.splice(index, 1);
  			//   }
  			// });

  			// const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
  			// if (index1 !== -1) {
  			//   if (this.myWatchlist3Tickers.length === 0) {
  			//     this.watchlistTickers.splice(index1, 1);
  			//   }
  			// }

  			// Update the working Internal Watchlist
  			this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

  			// Update the local working Watchlist
  			this.watchlistTickers = this.watchlistService.getWatchlist();

  			// Save the updated Watchlist to myWatchlist LocalStorage
  			localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

  			// Save the Selected Internal Watchlist for Watchlist 3
  			localStorage.setItem("myWatchlist3Tickers", encrypt(JSON.stringify(this.myWatchlist3Tickers), "myWatchlist3Tickers"));

  			// Clear the selected items
  			this.selectedWatchlist3Items = [];

  		},
  		reject: () => {
  			// This block will be executed when the user cancels or rejects the deletion
  			this.messageService.add({
  				severity: 'warn',
  				summary: 'Cancelled',
  				detail: 'Deletion was cancelled'
  			});
  		}
  	});
  }

  // *** Watchlist 3 Processing - End ***

  
  // *** Watchlist 4 Processing - Start ***
  onWatchlist4NameKeyUp(event: any) {

    this.enteredWatchlist4Name = event.target.value;
    
  }

  saveWatchlist4Item(): void {

    // Update the Users Second Watchlist
    if (this.selectedWatchlist4Item) {
      const found = this.myWatchlist4Tickers.find((item) => item.id === this.selectedWatchlist4Item?.ShareCode);
      if (found === undefined) {
        let currentShare = {
          id: this.selectedWatchlist4Item.ShareCode,
          label: this.selectedWatchlist4Item.label,
          subLabel: "",
          className: ""
        };
  
        // Add and Update the Watchlist Menu and items
        this.myWatchlist4Tickers = [...this.myWatchlist4Tickers, currentShare];

        if (this.enteredWatchlist4Name.toString() != '') {

          let saveWatchlistMenuItem1 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem2 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem3 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem5 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };


          const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
          if (index1 !== -1) {
            saveWatchlistMenuItem1 = this.watchlistTickers[index1];
          }

          const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
          if (index2 !== -1) {
            saveWatchlistMenuItem2 = this.watchlistTickers[index2];
          }

          const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
          if (index3 !== -1) {
            saveWatchlistMenuItem3 = this.watchlistTickers[index3];
          }

          const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
          if (index5 !== -1) {
            saveWatchlistMenuItem5 = this.watchlistTickers[index5];
          }


          let watchlist4MenuItem = {
            id: "myWatchlistName4",
            label: this.enteredWatchlist4Name,
            subLabel: "",
            className: "am5stock-list-info am5stock-list-heading"
          };

          // Sort the Array List Alphabetically excluding the Headings and Stuff
          this.myWatchlist4Tickers.sort(sortNewAlph)

          // Save the Selected Internal Watchlist for Watchlist 4
          localStorage.setItem("myWatchlist4Tickers", encrypt(JSON.stringify(this.myWatchlist4Tickers), "myWatchlist4Tickers"));

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
          } 

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, watchlist4MenuItem, ...this.myWatchlist4Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, watchlist4MenuItem, ...this.myWatchlist4Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
          }

        }
        else {
          this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
          return;
        }

        // Update the working Internal Watchlist
        this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

        this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code (' + this.selectedWatchlist4Item.ShareCode + '), has been Succsessfully added to your watchlist.' });
      }
    }
  }


  deleteWatchlist4ItemOnly(watchlistItem: any): void {

    const index = this.watchlistTickers.findIndex((item) => item.id === watchlistItem.id);
    if (index !== -1) {

      // Remove the Selected Item from the Watchlist
      this.watchlistTickers.splice(index, 1);
      this.watchlistService.removeFromWatchlistByIndex(index);
  
      // Update the working Internal Watchlist
      this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
      const myWatchlist4ItemIndex = this.myWatchlist4Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (myWatchlist4ItemIndex !== -1) {
        this.myWatchlist4Tickers.splice(myWatchlist4ItemIndex, 1);
      }

      const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
      if (index1 !== -1) {
        if (this.myWatchlist4Tickers.length === 0) {
          this.watchlistTickers.splice(index1, 1);
        }
      }

      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      // Save the Selected Internal Watchlist for Watchlist 4
      localStorage.setItem("myWatchlist4Tickers", encrypt(JSON.stringify(this.myWatchlist4Tickers), "myWatchlist4Tickers"));

      // Update the local working Watchlist
      this.watchlistTickers = this.watchlistService.getWatchlist();
  
      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });

    } else {

      const index = this.myWatchlist4Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (index !== -1) {

        // Remove the Selected Item from the Watchlist
        this.myWatchlist4Tickers.splice(index, 1);
    
        const myWatchlist4ItemIndex = this.myWatchlist4Tickers.findIndex((item) => item.id === watchlistItem.id);
        if (myWatchlist4ItemIndex !== -1) {
          this.myWatchlist4Tickers.splice(myWatchlist4ItemIndex, 1);
        }

        const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
        if (index1 !== -1) {
          if (this.myWatchlist4Tickers.length === 0) {
            this.watchlistTickers.splice(index1, 1);
          }
        }

        // Save the Selected Internal Watchlist for Watchlist 4
        localStorage.setItem("myWatchlist4Tickers", encrypt(JSON.stringify(this.myWatchlist4Tickers), "myWatchlist4Tickers"));

        this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });
      }
    }

  }


  deleteSelectedWatchlist4Items(): void {

  	this.confirmationService.confirm({
  		message: 'Are you sure you want to delete all items in  your Watchlist',
  		header: 'Delete Confirmation',
  		icon: 'pi pi-info-circle',
  		accept: () => {

  			let saveWatchlistMenuItem1 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem2 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem3 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem5 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};


  			const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
  			if (index1 !== -1) {
  				saveWatchlistMenuItem1 = this.watchlistTickers[index1];
  			}

  			const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
  			if (index2 !== -1) {
  				saveWatchlistMenuItem2 = this.watchlistTickers[index2];
  			}

  			const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
  			if (index3 !== -1) {
  				saveWatchlistMenuItem3 = this.watchlistTickers[index3];
  			}

  			const index5 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
  			if (index5 !== -1) {
  				saveWatchlistMenuItem5 = this.watchlistTickers[index5];
  			}


  			this.watchlistTickers = [];
  			this.myWatchlist4Tickers = [];

  			if (this.myWatchlist1Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem5, ...this.myWatchlist5Tickers];
  			}

  			// // Remove the selected items from the Internal watchlist
  			// this.selectedWatchlist4Items.forEach((selectedItem) => {
  			//   const index = this.watchlistTickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.watchlistTickers.splice(index, 1);
  			//   }
  			// });

  			// // Remove the selected items from myWatchlist4
  			// this.selectedWatchlist4Items.forEach((selectedItem) => {
  			//   const index = this.myWatchlist4Tickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.myWatchlist4Tickers.splice(index, 1);
  			//   }
  			// });

  			// const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
  			// if (index1 !== -1) {
  			//   if (this.myWatchlist4Tickers.length === 0) {
  			//     this.watchlistTickers.splice(index1, 1);
  			//   }
  			// }

  			// Update the working Internal Watchlist
  			this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

  			// Update the local working Watchlist
  			this.watchlistTickers = this.watchlistService.getWatchlist();

  			// Save the updated Watchlist to myWatchlist LocalStorage
  			localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

  			// Save the Selected Internal Watchlist for Watchlist 4
  			localStorage.setItem("myWatchlist4Tickers", encrypt(JSON.stringify(this.myWatchlist4Tickers), "myWatchlist4Tickers"));

  			// Clear the selected items
  			this.selectedWatchlist4Items = [];

  		},
  		reject: () => {
  			// This block will be executed when the user cancels or rejects the deletion
  			this.messageService.add({
  				severity: 'warn',
  				summary: 'Cancelled',
  				detail: 'Deletion was cancelled'
  			});
  		}
  	});
  }

  // *** Watchlist 4 Processing - End ***

  
  // *** Watchlist 5 Processing - Start ***
  onWatchlist5NameKeyUp(event: any) {

    this.enteredWatchlist5Name = event.target.value;
    
  }

  saveWatchlist5Item(): void {

    // Update the Users Second Watchlist
    if (this.selectedWatchlist5Item) {
      const found = this.myWatchlist5Tickers.find((item) => item.id === this.selectedWatchlist5Item?.ShareCode);
      if (found === undefined) {
        let currentShare = {
          id: this.selectedWatchlist5Item.ShareCode,
          label: this.selectedWatchlist5Item.label,
          subLabel: "",
          className: ""
        };
  
        // Add and Update the Watchlist Menu and items
        this.myWatchlist5Tickers = [...this.myWatchlist5Tickers, currentShare];

        if (this.enteredWatchlist5Name.toString() != '') {

          let saveWatchlistMenuItem1 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem2 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem3 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };

          let saveWatchlistMenuItem4 = {
            id: "",
            label: "",
            subLabel: "",
            className: ""
          };


          const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
          if (index1 !== -1) {
            saveWatchlistMenuItem1 = this.watchlistTickers[index1];
          }

          const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
          if (index2 !== -1) {
            saveWatchlistMenuItem2 = this.watchlistTickers[index2];
          }

          const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
          if (index3 !== -1) {
            saveWatchlistMenuItem3 = this.watchlistTickers[index3];
          }

          const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
          if (index4 !== -1) {
            saveWatchlistMenuItem4 = this.watchlistTickers[index4];
          }


          let watchlist5MenuItem = {
            id: "myWatchlistName5",
            label: this.enteredWatchlist5Name,
            subLabel: "",
            className: "am5stock-list-info am5stock-list-heading"
          };

          // Sort the Array List Alphabetically excluding the Headings and Stuff
          this.myWatchlist5Tickers.sort(sortNewAlph)

          // Save the Selected Internal Watchlist for Watchlist 5
          localStorage.setItem("myWatchlist5Tickers", encrypt(JSON.stringify(this.myWatchlist5Tickers), "myWatchlist5Tickers"));

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
          } 

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
          }

          // Add the Watchlist menu items
          if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0 && this.myWatchlist5Tickers.length > 0) {
            this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers, watchlist5MenuItem, ...this.myWatchlist5Tickers];
          }

        }
        else {
          this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
          return;
        }

        // Update the working Internal Watchlist
        this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

        this.messageService.add({ key: 'bc', severity: 'success', summary: 'Success', detail: 'Share Code (' + this.selectedWatchlist5Item.ShareCode + '), has been Succsessfully added to your watchlist.' });
      }
    }
  }


  deleteWatchlist5ItemOnly(watchlistItem: any): void {

    const index = this.watchlistTickers.findIndex((item) => item.id === watchlistItem.id);
    if (index !== -1) {

      // Remove the Selected Item from the Watchlist
      this.watchlistTickers.splice(index, 1);
      this.watchlistService.removeFromWatchlistByIndex(index);
  
      // Update the working Internal Watchlist
      this.watchlistService.updateInternalWatchlist(this.watchlistTickers);
  
      const myWatchlist5ItemIndex = this.myWatchlist5Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (myWatchlist5ItemIndex !== -1) {
        this.myWatchlist5Tickers.splice(myWatchlist5ItemIndex, 1);
      }

      const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
      if (index1 !== -1) {
        if (this.myWatchlist5Tickers.length === 0) {
          this.watchlistTickers.splice(index1, 1);
        }
      }

      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      // Save the Selected Internal Watchlist for Watchlist 5
      localStorage.setItem("myWatchlist5Tickers", encrypt(JSON.stringify(this.myWatchlist5Tickers), "myWatchlist5Tickers"));

      // Update the local working Watchlist
      this.watchlistTickers = this.watchlistService.getWatchlist();
  
      // Save the Selected Share to myWatchlist LocalStorage
      localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

      this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });

    } else {

      const index = this.myWatchlist5Tickers.findIndex((item) => item.id === watchlistItem.id);
      if (index !== -1) {

        // Remove the Selected Item from the Watchlist
        this.myWatchlist5Tickers.splice(index, 1);
    
        const myWatchlist5ItemIndex = this.myWatchlist5Tickers.findIndex((item) => item.id === watchlistItem.id);
        if (myWatchlist5ItemIndex !== -1) {
          this.myWatchlist5Tickers.splice(myWatchlist5ItemIndex, 1);
        }

        const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
        if (index1 !== -1) {
          if (this.myWatchlist5Tickers.length === 0) {
            this.watchlistTickers.splice(index1, 1);
          }
        }

        // Save the Selected Internal Watchlist for Watchlist 5
        localStorage.setItem("myWatchlist5Tickers", encrypt(JSON.stringify(this.myWatchlist5Tickers), "myWatchlist5Tickers"));

        this.messageService.add({ key: 'tl', severity: 'info', summary: 'Info', detail: 'Share Code (' + watchlistItem + '), has been removed from your watchlist.' });
      }
    }

  }


  deleteSelectedWatchlist5Items(): void {

  	this.confirmationService.confirm({
  		message: 'Are you sure you want to delete all items in  your Watchlist',
  		header: 'Delete Confirmation',
  		icon: 'pi pi-info-circle',
  		accept: () => {

  			let saveWatchlistMenuItem1 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem2 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem3 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};

  			let saveWatchlistMenuItem4 = {
  				id: "",
  				label: "",
  				subLabel: "",
  				className: ""
  			};


  			const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
  			if (index1 !== -1) {
  				saveWatchlistMenuItem1 = this.watchlistTickers[index1];
  			}

  			const index2 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
  			if (index2 !== -1) {
  				saveWatchlistMenuItem2 = this.watchlistTickers[index2];
  			}

  			const index3 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
  			if (index3 !== -1) {
  				saveWatchlistMenuItem3 = this.watchlistTickers[index3];
  			}

  			const index4 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
  			if (index4 !== -1) {
  				saveWatchlistMenuItem4 = this.watchlistTickers[index4];
  			}


  			this.watchlistTickers = [];
  			this.myWatchlist5Tickers = [];

  			if (this.myWatchlist1Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers];
  			}

  			if (this.myWatchlist1Tickers.length > 0 && this.myWatchlist2Tickers.length > 0 && this.myWatchlist3Tickers.length > 0 && this.myWatchlist4Tickers.length > 0) {
  				this.watchlistTickers = [saveWatchlistMenuItem1, ...this.myWatchlist1Tickers, saveWatchlistMenuItem2, ...this.myWatchlist2Tickers, saveWatchlistMenuItem3, ...this.myWatchlist3Tickers, saveWatchlistMenuItem4, ...this.myWatchlist4Tickers];
  			}

  			// // Remove the selected items from the Internal watchlist
  			// this.selectedWatchlist5Items.forEach((selectedItem) => {
  			//   const index = this.watchlistTickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.watchlistTickers.splice(index, 1);
  			//   }
  			// });

  			// // Remove the selected items from myWatchlist5
  			// this.selectedWatchlist5Items.forEach((selectedItem) => {
  			//   const index = this.myWatchlist5Tickers.findIndex((item) => item === selectedItem);
  			//   if (index !== -1) {
  			//     this.myWatchlist5Tickers.splice(index, 1);
  			//   }
  			// });

  			// const index1 = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
  			// if (index1 !== -1) {
  			//   if (this.myWatchlist5Tickers.length === 0) {
  			//     this.watchlistTickers.splice(index1, 1);
  			//   }
  			// }

  			// Update the working Internal Watchlist
  			this.watchlistService.updateInternalWatchlist(this.watchlistTickers);

  			// Update the local working Watchlist
  			this.watchlistTickers = this.watchlistService.getWatchlist();

  			// Save the updated Watchlist to myWatchlist LocalStorage
  			localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

  			// Save the Selected Internal Watchlist for Watchlist 5
  			localStorage.setItem("myWatchlist5Tickers", encrypt(JSON.stringify(this.myWatchlist5Tickers), "myWatchlist5Tickers"));

  			// Clear the selected items
  			this.selectedWatchlist5Items = [];

  		},
  		reject: () => {
  			// This block will be executed when the user cancels or rejects the deletion
  			this.messageService.add({
  				severity: 'warn',
  				summary: 'Cancelled',
  				detail: 'Deletion was cancelled'
  			});
  		}
  	});
  }

  // *** Watchlist 5 Processing - End ***


  // reloadComponent(self:boolean,urlToNavigateTo ?:string){
  //     //skipLocationChange:true means dont update the url to / when navigating
  //   console.log("Current route I am on:",this.router.url);
  //   const url=self ? this.router.url :urlToNavigateTo;
  //   this.router.navigateByUrl('/',{skipLocationChange:true}).then(()=>{
  //     this.router.navigate([`/${url}`]).then(()=>{
  //       console.log(`After navigation I am on:${this.router.url}`)
  //     })
  //   })
  // }

  // reload(){
  //   this.reloadComponent(false,'charts');
  // }
 
  // reloadCurrent(){
  //   this.reloadComponent(true);
  // }

  onThemeSwitchChange() {
    this.isLightTheme = !this.isLightTheme;
    const selectedTheme = this.isLightTheme ? 'light' : 'dark';
    document.body.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('selectedTheme', selectedTheme); // Store the selected theme in localStorage
    window.location.reload();
    //this.reload();
  }

  openModal(menuItem: string): void {
    // Set the corresponding modal to open
    this.isModalOpen[menuItem] = true;
  }


  // *** GET DIRECTOR DEALINGS ***
  openModalDirectorsDealings(menuItem: string): void {
    this.startLoading(); // Call startLoading when the event occurs
    this.isModalOpen[menuItem] = true;
    let headers = new HttpHeaders()
    headers = headers.append('content-type','application/json');
    headers = headers.append('mode', 'cors');
    headers = headers.append('credentials', 'include');
    headers = headers.append('rejectUnauthorized', 'false');
    headers = headers.append('Authorization', 'Bearer ' + this.setToken);

    this.DirectorDealingsColumns = [
      //{ field: 'ID', header: 'ID' },
      { field: 'ShareCode', header: 'Share Code' },
      { field: 'CompanyFullName', header: 'Company FullName' },
      { field: 'DirectorInitials', header: 'Director Initials' },
      { field: 'DirectorLastName', header: 'Director LastName' },
      { field: 'Price', header: 'Price' },
      { field: 'Volume', header: 'Volume' },
      { field: 'TransactionDate', header: 'Transaction Date' },
      { field: 'TransactionDescription', header: 'Transaction Description' },
    ]


    // *** LOAD THE DIRECTOR DEALINGS LIST ***
    this.hasDirectorsDealings = false;
    let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetDirectorDealings?%24orderby=TransactionDate%20desc&$top=10&%24filter=(ShareCode%20eq%20'${this.selectedShareCode}'%20)`;
    const httpClientDirectorDealings = new HttpClient(new HttpXhrBackend({ 
      build: () => new XMLHttpRequest() 
    }));
    httpClientDirectorDealings.get<any>(endpoint, { headers })
      .subscribe(
        (response: { [x: string]: any; }) => {
          this.DirectorsDealingsArrayResponse = JSON.parse(JSON.stringify(response["value"]))

          if (this.DirectorsDealingsArrayResponse.length > 0) {
            this.hasDirectorsDealings = true;
          }
      },
      (error: any) => {
        console.log(error);
      }
    ),
    (error: any) => {
      console.log(error);
    }

    this.isModalOpen[menuItem] = true;
  }


  // *** GET DIVIDENDS HISTORY ***
  openModalDividendsHistory(menuItem: string): void {
    this.startLoading(); // Call startLoading when the event occurs

    let headers = new HttpHeaders()
    headers = headers.append('content-type','application/json');
    headers = headers.append('mode', 'cors');
    headers = headers.append('credentials', 'include');
    headers = headers.append('rejectUnauthorized', 'false');
    headers = headers.append('Authorization', 'Bearer ' + this.setToken);

    this.DividendsHistoryColumns = [
      //{ field: 'ID', header: 'ID' },
      { field: 'ShareCode', header: 'Share Code' },
      // { field: 'ShortName', header: 'Short Name' },
      { field: 'LongName', header: 'Long Name' },
      { field: 'FinancialYearEndDate', header: 'Financial Year-End Date' },
      { field: 'DeclarationDate', header: 'Declaration Date' },
      { field: 'DividendAmount', header: 'Dividend Amount' },
      { field: 'DividendNumber', header: 'Dividend Number' },
      { field: 'LastDateToRegister', header: 'Last Date to Register' },
      { field: 'PaymentDate', header: 'Payment Date' },
      { field: 'DividendSubType', header: 'Dividend Subtype' },
    ]


    // *** LOAD THE DIVIDENDS HISTORY LIST ***
    this.hasDevidendsHistory = false;
    let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetDividendsHistory?%24orderby=LastDateToRegister%20desc&$top=10&%24filter=(ShareCode%20eq%20'${this.selectedShareCode}'%20)`;
    const httpClientDividendsHistory = new HttpClient(new HttpXhrBackend({ 
      build: () => new XMLHttpRequest() 
    }));
    httpClientDividendsHistory.get<any>(endpoint, { headers })
      .subscribe(
        (response: { [x: string]: any; }) => {
          this.DividendsHistoryArrayResponse = JSON.parse(JSON.stringify(response["value"]))

          if (this.DividendsHistoryArrayResponse.length > 0) {
            this.hasDevidendsHistory = true;
          }
      },
      (error: any) => {
        console.log(error);
      }
    ),
    (error: any) => {
      console.log(error);
    }

    this.isModalOpen[menuItem] = true;
  }


  // *** GET COMPANY FINANCIAL RESULTS - Ratios, Income Statement, Balance Sheet and Cashflow Statement ***
  openModalCompanyFinancialResults(menuItem: string): void {
    this.selectedFinancialResultsTabName('Financial Results - Ratios');
    this.isModalOpen[menuItem] = true;
  }

  selectedFinancialResultsTabName(menuItem: string) {
    this.hasFinantialResults = false;
    this.startLoading(); // Call startLoading when the event occurs
    
    let headers = new HttpHeaders()
    headers = headers.append('content-type','application/json');
    headers = headers.append('mode', 'cors');
    headers = headers.append('credentials', 'include');
    headers = headers.append('rejectUnauthorized', 'false');
    headers = headers.append('Authorization', 'Bearer ' + this.setToken);

    // Determin which 'ReturnFinancialTypeInfo' to Generate the results for
    let ReturnFinancialType: string = '';
    if (menuItem === 'Financial Results - Ratios') {
      ReturnFinancialType = 'R'
    } else if (menuItem === 'Financial Results - Income Statement') {
      ReturnFinancialType = 'I'
    } else if (menuItem === 'Financial Results - Balance Sheet') {
      ReturnFinancialType = 'B'
    } else if (menuItem === 'Financial Results - Cashflow Statement') {
      ReturnFinancialType = 'C'
    }

    this.CompanyFinancialResultsColumns = [
      //{ field: 'ID', header: 'ID' },
      //{ field: 'ItemID', header: 'Item ID' },
      { field: 'ShareCode', header: 'Share Code' },
      { field: 'FinancialDescriptionName', header: 'Financial Description' },
      //{ field: 'FinancialYear1', header: 'FinancialYear1' },
      { field: 'FinancialValueForYear1', header: 'Financial Value 1' },
      //{ field: 'FinancialYear2', header: 'Financial Year' },
      { field: 'FinancialValueForYear2', header: 'Financial Value 2' },
      //{ field: 'FinancialYear3', header: 'Financial Year' },
      { field: 'FinancialValueForYear3', header: 'Financial Value 3' },
    ]

    // *** LOAD THE COMPANY FINANCIAL RESULTS - RATIOS LIST ***
    let endpoint = `${environment.apiAuthenticationEndpoint}/GetCKS_CompanyFinancialResultsByShareCode/${this.selectedShareCode}/${ReturnFinancialType}`;
    const httpClientIndices = new HttpClient(new HttpXhrBackend({
      build: () => new XMLHttpRequest()
    }));
    httpClientIndices.get<any>(endpoint, { headers })
      .subscribe(
        (response: { [x: string]: any; }) => {
          this.CompanyFinancialResultsArrayResponse = JSON.parse(JSON.stringify(response))

          if (this.CompanyFinancialResultsArrayResponse.length > 0) {
            this.hasFinantialResults = true;
          }

          this.FinancialYear1 = this.CompanyFinancialResultsArrayResponse[0].FinancialYear1;
          this.FinancialYear2 = this.CompanyFinancialResultsArrayResponse[0].FinancialYear2;
          this.FinancialYear3 = this.CompanyFinancialResultsArrayResponse[0].FinancialYear3;
      },
      (error: any) => {
        console.log(error);
      }
    ),
    (error: any) => {
      console.log(error);
    }

    this.isModalOpen[menuItem] = true;
  }


  // *** GET Market News By Share Code ***
  openModalMarketNews(menuItem: string) {
    this.startLoading(); // Call startLoading when the event occurs

    let headers = new HttpHeaders()
    headers = headers.append('content-type','application/json');
    headers = headers.append('mode', 'cors');
    headers = headers.append('credentials', 'include');
    headers = headers.append('rejectUnauthorized', 'false');
    headers = headers.append('Authorization', 'Bearer ' + this.setToken);

    this.MarketNewsColumns = [
      //{ field: 'ID', header: 'ID' },
      { field: 'ShareCode', header: 'Share Code' },
      // { field: 'ShortName', header: 'Short Name' },
      { field: 'Date', header: 'Date' },
      // { field: 'Time', header: 'Time' },
      { field: 'Description', header: 'Description' },
      { field: 'Article', header: 'Article' },
      // { field: 'DividendNumber', header: 'Dividend Number' },
      // { field: 'Source', header: 'Source' },
      // { field: 'DateCreated', header: 'Date Created' },
      // { field: 'ArticleID', header: 'Article ID' },
    ]


    // *** LOAD THE Market News LIST ***
    this.hasMarketNews = false;
    let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetMarketNewsByShareCode?%24orderby=Date%20desc&$top=10&%24filter=(ShareCode%20eq%20'${this.selectedShareCode}'%20)`;
    const httpClientIndices = new HttpClient(new HttpXhrBackend({
      build: () => new XMLHttpRequest()
    }));
    httpClientIndices.get<any>(endpoint, { headers })
      .subscribe(
        (response: { [x: string]: any; }) => {
          this.MarketNewsArrayResponse = JSON.parse(JSON.stringify(response["value"]))

          if (this.MarketNewsArrayResponse.length > 0) {
            this.hasMarketNews = true;
          }
      },
      (error: any) => {
        console.log(error);
      }
    ),
    (error: any) => {
      console.log(error);
    }

    this.isModalOpen[menuItem] = true;
  }


  openModalCompanyStatutoryInformation(menuItem: string): void {
    this.startLoading(); // Call startLoading when the event occurs

    let headers = new HttpHeaders()
    headers = headers.append('content-type','application/json');
    headers = headers.append('mode', 'cors');
    headers = headers.append('credentials', 'include');
    headers = headers.append('rejectUnauthorized', 'false');
    headers = headers.append('Authorization', 'Bearer ' + this.setToken);

    // *** Company Information Start ***
    this.hasCompanyInformation = false;
    let endpoint = `${environment.apiUrl}/api/odata/CKS_SharetStatutoryInformation/%27${this.selectedShareCode}%27`;
    const httpClientIndices = new HttpClient(new HttpXhrBackend({
      build: () => new XMLHttpRequest()
    }));
    httpClientIndices.get<any>(endpoint, { headers })
      .subscribe(
        (response: { [x: string]: any; }) => {
          const selectedItemString = JSON.stringify(response);
          const selectedItem = JSON.parse(selectedItemString);

          this.companyInformation = [];
          this.companyInformation.push({
              ShareCode: selectedItem.ShareCode,
              NatureOfBusiness: selectedItem.NatureOfBusiness,
              CompanyFullName: selectedItem.CompanyFullName,
              Email: selectedItem.Email,
              Fax: selectedItem.Fax,
              Tel: selectedItem.Tel,
              Industry: selectedItem.Industry,
              Sector: selectedItem.Sector,
              SubSector: selectedItem.SubSector,
              YearEnd: selectedItem.YearEnd,
              ShortName: selectedItem.ShortName,
              PostalAddress: selectedItem.PostalAddress,
              PostalCode: selectedItem.PostalCode,
              PostalRegion: selectedItem.PostalRegion,
              PostalSuburb: selectedItem.PostalSuburb,
              PostalTown: selectedItem.PostalTown,
              ResidentialAddress: selectedItem.ResidentialAddress,
              ResidentialCode: selectedItem.ResidentialCode,
              ResidentialRegion: selectedItem.ResidentialRegion,
              ResidentialSuburb: selectedItem.ResidentialSuburb,
              ResidentialTown: selectedItem.ResidentialTown
            },
          );

          if (this.companyInformation.length > 0) {
            this.hasCompanyInformation = true;
          }
        },
      (error: any) => {
        console.log(error);
      }
    ),
    (error: any) => {
      console.log(error);
    }

    this.isModalOpen[menuItem] = true;
  }


  // *** Watchlist Management Model ***
  openModalWatchlist(menuItem: string) {
    this.selectedWatchlistTabName('Watchlist Management');

    // Update/Set the allWatchlistTickers used in the Watchlist Management Model/Window
    this.allWatchlistTickers = this.allIndicatorsList;

    this.isModalOpen[menuItem] = true;
  }

  selectedWatchlistTabName(menuItem: string) {

    this.startLoadingWL(); // Call startLoading when the event occurs

    // My Watchlist 1
    const foundWatchlist1NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
    if (foundWatchlist1NameIndex !== -1) {
      if (this.enteredWatchlist1Name !== "Watchlist 1") {
        this.watchlistTickers[foundWatchlist1NameIndex].label = this.enteredWatchlist1Name;
      } else {
        this.enteredWatchlist1Name = this.watchlistTickers[foundWatchlist1NameIndex].label;
      }
    }


    // My Watchlist 2
    const foundWatchlist2NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
    if (foundWatchlist2NameIndex !== -1) {
      if (this.enteredWatchlist2Name !== "Watchlist 2") {
        this.watchlistTickers[foundWatchlist2NameIndex].label = this.enteredWatchlist2Name;
      } else {
        this.enteredWatchlist2Name = this.watchlistTickers[foundWatchlist2NameIndex].label;
      }
    }


    // My Watchlist 3
    const foundWatchlist3NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
    if (foundWatchlist3NameIndex !== -1) {
      if (this.enteredWatchlist3Name !== "Watchlist 3") {
        this.watchlistTickers[foundWatchlist3NameIndex].label = this.enteredWatchlist3Name;
      } else {
        this.enteredWatchlist3Name = this.watchlistTickers[foundWatchlist3NameIndex].label;
      }
    }


    // My Watchlist 4
    const foundWatchlist4NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
    if (foundWatchlist4NameIndex !== -1) {
      if (this.enteredWatchlist4Name !== "Watchlist 4") {
        this.watchlistTickers[foundWatchlist4NameIndex].label = this.enteredWatchlist4Name;
      } else {
        this.enteredWatchlist4Name = this.watchlistTickers[foundWatchlist4NameIndex].label;
      }
    }


    // My Watchlist 5
    const foundWatchlist5NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
    if (foundWatchlist5NameIndex !== -1) {
      if (this.enteredWatchlist5Name !== "Watchlist 5") {
        this.watchlistTickers[foundWatchlist5NameIndex].label = this.enteredWatchlist5Name;
      } else {
        this.enteredWatchlist5Name = this.watchlistTickers[foundWatchlist5NameIndex].label;
      }
    }


    // Save the Selected Share to myWatchlist LocalStorage
    localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));

    this.isModalOpen[menuItem] = true;
  }


  closeModal(menuItem: string): void {

    if (menuItem === "Watchlist Management") {

      // This is incase the User Only updates their Watchlist Name
      if (this.enteredWatchlist1Name.toString() != '') {

        const foundWatchlist1NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName1");
        if (foundWatchlist1NameIndex !== -1) {
          this.watchlistTickers[foundWatchlist1NameIndex].label = this.enteredWatchlist1Name;
        }

        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));
      }
      else {
        this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
        return;
      }


      // This is incase the User Only updates their Watchlist Name
      if (this.enteredWatchlist2Name.toString() != '') {

        const foundWatchlist2NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName2");
        if (foundWatchlist2NameIndex !== -1) {
          this.watchlistTickers[foundWatchlist2NameIndex].label = this.enteredWatchlist2Name;
        }

        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));
      }
      else {
        this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
        return;
      }


      // This is incase the User Only updates their Watchlist Name
      if (this.enteredWatchlist3Name.toString() != '') {

        const foundWatchlist3NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName3");
        if (foundWatchlist3NameIndex !== -1) {
          this.watchlistTickers[foundWatchlist3NameIndex].label = this.enteredWatchlist3Name;
        }

        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));
      }
      else {
        this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
        return;
      }


      // This is incase the User Only updates their Watchlist Name
      if (this.enteredWatchlist4Name.toString() != '') {

        const foundWatchlist4NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName4");
        if (foundWatchlist4NameIndex !== -1) {
          this.watchlistTickers[foundWatchlist4NameIndex].label = this.enteredWatchlist4Name;
        }

        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));
      }
      else {
        this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
        return;
      }


      // This is incase the User Only updates their Watchlist Name
      if (this.enteredWatchlist5Name.toString() != '') {

        const foundWatchlist5NameIndex = this.watchlistTickers.findIndex((item) => item.id === "myWatchlistName5");
        if (foundWatchlist5NameIndex !== -1) {
          this.watchlistTickers[foundWatchlist5NameIndex].label = this.enteredWatchlist5Name;
        }

        // Save the Selected Share to myWatchlist LocalStorage
        localStorage.setItem("myWatchlist", encrypt(JSON.stringify(this.watchlistTickers), "myWatchlist"));
      }
      else {
        this.messageService.add({ key: 'bc', severity: 'error', summary: 'Error', detail: 'The Watchlist Name is a Mandatory field!  Please provide a Watchlist Name.' });
        return;
      }
      
    }

    // Close the corresponding modal
    this.isModalOpen[menuItem] = false;

  }

  setDrawingsOn(action: string) {
    localStorage.setItem("setDrawingsOn", action);
  }

  toggleFullScreen() {
    const elem = this.el.nativeElement.querySelector('.Fullscreen');

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  }

  ngAfterViewInit(): void {
    // Add the hide-after-5s class after 5 seconds
    setTimeout(() => {
      const loadingWrapper = document.getElementById('loading-wrapper');
      if (loadingWrapper) {
        loadingWrapper.classList.add('hide-after-5s');
      }
    }, 3000);
  }

}

function encrypt(txtToEncrypt: string, key: string): string {
  return CryptoJS.AES.encrypt(txtToEncrypt, key).toString();
}

function decrypt(txtToDecrypt: string, key: string) {
  return CryptoJS.AES.decrypt(txtToDecrypt, key).toString(CryptoJS.enc.Utf8);
}

function isEncrypted(value: string, key: string): boolean {
  try {
    const decrypted = CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8);
    return decrypted.length > 0;
  } catch (error) {
    return false;
  }
}

function migrateMyDrawingsData(): void {
  const prefix = "myDrawings_"; // Prefix for local storage keys

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);

    // Check if the key starts with the prefix
    if (storageKey && storageKey.startsWith(prefix)) {
      const storedValue = localStorage.getItem(storageKey);

      if (storedValue) {
        const shareCodeName = storageKey.substring(prefix.length); // Extract shareCodeName
        const encryptionKey = prefix + shareCodeName; // Generate the key dynamically

        if (isEncrypted(storedValue, encryptionKey)) {
          const decryptedValue = decrypt(storedValue, encryptionKey);
          localStorage.setItem(storageKey, decryptedValue);
          console.log('Migrated and updated the local storage for key' + "${storageKey}");
        } else {
          console.log('Value for key' + "${storageKey}" + 'is not encrypted. No action taken');
        }
      }
    }
  }

  console.log("Migration completed.");
}

// Run the migration
migrateMyDrawingsData();

// function getUserSelectedThemeColour() {
//   if (localStorage.getItem("selectedTheme") === "dark") {

//     return am5.color(0x171b29);

//   } else {

//     return am5.color(0x71848d);

//   }
// }

// // setUserSelectedThemeColour(mainPanel, root)
// function setUserSelectedThemeColour(mainPanel: am5stock.StockPanel, root: am5.Root) {
//   if (localStorage.getItem("selectedTheme") === "dark") {

//     mainPanel.set("colors", am5.ColorSet._new(root, {
//       colors: [am5.color(0x171b29)]
//     }))

//     return am5.color(0x71848d);

//   } else {

//     mainPanel.set("colors", am5.ColorSet._new(root, {
//       colors: [am5.color(0x171b29)]
//     }))

//     return am5.color(0xffffff);

//   }
// }

// class STATheme extends am5.Theme {

//   override setupDefaultRules() {

//     if (localStorage.getItem("selectedTheme") === "dark") {

//       this.rule("Label").setAll({
//         fill: am5.color(0x71848d),
//         fontSize: "1em"
//       })
  
//       this.rule("Graphics").setAll({
//         fill: am5.color(0x71848d),
//       })
  
//       // this.rule("InterfaceColors").setAll({
//       //   //background: am5.color(0x71848d),
//       //   //grid: am5.color(0xffffff),
//       //   //alternativeBackground: am5.color(0x71848d),
//       //   //text: am5.color(0xffffff),
//       //   //fill: am5.color(0x71848d),
//       // })

//       this.rule("AxisRenderer").setAll({
//         fill: am5.color(0x151825),
//       })

//     } else {
  
//       this.rule("Label").setAll({
//         fill: am5.color(0x71848d),
//         fontSize: "1em"
//       })
  
//       this.rule("Graphics").setAll({
//         fill: am5.color(0xffffff),
//       })
  
//       // this.rule("InterfaceColors").setAll({
//       //   background: am5.color(0xECECEC),
//       //   grid: am5.color(0x000000),
//       //   alternativeBackground: am5.color(0xECECEC),
//       //   text: am5.color(0x000000),
//       //   fill: am5.color(0xECECEC),
//       // })

//       this.rule("AxisRenderer").setAll({
//         fill: am5.color(0xECECEC),
//       })

//     }

//   }

// }

class FibonacciTheme extends am5.Theme {

  override setupDefaultRules() {

    this.rule("FibonacciSeries").setAll({


      sequence: [ 1.618, 1.272, 1, 0.764, 0.618, 0.5, 0.382, 0.236, 0, -0.272, -0.618 ],

      colors: [

        am5.color(0x868686),

        am5.color(0xed483c),

        am5.color(0x83c486),

        am5.color(0x4fab53),

        am5.color(0x059183),

        am5.color(0x69b4f1),

        am5.color(0x868686),

        am5.color(0x3065f8),

        am5.color(0xed483c),

        am5.color(0x982bab),

        am5.color(0xe22465)

      ]

    })

  }

}


function sortNewAlph(a: any, b: any): number {

    if (a.label.toLowerCase() > b.label.toLowerCase()) {
      return 1;
    }

    if (a.label.toLowerCase() < b.label.toLowerCase()) {
      return -1;
    }

    return 0;

}

function getShareNameByShareCodeID(search: any, allIndicatorsList: any[]) {
  return allIndicatorsList.find( ({ id }) => id === search );
    // search = search.toLowerCase();
  // return allIndicatorsList.filter((item: any) => {
  //   return item.id.toLowerCase().match(search);
  // });
}

function maybeDisposeRoot(divId: string) {
  am5.array.each(am5.registry.rootElements, function(root) {
    if (root.dom.id == divId) {
      try {
        root.dispose();
      } catch (error) {
        root.dispose();
    }}
  });
}

function setComparisonAdded(action: string) {
  localStorage.setItem("ComparisonAdded", action);
}

function getComparisonAdded() {
  return localStorage.getItem("ComparisonAdded");
}
