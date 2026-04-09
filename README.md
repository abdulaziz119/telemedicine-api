# Telemedicine API

Fastify + TypeScript + Prisma + PostgreSQL asosida yozilgan soddalashtirilgan telemedicine service.

Asosiy imkoniyatlar:

- `POST /auth/login` orqali JWT olish
- `GET /auth/me` orqali joriy foydalanuvchini ko'rish
- `GET /users/find-all` va `GET /users/get-one/:id`
- `GET /doctors/find-all` va `GET /doctors/get-one/:id`
- `GET /appointments/find-all` va `GET /appointments/get-one/:id`
- `GET /prescriptions/find-all` va `GET /prescriptions/get-one/:id`
- `POST /appointments` orqali qabulga yozilish
- `PUT /appointments/:id/complete` orqali qabulni yakunlash
- `PUT /appointments/:id/cancel` orqali qabulni bekor qilish
- `POST /appointments/:id/prescription` orqali retsept berish

## Ishlatilgan stack

- Node.js 20+
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- Zod
- `@fastify/cors`
- `cors`
- `http-status-codes`
- `pino-pretty`

## Yangi struktura

Loyiha NestJS'ga yaqin usulda yig'ilgan:

```text
src/
  modules/
    doctors/
      dto/
      doctors.controller.ts
      doctors.service.ts
      doctors.repository.ts
      doctors.module.ts
    appointments/
      dto/
      appointments.controller.ts
      appointments.service.ts
      appointments.repository.ts
      appointments.module.ts
    prescriptions/
      dto/
      prescriptions.controller.ts
      prescriptions.service.ts
      prescriptions.repository.ts
      prescriptions.module.ts
    users/
      dto/
      users.controller.ts
      users.service.ts
      users.repository.ts
      users.module.ts
  shared/
    config/
    database/
    http/
    i18n/
```

## Audit fieldlar

Barcha asosiy jadvallarda quyidagi fieldlar bor:

- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

Write endpointlarda audit actor JWT token ichidagi foydalanuvchidan olinadi.

Shuning uchun `created_by` va `updated_by` avtomatik to'ldiriladi.

## Authentication

API endi `Bearer` token talab qiladi. Public route'lar:

- `GET /health`
- `POST /auth/login`

Login misoli:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "PatientPass123!"
  }'
```

Keyingi so'rovlarda tokenni yuboring:

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Authz qoidalari:

- patient faqat o'zi uchun appointment yarata oladi
- doctor faqat o'zi uchun appointment'ni yakunlay oladi
- doctor faqat o'zi nomidan prescription yoza oladi
- appointment va prescription list/get-one route'lari faqat joriy userga tegishli yozuvlarni qaytaradi
- `PUT /appointments/:id/cancel` faqat qabulga biriktirilgan shifokor yoki bemor tomonidan bajarilishi mumkin
- `users` route'lari barcha aktiv foydalanuvchilarni ko'rish imkonini beradi

## Multilingual JSON fieldlar

Quyidagi fieldlar PostgreSQL `JSONB` ko'rinishida saqlanadi:

- `doctor_profiles.specialization`
- `prescription_items.medication_name`
- `prescription_items.dosage`
- `prescription_items.instructions`

JSON formati:

```json
{
  "uz": "Kardiolog",
  "en": "Cardiologist",
  "ru": "Кардиолог"
}
```

API javobida esa `x-lang` yoki `Accept-Language` header bo'yicha kerakli tilning qiymati chiqariladi.

## Ko'p tilli errorlar

Error message'lar JSON fayllarda saqlanadi:

```text
src/shared/i18n/locales/uz/errors.json
src/shared/i18n/locales/uz/validation.json
src/shared/i18n/locales/en/errors.json
src/shared/i18n/locales/en/validation.json
src/shared/i18n/locales/ru/errors.json
src/shared/i18n/locales/ru/validation.json
```

Har bir tilda faqat 2 ta fayl bor:

- `errors.json`
- `validation.json`

Modullar esa JSON ichida nested ko'rinishda saqlanadi.

JSON ichida nesting ham bor, masalan:

```json
{
  "service": {
    "appointmentNotFound": "Прием не найден."
  }
}
```

Tilni quyidagicha tanlash mumkin:

- `x-lang: uz`
- `x-lang: en`
- `x-lang: ru`

Yoki `Accept-Language` header orqali.

## Local ishga tushirish

1. `.env` tayyorlang:

```bash
cp .env.example .env
```

2. Postgres'ni ishga tushiring:

```bash
docker compose up -d postgres
```

3. Dependency o'rnating:

```bash
npm install
```

4. Prisma client yarating:

```bash
npm run prisma:generate
```

5. Migratsiyani qo'llang:

```bash
npm run prisma:deploy
```

6. Seed data yozing:

```bash
npm run prisma:seed
```

7. Serverni ishga tushiring:

```bash
npm run dev
```

`npm run dev` endi `nodemon` bilan ishlaydi va fayl o'zgarsa server avtomatik restart bo'ladi.

Seed'dan keyin default loginlar:

- doctor: `doctor.cardiology@example.com` / `DoctorPass123!`
- patient: `patient@example.com` / `PatientPass123!`

## Testlar

Vitest asosidagi unit testlarni ishga tushirish:

```bash
npm test
```

Hozircha testlar quyidagilarni yopadi:

- appointment vaqt oralig'i overlap logikasi
- `createAppointment` ichidagi past-date va invalid-range validatsiyasi
- doctor yoki patient conflict bo'lganda appointment yaratishni bloklash

## Docker bilan to'liq ishga tushirish

```bash
docker compose up --build
```

Keyin seed:

```bash
docker compose exec api npm run prisma:seed
```

## Environment

`.env.example`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/telemedicine?schema=public"
HOST="0.0.0.0"
PORT="3000"
NODE_ENV="development"
JWT_SECRET="dev-jwt-secret-change-me"
JWT_EXPIRES_IN_SECONDS="3600"
```

## Prisma migration

Migration fayli:

```text
prisma/migrations/20260408231000_init/migration.sql
```

Qo'shimcha ravishda appointment overlap'larni race condition paytida ham to'xtatish uchun PostgreSQL `EXCLUSION CONSTRAINT` ishlatiladi:

- `appointments_doctor_schedule_no_overlap`
- `appointments_patient_schedule_no_overlap`

## Seed

`npm run prisma:seed` quyidagilarni yaratadi:

- 2 ta doctor
- 1 ta patient

Command natijasida `id` larni konsolda ko'rasiz.

## Endpointlar

### 1. Find-all route'lar

Barcha list endpointlar `page` va `limit` qabul qiladi:

- `GET /users/find-all?page=1&limit=10`
- `GET /doctors?page=1&limit=10`
- `GET /doctors/find-all?page=1&limit=10`
- `GET /appointments/find-all?page=1&limit=10`
- `GET /prescriptions/find-all?page=1&limit=10`

Qo'shimcha filterlar:

- `GET /users/find-all?role=DOCTOR&page=1&limit=10`
- `GET /doctors/find-all?specialization=cardio&page=1&limit=10`
- `GET /appointments/find-all?doctor_id=DOCTOR_ID&status=SCHEDULED&page=1&limit=10`
- `GET /prescriptions/find-all?patient_id=PATIENT_ID&page=1&limit=10`

### 2. Get-one route'lar

- `GET /users/get-one/:id`
- `GET /doctors/get-one/:id`
- `GET /appointments/get-one/:id`
- `GET /prescriptions/get-one/:id`

### 3. Doctors list

`GET /doctors`

Optional query:

- `specialization`
- `page`
- `limit`

Misol:

```bash
curl "http://localhost:3000/doctors?specialization=cardio&page=1&limit=10"
```

### 4. Appointment yaratish

`POST /appointments`

Body:

```json
{
  "patient_id": "PATIENT_ID",
  "doctor_id": "DOCTOR_ID",
  "starts_at": "2026-05-01T10:00:00.000Z",
  "ends_at": "2026-05-01T10:30:00.000Z"
}
```

Misol:

```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "x-lang: uz" \
  -d '{
    "patient_id": "PATIENT_ID",
    "doctor_id": "DOCTOR_ID",
    "starts_at": "2026-05-01T10:00:00.000Z",
    "ends_at": "2026-05-01T10:30:00.000Z"
  }'
```

Business rule:

- o'tgan vaqtga yozib bo'lmaydi
- band slotga yozib bo'lmaydi
- doctor va patient mavjud bo'lishi kerak

### 5. Appointment complete

`PUT /appointments/:id/complete`

Body:

```json
{
  "doctor_id": "DOCTOR_ID"
}
```

### 6. Appointment cancel

`PUT /appointments/:id/cancel`

Authz qoidasi: faqat qabulga biriktirilgan shifokor yoki bemor bekor qila oladi.

### 7. Prescription create

`POST /appointments/:id/prescription`

Body:

```json
{
  "doctor_id": "DOCTOR_ID",
  "items": [
    {
      "medication_name": {
        "uz": "Ibuprofen",
        "en": "Ibuprofen",
        "ru": "Ибупрофен"
      },
      "dosage": {
        "uz": "Kuniga 2 mahal 200 mg",
        "en": "200 mg 2 times a day",
        "ru": "200 мг 2 раза в день"
      },
      "instructions": {
        "uz": "Ovqatdan keyin iching",
        "en": "Take after meals",
        "ru": "Принимать после еды"
      }
    }
  ]
}
```

Business rule:

- retsept faqat `COMPLETED` appointment uchun yaratiladi
- bitta appointment uchun faqat bitta retsept bo'ladi

## Error format

API quyidagi statuslarni qaytaradi:

- `400`
- `404`
- `409`

Misol:

```json
{
  "status_code": 409,
  "error": "Conflict",
  "error_code": "APPOINTMENT_SLOT_BUSY",
  "message": "Tanlangan vaqt band."
}
```
