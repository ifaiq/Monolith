import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../../shared";
import { Router } from "@angular/router";


@Component({
    selector: "app-create-tag",
    templateUrl: "./create-tag.component.html",
})

export class CreateTagComponent implements OnInit {
    tag = {
        name: "",
        // is_disabled: false
    };
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
    }

    createTag() {
        let url = "/tag";
        if (this.tag.name)
            this.tag.name = this.tag.name.trim();
        if (!this.tag.name) {
            this.toastr.error("Tag name is required");
            return;
        }
        this.sharedFunctions.postRequest(url, this.tag).subscribe(
            (data) => {
                this.toastr.success("Tag created successfully");
                this.router.navigateByUrl("/product/tag");
            },
            (err: any) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }
}
