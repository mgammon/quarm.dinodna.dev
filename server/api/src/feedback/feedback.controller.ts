import { Body, Controller, Post } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { ApiUser, requireUser } from '../utils';
import { User } from '../user/user.entity';

export interface Feedback {
  name: string;
  message: string;
}

@Controller('api/feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  public async sendFeedback(@ApiUser() user: User, @Body() feedback: Feedback) {
    requireUser(user);
    this.feedbackService.sendFeedback(user.id, feedback);
  }
}
