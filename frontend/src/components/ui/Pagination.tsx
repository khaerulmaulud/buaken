import React from "react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-10 h-10 rounded-xl glass-card border-white/10 text-slate-300 hover:text-white hover:border-[#FF8C00]/50 hover:bg-white/5 transition-all"
      >
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </Button>

      {getPageNumbers().map((page, index) => (
        <React.Fragment key={`${page}-${index}`}>
          {page === "..." ? (
            <span className="px-2 text-slate-500 font-bold tracking-widest">
              ...
            </span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                currentPage === page
                  ? "bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20 hover:bg-[#e07b00] border-transparent"
                  : "glass-card border-white/10 text-slate-300 hover:text-white hover:border-[#FF8C00]/50 hover:bg-white/5"
              }`}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-10 h-10 rounded-xl glass-card border-white/10 text-slate-300 hover:text-white hover:border-[#FF8C00]/50 hover:bg-white/5 transition-all"
      >
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </Button>
    </div>
  );
}
