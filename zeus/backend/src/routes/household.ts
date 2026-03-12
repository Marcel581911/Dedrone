import { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { getUserHouseholdId, getHouseholdMembers } from "../services/household.js";

export async function householdRoutes(app: FastifyInstance) {
  app.get("/api/household", async (req) => {
    const householdId = await getUserHouseholdId(req.userId);
    if (!householdId) return { household: null, members: [] };
    const [household, members] = await Promise.all([
      prisma.household.findUnique({ where: { id: householdId } }),
      getHouseholdMembers(householdId),
    ]);
    return { household, members: members.map((m) => ({ id: m.user.id, name: m.user.name, assistantName: m.user.assistantName, role: m.role })) };
  });

  app.patch("/api/household", async (req) => {
    const householdId = await getUserHouseholdId(req.userId);
    if (!householdId) return { error: "No household" };
    const { name } = req.body as { name?: string };
    if (name) await prisma.household.update({ where: { id: householdId }, data: { name } });
    return { success: true };
  });
}
