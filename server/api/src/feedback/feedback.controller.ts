import { Body, Controller, Param, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { ApiUser } from '../utils';
import { User } from '../user/user.entity';

export interface Feedback {
  name: string;
  message: string;
}

@Controller('api/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post(`/:apiKey`)
  public async sendFeedback(@ApiUser() user: User, @Body() feedback: Feedback) {
    this.feedbackService.sendFeedback(user.id, feedback);
  }
}
