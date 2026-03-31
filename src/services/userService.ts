import db from "../db";

export async function createOrGetUserByExternalId(userId: string) {
  return db.user.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getUserByExternalId(userId: string) {
  return db.user.findUnique({
    where: { userId },
  });
}

export async function updateUserGender(userId: string, gender: string) {
  const user = await getUserByExternalId(userId);
  if (!user) return;

  await db.user.update({
    where: { userId },
    data: { gender },
  });
}
