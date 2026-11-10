import "./globals.css";
export const metadata = {
  title: "MASTER SHEETS",
  description: "বাংলা স্প্রেডশিট — অফলাইনে কাজ করুন",
  manifest: "/manifest.json"
};
export const viewport = { themeColor: "#176b50", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="bn"><body>{children}</body></html>;
}