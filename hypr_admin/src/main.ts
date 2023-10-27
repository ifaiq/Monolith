import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

declare let Sentry: any;

Sentry.init({
  dsn: environment.dns,
  tracesSampleRate: 0,
  environment: environment.name,
  beforeSend: (event) => {
    if (window.location.hostname === 'localhost') {
      return null;
    }
    return event;
  },
});

if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule);
