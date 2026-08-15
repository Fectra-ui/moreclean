import type { Metadata } from "next";
import BlogManager from "./BlogManager";
export const metadata: Metadata = { title: "Blogbeheer" };
export default function Page() { return <BlogManager />; }
