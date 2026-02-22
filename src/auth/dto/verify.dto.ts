import { IsNotEmpty, IsIn, IsString } from 'class-validator';

export class VerifyDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsIn(['email', 'phone'])
  type: 'email' | 'phone';
}
