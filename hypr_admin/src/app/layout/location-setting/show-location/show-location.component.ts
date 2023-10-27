import { Component, OnInit, ViewContainerRef , OnChanges} from '@angular/core';
import { AgmCoreModule, MapsAPILoader } from '@agm/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';
declare const google: any;
import { PolygonService } from '../../../shared/services/polygonService';
import { CompanyTypeConstants } from "app/constants/company_types";


@Component({
    selector: "app-show-location",
    templateUrl: "./show-location.component.html",
    styleUrls: ["./show-location.component.scss"]
})
export class ShowLocationComponent implements OnChanges  {
    public latitude: number;
    public longitude: number;
    circle = [];
    locations = [];
    businessUnits = [];
    userLocation = "";
    selectedLocationIndex = "";
    selectedBusinessUnitId = "";
    companyId = "";
    isAdmin = false;
    defaultCircle = [
        { lat: 31.582045, lng: 74.329376, radius: 100, color: "red" },
    ];
    selectedShap = {
        longitude: "",
        latitude: "",
        radius: "",
        polygon_coords:""
    };
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    retailoId = 0;
    isRetailo = false;
    isMapReady = false;
    map: any;

    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        private mapsAPILoader: MapsAPILoader,
        vRef: ViewContainerRef,
        public polygonService: PolygonService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.setRetailoId();
    }

    setRetailoId(){
        let companies = this.sharedFunctions.getUserCompanies();
        companies = companies.filter(comp => comp.code == CompanyTypeConstants.retailo);
        if( companies.length>0 ){
            this.retailoId = companies[0].id;
        }
    }

    ngOnChanges(){

    }

    ngOnInit() {
        this.latitude = 31.582045;
        this.longitude = 74.329376;
        this.getbusinessUnits();
        this.getlocations();
    }

    onMapReady(event:any){
        this.polygonService.initDrawingManager(event, true);
        this.isMapReady = true;
        if(this.selectedLocationIndex){
            this.changeLocation();
        }
        this.map = event;
    }

    undo(){
        this.selectedBusinessUnitId = "";
        this.userLocation = "";
        this.getbusinessUnits();
        this.getlocations();
    }

    getlocations() {
        var params = {};
        this.locations = [];
        this.selectedLocationIndex = "";
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        }
        else if (this.sharedFunctions.isBUListPerm()) {
            return;
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                else {
                    this.locations = [];
                }
            },
            (error) => {
                console.log(error);
            }
        );
    }

    getbusinessUnits() {
        const params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        this.sharedFunctions
            .getRequest("/config/businessunit/getAll", params)
            .subscribe(
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
                (error) => {
                    console.log(error);
                }
            );
    }

    updateCircle() {
        if(this.isRetailo){
            if(this.polygonService.pointList.length==0){
                this.toastr.error("Please draw polygon");
                return;
            }
            if(this.polygonService.selectedArea == 0){
                this.toastr.error("Selected points not formed a valid polygon");
                return;
            }
            this.selectedShap.polygon_coords = JSON.stringify(this.polygonService.pointList);
            let center = this.polygonService.getPolygonCenter();
            this.selectedShap.longitude = center.lng();
            this.selectedShap.latitude = center.lat();
        }
        this.sharedFunctions
            .putRequest(`/config/location/${this.locations[this.selectedLocationIndex].id}`, {
                latitude: this.selectedShap.latitude,
                longitude: this.selectedShap.longitude,
                polygonCoords: this.selectedShap.polygon_coords,
                radius: this.selectedShap.radius
            })
            .subscribe(
                (data) => {
                    this.toastr.success("Record Updated Successfully");
                },
                (err) => {
                    console.log(err);
                    this.toastr.error("Could not update record");
                }
            );
    }

    changeLocation() {
        this.polygonService.deleteSelectedShape();
        if(this.locations[this.selectedLocationIndex].company_id == this.retailoId){
            this.isRetailo = true;
            if(this.locations[this.selectedLocationIndex].polygon_coords){
                this.polygonService.existingPolygon = JSON.parse(this.locations[this.selectedLocationIndex].polygon_coords);
            }
            else{
                this.polygonService.existingPolygon = null;
            }
            if(this.isMapReady){
                this.polygonService.initDrawingManager(this.map, true);
            }
        }
        else{
            this.isRetailo = false;
        }
        this.selectedShap = this.locations[this.selectedLocationIndex];
        if (
            this.locations[this.selectedLocationIndex].latitude == null ||
            this.locations[this.selectedLocationIndex].longitude == null ||
            this.locations[this.selectedLocationIndex].radius == null
        ) {
            this.circle = this.defaultCircle;
        } else {
            this.circle = [
                {
                    lat: parseFloat(
                        this.locations[this.selectedLocationIndex].latitude
                    ),
                    lng: parseFloat(
                        this.locations[this.selectedLocationIndex].longitude
                    ),
                    radius: parseFloat(
                        this.locations[this.selectedLocationIndex].radius
                    ),
                    color: "red",
                },
            ];
        }
        try{
            this.longitude = parseFloat(
                this.locations[this.selectedLocationIndex].longitude
            );
            this.latitude = parseFloat(
                this.locations[this.selectedLocationIndex].latitude
            );
        }
        catch(e){}
    }

    onMapClick(event) {
        if(this.isRetailo){
            event.stopPropagation();
            return;
        }
        this.circle = [
            {
                lat: parseFloat(event.coords.lat),
                lng: parseFloat(event.coords.lng),
                radius: parseFloat(this.selectedShap.radius),
                color: "red",
            },
        ];
        this.selectedShap.latitude = this.circle[0].lat;
        this.selectedShap.longitude = this.circle[0].lng;
    }

    changeRadius(event) {
        this.selectedShap.radius = event;
    }

    centerChange(event) {
        this.selectedShap.latitude = event.lat;
        this.selectedShap.longitude = event.lng;
    }

    pointsUpdated(event:any){
        if(this.isMapReady){
            this.polygonService.existingPolygon = event.points;
            this.polygonService.initDrawingManager(this.map, false);
            let center = this.polygonService.getPolygonCenter();
            this.longitude = center.lng();
            this.latitude = center.lat();
        }

    }
}