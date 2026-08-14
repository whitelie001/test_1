import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MeetupsModule } from '../meetups/meetups.module';

@Module({
  imports: [MeetupsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
