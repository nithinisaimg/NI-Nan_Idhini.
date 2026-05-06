import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-7 w-7 border border-border flex items-center justify-center">
            <span className="h-1.5 w-1.5 bg-foreground pulse-dot" />
            <span className="absolute -inset-px border border-foreground/20 group-hover:border-foreground/60 transition" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-semibold tracking-[0.3em]">NI</div>
            <div className="text-[10px] text-muted-foreground tracking-widest mt-0.5">NAN IDHINI</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-xs tracking-widest uppercase">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="px-3 py-2 text-muted-foreground hover:text-foreground transition">Home</Link>
          <Link to="/chat" activeProps={{ className: "text-foreground" }} className="px-3 py-2 text-muted-foreground hover:text-foreground transition">Session</Link>
          <Link to="/about" activeProps={{ className: "text-foreground" }} className="px-3 py-2 text-muted-foreground hover:text-foreground transition">System</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="tracking-widest">NI · NAN IDHINI · v0.1</div>
        <div className="max-w-md">
          Supportive guidance only. Not a medical diagnosis, therapy, or emergency service.
        </div>
      </div>
    </footer>
  );
}
