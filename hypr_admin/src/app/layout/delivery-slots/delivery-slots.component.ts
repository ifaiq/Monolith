import { Component, OnInit } from "@angular/core";
import { routerTransition } from "../../router.animations";
import { SharedFunctionsService } from "../../shared";
import {
  DeliverySlotsAPIConstants,
  DeliverySlotDays,
  DeliverySlotCutOffTimes,
  DeliverySlotsMessages,
} from "../../constants/delivery-slots-constants";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { ViewContainerRef } from "@angular/core";
import * as moment from "moment";

@Component({
  selector: "delivery-slots",
  templateUrl: "./delivery-slots.component.html",
  styleUrls: ["./delivery-slots.component.scss"],
  animations: [routerTransition()],
})
export class DeliverySlotsComponent implements OnInit {
  loading = false;
  businessUnits = [];
  locations = [];
  selectedBusinessUnitId = "";
  selectedLocationId = "";
  save = false;
  deliverySlots = [];
  deliverySlotDays = DeliverySlotDays.DAYS;
  deliverySlotCutOffTimes = DeliverySlotCutOffTimes.TIMES;
  selectedDeliverySlotDay = null;
  selectedDeliverySlotCutOffTime = null;
  csvDeliverySlots = [];

  constructor(
    public sharedFunctions: SharedFunctionsService,
    private toastr: ToastsManager,
    vRef: ViewContainerRef
  ) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
    this.getbusinessUnits();
  }

  getbusinessUnits() {
    this.resetBUUnit();
    this.loading = true;
    this.sharedFunctions
      .getRequest(DeliverySlotsAPIConstants.BUSINESSUNIT, {})
      .subscribe(
        (data) => {
          if (data && data.data && data.data.length) {
            this.businessUnits = data.data;
          }
          this.loading = false;
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
        }
      );
  }

  getlocations() {
    this.resetLocations();
    this.loading = true;
    const params = { businessUnitId: this.selectedBusinessUnitId };
    this.sharedFunctions
      .getRequest(DeliverySlotsAPIConstants.LOCATION, params)
      .subscribe(
        (data) => {
          if (data && data.data && data.data.locations) {
            this.locations = data.data.locations;
          }
          this.loading = false;
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
        }
      );
  }

  resetBUUnit() {
    this.businessUnits = [];
    this.selectedBusinessUnitId = "";
    this.resetLocations();
  }

  resetLocations() {
    this.selectedLocationId = "";
    this.locations = [];
    this.deliverySlots = [];
    this.selectedDeliverySlotDay = null;
    this.selectedDeliverySlotCutOffTime = null;
    this.save = false;
  }

  refresh() {
    this.getbusinessUnits();
  }

  getDeliverySlots() {
    this.loading = true;
    this.save = false;
    const params = { locationId: this.selectedLocationId };
    this.sharedFunctions
      .getRequest(DeliverySlotsAPIConstants.GETDELIVERYSLOT, params)
      .subscribe(
        (data) => {
          if (data && data.data && data.data.length) {
            this.deliverySlots = data.data;
            for (const deliverySlot of this.deliverySlots) {
              deliverySlot.cutOff = moment.utc(deliverySlot.cutOff).local().format('YYYY-MM-DD HH:mm:ss');
            }
          } else {
            this.deliverySlots = [];
          }
          this.loading = false;
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
          this.deliverySlots = [];
        }
      );
  }

  getActiveDeliverySlots() {
    const params = { select: "advanceBookableDays,defaultCutOff" };
    this.loading = true;
    this.sharedFunctions
      .getRequest(
        DeliverySlotsAPIConstants.ACTIVEDELIVERYSLOT + this.selectedLocationId,
        params
      )
      .subscribe(
        (data) => {
          if (data && data.data) {
            this.selectedDeliverySlotDay = data.data.advanceBookableDays;
            this.selectedDeliverySlotCutOffTime = data.data.defaultCutOff + (moment().utcOffset()/60) ;
          } else {
            this.selectedDeliverySlotDay = null;
            this.selectedDeliverySlotCutOffTime = null;
          }
          this.loading = false;
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
          this.selectedDeliverySlotDay = null;
          this.selectedDeliverySlotCutOffTime = null;
        }
      );
  }

  setAdvanceBookableDays() {
    const params = {
      advanceBookableDays: +this.selectedDeliverySlotDay,
      defaultCutOff: this.selectedDeliverySlotCutOffTime - (moment().utcOffset()/60),
    };
    this.loading = true;
    this.sharedFunctions
      .putRequest(
        DeliverySlotsAPIConstants.ACTIVEDELIVERYSLOT + this.selectedLocationId,
        params
      )
      .subscribe(
        (data) => {
          this.toastr.success(DeliverySlotsMessages.SUCCESS);
          this.loading = false;
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
        }
      );
  }

  editDeliverySlots(i, field) {
    this.save = true;
    if (field === "time") {
      this.deliverySlots[i]["editTime"] = true;
    }
    if (field === "tp") {
      this.deliverySlots[i]["editTp"] = true;
    }
  }

  updateDeliverySlots() {
    this.loading = true;
    const params = this.createUpdatePayload();
    const error = this.cutoffCheck(params.deliverySlots);
    if (error.length > 0) {
      this.toastr.error(error);
      this.loading = false;
      return;
    }
    this.sharedFunctions
      .putRequest(DeliverySlotsAPIConstants.UPDATEDELIVERYSLOT, params)
      .subscribe(
        (data) => {
          this.toastr.success(DeliverySlotsMessages.SUCCESS);
          this.getDeliverySlots();
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
        }
      );
  }

  cutoffCheck(deliverySlots) {
    let error = "";
    for (let i = 0; i < deliverySlots.length; i++) {
      const deliverySlot = deliverySlots[i];
      const previousDate = moment(deliverySlot.date)
        .subtract(1, "days")
        .format("YYYY-MM-DD");
      if (deliverySlot.date === deliverySlot.cutOff.substring(0, 10)) {
        if (
          moment(deliverySlot.cutOff.substring(11, 19), "HH:mm:ss").isAfter(
            moment("18:00:00", "HH:mm:ss")
          )
        ) {
          error =
            `Error on date ${deliverySlot.date}: ` +
            DeliverySlotsMessages.CUTOFFSAMEDAY;
        }
      } else {
        if (previousDate !== deliverySlot.cutOff.substring(0, 10)) {
          error =
            `Error on date ${deliverySlot.date}: ` +
            DeliverySlotsMessages.CUTOFFDIFFERENTDAY;
        }
      }
    }
    return error;
  }

  createUpdatePayload() {
    let payload = {
      locationId: +this.selectedLocationId,
      deliverySlots: this.deliverySlots,
    };
    
    payload.deliverySlots.forEach((deliverySlot, index) => {
      deliverySlot.cutOff = moment(deliverySlot.cutOff).utc().format('YYYY-MM-DD HH:mm:ss');

    });

    return payload;
  }

  uploadFile(event) {
    if (!this.selectedLocationId) {
      this.toastr.error(DeliverySlotsMessages.LOCATIONERROR);
      document.getElementById("file")["value"] = "";
      return;
    }
    this.loading = true;
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file: File = fileList.item(0);
      const reader: FileReader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        let csvData = reader.result;
        this.csvDeliverySlots = (<string>csvData)
          .split("\n")
          .map((deliverySlot) => {
            return deliverySlot.trim();
          });
        this.csvDeliverySlots.shift();
        if (this.csvDeliverySlots.length > 0) {
          const response = this.verifyCsvData();
          if (response.length > 0) {
            this.toastr.error(response);
            this.loading = false;
          } else {
            this.toastr.success(DeliverySlotsMessages.FILEVALIDATION);
            this.updateDeliverySlotsCsv();
          }
        } else {
          this.toastr.error(DeliverySlotsMessages.EMPTYCSV);
          this.loading = false;
        }
      };
    }

    document.getElementById("file")["value"] = "";
    this.loading = false;
  }

  verifyCsvData() {
    let error = "";
    for (let deliverySlot of this.csvDeliverySlots) {
      deliverySlot = deliverySlot.split(",");
      if (!deliverySlot[0]) {
        error = DeliverySlotsMessages.DATEREQUIRED;
        break;
      }
      if (!moment(deliverySlot[0], "YYYY-MM-DD").isValid()) {
        error = DeliverySlotsMessages.DATEFORMAT;
        break;
      }
      if (!deliverySlot[1]) {
        error = DeliverySlotsMessages.TPCAPACITYREQUIRED;
        break;
      }
      if (
        !Number.isInteger(Number(deliverySlot[1])) ||
        Number(deliverySlot[1]) < 0
      ) {
        error = DeliverySlotsMessages.TPCAPACITYFORMAT;
        break;
      }
      if (deliverySlot[2]) {
        if (
          !moment(deliverySlot[2].substring(0, 10), "YYYY-MM-DD").isValid() ||
          !moment(deliverySlot[2].substring(11, 19), "HH:mm:ss").isValid()
        ) {
          error = DeliverySlotsMessages.CUTOFFFORMAT;
          break;
        }
      }
    }

    return error;
  }

  updateDeliverySlotsCsv() {
    this.loading = true;
    const params = this.createCsvPayload();
    this.sharedFunctions
      .putRequest(DeliverySlotsAPIConstants.UPDATEDELIVERYSLOT, params)
      .subscribe(
        (data) => {
          this.toastr.success(DeliverySlotsMessages.SUCCESS);
          this.getDeliverySlots();
        },
        (error) => {
          this.toastr.error(error.error.message);
          this.loading = false;
        }
      );
  }

  createCsvPayload() {
    let payload = {
      locationId: +this.selectedLocationId,
    };
    let deliverySlots = [];
    this.csvDeliverySlots.forEach((deliverySlot) => {
      deliverySlot = deliverySlot.split(",");
      deliverySlots.push({
        date: deliverySlot[0],
        touchpointCapacity: +deliverySlot[1],
        cutOff: moment(deliverySlot[2]
          ? deliverySlot[2]
          : this.createDefaultCutOff(deliverySlot[0])
          ).utc().format('YYYY-MM-DD HH:mm:ss'),
      });
    });
    payload["deliverySlots"] = deliverySlots;
    return payload;
  }

  createDefaultCutOff(date) {
    let cutoff = "";
    let day = 0;
    if (this.selectedDeliverySlotCutOffTime < 0) {
      cutoff = date.setDate(date.getDate() - 1) + " ";
      day = 24 + this.selectedDeliverySlotCutOffTime;
    } else {
      cutoff = date + " ";
      day = this.selectedDeliverySlotCutOffTime;
    }

    if (day < 10) {
      cutoff = cutoff + "0" + day + ":00:00";
    } else {
      cutoff = cutoff + day + ":00:00";
    }

    return cutoff;
  }
}
