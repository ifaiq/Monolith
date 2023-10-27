import http from 'k6/http';
import { sleep } from 'k6';

// import { SUPER_ADMIN_USER_AUTH_TOKEN } from '../test-data/login-data.ts';
const SUPER_ADMIN_USER_AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTYwLCJuYW1lIjoiaGFzaF9hIiwiYWRkcmVzcyI6IjEyMzIzIiwicGhvbmUiOiIwOTAwNzg2MDEiLCJlbWFpbCI6IiIsImNuaWMiOiIxMjMxMjMxMjMiLCJjbmljX3BpY3R1cmUiOm51bGwsInVzZXJuYW1lIjoiaGFzaF9hIiwiZGlzYWJsZWQiOjAsInByb2ZpbGVfcGljdHVyZSI6bnVsbCwicm9sZSI6eyJjcmVhdGVkX2F0IjpudWxsLCJ1cGRhdGVkX2F0IjpudWxsLCJkZWxldGVkX2F0IjpudWxsLCJpZCI6MSwibmFtZSI6IkFETUlOIiwiZGlzYWJsZWQiOmZhbHNlfSwiYWNjZXNzSGllcmFyY2h5IjoiKiIsInNlc3Npb25fdXVpZCI6ImE2MzJlYmUwLWFhMjItNGU2MC05NmQ5LWE3ZTFlOTdhZGY3ZCIsImlhdCI6MTY2MDI4NzA4NCwiYXVkIjoiaHlwci5wayIsImlzcyI6Imh5cHIucGsifQ.cY1ChlkAJedVfdKfFrhBxEwUczvrau_iNuC8LQ8GG8k';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['avg<5000'],
    http_reqs: ['rate>15'],
  },

  stages: [
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 },
  ],
};

export default function () {
  const response = http.get('https://dev.retailo.me/api/v1/delivery-slots/portal?locationId=13', {
    headers: {
      Authorization:
      SUPER_ADMIN_USER_AUTH_TOKEN,
    },
    // timeout: 10 * 60 * 1000,
  });

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
