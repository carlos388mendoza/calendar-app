import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendario de Eventos",
  description:
    "Aplicación de calendario con vistas de día, semana y mes, búsqueda, drag & drop y más de 10.000 eventos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans">{children}</body>
    </html>
  );
}