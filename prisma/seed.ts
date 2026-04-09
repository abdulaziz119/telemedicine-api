import "dotenv/config";

import { Prisma, PrismaClient } from "@prisma/client";
import { createLocalizedText } from "../src/shared/i18n/localized-text";
import { hashPassword } from "../src/shared/auth/password";
import { userRoles } from "../src/modules/users/users.enum";

const prisma = new PrismaClient();

async function main() {
  const doctorPasswordHash = await hashPassword("DoctorPass123!")
  const patientPasswordHash = await hashPassword("PatientPass123!")

  const cardiologySpecialization = createLocalizedText(
    "Kardiolog",
    "Cardiologist",
    "Кардиолог"
  ) as unknown as Prisma.InputJsonValue;

  const neurologySpecialization = createLocalizedText(
    "Nevrolog",
    "Neurologist",
    "Невролог"
  ) as unknown as Prisma.InputJsonValue;

  const doctorOne = await prisma.user.upsert({
    where: { email: "doctor.cardiology@example.com" },
    update: {
      full_name: "Dr. Alice Karimova",
      role: userRoles.DOCTOR,
      password_hash: doctorPasswordHash,
      doctor_profile: {
        upsert: {
          update: {
            specialization: cardiologySpecialization,
            consultation_fee: 200000
          },
          create: {
            specialization: cardiologySpecialization,
            consultation_fee: 200000
          }
        }
      }
    },
    create: {
      email: "doctor.cardiology@example.com",
      full_name: "Dr. Alice Karimova",
      role: userRoles.DOCTOR,
      password_hash: doctorPasswordHash,
      doctor_profile: {
        create: {
          specialization: cardiologySpecialization,
          consultation_fee: 200000
        }
      }
    }
  });

  const doctorTwo = await prisma.user.upsert({
    where: { email: "doctor.neurology@example.com" },
    update: {
      full_name: "Dr. Bekzod Tursunov",
      role: userRoles.DOCTOR,
      password_hash: doctorPasswordHash,
      doctor_profile: {
        upsert: {
          update: {
            specialization: neurologySpecialization,
            consultation_fee: 250000
          },
          create: {
            specialization: neurologySpecialization,
            consultation_fee: 250000
          }
        }
      }
    },
    create: {
      email: "doctor.neurology@example.com",
      full_name: "Dr. Bekzod Tursunov",
      role: userRoles.DOCTOR,
      password_hash: doctorPasswordHash,
      doctor_profile: {
        create: {
          specialization: neurologySpecialization,
          consultation_fee: 250000
        }
      }
    }
  });

  const patient = await prisma.user.upsert({
    where: { email: "patient@example.com" },
    update: {
      full_name: "Jasur Patient",
      role: userRoles.PATIENT,
      password_hash: patientPasswordHash
    },
    create: {
      email: "patient@example.com",
      full_name: "Jasur Patient",
      role: userRoles.PATIENT,
      password_hash: patientPasswordHash
    }
  });

  console.log("Seed completed.");
  console.log("Doctors:");
  console.log(
    JSON.stringify(
      [
        {
          id: doctorOne.id,
          full_name: doctorOne.full_name,
          specialization: cardiologySpecialization,
          consultation_fee: 200000
        },
        {
          id: doctorTwo.id,
          full_name: doctorTwo.full_name,
          specialization: neurologySpecialization,
          consultation_fee: 250000
        }
      ],
      null,
      2
    )
  );
  console.log("Patient:");
  console.log(
    JSON.stringify(
      {
        id: patient.id,
        full_name: patient.full_name,
        email: patient.email
      },
      null,
      2
    )
  );
  console.log("Login credentials:");
  console.log(
    JSON.stringify(
      {
        doctor: {
          email: "doctor.cardiology@example.com",
          password: "DoctorPass123!"
        },
        patient: {
          email: "patient@example.com",
          password: "PatientPass123!"
        }
      },
      null,
      2
    )
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
