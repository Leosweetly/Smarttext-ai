export const auth0Config = {
  secret: process.env.AUTH0_SECRET,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  routes: {
    callback: '/api/authentication/callback',
    login: '/api/authentication/login',
    logout: '/api/authentication/logout',
  },
  authorizationParams: {
    scope: 'openid profile email',
  },
  session: {
    rollingDuration: 60 * 60 * 24 * 30, // 30 days
  },
};
