'use strict';

/**
 * manual controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::manual.manual');
