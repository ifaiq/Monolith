import { Component, OnInit, ViewChild } from "@angular/core";
import { routerTransition } from "../../router.animations";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { BaseChartDirective } from "ng2-charts/ng2-charts";
import { SharedFunctionsService } from "../../shared";
import { AccountSettingService } from "../../shared/services/account-settings";
import { ChartOptions, Chart } from "chart.js";
import { CompanyTypeConstants } from "app/constants/company_types";
import { RoleConstants } from "app/constants/roles-constants";
@Component({
    selector: "app-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
    animations: [routerTransition()],
})
export class DashboardComponent implements OnInit {
    @ViewChild("baseChart") chart: BaseChartDirective;
    startDate;
    endDate;
    isB2B = false;
    settings = {
        bigBanner: true,
        timePicker: false,
        format: "dd-MMM-yyyy",
        defaultOpen: false,
    };
    loading = true;
    locations = [];
    companies = [];
    businessUnits = [];
    selectedLocationId = "";
    Popular = [];
    companyId = "";
    businessUnitId = "";
    dashBoardData = {
        averageOrderPrice: 0,
        averageOrderItems: 0,
        dailyOrders: 0,
        completedOrders: 0,
        rejectedOrders: 0,
        modifiedOrders: 0,
        actualSales: 0,
        packedSales: 0,
        totalSales: 0,
        notPackedSales: 0,
        returnedSales: 0,
        cancelledSales: 0,
        repeatingCustomers: 0,
        totalCustomers: 0,
        leadTime: 0,
        packingTime: 0,
        transitTime: 0,
        partialSales: 0,
    };
    categoriesChartData = [];
    categoriesChartLabels = [];
    categoriesChartColors = [];
    skuChart = [];
    skuChartLabels = [];
    skuChartName = [];
    skuChartData = [];
    skuChartColors = [];
    leadTimeLineChartData = [];
    leadTimeLineChartLabels = [];
    leadTimeLineChartColors = [];
    packingTimeLineChartData = [];
    packingTimeLineChartLabels = [];
    packingTimeLineChartColors = [];
    transitTimeLineChartData = [];
    transitTimeLineChartLabels = [];
    transitTimeLineChartColors = [];
    userLocation = "";
    userCompany = "";
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    userData = {
        location_id: { id: "" },
    };
    public lineChartOptions: ChartOptions & { annotation: any } = {
        responsive: true,
        scales: {
            yAxes: [
                {
                    ticks: {
                        min: 0,
                    },
                },
            ],
        },
    };
    public lineChartLegend = true;
    public lineChartType = "line";
    public days: string[] = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thrusday",
        "Friday",
        "Saturday",
    ];

    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService,
        public accountService: AccountSettingService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.loading = true;
        this.startDate = new Date();
        this.endDate = new Date();
        let userData = JSON.parse(localStorage.getItem("userData"));
        let user_company = JSON.parse(localStorage.getItem("userCompanies"));
        let check_ret = user_company ? user_company.filter(
            (comp) => comp.type == CompanyTypeConstants.B2B
        ) : [];
        this.isB2B =
            userData.role.id == RoleConstants.COMPANY_OWNER &&
            check_ret &&
            check_ret.length > 0;
        this.startDate.setDate(this.startDate.getDate() - 7);
        this.getCompanies();
        this.getbusinessUnits();
        this.getLocations();
        this.getData();
        this.detectChartDraw();
    }
    setCompanyType() {
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            let ref = this;
            let selected_company = this.companies && this.companies.length > 0? this.companies.filter(function (comp) {
                return comp.id == ref.companyId;
            }): [];
            this.isB2B =
                selected_company &&
                selected_company.length > 0 &&
                selected_company[0].type == CompanyTypeConstants.B2B;
        }
    }
    detectChartDraw() {
        Chart.plugins.register({
            afterDraw: function (chart) {
                try {
                    var dataset = JSON.parse(
                        JSON.stringify(chart.config.data.datasets[0].data)
                    );
                    dataset = dataset.sort();
                    var isLineChart =
                        chart.canvas.id === "leadTimeLineChart" ||
                        chart.canvas.id === "packingTimeLineChart" ||
                        chart.canvas.id === "transitTimeLineChart";
                    if (
                        dataset[0] == dataset[dataset.length - 1] &&
                        dataset[0] == 0 &&
                        isLineChart
                    ) {
                        var ctx = chart.chart.ctx;
                        var width = chart.chart.width;
                        var height = chart.chart.height;
                        ctx.save();
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.font =
                            '40px "Helvetica Neue", Helvetica, Arial, sans-serif';
                        ctx.fillStyle = "rgba(253, 240, 240, 1)";
                        ctx.fillText(
                            "No data to display",
                            width / 2,
                            height / 2
                        );
                        ctx.restore();
                    }
                } catch (e) { }
            },
        });
    }

    public setStartDate(value: Date): void {
        this.startDate = value;
    }

    public setEndDate(value: Date): void {
        this.endDate = value;
    }
    commafy(num) {
        var amount = num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        return amount;
    }
    onChartClick(event) {
        this.populateTopItemsChart(event.active[0]._index);
    }
    saveLastSync() {
        this.sharedFunctions
            .getRequest("/settings/saveLastSync")
            .subscribe((data) => {
                this.loading = false;
            });
    }

    populateTopItemsChart(index) {
        this.skuChartName = [];
        this.skuChartData = [];
        setTimeout(
            function () {
                if (this.skuChart[index]) {
                    this.skuChartName = this.skuChart[index].name;
                    this.skuChartData = this.skuChart[index].data;
                    this.skuChartColors = this.skuChart[index].colors;
                }
            }.bind(this),
            300
        );
    }
    getData() {
        this.resetValues();
        let url = "/dashboard/getDashboardData";
        let params = {
            startDate: this.sharedFunctions.getStartDate(this.startDate),
            endDate: this.sharedFunctions.getEndDate(this.endDate),
        };
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["company_id"] = this.companyId;
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.businessUnitId, true)) {
            params["business_unit_id"] = this.businessUnitId;
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.userLocation, true)) {
            params["location_id"] = this.userLocation;
        }
        this.sharedFunctions.getRequest(url, params).subscribe((data) => {
            this.dashBoardData = data.data;
            data = data.data;
            this.loading = false;
            this.categoriesChartLabels = data.categoriesChartData.labels;
            this.categoriesChartData = data.categoriesChartData.data;
            this.categoriesChartColors = data.categoriesChartData.colors;
            this.skuChart = data.categoriesChartData.skuChart;
            this.leadTimeLineChartData = data.leadTimeLineChartData.data;
            this.leadTimeLineChartColors = data.leadTimeLineChartData.colors;
            if (data.leadTimeLineChartData.labels.length) {
                this.leadTimeLineChartLabels =
                    data.leadTimeLineChartData.labels;
            } else {
                this.initializeEmptyGraph("leadTimeLineChart");
            }
            this.packingTimeLineChartData = data.packingTimeLineChartData.data;
            this.packingTimeLineChartColors =
                data.packingTimeLineChartData.colors;
            if (data.packingTimeLineChartData.labels.length) {
                this.packingTimeLineChartLabels =
                    data.packingTimeLineChartData.labels;
            } else {
                this.initializeEmptyGraph("packingTimeLineChart");
            }
            this.transitTimeLineChartData = data.transitTimeLineChartData.data;
            this.transitTimeLineChartColors =
                data.transitTimeLineChartData.colors;
            if (data.transitTimeLineChartData.labels.length) {
                this.transitTimeLineChartLabels =
                    data.transitTimeLineChartData.labels;
            } else {
                this.initializeEmptyGraph("transitTimeLineChart");
            }
            this.Popular = data.popularItems;
            this.populateTopItemsChart(0);
            this.dashBoardData.leadTime = data.leadTime;
            this.dashBoardData.packingTime = data.packingTime;
            this.dashBoardData.transitTime = data.transitTime;
            this.dashBoardData.modifiedOrders = data.modifiedOrders;
            this.loading = false;
        }, (error)=>{
            this.loading = false;
        });
    }

    getLocations() {
        this.resetLocations();
        var params = {};
        this.locations = [];
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.businessUnitId, true)) {
            params["businessUnitId"] = this.businessUnitId;
        } else if (this.sharedFunctions.isBUListPerm()) {
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    if (data.data && data.data.locations) {
                        this.locations = data.data.locations;
                    }
                }
            },
            (error) => { }
        );
    }
    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                } else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }
    resetLocations() {
        this.userLocation = "";
        this.locations = [];
    }
    resetBUUnit() {
        this.businessUnits = [];
        this.businessUnitId = "";
        this.resetLocations();
    }

    getbusinessUnits() {
        this.resetBUUnit();
        this.getLocations();
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (data.data && data.data.length) {
                            this.businessUnits = data.data;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            },
            (error) => { }
        );
    }
    resetValues() {
        this.loading = true;
        this.categoriesChartData = [];
        this.categoriesChartLabels = [];
        this.categoriesChartColors = [];
        this.skuChart = [];
        this.skuChartLabels = [];
        (this.skuChartName = []), (this.skuChartData = []);
        this.skuChartColors = [];
        this.leadTimeLineChartData = [];
        this.leadTimeLineChartLabels = [];
        this.leadTimeLineChartColors = [];
        this.packingTimeLineChartData = [];
        this.packingTimeLineChartLabels = [];
        this.packingTimeLineChartColors = [];
        this.transitTimeLineChartData = [];
        this.transitTimeLineChartLabels = [];
        this.transitTimeLineChartColors = [];
    }

    getDayName(date) {
        return this.days[new Date(date).getDay()];
    }
    initializeEmptyGraph(name) {
        setTimeout(() => {
            try {
                this[name + "Data"][0].data = [0, 0];
                this[name + "Labels"] = [
                    this.getDayName(this.startDate),
                    this.getDayName(this.endDate),
                ];
            } catch (e) { }
        }, 2);
    }
    fetchSum(data, flag) {
        if (flag) {
            let sum = parseInt(data.totalSales);
            sum = this.sharedFunctions.getFormattedAmount(sum);
            return sum;
        } else {
            let sum =
                parseInt(data.returnedSales) + parseInt(data.partialSales);
            sum = this.sharedFunctions.getFormattedAmount(sum);
            return sum;
        }
    }
}
