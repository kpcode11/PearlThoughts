import { IsEmail, IsNotEmpty, MinLength, IsIn, IsOptional } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsOptional()
  phone?: string;

  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsIn(['patient', 'doctor'])
  role: 'patient' | 'doctor';
}
