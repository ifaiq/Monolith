window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: "/swagger/getDocs",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset,
    ],
    layout: "StandaloneLayout",
    defaultModelsExpandDepth: -1,
    persistAuthorization: true,
  });
};
