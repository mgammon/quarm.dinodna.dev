import { ForbiddenException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from './admin.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {
    setInterval(() => this.getAdmins(), 60_000 * 5);
    this.getAdmins();
  }

  public admins: Admin[] = [];

  async getAdmins() {
    if (this.admins) {
      for (const admin of this.admins) {
        await this.adminRepository.save(admin); // save them before reloading (currently just for saving sentLogCount)
      }
    }
    this.admins = await this.adminRepository.find();
  }

  validateIsAdmin = (apiKey: string) => {
    const isAdmin = this.admins.some((admin) => admin.apiKey === apiKey && admin.isAdmin);
    if (!isAdmin) {
      throw new ForbiddenException();
    }
  };

  canSendPublicLogs = (apiKey: string) => {
    return this.admins.some((admin) => admin.apiKey === apiKey && admin.sendPublicLogs);
  };

  getPermissions = (apiKey: string) => {
    return {
      sendPublicLogs: this.canSendPublicLogs(apiKey),
    };
  };

  addToSentLogCount(admin: Admin, increment: number) {
    const sentLogCount = BigInt(admin.sentLogCount) + BigInt(increment);
    admin.sentLogCount = sentLogCount.toString();
  }
}
