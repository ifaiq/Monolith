import { Component, OnInit, Input } from "@angular/core";

@Component({
    selector: "app-print-page",
    templateUrl: "./print-page.component.html",
    styleUrls: ["./print-page.component.scss"],
})
export class PrintPageComponent implements OnInit {
    @Input() order;
    constructor() {}

    ngOnInit() {}
    getValue(value) {
        if (value == null || value == "" || value == undefined) {
            return "N/A";
        } else {
            return value;
        }
    }

    getAmount(item, type) {
        if (item.price == null || item.price == "") {
            return "N/A";
        } else {
            var total =
                type == 1
                    ? parseFloat(item.price)
                    : parseFloat(item.price) * parseInt(item.quantity);
            return total;
        }
    }
}
