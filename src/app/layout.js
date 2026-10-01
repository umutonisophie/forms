import Providers from "./providers";
import "./globals.css";

export const metadata = {
  title: "Academic Portal",
  description: "Manage students, courses, and enrollments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}