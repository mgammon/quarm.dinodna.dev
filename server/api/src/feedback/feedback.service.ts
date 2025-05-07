import { Injectable } from '@nestjs/common';
import { Feedback } from './feedback.controller';
import { config } from '../config';
import { WebhookClient } from 'discord.js';
import * as moment from 'moment';

@Injectable()
export class FeedbackService {
  private webhookFeedbackClient = new WebhookClient({
    url: config.discord.feedbackWebhook,
  });

  private webhookEcChatClient = new WebhookClient({
    url: config.discord.ecChatWebhook,
  });

  private webhookGeneralClient = new WebhookClient({
    url: config.discord.generalWebhook,
  });

  private lastSendAtMap = new Map<string, number>();

  private noRecentEcChatTimeout?: NodeJS.Timeout;
  private ecChatIsUp = true;
  private lastEcChatMessageAt = Date.now();

  sendGeneral(content: string) {
    this.webhookGeneralClient.send({ content });
  }

  sendEcChat(rawLog: string) {
    if (config.apiKey === 'super-secret-api-key') {
      return;
    }
    if (this.ecChatIsUp === false) {
      const outageDuration = moment(this.lastEcChatMessageAt).fromNow(true);
      this.webhookGeneralClient.send({
        content: `Mule is UP: It was down for ${outageDuration}.`,
      });
    }
    this.lastEcChatMessageAt = Date.now();
    this.ecChatIsUp = true;
    this.webhookEcChatClient.send({ content: rawLog });
    clearTimeout(this.noRecentEcChatTimeout);
    this.noRecentEcChatTimeout = setTimeout(() => {
      this.webhookGeneralClient.send({
        content:
          'Mule is DOWN: No chat messages received in the last 15 minutes',
      });
      this.ecChatIsUp = false;
    }, 60_000 * 15);
  }

  sendFeedback(apiKey: string, feedback: Feedback) {
    // Check if they already sent a message recently
    const lastSentAt = this.lastSendAtMap.get(apiKey);
    const recentlySent =
      lastSentAt &&
      lastSentAt > moment().subtract(15, 'seconds').toDate().getTime();
    if (recentlySent) {
      return;
    }
    this.lastSendAtMap.set(apiKey, Date.now());

    // Trim the inputs down if they're ridiculously long
    if (apiKey.length > 100) {
      apiKey = apiKey.slice(0, 100);
    }
    if (feedback.message.length > 10_000) {
      feedback.message = feedback.message.slice(0, 10_000);
    }
    if (feedback.name.length > 100) {
      feedback.name = feedback.name.slice(0, 100);
    }
    const content = `**From**: ${
      feedback.name || 'Blank'
    } (${apiKey})\n**Message**: ${feedback.message}
    `;

    // Send
    this.webhookFeedbackClient.send({ content });
  }
}
