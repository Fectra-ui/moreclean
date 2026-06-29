import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileCTA from "@/components/MobileCTA";
import NavOffset from "@/components/NavOffset";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <NavOffset />
        {children}
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
