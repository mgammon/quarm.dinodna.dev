export const config = {
  httpPort: parseInt(process.env.HTTP_PORT || '3000'),
  apiKey: process.env.API_KEY || 'super-secret-api-key',
  mariadb: {
    host: process.env.MARIADB_HOST || 'mariadb',
    port: parseInt(process.env.MARIADB_PORT || '3307'),
    database: process.env.MARIADB_DATABASE || 'quarm',
    username: process.env.MARIADB_USERNAME || 'mariadb',
    password: process.env.MARIADB_PASSWORD || 'mariadb',
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
