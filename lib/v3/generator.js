const AbstractApiGenerator = require('../openapi');
const utils = require('../utils');

function apiKeySecurity () {
  return {
    description: "Authorization using an API Key",
    in: "header",
    name: "x-api-key",
    style: "form",
    schema: {
      type: "string"
    }
  }
}

function addDefinitionToSchemas (schemas, definition, model, modelName) {
  schemas[model] = definition;
  schemas[`${model}_list`] = {
    title: `${modelName} list`,
    type: 'array',
    items: { $ref: `#/components/schemas/${model}` }
  };
}

function joinParameter(refs) {
  if(refs.resolverParameter) {
    return {
      description: 'Tables to join in query. Use SHIFT to select mulitple',
      in: 'query',
      name: '$join',
      style: 'form',
      schema: {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${refs.resolverParameter}`
        }
      }
    }
  } else { return {
    description: 'Tables to join in query. This operation doesn\'t have any defined resolvers',
    in: 'query',
    name: '$join',

  }}
}

function filterParameter (refs) {
  return [{
    description: 'Query parameters to filter. An example of this parameter: userId[$gt]=1000',
    in: 'query',
    name: 'filter',
    style: 'form',
    explode: true,
    schema: {
      type: 'array',
      items: {
        enum: [
          '$gt',
          '$gte',
          '$lt',
          '$lte',
          '$ne',
          '$in',
          '$nin'
        ]
      }
    }
  },
  {
    description: 'Filter results to only selected parameters. An example of this parameter: $select[0]=userId',
    in: 'query',
    name: '$select[0]',
    style: 'form',
    explode: true,
    schema: {
      type: 'array',
      items: {
        $ref: `#/components/schemas/${refs.properties}`
      }
    }
  }];
}

function jsonSchemaRef (ref) {
  return {
    'application/json': {
      schema: {
        $ref: `#/components/schemas/${ref}`
      }
    }
  };
}

function idPathParameters (idName, idType, description) {
  const idNames = Array.isArray(idName) ? idName : [idName];
  const idTypes = Array.isArray(idType) ? idType : [idType];
  const params = [];

  for (let i = 0; i < idNames.length; i++) {
    const name = idNames[i];

    params.push({
      in: 'path',
      name,
      description,
      schema: {
        type: idTypes[i] || idTypes[0]
      },
      required: true
    });
  }

  return params;
}

class OpenApiV3Generator extends AbstractApiGenerator {
  getDefaultSpecs () {
    return {
      paths: {},
      components: {
        schemas: {}
      },
      openapi: '3.0.2',
      tags: [],
      info: {}
    };
  }

  getOperationSpecDefaults () {
    return {
      parameters: [],
      responses: {},
      description: '',
      summary: '',
      tags: [],
      security: []
    };
  }

  getOperationDefaults () {
    return {
      find ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Retrieves a list of all resources from the service.',
          parameters: [
            {
              description: 'Number of results to return',
              in: 'query',
              name: '$limit',
              schema: {
                type: 'integer'
              }
            }, {
              description: 'Number of results to skip',
              in: 'query',
              name: '$skip',
              schema: {
                type: 'integer'
              }
            }, {
              description: 'Property to sort results',
              in: 'query',
              name: '$sort[parameter]',
              style: 'deepObject',
              schema: {
                type: "integer",
                enum: [
                  1, -1
                ]
              }
            },
            joinParameter(refs),
            ...filterParameter(refs),
            apiKeySecurity(),
          ],
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.findResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('find', securities, security)
        };
      },
      get ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Retrieves a single resource with the given id from the service.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to return`),
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.getResponse)
            },
            401: {
              description: 'not authenticated'
            },
            404: {
              description: 'not found'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('get', securities, security)
        };
      },
      create ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Creates a new resource with data.',
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.createRequest)
          },
          responses: {
            201: {
              description: 'created',
              content: jsonSchemaRef(refs.createResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('create', securities, security)
        };
      },
      update ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to update`),
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.updateRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.updateResponse)
            },
            401: {
              description: 'not authenticated'
            },
            404: {
              description: 'not found'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('update', securities, security)
        };
      },
      updateMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Updates multiple resources.',
          parameters: [],
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.updateMultiRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.updateMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('updateMulti', securities, security)
        };
      },
      patch ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Updates the resource identified by id using data.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to update`),
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.patchRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.patchResponse)
            },
            401: {
              description: 'not authenticated'
            },
            404: {
              description: 'not found'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('patch', securities, security)
        };
      },
      patchMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Updates multiple resources queried by given filters.',
          parameters: [...filterParameter(refs)],
          requestBody: {
            required: true,
            content: jsonSchemaRef(refs.patchMultiRequest)
          },
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.patchMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('patchMulti', securities, security)
        };
      },
      remove ({ tags, modelName, idName, idType, security, securities, refs }) {
        return {
          tags,
          description: 'Removes the resource with id.',
          parameters: idPathParameters(idName, idType, `ID of ${modelName} to remove`),
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.removeResponse)
            },
            401: {
              description: 'not authenticated'
            },
            404: {
              description: 'not found'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('remove', securities, security)
        };
      },
      removeMulti ({ tags, security, securities, refs }) {
        return {
          tags,
          description: 'Removes multiple resources queried by given filters.',
          parameters: [...filterParameter(refs)],
          responses: {
            200: {
              description: 'success',
              content: jsonSchemaRef(refs.removeMultiResponse)
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security('removeMulti', securities, security)
        };
      },
      custom ({ tags, modelName, idName, idType, security, securities, refs }, { method, httpMethod, withId }) {
        const customDoc = {
          tags,
          description: `A custom ${method} method.`,
          responses: {
            200: {
              description: 'success'
            },
            401: {
              description: 'not authenticated'
            },
            500: {
              description: 'general error'
            }
          },
          security: utils.security(method, securities, security)
        };

        if (withId) {
          customDoc.parameters = idPathParameters(idName, idType, `ID of ${modelName}`);
        }

        if (['post', 'put', 'patch'].includes(httpMethod)) {
          const refRequestName = `${method}Request`;
          if (refs[refRequestName]) {
            customDoc.requestBody = {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${refs[refRequestName]}`
                  }
                }
              }
            };
          }
        }

        const refResponseName = `${method}Response`;
        if (refs[refResponseName]) {
          customDoc.responses['200'].content = {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${refs[refResponseName]}`
              }
            }
          };
        }

        return customDoc;
      }
    };
  }

  applyDefinitionsToSpecs (service, model, modelName) {
    if (typeof service.docs.definition !== 'undefined') {
      addDefinitionToSchemas(this.specs.components.schemas, service.docs.definition, model, modelName);
    }
    if (typeof service.docs.schema !== 'undefined') {
      addDefinitionToSchemas(this.specs.components.schemas, service.docs.schema, model, modelName);
    }
    if (typeof service.docs.definitions !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.definitions);
    }
    if (typeof service.docs.schemas !== 'undefined') {
      this.specs.components.schemas = Object.assign(this.specs.components.schemas, service.docs.schemas);
    }
    if (typeof this.config.defaults.schemasGenerator === 'function') {
      this.specs.components.schemas = Object.assign(
        this.specs.components.schemas,
        this.config.defaults.schemasGenerator(service, model, modelName, this.specs.components.schemas)
      );
    }
  }

  getPathParameterSpec (name) {
    return {
      in: 'path',
      name,
      schema: {
        type: 'string'
      },
      required: true,
      description: name + ' parameter'
    };
  }
}

module.exports = OpenApiV3Generator;
