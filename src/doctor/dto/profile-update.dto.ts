import { IsOptional, IsString, IsInt, Min, IsBoolean, IsArray } from 'class-validator';

export class ProfileUpdateDto {
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsArray()
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

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsBoolean()
  availabilityStatus?: boolean;
}
