const FooterSection = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-display text-lg font-bold text-foreground">Artisan</span>
        <p className="font-body text-sm text-muted-foreground">
          © 2026 Artisan. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
