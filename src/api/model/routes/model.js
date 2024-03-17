'use strict';

/**
 * model router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = {
  routes: [
    createCoreRouter('api::model.model').routes,
    {
      method: 'POST',
      path: '/model/query', // Custom path for your route
      handler: 'query.forwardToMindsDB', // Handler in your controller
      config: {
        middlewares: ['api::model.mindsdb'], // Specify your middleware here
      },
    },
  ],
};