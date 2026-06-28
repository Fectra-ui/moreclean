import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Beheer | More Clean",
  description: "Interne beheerpagina voor het aanmaken van blogposts.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
