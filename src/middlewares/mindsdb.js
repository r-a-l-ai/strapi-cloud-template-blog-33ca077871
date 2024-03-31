const axios = require('axios');
const { useLayoutEffect } = require('react');

module.exports = (config, {strapi}) => {
  return async (ctx, next) => {
    if (ctx.url.match(/^\/api\/model\/query/)) {
      try {
        const question = ctx.request.body.query;
        let conversation = ctx.request.body.conversation;

        let entityCheck = await strapi.db.query('api::conversation.conversation').findMany({
          select: ['id'],
          where: { conversationUid: conversation }
        });
        let conversationId = -1;
        if (entityCheck.length == 0)
        {
          let insertConversationResult = await strapi.entityService.create('api::conversation.conversation', { 
            data: {
              conversationUid: conversation
            },
          });
          conversationId = insertConversationResult.id;
          conversation = insertConversationResult.conversationUid
        }
        else
        {
          conversationId = entityCheck[0].id;
        }

        let insertMessageResult = await strapi.entityService.create('api::message.message', {
          data: {
            message_text: question,
            conversation: conversationId
          }
        });

        let mindsDbBody = `{"query": "SELECT * FROM garni_gpt4_model WHERE question = '${question}';"}`;

        let mindsDbRespone = await axios.post(process.env.MINDSDB_URL, mindsDbBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINDSDB_BEARER_TOKEN}`
          },
        });

        ctx.body = `{"answer" : ${JSON.stringify(mindsDbRespone.data.data[0][0])}, "conversation": "${conversation}"}`;

      } catch (error) {
        console.error('Error querying MindsDB: %s \n body : %s\n mindsDBUrl:%s', error, ctx.request.body, process.env.MINDSDB_URL);
        ctx.send({ message: 'Failed to query MindsDB', error }, 500);
      }
    } else {
      await next();
    }
  };
};
