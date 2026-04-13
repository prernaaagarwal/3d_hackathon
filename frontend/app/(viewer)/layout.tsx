export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-navy-950">
      {children}
    </div>
  );
}

