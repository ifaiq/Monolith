import { Component, OnInit, Input, SimpleChanges} from "@angular/core";

@Component({
    selector: "events-timing",
    templateUrl: "./events_timings.component.html",
    styleUrls: ["./events_timings.component.scss"],
})
export class EventsTimingsComponent implements OnInit {
    @Input() location:any = {};
    settings = {
        bigBanner: true,
        timePicker: false,
        format: "dd-MMM-yyyy",
        defaultOpen: false,
    };
    constructor(
    ) {
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.location&&changes.location.currentValue){
          this.location = changes.location.currentValue;
          if(!this.location.events){
            this.location.events = [];
          }
        }
    }
    addEvent(){
        this.location.events.push({
            id:0,
            start_date: new Date(),
            end_date: new Date(),
            start_time:{
                hour: 0, 
                minute: 0
            },
            end_time:{
                hour: 23,
                minute: 59
            },
            disabled:0
        })
    }

    removeEvent(i){
        this.location.events.splice(i,1);
    }
}