export type BlogCategory = "Glasbewassing" | "Zonnepanelen" | "Schoonmaak" | "Bedrijven";

export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string; // HTML string
  category: BlogCategory;
  image: string;
  author: string;
  date: string; // ISO "2026-06-01"
  readTime: number; // minutes
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  faq?: FAQ[];
  related?: string[]; // slugs
}
