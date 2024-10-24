'use strict';

/**
 * vector-store controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vector-store.vector-store');
