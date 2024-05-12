const axios = require('axios');
const openai = require('openai');

module.exports = (config, {strapi}) => {
  return async (ctx, next) => {
    if (ctx.url.match(/^\/api\/model\/query/)) {
      try {
        const openaiobject = new openai.OpenAI();
        const question = ctx.request.body.query;
        let conversation = ctx.request.body.conversation;
        let thread = null;
        let insertConversationResult = null;

        // try{
        //     thread = await openaiobject.beta.threads.retrieve(conversation);
        // } catch {
        //     thread = await openaiobject.beta.threads.create();
        // }

        let entityCheck = await strapi.db.query('api::conversation.conversation').findMany({
          select: ['id'],
          where: { conversationUid: conversation }
        });

        let conversationId = -1;
        if (entityCheck.length == 0)
        {
          insertConversationResult = await strapi.entityService.create('api::conversation.conversation', { 
            data: {
              conversationUid: conversation
            },
          });
          conversationId = insertConversationResult[0].id;

        }else{
            conversationId = entityCheck[0].id;
        }

        let insertMessageResult = await strapi.entityService.create('api::message.message', {
          data: {
            message_text: question,
            conversation: conversationId,
            type: 'user'
          }
        });

        let conversationContent = await strapi.db.query('api::message.message').findMany({
            orderBy: { createdAt: 'asc' },
            where: { conversation: conversationId }
          });

        let messages = [{'role': 'system', 'content': 'You are a helpful assistant.'}];
        conversationContent.forEach(element => {
            messages.push({'role': element.type, 'content': element.message_text})
        });  

        const completion = await openaiobject.chat.completions.create({
            messages:  [{'role': 'user', 'content': question}],
            model: "gpt-4",
        });

        if(completion.choices.length > 0){
            const answer = completion.choices[0].message.content;

            insertMessageResult = await strapi.entityService.create('api::message.message', {
                data: {
                  message_text: answer,
                  conversation: conversationId,
                  type: 'assistant'
                }
              });
            ctx.body = `{'answer' : ${JSON.stringify(completion.choices[0].message.content)}, 'conversation': '${conversation}'}`;
        }
      } catch (error) {
        console.error('Error querying AutoGen: %s \n body : %s\n AutoGenUrl:%s', error, ctx.request.body, process.env.AUTOGEN_URL);
        ctx.send({ message: 'Failed to query AutoGen', error }, 500);
      }
    } 

    await next();
  };
};
