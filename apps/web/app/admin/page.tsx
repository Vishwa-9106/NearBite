import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE = "auth_token";
const AUTH_ROLE_COOKIE = "auth_role";

export default function AdminPage() {
  const cookieStore = cookies();
  const isAuthenticated = Boolean(cookieStore.get(AUTH_COOKIE)?.value);
  const role = cookieStore.get(AUTH_ROLE_COOKIE)?.value;

  if (!isAuthenticated || role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Admin Website</h1>
      <p className="mt-2 text-slate-600">Operations and management panel.</p>
    </main>
  );
}
