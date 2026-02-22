import { IsString, IsIn } from 'class-validator';
import { SessionType } from '@prisma/client';

export class SlotDto {
  @IsString()
  // date in ISO form (doctor's calendar date)
  date: string;

  @IsString()
  dayOfWeek: string;

  @IsIn(['morning', 'evening'])
  session: SessionType;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}
