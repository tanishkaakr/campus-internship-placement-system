import "./globals.css";

export const metadata = {
  title: "Campus Internship & Placement Management System",
  description: "PES University DBMS Level 3 Mini-Project",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}