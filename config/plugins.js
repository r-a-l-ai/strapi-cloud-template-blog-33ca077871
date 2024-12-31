module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d',
      },
      grant: {
        github: {
          enabled: true,
          icon: 'github',
          key: env('GITHUB_CLIENT_ID'),
          secret: env('GITHUB_CLIENT_SECRET'),
          callback: '/api/connect/github/callback',
          scope: ['user', 'user:email'],
          redirectUri: 'http://localhost/login'
        },
      },
    },
  },
});
