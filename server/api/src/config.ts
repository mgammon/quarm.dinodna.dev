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
  discordFeedbackWebhook: process.env.DISCORD_FEEDBACK_WEBHOOK,
  quarmDatabaseDumpUrl:
    process.env.QUARM_DATABASE_DUMP_URL ||
    'https://github.com/SecretsOTheP/EQMacEmu/blob/80c759031aa2a1668225f51c1226dae9bddc2eda/utils/sql/database_full/quarm_2024-10-21-13_53.tar.gz',
};
