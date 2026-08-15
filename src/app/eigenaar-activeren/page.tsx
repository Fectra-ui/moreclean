import type { Metadata } from "next";
import OwnerActivationForm from "./OwnerActivationForm";

export const metadata: Metadata = {
  title: "Eigenaaraccount activeren",
  robots: { index: false, follow: false },
};

export default function OwnerActivationPage() {
  return <OwnerActivationForm />;
}
