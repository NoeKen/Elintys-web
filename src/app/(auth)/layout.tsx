import { AuthRouteGuard } from "@/shared/guards/AuthRouteGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthRouteGuard>{children}</AuthRouteGuard>;
}
