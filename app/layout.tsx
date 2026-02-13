import "./globals.css";

export const metadata = {
  title: "MKR Control Hub",
  description: "MKR Control Hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
