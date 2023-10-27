import { Component, ViewContainerRef, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { PolygonService } from '../../../shared/services/polygonService';
@Component({
    selector: "polygon-points",
    templateUrl: "./polygon-points.component.html",
})
export class PolygonPointsComponent implements OnChanges {

    @Input() points = [];
    @Output() redrawPolygon: EventEmitter<any> = new EventEmitter();

    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public polygonService: PolygonService
    ) {
    }

    ngOnChanges() {
    }

    addNewPoint(i) {
        this.points.splice(i + 1, 0, {
            lat: 23,
            lng: 60
        });
        this.redrawPolygon.emit({
            type: 'add',
            index: i,
            points: this.points
        });
    }

    removePoint(i) {
        this.points.splice(i, 1);
        this.redrawPolygon.emit({
            type: 'remove',
            index: i,
            points: this.points
        });
    }

    pointUpdated(i) {
        this.redrawPolygon.emit({
            type: 'updated',
            index: i,
            points: this.points
        });
    }
}