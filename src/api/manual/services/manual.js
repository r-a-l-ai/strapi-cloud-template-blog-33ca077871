'use strict';

/**
 * manual service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::manual.manual');
