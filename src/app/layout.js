import './globals.css';
import Providers from '../components/providers/Providers';

export const metadata = {
  title: 'نظام إدارة المصحة والفروع - لوحة التحكم',
  description: 'نظام إلكتروني متكامل لإدارة النزلاء والموظفين والمالية والحضور لفرع المصحة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen font-cairo antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
