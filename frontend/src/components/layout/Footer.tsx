"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on specific pages
  if (pathname === "/orders") {
    return null;
  }

  return (
    <footer className="bg-[#0f0f0f] border-t border-white/10 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo
              className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity w-fit cursor-pointer"
              iconContainerClassName="w-8 h-8 bg-gradient-to-br from-[#FF8C00] to-[#e07b00] rounded-lg flex items-center justify-center shadow-lg"
              iconClassName="text-white text-sm font-bold"
              textClassName="text-xl font-black tracking-tight text-white uppercase italic"
              imageSize={32}
            />
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Premium food delivery platform. Bringing the best gourmet
              experiences right to your doorstep with speed and elegance.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#FF8C00] transition-all duration-300"
              >
                <span className="material-symbols-outlined text-lg">
                  public
                </span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#FF8C00] transition-all duration-300"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#242424] flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#FF8C00] transition-all duration-300"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-white font-bold mb-6 tracking-wide">Company</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Press
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Sustainability
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h5 className="text-white font-bold mb-6 tracking-wide">Support</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/complaints"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Complaints
                </Link>
              </li>
            </ul>
          </div>

          {/* Become a Partner */}
          <div>
            <h5 className="text-white font-bold mb-6 tracking-wide">
              Become a Partner
            </h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Add your restaurant
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Sign up to deliver
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="hover:text-[#FF8C00] hover:translate-x-1 inline-block transition-all"
                >
                  Corporate accounts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-600 text-xs font-medium">
            © 2026 FoodDash Premium. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                language
              </span>
              English (US)
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                payments
              </span>
              IDR
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
