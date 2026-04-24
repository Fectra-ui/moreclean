import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-white">
      <div className="glass shadow-premium max-w-2xl rounded-3xl p-10 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
          404 Error
        </p>

        <h1 className="mt-4 text-5xl font-bold">Pagina niet gevonden</h1>

        <p className="mt-4 text-white/70">
          De pagina die u zoekt bestaat niet of is verplaatst.
        </p>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold"
        >
          Terug naar home
        </Link>
      </div>
    </main>
  );
}