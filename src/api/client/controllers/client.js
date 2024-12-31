'use strict';

/**
 * client controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::client.client', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    
    try {
      // Get the client to be deleted
      const client = await strapi.entityService.findOne('api::client.client', id);

      if (!client) {
        return ctx.notFound();
      }

      // Delete the client
      const response = await strapi.entityService.delete('api::client.client', id);

      // Return success response
      return ctx.send({
        data: response
      });
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}));
