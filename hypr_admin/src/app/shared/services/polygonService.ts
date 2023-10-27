import { Injectable } from "@angular/core";
declare const google: any;

@Injectable()
export class PolygonService {

    existingPolygon: any;
    drawingManager: any;
    pointList: any = [];
    selectedShape: any;
    selectedArea: any;


    onMapReady(event: any) {
        this.initDrawingManager(event, true);
    }
    polygonCompleteEvent(event, map,isRecompute) {
        let self = this;
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
            const paths = event.overlay.getPaths();
            for (let p = 0; p < paths.getLength(); p++) {
                google.maps.event.addListener(
                    paths.getAt(p),
                    'set_at',
                    () => {
                        if (!event.overlay.drag) {
                            self.updatePointList(event.overlay.getPath(),true);
                        }
                    }
                );
                google.maps.event.addListener(
                    paths.getAt(p),
                    'insert_at',
                    () => {
                        self.updatePointList(event.overlay.getPath(),true);
                    }
                );
                google.maps.event.addListener(
                    paths.getAt(p),
                    'remove_at',
                    () => {
                        self.updatePointList(event.overlay.getPath(),true);
                    }
                );
            }
            self.updatePointList(event.overlay.getPath(),isRecompute);
            self.setSelection(event.overlay);
        }
        if (event.type !== google.maps.drawing.OverlayType.MARKER) {
            this.drawingManager.setDrawingMode(null);
            this.drawingManager.setOptions({
                drawingControl: false,
            });
        }
    }

    initDrawingManager = (map: any,isRecompute) => {
        if (this.drawingManager) {
            this.drawingManager.setMap(null);
        }
        let overlays = [];
        const options = {
            drawingControl: false,
            drawingControlOptions: {
                drawingModes: ['polygon'],
            },
            polygonOptions: {
                strokeWeight: 0,
                fillOpacity: 0.45,
                editable: true,
                draggable: true,
            }
        };
        if (this.existingPolygon) {
            var newCoords = [];
            for (var c = 0; c < this.existingPolygon.length; c++) {
                newCoords.push(new google.maps.LatLng(this.existingPolygon[c].lat, this.existingPolygon[c].lng));
            }
            var bermudaTriangle = new google.maps.Polygon({
                path: newCoords,
                strokeColor: '#FFC107',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FFC107',
                fillOpacity: 0.35,
                draggable: true,
                editable: true,
                map: map
            });
            overlays.push({
                overlay: bermudaTriangle,
                type: 'polygon'
            })
        }
        else {
            options["drawingControl"] = true;
            options["drawingMode"] = google.maps.drawing.OverlayType.POLYGON;
        }
        const self = this;
        this.drawingManager = new google.maps.drawing.DrawingManager(options);
        this.drawingManager.setMap(map);
        google.maps.event.addListener(
            this.drawingManager,
            'overlaycomplete',
            (event) => {
                self.polygonCompleteEvent(event, map,isRecompute);
            }
        );
        if (this.existingPolygon) {
            setTimeout(() => {
                this.polygonCompleteEvent(overlays[0], map,isRecompute)
            }, 100)

        }
    }

    clearSelection() {
        if (this.selectedShape) {
            this.selectedShape.setMap(null);
            this.selectedShape.setEditable(false);
            this.selectedShape = null;
        }
    }

    setSelection(shape) {
        this.clearSelection();
        this.selectedShape = shape;
        setTimeout(() => {
            if (this.drawingManager) {
                this.drawingManager.setOptions({
                    drawingControl: false,
                    drawingMode: null,
                    drawingControlOptions: {
                        drawingModes: ['polygon'],
                    },
                    polygonOptions: {
                        editable: true,
                        draggable: true,
                    }
                });
            }
            shape.setEditable(true);
        }, 2000);
    }

    deleteSelectedShape() {
        if (this.selectedShape) {
            this.selectedShape.setMap(null);
            this.selectedArea = 0;
            this.pointList = [];
        }
        if (this.drawingManager) {
            this.drawingManager.setOptions({
                drawingControl: true,
                drawingMode: google.maps.drawing.OverlayType.POLYGON
            });
        }
    }

    updatePointList(path, isRecompute?) {
        if (isRecompute) {
            this.pointList = [];
            const len = path.getLength();
            for (let i = 0; i < len; i++) {
                this.pointList.push(
                    path.getAt(i).toJSON()
                );
            }
        }
        this.selectedArea = google.maps.geometry.spherical.computeArea(
            path
        );
    }

    getPolygonCenter() {
        var bounds = new google.maps.LatLngBounds();
        var i;
        var polygonCoords = [
        ];
        for (var c = 0; c < this.pointList.length; c++) {
            polygonCoords.push(new google.maps.LatLng(this.pointList[c].lat,
                this.pointList[c].lng));
        }
        for (i = 0; i < polygonCoords.length; i++) {
            bounds.extend(polygonCoords[i]);
        }
        return bounds.getCenter();
    }

}