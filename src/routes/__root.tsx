import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Header, Footer } from "@/components/layout";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-widest">404</h1>
        <p className="mt-4 text-sm text-muted-foreground tracking-wider uppercase">
          Signal not found
        </p>
        <Link
          to="/"
          className="mt-6 inline-block border border-border px-4 py-2 text-xs uppercase tracking-widest hover:bg-surface-elevated"
        >
          Return to base
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NI — Nan Idhini · AI Mental Wellness Support" },
      {
        name: "description",
        content:
          "NI (Nan Idhini): an AI-based mental wellness support system that uses NLP and ML to detect emotional stress and offer solo self-calming recommendations. Open-access, no login.",
      },
      { name: "author", content: "NI" },
      { property: "og:title", content: "NI — Nan Idhini · AI Mental Wellness Support" },
      { property: "og:description", content: "NI (Nan Idhini) is an AI-powered web app for instant mental wellness support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NI — Nan Idhini · AI Mental Wellness Support" },
      { name: "description", content: "NI (Nan Idhini) is an AI-powered web app for instant mental wellness support." },
      { name: "twitter:description", content: "NI (Nan Idhini) is an AI-powered web app for instant mental wellness support." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/79ca8fe0-629a-4118-866e-adc46adb2481/id-preview-4f586ba5--ad2edc51-953e-4180-a4b0-836eefde298a.lovable.app-1778340179101.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/79ca8fe0-629a-4118-866e-adc46adb2481/id-preview-4f586ba5--ad2edc51-953e-4180-a4b0-836eefde298a.lovable.app-1778340179101.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
