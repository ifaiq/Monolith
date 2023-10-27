import { Injectable } from "@angular/core";
import { environment } from "../environments/environment";
Injectable();
export class Globals {
    backendURI = environment.baseURI;
    walletURI = environment.walletURI;
    productURI = environment.productPortal;
}
