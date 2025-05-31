import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ synchronize: true, name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 100 })
  apiKey: string;

  @Column()
  sendPublicLogs: boolean;

  @Column()
  isAdmin: boolean;
}