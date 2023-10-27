import http from 'k6/http';
import { sleep } from 'k6';

// import { CUSTOMER_USER_AUTH_TOKEN } from '../test-data/login-data.ts';
const CUSTOMER_USER_AUTH_TOKEN = // consumer
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTA1NDY2LCJwaG9uZSI6IjkyMzExMDExMDUzMyIsImNuaWMiOiIzNDIwMi0yNjY3NDc4LTEiLCJyb2xlIjp7ImlkIjo4LCJuYW1lIjoiQ09OU1VNRVIifSwibGFuZ3VhZ2UiOiJlbi1VcyIsImZvcmNlTG9nb3V0IjpudWxsLCJpYXQiOjE2NjE5NDExMzYsImV4cCI6MTY2MTk0MTQzNiwiYXVkIjoicmV0YWlsZXJzIiwiaXNzIjoicmV0YWlsby5jbyAifQ.Pufi4KSflPnzpSPk_83fUFt8niUgTtJ1E3E0TjERgJlufT6TTqxo-WKM98CegYSXSL_8CVejWfJSCwzx1qOD8T1VjXAGUCbg5KB4QPHe0X2Pxb0yFU2Vro8Hcuc2BZslnShUwgoP7tXXViwvJo-xtLurgbyNwa4ydzftxzhLW8I';

export const options = {
  thresholds: {
    // http_req_failed: ['rate<0.4'],
    http_req_duration: ['avg<15000'],
    // http_reqs: ['rate>7'],
  },

  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
  ],
};

export default function () {
  const body = {
    customerId:105466,
    deliveryTime:"1661350266000",
    locationId:13,
    paymentType:"COD",
    products:[
      {
          id:3311,
          quantity:1,
      },
    ],
 }
 
    const response = http.post('https://dev.retailo.me/api/v1/order',
    JSON.stringify(body),
    {
      headers: {
        Authorization:
        CUSTOMER_USER_AUTH_TOKEN,
      },
      // timeout: 10 * 60 * 1000,
    }
  );

  if (response.status >= 400 || response.status < 200 || response.error || response.error_code) {
    console.log(`status_text: "${response.status_text}"`);
    // console.log(
    //   `duration: "${response.timings.duration}" - status: "${response.status}" - status_text: "${response.status_text}" - response body: ${response.body}`
    // );
    // console.log(`response: "${JSON.stringify(response)}"`);
    sleep(10);
  } else {

    sleep(1);
  }
}
