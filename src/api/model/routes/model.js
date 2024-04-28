'use strict';

/**
 * model router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::model.model', {
  method: 'POST',
  path: '/api/model/query', // Custom path for your route
  handler: 'query.forwardToAutoGen', // Handler in your controller
  config: {
    middlewares: ['AutoGen'] // Specify your middleware here
  },
});