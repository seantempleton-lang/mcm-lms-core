export function buildUsernameFromName(name = '') {
  const compact = String(name)
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '');

  return compact || 'User';
}

export async function generateUniqueUsername(prisma, name, excludeUserId) {
  const base = buildUsernameFromName(name);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.user.findFirst({
      where: {
        username: candidate,
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;

    suffix += 1;
    candidate = `${base}${suffix}`;
  }
}
