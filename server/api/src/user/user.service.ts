import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { cache } from '../items/in-memory-cache';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Cached for 1 minute,  maybe should be longer
  async getUserFromApiKey(apiKey: string) {
    // No API key, no user.
    if (!apiKey) {
      return null;
    }

    const user = await cache(
      'getUserFromApiKey',
      apiKey,
      async () => {
        let user = await this.userRepository.findOneBy({ apiKey });
        if (!user) {
          await this.userRepository.save({ apiKey });
          user = await this.userRepository.findOneBy({ apiKey });
        }

        return user;
      },
      60_000,
    );

    return user;
  }

  async isAdmin(apiKey: string) {
    const user = await this.getUserFromApiKey(apiKey);
    return user && user.isAdmin;
  }

  async canSendPublicLogs(apiKey: string) {
    const user = await this.getUserFromApiKey(apiKey);
    return user && user.canSendPublicLogs;
  }

  // Specifically not cached
  async getPermissions(userId: number) {
    const { canSendPublicLogs } = await this.userRepository.findOneBy({ id: userId });
    return {
      canSendPublicLogs,
    };
  }
}
