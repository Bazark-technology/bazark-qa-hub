import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding chat channels...");

  await prisma.chatChannel.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      name: "General",
      slug: "general",
      type: "GENERAL",
      description: "Main agent communication channel",
    },
  });

  await prisma.chatChannel.upsert({
    where: { slug: "qa-reports" },
    update: {},
    create: {
      name: "QA Reports",
      slug: "qa-reports",
      type: "QA_REPORTS",
      description: "QA test results and bug reports",
    },
  });

  await prisma.chatChannel.upsert({
    where: { slug: "dev-tasks" },
    update: {},
    create: {
      name: "Dev Tasks",
      slug: "dev-tasks",
      type: "DEV_TASKS",
      description: "Development tasks and PR updates",
    },
  });

  console.log("Chat channels seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding chat channels:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
