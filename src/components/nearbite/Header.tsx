import logo from "@/assets/nearbite_logo.jpg";
import { User } from "lucide-react";

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <img
          src={logo}
          alt="NearBite"
          className="w-10 h-10 rounded-full object-cover shadow-sm"
        />
        <div className="leading-tight">
          <h1 className="font-display font-extrabold text-base text-foreground">
            NearBite
          </h1>
          <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase">
            Just Pickup
          </span>
        </div>
      </div>
      <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center transition-all hover:bg-accent active:scale-95">
        <User className="w-4 h-4 text-secondary-foreground" />
      </button>
    </div>
  </header>
);

export default Header;
