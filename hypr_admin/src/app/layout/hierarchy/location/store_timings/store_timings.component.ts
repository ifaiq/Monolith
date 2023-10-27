import { Component, OnInit, Input, SimpleChanges} from "@angular/core";
import { LocationService } from "../../location/location-service";

@Component({
    selector: "store-timing",
    templateUrl: "./store_timings.component.html",
    providers: [ LocationService ]
})
export class StoreTimingsComponent implements OnInit {
    @Input() location:any = {};
    selectedDay = "";
    workingDays = [
    ];
    constructor(
        private locService: LocationService
    ) {
        this.workingDays = this.locService.workingDays;
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.location&&changes.location.currentValue){
          this.location = changes.location.currentValue;
          if(this.location.operating_days.length==0){
              this.setDaysFirstTime();
          }
          this.location.operating_days.sort((a, b) => (a.day_id > b.day_id) ? 1 : -1);
        }
    }

    setDaysFirstTime(){
        let start_time = {
            hour: 0,
            minute: 0
        }
        let end_time = {
            hour: 23,
            minute: 59
        }
        for (var index = 0; index < this.workingDays.length; index++) {
            let day = this.workingDays[index];
            this.location.operating_days.push({
                day_id: day.id,
                day_name: day.name,
                start_time: {
                    hour: start_time.hour,
                    minute: start_time.minute
                },
                end_time: {
                    hour: end_time.hour,
                    minute: end_time.minute
                },
                disabled: 0
            });
        }
    }

    timeOptionChanged(){
        if(!this.location.is_day_wise_time){
            return;
        }
        let start_time = {
            hour: 0,
            minute: 0
        }
        if(this.location.start_time){
            start_time = this.location.start_time;
        }
        let end_time = {
            hour: 23,
            minute: 59
        }
        if(this.location.end_time){
            end_time = this.location.end_time;
        }
        for (var index = 0; index < this.location.operating_days.length; index++) {
            let day = this.location.operating_days[index];
            day["start_time"] = {
                hour: start_time.hour,
                minute: start_time.minute
            }
            day["end_time"] = {
                hour: end_time.hour,
                minute: end_time.minute
            }
        }
    }

    isNumberKey(evt) {
        var charCode = evt.which ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
        return true;
    }

    minuteChanged(){
        if(this.location.delivery_time.minute > 59){
            this.location.delivery_time.minute = 59;
        }
        else if(this.location.delivery_time.minute < 0){
            this.location.delivery_time.minute = 0;
        }
    }

    hourChanged(){
        if(this.location.delivery_time.hour < 0){
            this.location.delivery_time.hour = 0;
        }
    }
}
