import { prisma } from "../db.js";

export async function getUserHouseholdId(userId: string): Promise<string | null> {
  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    select: { householdId: true },
  });
  return membership?.householdId ?? null;
}

export async function getHouseholdMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    include: { user: { select: { id: true, name: true, assistantName: true } } },
  });
}

export async function isHouseholdMember(userId: string, householdId: string): Promise<boolean> {
  const m = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
  });
  return !!m;
}

export async function provisionHousehold(userId: string): Promise<string> {
  const existing = await prisma.household.findFirst({ where: { createdBy: userId } });
  if (existing) {
    // Ensure user is a member
    await prisma.householdMember.upsert({
      where: { householdId_userId: { householdId: existing.id, userId } },
      update: {},
      create: { householdId: existing.id, userId, role: "owner" },
    });
    return existing.id;
  }
  const household = await prisma.household.create({
    data: { createdBy: userId, members: { create: { userId, role: "owner" } } },
  });
  return household.id;
}

export async function joinHousehold(userId: string): Promise<void> {
  // On a single-family instance there is exactly one household
  const household = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  if (!household) return;
  await prisma.householdMember.upsert({
    where: { householdId_userId: { householdId: household.id, userId } },
    update: {},
    create: { householdId: household.id, userId, role: "member" },
  });
}
