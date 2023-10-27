import { HttpClient, HttpRequest, HttpXhrBackend, HttpEvent, HttpHandler, HttpErrorResponse, HttpInterceptor } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { Observable } from "rxjs/Observable";
import { Router } from '@angular/router';
import Cookies from 'js-cookie';
import { environment } from "environments/environment";

// operators
import "rxjs/add/operator/catch"
import "rxjs/add/observable/throw"
import "rxjs/add/operator/map"
import { _throw as throwError } from 'rxjs/observable/throw';

@Injectable()
export class AuthInterceptor extends HttpClient implements HttpInterceptor {

  open = false;

  constructor(
    backend: HttpXhrBackend,
    private router: Router,
    public http: HttpClient
  ) {
    super(backend)
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).do(() => { }, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          localStorage.clear();
          Cookies.remove(environment.authData);
          this.router.navigate(['/login']);
        }
        return throwError(err);
      }
    });
  }
}