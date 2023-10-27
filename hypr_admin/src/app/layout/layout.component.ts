import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_ROUTE, PRODUCT_ROUTE } from 'app/constants/routes';
import { Globals } from '../globals';

@Component({
    selector: 'app-layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {


    constructor(public router: Router, private globals: Globals,) { }

    ngOnInit() {
        if (this.router.url === '/') {
            this.router.navigate(['/product']);
        }
    }
}
