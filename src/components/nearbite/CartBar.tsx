import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface CartBarProps {
  itemCount: number;
  total: number;
  onPlaceOrder: () => void;
}

const CartBar = ({ itemCount, total, onPlaceOrder }: CartBarProps) => (
  <motion.div
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="fixed bottom-[76px] left-4 right-4 z-40 bg-primary rounded-2xl p-3.5 shadow-lg flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
        <ShoppingBag className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="text-sm font-bold text-primary-foreground">
          {itemCount} item{itemCount > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-primary-foreground/75">₹{total}</p>
      </div>
    </div>
    <button
      onClick={onPlaceOrder}
      className="bg-primary-foreground text-primary rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all active:scale-95 hover:shadow-md"
    >
      Place Order
    </button>
  </motion.div>
);

export default CartBar;
