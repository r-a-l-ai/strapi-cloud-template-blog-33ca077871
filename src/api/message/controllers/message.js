'use strict';

/**
 * message controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::message.message', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    
    try {
      // Get the message to be deleted
      const message = await strapi.entityService.findOne('api::message.message', id, {
        populate: ['thread', 'client_id']
      });

      if (!message) {
        return ctx.notFound();
      }

      // Delete the message
      const response = await strapi.entityService.delete('api::message.message', id);

      // Return success response
      return ctx.send({
        data: response
      });
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}));
