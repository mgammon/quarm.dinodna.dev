import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  private async createUser() {
    const id = crypto.randomUUID();
    await this.userRepository.insert({ id, isConnected: true });
    return id;
  }

  private async userExists(id?: string) {
    if (!id) {
      return false;
    }

    return this.userRepository.exists({ where: { id } });
  }

  async onUserConnected(id?: string): Promise<string> {
    if (this.userExists(id)) {
      this.userRepository.update({ id }, { isConnected: true });
      return id;
    } else {
      return this.createUser();
    }
  }
}
