module.exports["swagger-generator"] = {
  disabled: process.env.NODE_ENV === "production",
  swaggerJsonPath: "./swagger/swagger.json",
  swagger: {
    openapi: "3.0.0",
    info: {
      title: "Retailo Monolith",
      description: "Monolithic APIs for Retailo.",
      version: "1.0.0",
      termsOfService: null,
      contact: null,
      license: null,
    },
    servers: [
      { url: "https://dev.retailo.me/", description: "Dev" },
      { url: "https://stage.retailo.me/", description: "Stage" },
      { url: "https://prod.retailo.me/", description: "Production" },
      { url: "http://localhost:8090/", description: "Local" },
    ],
    externalDocs: {
      url: null,
    },
    components: {
      securitySchemes: {
        Authorization: {
          type: "apiKey",
          in: "header",
          name: "Authorization",
        },
      },
    },
  },
  defaults: {
    responses: {
      200: { description: "The requested resource" },
      404: { description: "Resource not found" },
      500: { description: "Internal server error" },
    },
  },
  excludeDeprecatedPutBlueprintRoutes: true,
  includeRoute: function (routeInfo) {
    if (routeInfo.middlewareType === "ACTION" && routeInfo.action.includes("v1")) {
      routeInfo.path = routeInfo.path.replace(/\/$/, "");
    }

    return !!routeInfo.swagger;
  },
  postProcess: function (specifications) {
    specifications.tags.forEach(tag => (tag.description = ""));
  },
};
