'use strict';

/**
 * vector-store service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vector-store.vector-store');
