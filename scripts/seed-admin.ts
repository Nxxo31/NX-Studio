// Seed de administrador — crea (o promueve) un usuario con rol de equipo.
//
// POR QUÉ EXISTE: el signup de better-auth deja role='cliente' por defecto y
// no había ninguna forma de crear el primer admin. adminGuard exige un rol
// de [admin, gatekeeper, designer, dev] → con la DB vacía, /admin daba 403 a
// todo el mundo y nadie podía entrar. Este script es ese camino.
//
// Uso:
//   npm run seed:admin -- --email=tu@email.com --password=TuPassword123
//   npm run seed:admin -- --email=tu@email.com --password=... --target=remote
//
// El password se hashea con el MISMO algoritmo que better-auth (scrypt vía
// better-auth/crypto), así que el login funciona sin cambios.
//
// Flags:
//   --email      (obligatorio) email del admin
//   --password   (obligatorio) contraseña (mín. 8 chars)
//   --name       nombre a mostrar (default: "Sebastian")
//   --target     local | remote  (default: local)
//   --role       admin | gatekeeper | designer | dev  (default: admin)

import { hashPassword } from 'better-auth/crypto';
import { execute } from './d1-exec';

type Args = {
  email: string;
  password: string;
  name: string;
  target: 'local' | 'remote';
  role: 'admin' | 'gatekeeper' | 'designer' | 'dev';
};

function parseArgs(argv: string[]): Args {
  const get = (name: string): string | undefined => {
    const prefijo = `--${name}=`;
    const hit = argv.find((a) => a.startsWith(prefijo));
    return hit ? hit.slice(prefijo.length) : undefined;
  };

  const email = get('email');
  const password = get('password');
  if (!email || !password) {
    console.error(
      'Uso: npm run seed:admin -- --email=tu@email.com --password=TuPassword123 [--target=remote] [--role=admin]'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const target = get('target') === 'remote' ? 'remote' : 'local';
  const roleRaw = get('role') ?? 'admin';
  const roles = ['admin', 'gatekeeper', 'designer', 'dev'] as const;
  const role = (roles as readonly string[]).includes(roleRaw)
    ? (roleRaw as Args['role'])
    : 'admin';

  return {
    email: email.toLowerCase().trim(),
    password,
    name: get('name') ?? 'Sebastian',
    target,
    role,
  };
}

function esc(val: string): string {
  return val.replace(/'/g, "''");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log(`[seed:admin] objetivo=${args.target} email=${args.email} rol=${args.role}`);

  const hash = await hashPassword(args.password);
  const now = Date.now();

  // 1) ¿Existe el usuario?
  const existing = await execute(
    args.target,
    `SELECT id, role FROM user WHERE email = '${esc(args.email)}' LIMIT 1`
  );
  const fila = existing[0];

  if (fila) {
    // 2) Promover a admin: actualizamos rol y la contraseña (para que el
    //    operador pueda entrar con la que acabamos de definir).
    const accountId = `acc-${args.email}`;
    await execute(
      args.target,
      `UPDATE user SET role = '${args.role}', name = '${esc(args.name)}', updated_at = ${now} WHERE email = '${esc(args.email)}'`
    );
    await execute(
      args.target,
      `UPDATE account SET password = '${esc(hash)}', updated_at = ${now}
       WHERE user_id = '${esc(String(fila.id))}' AND provider_id = 'credential'`
    );
    console.log(`[seed:admin] usuario existente -> rol '${args.role}' y contraseña actualizada.`);
  } else {
    // 3) Crear usuario + cuenta de credenciales.
    const userId = crypto.randomUUID();
    const accountId = `acc-${args.email}`;
    await execute(
      args.target,
      `INSERT INTO user (id, name, email, email_verified, image, role, empresa, telefono, pais, created_at, updated_at)
       VALUES ('${esc(userId)}', '${esc(args.name)}', '${esc(args.email)}', 1, NULL, '${args.role}', NULL, NULL, NULL, ${now}, ${now})`
    );
    await execute(
      args.target,
      `INSERT INTO account (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at)
       VALUES ('${esc(accountId)}', '${esc(userId)}', 'credential', '${esc(userId)}', NULL, NULL, NULL, NULL, NULL, NULL, '${esc(hash)}', ${now}, ${now})`
    );
    console.log(`[seed:admin] usuario creado con rol '${args.role}'.`);
  }

  // 4) Verificación.
  const check = await execute(
    args.target,
    `SELECT u.email, u.role, COUNT(a.id) AS cuentas
     FROM user u LEFT JOIN account a ON a.user_id = u.id
     WHERE u.email = '${esc(args.email)}' GROUP BY u.email, u.role`
  );
  console.log('[seed:admin] verificación:', JSON.stringify(check[0] ?? null));
  console.log('[seed:admin] listo. Entra en /admin/login con ese email y contraseña.');
}

main().catch((err) => {
  console.error('[seed:admin] error:', err);
  process.exit(1);
});
