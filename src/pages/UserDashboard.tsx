import { useState, useEffect } from "react";
import Header from "@/components/nearbite/Header";
import SearchFilterBar from "@/components/nearbite/SearchFilterBar";
import OrderStatusBar from "@/components/nearbite/OrderStatusBar";
import FoodCategories from "@/components/nearbite/FoodCategories";
import RestaurantList from "@/components/nearbite/RestaurantList";
import CartBar from "@/components/nearbite/CartBar";
import BottomNav from "@/components/nearbite/BottomNav";
import {
  CategorySkeleton,
  RestaurantSkeleton,
} from "@/components/nearbite/SkeletonLoaders";
import { foodCategories, restaurants } from "@/data/mockData";

const UserDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredRestaurants = selectedCategory
    ? restaurants.filter((r) =>
        r.cuisines.some((c) =>
          c.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      )
    : restaurants;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchFilterBar />

      <main className="pt-[112px] pb-36">
        {/* Active Order Status */}
        <div className="mt-2">
          <OrderStatusBar
            restaurantName="Biryani House"
            status="Preparing your order"
            estimatedTime="15 min"
          />
        </div>

        {/* Food Categories */}
        {isLoading ? (
          <div className="mb-5">
            <div className="px-4 mb-3">
              <div className="h-5 w-40 bg-muted rounded-full animate-pulse" />
            </div>
            <CategorySkeleton />
          </div>
        ) : (
          <FoodCategories
            categories={foodCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}

        {/* Restaurant Listings */}
        {isLoading ? (
          <div>
            <div className="px-4 mb-3">
              <div className="h-5 w-48 bg-muted rounded-full animate-pulse" />
            </div>
            <RestaurantSkeleton />
          </div>
        ) : (
          <RestaurantList restaurants={filteredRestaurants} />
        )}
      </main>

      {/* Cart Bar */}
      <CartBar itemCount={2} total={350} onPlaceOrder={() => {}} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default UserDashboard;
