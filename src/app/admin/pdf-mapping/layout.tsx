export default function PDFMappingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily bypass auth for demo purposes
  return <>{children}</>;
}
