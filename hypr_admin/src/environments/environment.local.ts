// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  name: "local",
  production: false,
  baseURI: "http://localhost:8090",
  walletURI: "https://devwallet.retailo.me",
  loyaltyPortal: "https://dev.retailo.me/loyaltyportal/",
  couponPortal: "https://dev.retailo.me/couponportal/",
  productPortal: "https://dev.retailo.me/productportal/",
  categoryPortal: "https://dev.retailo.me/categoryportal/",
  batchPortal: "https://dev.retailo.me/batchportal/",
  authData: "dev_auth_data",
  dns: "https://035be34d6bb148c6b62fab81ccc539d9@o1087328.ingest.sentry.io/6718938",
};
