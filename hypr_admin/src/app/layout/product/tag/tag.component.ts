import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";

@Component({
    selector: "app-tag",
    templateUrl: "./tag.component.html",
    styleUrls: ["./tag.component.scss"],
})

export class TagComponent implements OnInit {
    activeIndex = -1;
    loading = false;
    tags = [];
    tagsCopy = null;
    currentPage = 1;
    itemsPerPage = 20;
    totalItems = 0;
    paginationId = "tagPage";
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getTags();
    }

    getTags() {
        this.loading = true;
        this.tags = [];
        const params = {
            page: this.currentPage,
            per_page: this.itemsPerPage,
        };
        this.sharedFunctions.getRequest("/tag", params).subscribe(
            (data) => {
                if (data.code === "OK") {
                    try {
                        if (
                            data.data.tags &&
                            data.data.tags.length
                        ) {
                            data.data.tags.forEach((tag, index) => {
                                this.tags.push({
                                    rowCount: this.sharedFunctions.getRowCount(
                                        this.itemsPerPage,
                                        this.currentPage,
                                        index,
                                    ),
                                    id: tag.id,
                                    name: tag.name,
                                    status: tag.status ? 'Active' : 'Inactive'
                                });
                            });
                            this.totalItems = data.data.count;
                        }
                    } catch (e) {
                        this.toastr.error(e);
                    }
                }
                this.loading = false;
            },
            (err) => {
                this.loading = false;
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }
    rowClick(i) {
        if (this.activeIndex == i) {
            this.activeIndex = -1;
            this.tags[i] = JSON.parse(JSON.stringify(this.tagsCopy));
        } else {
            this.activeIndex = i;
            this.tagsCopy = JSON.parse(JSON.stringify(this.tags[i]));
        }
    }

    update(updatedTag, tag) {
        let url = "/tag/" + tag.id;
        if (!updatedTag) {
            this.toastr.error("Tag name is required");
            return;
        }
        let updateTag = false;
        let params = {};
        if (updatedTag != tag.name) {
            updatedTag = updatedTag.trim();
            params['name'] = updatedTag;
            updateTag = true;
        }

        if (updateTag) {
            this.sharedFunctions.putRequest(url, params).subscribe(
                (data) => {
                    if (data['success']) {
                        this.toastr.success("Tag updated successfully");
                        const tagIndex = this.tags.indexOf(tag);
                        this.tags[tagIndex].name = updatedTag;
                    }
                },
                (err: any) => {
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                }
            );
        } else {
            this.toastr.success("Tag updated successfully");
        }
    }

    refresh() {
        this.currentPage = 1;
        this.totalItems = 0;
        this.getTags();
    }

    pagination(event) {
        this.currentPage = event;
        this.totalItems = 0;
        this.getTags();
    }
}