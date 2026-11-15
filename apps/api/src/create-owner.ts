import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { emailSchema, hashPassword, passwordSchema } from './password.js';

const name = z.string().trim().min(1).max(70);
const owner = z.object({ email: emailSchema, firstName: name, lastName: name, password: passwordSchema }).safeParse({
  email: process.env.OWNER_EMAIL,
  firstName: process.env.OWNER_FIRST_NAME,
  lastName: process.env.OWNER_LAST_NAME,
  password: process.env.OWNER_PASSWORD,
});
if (!owner.success) throw new Error('Provide valid OWNER_EMAIL, OWNER_FIRST_NAME, OWNER_LAST_NAME and OWNER_PASSWORD');
const db = new PrismaClient();
try {
  const { password, ...profile } = owner.data;
  if (await db.owner.findUnique({ where: { id: 1 }, select: { id: true } })) {
    process.stdout.write('The owner already exists.\n');
  } else {
    await db.owner.create({ data: { id: 1, ...profile, passwordHash: await hashPassword(password) } });
    process.stdout.write('Owner created.\n');
  }
} finally {
  await db.$disconnect();
}
