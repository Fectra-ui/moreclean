import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BedanktPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pt-28 pb-24 text-white flex items-center justify-center">
        <div className="glass shadow-premium max-w-2xl rounded-3xl p-10 text-center">
          <CheckCircle2 className="mx-auto text-green-400" size={64} />
          <h1 className="mt-6 text-4xl font-bold">
            Bedankt voor uw aanvraag
          </h1>
          <p className="mt-4 text-white/75">
            We hebben uw bericht goed ontvangen en nemen zo snel mogelijk contact met u op.
          </p>

          <Link
            href="/"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-6 py-4 font-semibold"
          >
            Terug naar home
          </Link>
        </div>
      </main>
    </>
  );
}