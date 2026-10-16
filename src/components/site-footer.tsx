export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p className="font-heading text-base font-medium text-foreground">
          SoleMate
        </p>
        <p>© {new Date().getFullYear()} SoleMate.</p>
      </div>
    </footer>
  );
}
