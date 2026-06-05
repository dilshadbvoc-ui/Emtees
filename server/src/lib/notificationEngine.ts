import { getDb } from "../queries/connection";
import { notifications } from "@db/schema";

export async function sendNotification(
  userId: number,
  title: string,
  message: string,
  type: string,
  data?: unknown
) {
  const db = getDb();
  await db
    .insert(notifications)
    .values({ userId, title, message, type, data: data ?? null });
}

export async function sendBulkNotification(
  userIds: number[],
  title: string,
  message: string,
  type: string,
  data?: unknown
) {
  if (userIds.length === 0) return;
  const db = getDb();
  await db
    .insert(notifications)
    .values(
      userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        data: data ?? null,
      }))
    );
}

export async function getAdminUserIds(): Promise<number[]> {
  const db = getDb();
  const admins = await db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.role, ["super_admin", "admin"]),
    columns: { id: true },
  });
  return admins.map(a => a.id);
}
