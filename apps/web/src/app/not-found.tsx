import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <div className="text-6xl font-semibold tracking-tight">404</div>
        <p className="mt-2 text-muted-foreground">This page doesn&apos;t exist.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
