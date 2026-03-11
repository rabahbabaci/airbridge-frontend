import { motion } from "framer-motion";
import { Sparkles, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Thoughtful Design",
    description: "Every pixel is intentional. We obsess over the details so your users don't have to think twice.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Performance isn't an afterthought. Your experience loads instantly, every single time.",
  },
  {
    icon: Shield,
    title: "Built to Last",
    description: "Reliable infrastructure and clean code mean your product scales gracefully with your ambition.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-3">Why us</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            What sets us apart
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-card rounded-2xl p-8 border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="font-body text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
