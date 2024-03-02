import "./globals.css";
import { Provider } from "@/components/Provider";
import { Nunito } from "next/font/google"

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="opencv.js" type="text/javascript"></script>
      </head>
      <body className={`${nunito.className} text-slate-600`}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
