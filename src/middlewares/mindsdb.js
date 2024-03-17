const axios = require('axios');

module.exports =  (config, {strapi}) => {
  return async (ctx, next) => {
    if (ctx.url.match(/^\/api\/model\/query/)) {
      try {
        var response = await axios.post('https://lades.sk/api/sql/query', ctx.request.body, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MINDSDB_BEARER_TOKEN}` // Use the environment variable
          },
        });

        ctx.body = response.data;
        
      } catch (error) {
        console.error('Error querying MindsDB:', error);
        ctx.send({ message: 'Failed to query MindsDB', error }, 500);
      }
    } else {
      return next();
    }
  };
};
