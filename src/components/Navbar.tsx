import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <span className="font-display text-xl font-bold text-foreground tracking-tight">Artisan</span>
        <div className="hidden md:flex items-center gap-8 font-body text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#about" className="hover:text-foreground transition-colors">About</a>
          <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
        </div>
        <Button variant="hero" size="sm" className="rounded-full px-5">
          Get Started
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
