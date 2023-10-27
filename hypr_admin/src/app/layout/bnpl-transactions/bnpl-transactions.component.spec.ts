import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { StatModule } from "../../shared";
import { BnplTransactions } from "./bnpl-transactions.component";

describe("BannersComponent", () => {
    let component: BnplTransactions;
    let fixture: ComponentFixture<BnplTransactions>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [StatModule],
            declarations: [BnplTransactions],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BnplTransactions);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
