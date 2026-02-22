import 'dotenv/config';
import { UserRole, Gender, SessionType, ConsultingType, VisitType, ComplaintType, BookingSource } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

// use PrismaService so the adapter configuration is applied
const prisma = new PrismaService();

async function main() {
  // clear existing data (development only)
  await prisma.appointment.deleteMany();
  await prisma.availableSlot.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // create a couple of doctors and patients
  const doc1User = await prisma.user.create({
    data: {
      fullName: 'Dr. Alice Smith',
      email: 'alice.doc@example.com',
      role: UserRole.doctor,
      passwordHash: 'dummy',
      isEmailVerified: true,
    },
  });
  const doc1 = await prisma.doctor.create({
    data: {
      userId: doc1User.id,
      specialization: 'Cardiology',
      qualification: 'MD',
      experienceYears: 10,
      clinicAddress: '123 Heart St.',
      consultationFee: 100,
    },
  });

  const doc2User = await prisma.user.create({
    data: {
      fullName: 'Dr. Bob Lee',
      email: 'bob.doc@example.com',
      role: UserRole.doctor,
      passwordHash: 'dummy',
      isEmailVerified: true,
    },
  });
  const doc2 = await prisma.doctor.create({
    data: {
      userId: doc2User.id,
      specialization: 'Dermatology',
      qualification: 'MD',
      experienceYears: 5,
      clinicAddress: '456 Skin Ave.',
      consultationFee: 80,
    },
  });

  const pat1 = await prisma.user.create({
    data: {
      fullName: 'John Patient',
      email: 'john.patient@example.com',
      role: UserRole.patient,
      passwordHash: 'dummy',
      isEmailVerified: true,
    },
  });
  await prisma.patient.create({ data: { userId: pat1.id, age: 30, gender: Gender.male } });

  const pat2 = await prisma.user.create({
    data: {
      fullName: 'Mary Patient',
      email: 'mary.patient@example.com',
      role: UserRole.patient,
      passwordHash: 'dummy',
      isEmailVerified: true,
    },
  });
  await prisma.patient.create({ data: { userId: pat2.id, age: 25, gender: Gender.female } });

  // create slots for each doctor
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await prisma.availableSlot.createMany({
    data: [
      {
        doctorId: doc1.id,
        date: today,
        dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
        session: SessionType.morning,
        startTime: '09:00',
        endTime: '11:00',
      },
      {
        doctorId: doc1.id,
        date: tomorrow,
        dayOfWeek: tomorrow.toLocaleDateString('en-US', { weekday: 'long' }),
        session: SessionType.evening,
        startTime: '14:00',
        endTime: '16:00',
      },
      {
        doctorId: doc2.id,
        date: today,
        dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
        session: SessionType.morning,
        startTime: '10:00',
        endTime: '12:00',
      },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
