import { Home, Search, User } from "lucide-react";
import { useState } from "react";

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "search", icon: Search, label: "Search" },
  { id: "profile", icon: User, label: "Profile" },
];

const BottomNav = () => {
  const [active, setActive] = useState("home");

  return (
    <nav className="fixed bottom-3 left-4 right-4 z-50">
      <div className="bg-foreground/95 backdrop-blur-md rounded-full px-2 py-2 flex items-center justify-around shadow-xl">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-1.5 py-2 px-5 rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-primary-foreground text-foreground"
                  : "text-primary-foreground/60"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isActive && (
                <span className="text-xs font-extrabold">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
