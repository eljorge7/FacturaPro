import { Module } from '@nestjs/common';
import { TopupsService } from './topups.service';

@Module({
  providers: [TopupsService],
  exports: [TopupsService]
})
export class TopupsModule {}
