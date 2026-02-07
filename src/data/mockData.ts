import burgerImg from "@/assets/food-burger.jpg";
import pizzaImg from "@/assets/food-pizza.jpg";
import biryaniImg from "@/assets/food-biryani.jpg";
import noodlesImg from "@/assets/food-noodles.jpg";
import dessertImg from "@/assets/food-dessert.jpg";
import drinksImg from "@/assets/food-drinks.jpg";
import restaurant1 from "@/assets/restaurant-1.jpg";
import restaurant2 from "@/assets/restaurant-2.jpg";
import restaurant3 from "@/assets/restaurant-3.jpg";

export interface FoodCategory {
  id: string;
  name: string;
  image: string;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisines: string[];
  location: string;
  distance: string;
  priceForTwo: number;
  offer?: string;
}

export const foodCategories: FoodCategory[] = [
  { id: "burgers", name: "Burgers", image: burgerImg },
  { id: "pizza", name: "Pizza", image: pizzaImg },
  { id: "biryani", name: "Biryani", image: biryaniImg },
  { id: "chinese", name: "Chinese", image: noodlesImg },
  { id: "desserts", name: "Desserts", image: dessertImg },
  { id: "drinks", name: "Drinks", image: drinksImg },
];

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "The Burger Barn",
    image: restaurant1,
    rating: 4.3,
    cuisines: ["Burgers", "American", "Fast Food"],
    location: "MG Road",
    distance: "1.2 km",
    priceForTwo: 300,
    offer: "20% OFF up to ₹100",
  },
  {
    id: "2",
    name: "Pizza Paradise",
    image: restaurant2,
    rating: 4.5,
    cuisines: ["Pizza", "Italian", "Pasta"],
    location: "Brigade Road",
    distance: "0.8 km",
    priceForTwo: 450,
  },
  {
    id: "3",
    name: "Biryani House",
    image: restaurant3,
    rating: 4.7,
    cuisines: ["Biryani", "Mughlai", "Kebabs"],
    location: "Koramangala",
    distance: "2.1 km",
    priceForTwo: 350,
    offer: "Free drink with every order",
  },
  {
    id: "4",
    name: "Dragon Wok",
    image: restaurant1,
    rating: 4.1,
    cuisines: ["Chinese", "Asian", "Noodles"],
    location: "Indiranagar",
    distance: "1.5 km",
    priceForTwo: 400,
  },
  {
    id: "5",
    name: "Sweet Spot Bakery",
    image: restaurant2,
    rating: 4.6,
    cuisines: ["Desserts", "Bakery", "Cakes"],
    location: "HSR Layout",
    distance: "0.5 km",
    priceForTwo: 200,
    offer: "Buy 2 Get 1 Free",
  },
];
