"use client";

export default function BlogError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-32 text-center">
      <h1 className="text-3xl font-bold text-[#101536]">Blog tijdelijk niet beschikbaar</h1>
      <p className="mt-4 text-[#606774]">De artikelen kunnen nu niet worden geladen. Probeer het later opnieuw.</p>
      <button type="button" onClick={retry} className="mt-8 btn-primary">Opnieuw proberen</button>
    </main>
  );
}
