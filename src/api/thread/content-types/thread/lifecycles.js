'use strict';

module.exports = {
  async beforeDelete(event) {
    const { params: { where } } = event;
    
    // Find all messages associated with this thread
    const messages = await strapi.entityService.findMany('api::message.message', {
      filters: {
        thread: where.id
      }
    });

    // Delete all associated messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        await strapi.entityService.delete('api::message.message', message.id);
      }
    }
  }
}; 