import { Star, MapPin } from "lucide-react";

interface RestaurantCardProps {
  name: string;
  image: string;
  rating: number;
  cuisines: string[];
  location: string;
  distance: string;
  priceForTwo: number;
  offer?: string;
  onClick?: () => void;
}

const RestaurantCard = ({
  name,
  image,
  rating,
  cuisines,
  location,
  distance,
  priceForTwo,
  offer,
  onClick,
}: RestaurantCardProps) => (
  <button
    onClick={onClick}
    className="w-full bg-card rounded-3xl overflow-hidden shadow-sm border border-border/50 transition-all hover:shadow-md active:scale-[0.98] text-left animate-fade-in"
  >
    <div className="relative">
      <img
        src={image}
        alt={name}
        className="w-full h-40 object-cover"
        loading="lazy"
      />
      <div className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
        <Star className="w-3.5 h-3.5 text-star fill-star" />
        <span className="text-xs font-extrabold text-foreground">{rating}</span>
      </div>
      {offer && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent px-3 py-2.5">
          <span className="text-xs font-bold text-primary-foreground">
            {offer}
          </span>
        </div>
      )}
    </div>
    <div className="p-3.5">
      <h3 className="font-display font-extrabold text-[15px] text-foreground mb-1">
        {name}
      </h3>
      <p className="text-xs text-muted-foreground mb-2.5">
        {cuisines.join(" • ")}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{distance}</span>
          <span className="mx-0.5">•</span>
          <span>{location}</span>
        </div>
        <span className="text-xs font-bold text-foreground">
          ₹{priceForTwo} for two
        </span>
      </div>
    </div>
  </button>
);

export default RestaurantCard;
