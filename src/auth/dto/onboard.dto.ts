import { IsOptional, IsInt, Min, IsIn, IsString } from 'class-validator';
import { Gender } from '@prisma/client';

export class OnboardDto {
  // fields specific to patient
  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: Gender;

  // fields specific to doctor
  @IsOptional()
  @IsString()
  // allow multiple specializations during onboarding
  specialization?: string;

  @IsOptional()
  @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsOptional()
  @IsInt()
  consultationFee?: number;
}
