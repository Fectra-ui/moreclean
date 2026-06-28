import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/types/blog";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function BlogCard({ post, featured }: BlogCardProps) {
  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="glass rounded-[32px] overflow-hidden lg:grid lg:grid-cols-2">
          {/* Image */}
          <div className="relative h-64 lg:h-full min-h-[320px]">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent lg:from-transparent lg:to-white/10" />
          </div>

          {/* Content */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <span className="inline-block rounded-full bg-[#E8EDF3] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA] mb-4 w-fit">
              {post.category}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#101536] leading-tight mb-4 group-hover:text-[#4D7EBA] transition-colors">
              {post.title}
            </h2>
            <p className="text-[#606774] leading-relaxed mb-6 line-clamp-3">
              {post.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-[#606774] mb-6">
              <span>{post.author}</span>
              <span>·</span>
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span>{post.readTime} min lezen</span>
            </div>
            <span className="inline-flex items-center gap-2 text-[#4D7EBA] font-semibold group-hover:gap-3 transition-all">
              Lees verder →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <div className="glass rounded-[32px] overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 flex-shrink-0">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute bottom-3 left-4 rounded-full bg-[#E8EDF3]/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#4D7EBA] backdrop-blur-sm">
            {post.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-[#101536] leading-snug mb-3 group-hover:text-[#4D7EBA] transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-[#606774] text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
            {post.description}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5">
            <span className="text-xs text-[#606774]">{post.readTime} min lezen</span>
            <span className="text-sm text-[#4D7EBA] font-semibold group-hover:translate-x-1 transition-transform inline-block">
              Lees verder →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
