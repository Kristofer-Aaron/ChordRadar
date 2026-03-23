import { Prisma, PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  // Get user credentials from JSON file
  const filePath = path.join(__dirname, "../data", "users.json");
  const raw = await fs.readFile(filePath, "utf8");
  const users = JSON.parse(raw);

  for (const u of users) {
    // Check existence by email OR username
    const exists = await prisma.user.findFirst({
      where: {
        OR: [
          { email_address: u.email_address },
          { user_name: u.user_name },
        ],
      },
      select: { id: true },
    });

    const password_hash = await bcrypt.hash(String(u.password), 10);

    const data = {
      user_name: u.user_name,
      first_name: u.first_name,
      last_name: u.last_name,
      email_address: u.email_address,
      email_verified: true,
      password_hash,
      password_changed_at: new Date(),
      two_factor_enabled: false,
      two_factor_method: null,
      two_factor_secret: null,
      two_factor_backup: Prisma.DbNull, // SQL NULL in the database for JSON-mapped column
      role: u.role ?? "user",
      status: u.status ?? "active",
      preferences: u.preferences ?? { theme: "dark", notifications: true },
      account_created_at: new Date(),
      last_login_at: new Date(),
    };

    await prisma.user.upsert({
      where: { email_address: data.email_address },
      update: data,
      create: data,
    });

    if (exists) {
      console.log(`User already exists: ${u.user_name}`);
    } else {
      console.log(`Seeded: ${data.email_address}`);
    }
  }

  console.log("Done seeding users.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });