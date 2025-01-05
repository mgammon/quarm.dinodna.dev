import { Body, Controller, Param, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

export interface Feedback {
  name: string;
  message: string;
}

@Controller('api/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post(`/:apiKey`)
  public async sendFeedback(
    @Param('apiKey') apiKey: string,
    @Body() feedback: Feedback,
  ) {
    this.feedbackService.sendFeedback(apiKey, feedback);
  }
}
