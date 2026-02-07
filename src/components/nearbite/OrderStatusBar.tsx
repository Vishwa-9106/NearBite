import { Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface OrderStatusBarProps {
  restaurantName: string;
  status: string;
  estimatedTime: string;
}

const OrderStatusBar = ({
  restaurantName,
  status,
  estimatedTime,
}: OrderStatusBarProps) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="mx-4 mb-4 p-3.5 rounded-2xl bg-brand-warm border border-accent/30 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{status}</p>
          <p className="text-xs text-muted-foreground">
            {restaurantName} • {estimatedTime}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  </motion.div>
);

export default OrderStatusBar;
