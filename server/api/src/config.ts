export const config = {
  noNewLogs: process.env.NO_NEW_LOGS === 'true',
  httpPort: parseInt(process.env.HTTP_PORT || '3000'),
  apiKey: process.env.API_KEY || 'super-secret-api-key',
  mysql: {
    host: process.env.MYSQL_HOST || 'mysql',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'quarm_data',
    username: process.env.MYSQL_USERNAME || 'mysql',
    password: process.env.MYSQL_PASSWORD || 'mysql',
  },

  discord: {
    feedbackWebhook: process.env.DISCORD_FEEDBACK_WEBHOOK,
    ecChatWebhook: process.env.DISCORD_EC_CHAT_WEBHOOK,
    generalWebhook: process.env.DISCORD_GENERAL_WEBHOOK,
  },
  quarmDatabaseDumpUrl:
    process.env.QUARM_DATABASE_DUMP_URL ||
    'https://github.com/SecretsOTheP/EQMacEmu/raw/refs/heads/main/utils/sql/database_full/quarm_2025-03-30-17_08.tar.gz',
};
