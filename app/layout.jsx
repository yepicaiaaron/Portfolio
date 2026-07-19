import './shell.css';

export const metadata = {
  title: 'Aaron Jones BEM | Interactive Portfolio',
  description: 'Creative technologist, AI builder, leader and storyteller.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
