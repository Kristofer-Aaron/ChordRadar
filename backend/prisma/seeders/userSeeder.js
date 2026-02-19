import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

async function main() {
  // Read users from a fixed JSON file next to this script
  const filePath = path.join(__dirname, "../data", "users.json");
  const raw = await fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(raw);

  for (const u of users) {
    const password_hash = await bcrypt.hash(String(u.password), 10);

    // Minimal fields; add/adjust as your schema requires
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
      two_factor_backup: [],
      role: u.role ?? "user",
      status: u.status ?? "active",
      preferences: u.preferences ?? { theme: "dark", notifications: true },
      account_created_at: new Date(),
      last_login_at: new Date(),
    };

    // Idempotent: create or update by unique email
    await prisma.user.upsert({
      where: { email_address: data.email_address },
      update: data,
      create: data,
    });

    console.log(`Seeded: ${data.email_address}`);
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