import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedUserPassword = await bcrypt.hash("asd12345", 10);
  const hashedAdminPassword = await bcrypt.hash("admin", 10);

  // Create a test user
  const testUser = await prisma.User.create({
    data: {
      user_name: "testuser",
      first_name: "Test",
      last_name: "User",
      email_address: "testuser@example.com",
      email_verified: true,
      password_hash: hashedUserPassword,
      password_changed_at: new Date(),
      two_factor_enabled: false,
      two_factor_method: null,
      two_factor_secret: null,
      two_factor_backup: [],
      role: "user",
      status: "active",
      account_created_at: new Date(),
      last_login_at: new Date(),
      preferences: {
        theme: "dark",
        notifications: true,
      },
    },
  });

  const testAdmin = await prisma.User.create({
    data: {
      user_name: "testadmin",
      first_name: "Test",
      last_name: "Admin",
      email_address: "testadmin@example.com",
      email_verified: true,
      password_hash: hashedAdminPassword,
      password_changed_at: new Date(),
      two_factor_enabled: false,
      two_factor_method: null,
      two_factor_secret: null,
      two_factor_backup: [],
      role: "admin",
      status: "active",
      account_created_at: new Date(),
      last_login_at: new Date(),
      preferences: {
        theme: "dark",
        notifications: true,
      },
    },
  });

  console.log(
    `Test user created: ${testUser.email_address}\nTest admin created: ${testAdmin.email_address}`
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
