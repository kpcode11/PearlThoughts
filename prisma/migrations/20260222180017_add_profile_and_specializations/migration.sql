/*
  Warnings:

  - You are about to drop the column `bio` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `clinicAddress` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `consultationFee` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `experienceYears` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `qualification` on the `doctors` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `doctors` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "doctors" DROP COLUMN "bio",
DROP COLUMN "clinicAddress",
DROP COLUMN "consultationFee",
DROP COLUMN "experienceYears",
DROP COLUMN "qualification",
DROP COLUMN "specialization";

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "specialization" VARCHAR(120),
    "qualification" VARCHAR(150),
    "experienceYears" INTEGER,
    "bio" TEXT,
    "clinicAddress" VARCHAR(255),
    "consultationFee" DECIMAL(10,2),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specializations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "doctorId" UUID NOT NULL,

    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_doctorId_key" ON "profiles"("doctorId");

-- CreateIndex
CREATE INDEX "specializations_doctorId_idx" ON "specializations"("doctorId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specializations" ADD CONSTRAINT "specializations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
