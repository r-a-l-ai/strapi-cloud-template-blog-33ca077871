'use strict';

/**
 * vector-store router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::vector-store.vector-store');
