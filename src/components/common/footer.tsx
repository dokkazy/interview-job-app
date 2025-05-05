import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-6  md:py-10">
      <div className=" max-w-7xl mx-auto w-full container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Link href="/" className="font-bold">
            JobConnect
          </Link>
          <nav className="flex gap-4 sm:gap-6">
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>
          </nav>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} JobConnect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
