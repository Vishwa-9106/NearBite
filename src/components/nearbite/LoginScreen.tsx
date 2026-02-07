import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/nearbite_logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const LoginScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("123456");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const goToStep = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="mb-8"
      >
        <img
          src={logo}
          alt="NearBite"
          className="w-28 h-28 rounded-3xl object-contain shadow-lg"
        />
      </motion.div>

      {/* Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm space-y-5 text-center"
          >
            <div>
              <h2 className="text-2xl font-extrabold font-display text-foreground">
                Welcome to NearBite
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your mobile number to continue
              </p>
            </div>

            <div className="flex gap-2">
              <div className="bg-card border border-border rounded-2xl px-3.5 py-3 text-sm font-bold text-foreground flex items-center">
                +91
              </div>
              <Input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="rounded-2xl py-3 text-base font-medium"
              />
            </div>

            <Button
              onClick={() => goToStep(2)}
              className="w-full rounded-2xl py-6 text-base font-extrabold"
              disabled={phone.length < 10}
            >
              Get OTP
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm space-y-5 text-center"
          >
            <div>
              <h2 className="text-2xl font-extrabold font-display text-foreground">
                Verify OTP
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a code to +91 {phone}
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="rounded-xl w-11 h-12 text-lg font-bold border-border"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={() => goToStep(3)}
              className="w-full rounded-2xl py-6 text-base font-extrabold"
              disabled={otp.length < 6}
            >
              Verify
            </Button>

            <button
              onClick={() => goToStep(1)}
              className="text-sm text-primary font-semibold hover:underline"
            >
              Change number
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm space-y-5 text-center"
          >
            <div>
              <h2 className="text-2xl font-extrabold font-display text-foreground">
                Almost there! 🎉
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us a bit about yourself
              </p>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Your name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl py-3 text-base font-medium"
              />
              <Input
                placeholder="Email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl py-3 text-base font-medium"
                type="email"
              />
            </div>

            <Button
              onClick={() => navigate("/user-dashboard")}
              className="w-full rounded-2xl py-6 text-base font-extrabold"
              disabled={!name.trim()}
            >
              Let's Go! 🚀
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div className="flex gap-2 mt-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step
                ? "w-6 bg-primary"
                : s < step
                ? "w-1.5 bg-primary/40"
                : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginScreen;
