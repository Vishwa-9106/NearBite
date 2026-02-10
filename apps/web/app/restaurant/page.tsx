import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE = "auth_token";
const AUTH_ROLE_COOKIE = "auth_role";

export default function RestaurantPage() {
  const cookieStore = cookies();
  const isAuthenticated = Boolean(cookieStore.get(AUTH_COOKIE)?.value);
  const role = cookieStore.get(AUTH_ROLE_COOKIE)?.value;

  if (isAuthenticated && role === "restaurant") {
    redirect("/restaurant/dashboard");
  }

  redirect("/restaurant/login");
}
