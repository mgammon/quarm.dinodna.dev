import { Controller, Get } from '@nestjs/common';
import { ApiUser, requireUser } from '../utils';
import { UserService } from './user.service';
import { User } from './user.entity';

@Controller('api/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(`/permissions`)
  public async getPermissions(@ApiUser() user: User) {
    requireUser(user);
    return this.userService.getPermissions(user.id);
  }
}
