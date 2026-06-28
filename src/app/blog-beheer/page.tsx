"use client";

import { useState } from "react";
import type { BlogCategory, FAQ } from "@/types/blog";

const CATEGORIES: BlogCategory[] = [
  "Glasbewassing",
  "Zonnepanelen",
  "Schoonmaak",
  "Bedrijven",
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState<BlogCategory>("Glasbewassing");
  const [author, setAuthor] = useState("More Clean");
  const [date, setDate] = useState(today());
  const [readTime, setReadTime] = useState(4);
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState("");
  const [content, setContent] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [related, setRelated] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }

  function removeFaq(i: number) {
    setFaqs(faqs.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, field: "question" | "answer", value: string) {
    setFaqs(faqs.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }

  function generate() {
    const slug = slugify(title);
    const kws = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const relatedSlugs = related
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const validFaqs = faqs.filter((f) => f.question && f.answer);

    const obj = {
      slug,
      title,
      description,
      category,
      image: image || "/images/hero-bg.jpg",
      author,
      date,
      readTime: Number(readTime),
      ...(featured ? { featured: true } : {}),
      ...(seoTitle ? { seoTitle } : {}),
      ...(seoDescription ? { seoDescription } : {}),
      ...(kws.length > 0 ? { keywords: kws } : {}),
      content: content,
      ...(validFaqs.length > 0 ? { faq: validFaqs } : {}),
      ...(relatedSlugs.length > 0 ? { related: relatedSlugs } : {}),
    };

    const lines: string[] = ["{"];
    for (const [key, val] of Object.entries(obj)) {
      if (key === "content") {
        lines.push(`  content: \`${String(val).replace(/`/g, "\\`")}\`,`);
      } else if (key === "faq" && Array.isArray(val)) {
        lines.push("  faq: [");
        for (const item of val as FAQ[]) {
          lines.push("    {");
          lines.push(`      question: ${JSON.stringify(item.question)},`);
          lines.push(`      answer: ${JSON.stringify(item.answer)},`);
          lines.push("    },");
        }
        lines.push("  ],");
      } else {
        lines.push(`  ${key}: ${JSON.stringify(val)},`);
      }
    }
    lines.push("}");

    setOutput(lines.join("\n"));
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputClass =
    "w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-[#121212] placeholder-[#CACED3] focus:outline-none focus:ring-2 focus:ring-[#4D7EBA]/30 transition";
  const labelClass = "block text-xs font-bold uppercase tracking-[0.15em] text-[#4D7EBA] mb-2";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[160px] text-[#121212]">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA]">
            Beheer
          </span>
          <h1 className="mt-6 text-4xl font-bold text-[#101536]">Blog Beheer</h1>
          <p className="mt-3 text-[#606774]">
            Vul het formulier in en kopieer het gegenereerde object naar{" "}
            <code className="text-xs bg-[#E8EDF3] px-2 py-1 rounded font-mono text-[#4D7EBA]">
              src/data/blog.ts
            </code>
          </p>
        </div>

        <div className="glass rounded-[32px] p-8 space-y-6">
          {/* Title */}
          <div>
            <label className={labelClass}>Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Waarom regelmatige glasbewassing zo belangrijk is"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Beschrijving *</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Korte samenvatting van het artikel (1-2 zinnen)"
              className={inputClass}
            />
          </div>

          {/* SEO Title */}
          <div>
            <label className={labelClass}>SEO Titel (optioneel)</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Laat leeg om blogtitel te gebruiken"
              className={inputClass}
            />
          </div>

          {/* SEO Description */}
          <div>
            <label className={labelClass}>SEO Beschrijving (optioneel)</label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Laat leeg om beschrijving te gebruiken"
              className={inputClass}
            />
          </div>

          {/* Keywords */}
          <div>
            <label className={labelClass}>Keywords (kommagescheiden)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="glasbewassing, ramen wassen, glazenwasser Roermond"
              className={inputClass}
            />
          </div>

          {/* Category + Author row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categorie *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Auteur</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Date + ReadTime row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Leestijd (minuten)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Image + Featured row */}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <div>
              <label className={labelClass}>Afbeelding pad</label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/blog/mijn-afbeelding.jpg"
                className={inputClass}
              />
            </div>
            <div className="pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#4D7EBA]"
                />
                <span className="text-sm font-semibold text-[#101536]">Uitgelicht</span>
              </label>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className={labelClass}>Content (HTML)</label>
            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>Introductie</h2>&#10;<p>Uw inhoud hier...</p>"
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={labelClass + " mb-0"}>FAQ vragen</label>
              <button
                type="button"
                onClick={addFaq}
                className="text-xs font-bold text-[#4D7EBA] hover:text-[#101536] transition-colors flex items-center gap-1"
              >
                + Vraag toevoegen
              </button>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-black/10 bg-white/50 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-[#606774]">
                      Vraag {i + 1}
                    </span>
                    {faqs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Verwijder
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Vraag..."
                    className={inputClass}
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    placeholder="Antwoord..."
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Related slugs */}
          <div>
            <label className={labelClass}>Gerelateerde slugs (kommagescheiden)</label>
            <input
              type="text"
              value={related}
              onChange={(e) => setRelated(e.target.value)}
              placeholder="waarom-regelmatige-glasbewassing-belangrijk-is, rendement-verlies-vuile-zonnepanelen"
              className={inputClass}
            />
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={!title || !description}
            className="w-full btn-premium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Genereer blogpost object
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="mt-8 glass rounded-[32px] p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-[#101536]">
                Gegenereerd object — kopieer naar{" "}
                <code className="text-xs bg-[#E8EDF3] px-2 py-1 rounded font-mono text-[#4D7EBA]">
                  src/data/blog.ts
                </code>
              </p>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-[#E8EDF3] text-[#4D7EBA] hover:bg-[#D8E2EC]"
                }`}
              >
                {copied ? "Gekopieerd!" : "Kopieer"}
              </button>
            </div>
            <pre className="text-xs font-mono text-[#606774] overflow-auto max-h-96 bg-white/50 rounded-2xl p-4 whitespace-pre-wrap">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
