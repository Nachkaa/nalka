import { Inter, Lora } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Lora supporte ces graisses
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
