import { Search, SlidersHorizontal } from "lucide-react";

const SearchFilterBar = () => (
  <div className="fixed top-[57px] left-0 right-0 z-40 bg-background/95 backdrop-blur-sm px-4 py-2.5 border-b border-border/50">
    <div className="flex gap-2.5">
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          placeholder="Search food or restaurants..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>
      <button className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95">
        <SlidersHorizontal className="w-4 h-4 text-primary-foreground" />
      </button>
    </div>
  </div>
);

export default SearchFilterBar;
