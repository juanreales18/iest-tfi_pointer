// Re-Kiosco · crear-usuario
// Crea un usuario (Auth + perfil) y solo puede usarlo el dueño.
// La clave de servicio (service_role) vive acá, en el servidor; nunca llega al navegador.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // 1) Quien llama debe estar autenticado
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !auth?.user) return json({ error: "No autorizado" }, 401);

  // 2) ...y ser un dueño activo
  const { data: caller } = await admin
    .from("usuarios")
    .select("id, activo, deleted_at, roles(nombre)")
    .eq("id", auth.user.id)
    .maybeSingle();
  // deno-lint-ignore no-explicit-any
  const callerRol = (caller as any)?.roles?.nombre;
  if (!caller || !caller.activo || caller.deleted_at || callerRol !== "dueno") {
    return json({ error: "Solo el dueño puede crear usuarios" }, 403);
  }

  // 3) Validar los datos
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Datos invalidos" }, 400); }

  const nombre = String(body.nombre ?? "").trim();
  const apellido = String(body.apellido ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const rolId = String(body.rol_id ?? "");

  if (!nombre || nombre.length > 100) return json({ error: "Nombre invalido" }, 400);
  if (!apellido || apellido.length > 100) return json({ error: "Apellido invalido" }, 400);
  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: "Email invalido" }, 400);
  if (password.length < 8 || password.length > 72) {
    return json({ error: "La contraseña debe tener entre 8 y 72 caracteres" }, 400);
  }
  if (!UUID_RE.test(rolId)) return json({ error: "Rol invalido" }, 400);

  // Solo se pueden crear dueños y empleados (no el rol de soporte)
  const { data: rol } = await admin.from("roles").select("id, nombre").eq("id", rolId).maybeSingle();
  if (!rol || !["dueno", "empleado"].includes(rol.nombre)) {
    return json({ error: "Rol no permitido" }, 400);
  }

  // 4) Crear en Auth
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    const yaExiste = /already|registered|exists/i.test(createErr?.message ?? "");
    return json(
      { error: yaExiste ? "Ya existe un usuario con ese email" : "No se pudo crear el usuario" },
      yaExiste ? 409 : 400,
    );
  }

  // 5) Crear el perfil; si falla, se deshace el usuario de Auth
  const { error: perfilErr } = await admin.from("usuarios").insert({
    id: created.user.id,
    nombre,
    apellido,
    email,
    rol_id: rolId,
  });
  if (perfilErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: "No se pudo crear el perfil del usuario" }, 400);
  }

  return json({ id: created.user.id, email }, 201);
});
