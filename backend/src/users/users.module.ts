import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { MeetupsModule } from '../meetups/meetups.module';

@Module({
  imports: [MeetupsModule],
  controllers: [UsersController],
})
export class UsersModule {}
