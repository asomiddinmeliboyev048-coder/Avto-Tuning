// Asosiy (landing) sahifa — har bir bo'lim ErrorBoundary bilan himoyalangan.
import Hero from "./sections/Hero.jsx";
import Process from "./sections/Process.jsx";
import VirtualGarage from "./sections/VirtualGarage.jsx";
import RacingGame from "./sections/RacingGame.jsx";
import Carousel from "./sections/Carousel.jsx";
import Reviews from "./sections/Reviews.jsx";
import Booking from "./sections/Booking.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const Guard = ({ children, label }) => (
  <ErrorBoundary label={label}>{children}</ErrorBoundary>
);

export default function Landing() {
  return (
    <>
      <Guard><Hero /></Guard>
      <Guard><Process /></Guard>
      <Guard><RacingGame /></Guard>
      <Guard label="3D zapchast ko'rinishi yuklanmadi."><Parts /></Guard>
      <Guard><Carousel /></Guard>
      <Guard><Reviews /></Guard>
      <Guard><Booking /></Guard>
    </>
  );
}
