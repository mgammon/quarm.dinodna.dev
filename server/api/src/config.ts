export const config = {
  httpPort: parseInt(process.env.HTTP_PORT || '3000'),
  apiKey: process.env.API_KEY || 'super-secret-api-key',
  mysql: {
    host: process.env.MYSQL_HOST || 'mysql',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'quarm_data',
    username: process.env.MYSQL_USER || 'mysql',
    password: process.env.MYSQL_PASSWORD || 'mysql',
  },
  discord: {
    feedbackWebhook: process.env.DISCORD_FEEDBACK_WEBHOOK,
    ecChatWebhook: process.env.DISCORD_EC_CHAT_WEBHOOK,
    generalWebhook: process.env.DISCORD_GENERAL_WEBHOOK,
  },
  isProd: process.env.NODE_ENV === 'production',
};
