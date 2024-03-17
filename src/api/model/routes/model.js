'use strict';

/**
 * model router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::model.model', {
  method: 'POST',
  path: '/api/model/query', // Custom path for your route
  handler: 'query.forwardToMindsDB', // Handler in your controller
  config: {
    middlewares: ['mindsdb'] // Specify your middleware here
  },
});