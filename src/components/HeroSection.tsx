import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-abstract.jpg";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="font-body text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Crafted with care
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6">
            Design that
            <br />
            <span className="text-primary">speaks.</span>
          </h1>
          <p className="font-body text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
            We build beautiful digital experiences that connect people with brands they love. Simple, elegant, unforgettable.
          </p>
          <div className="flex gap-4">
            <Button variant="hero" size="lg" className="px-8 py-6">
              Start Building
            </Button>
            <Button variant="heroOutline" size="lg" className="px-8 py-6">
              Learn More
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src={heroImage}
              alt="Abstract warm-toned geometric art"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
