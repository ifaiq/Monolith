const getSwaggerSchema = (swagger, authenticationRequired = true) => {
  try {
    if (!swagger || Object.keys(swagger).length <= 0) { return undefined; }

    const path = swagger.properties.params;
    const query = swagger.properties.query;

    const pathParams = [];
    const queryParams = [];

    if (path) {
      const pathProperties = swagger.properties.params.properties;

      Object.keys(pathProperties).forEach(key => {
        if (pathProperties[key].format === "date-time" && pathProperties[key].type === "string") {
          pathProperties[key].format = "string";
        }
        pathParams.push({
          name: key,
          schema: pathProperties[key],
          in: "path",
          ...(path.required && path.required.indexOf(key) >= 0 && { required: true }),
        });
      },
      );
    }

    if (query) {
      const queryProperties = swagger.properties.query.properties;

      Object.keys(queryProperties).forEach(key => {
        if (queryProperties[key].format === "date-time" && queryProperties[key].type === "string") {
          queryProperties[key].format = "string";
        }

        queryParams.push({
          name: key,
          schema: queryProperties[key],
          in: "query",
          ...(query.required && query.required.indexOf(key) >= 0 && { required: true }),
        });
      },
      );
    }

    const swaggerSchema = {
      ...(authenticationRequired && {
        security: [
          {
            Authorization: [],
          },
        ],
      }),
      ...(swagger.properties.body && {
        requestBody: {
          content: {
            "application/json": {
              schema: swagger.properties.body,
            },
          },
        },
      }),
      parameters: pathParams.concat(queryParams),
    };

    return swaggerSchema;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Swagger.utils error -> ${JSON.stringify(err.stack || err)}`);
    return undefined;
  }
};


module.exports = {
  getSwaggerSchema,
};
