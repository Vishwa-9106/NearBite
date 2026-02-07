import type { FoodCategory } from "@/data/mockData";

interface FoodCategoriesProps {
  categories: FoodCategory[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

const FoodCategories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: FoodCategoriesProps) => (
  <div className="mb-5">
    <h2 className="px-4 mb-3 text-base font-extrabold font-display text-foreground">
      What are you craving?
    </h2>
    <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(isActive ? null : cat.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
          >
            <div
              className={`w-[68px] h-[68px] rounded-full overflow-hidden border-[2.5px] transition-all shadow-sm ${
                isActive
                  ? "border-primary shadow-md scale-105"
                  : "border-card"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-[11px] font-bold transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default FoodCategories;
