import { Injectable } from '@nestjs/common';
import { Feedback } from './feedback.controller';
import { config } from '../config';
import { WebhookClient } from 'discord.js';
import * as moment from 'moment';

@Injectable()
export class FeedbackService {
  private webhookClient = new WebhookClient({
    url: config.discordFeedbackWebhook,
  });

  private lastSendAtMap = new Map<string, number>();

  send(apiKey: string, feedback: Feedback) {
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
    this.webhookClient.send({ content });
  }
}
