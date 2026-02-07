import RestaurantCard from "./RestaurantCard";
import type { Restaurant } from "@/data/mockData";

interface RestaurantListProps {
  restaurants: Restaurant[];
}

const RestaurantList = ({ restaurants }: RestaurantListProps) => (
  <div className="px-4 space-y-4 pb-4">
    <h2 className="text-base font-extrabold font-display text-foreground">
      Restaurants near you
    </h2>
    {restaurants.map((restaurant, index) => (
      <div
        key={restaurant.id}
        className="animate-slide-up"
        style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
      >
        <RestaurantCard {...restaurant} />
      </div>
    ))}
  </div>
);

export default RestaurantList;
