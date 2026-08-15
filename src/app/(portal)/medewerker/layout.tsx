import { requireEmployee } from "@/lib/auth/requireAdmin";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  await requireEmployee();
  return children;
}
