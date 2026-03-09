const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const {
  BASELINE_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} = require('./seed-data');

const prisma = new PrismaClient();

async function upsertRolesAndPermissions() {
  const roleByCode = new Map();
  const permissionByCode = new Map();

  for (const role of BASELINE_ROLES) {
    const upserted = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
    roleByCode.set(role.code, upserted);
  }

  for (const permission of PERMISSIONS) {
    const upserted = await prisma.permission.upsert({
      where: { code: permission.code },
      update: { name: permission.name },
      create: permission,
    });
    permissionByCode.set(permission.code, upserted);
  }

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleByCode.get(roleCode);
    if (!role) continue;

    for (const permissionCode of permissionCodes) {
      const permission = permissionByCode.get(permissionCode);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  return { roleByCode };
}

async function upsertDefaultAdmin(roleByCode) {
  const adminEmail =
    process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase() ??
    'admin@classivo.local';
  const adminPassword =
    process.env.DEFAULT_ADMIN_PASSWORD?.trim() ?? 'ChangeMe123!';
  const firstName = process.env.DEFAULT_ADMIN_FIRST_NAME?.trim() ?? 'System';
  const lastName = process.env.DEFAULT_ADMIN_LAST_NAME?.trim() ?? 'Admin';
  const saltRounds = Number(process.env.SALT_ROUND) > 0
    ? Number(process.env.SALT_ROUND)
    : 10;

  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      firstName,
      lastName,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      email: adminEmail,
      passwordHash,
      firstName,
      lastName,
      status: 'ACTIVE',
    },
  });

  const superAdminRole = roleByCode.get('SUPER_ADMIN');
  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: admin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: admin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  return admin;
}

async function main() {
  const { roleByCode } = await upsertRolesAndPermissions();
  const admin = await upsertDefaultAdmin(roleByCode);

  console.log('Seed completed successfully.');
  console.log(`Default admin email: ${admin.email}`);
  console.log(
    `Baseline roles seeded: ${BASELINE_ROLES.map((role) => role.code).join(', ')}`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed.', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
