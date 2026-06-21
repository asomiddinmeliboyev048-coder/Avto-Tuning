// Asosiy (landing) sahifa — barcha bo'limlar bir scroll oqimida.
import Hero from "./sections/Hero.jsx";
import Process from "./sections/Process.jsx";
import VirtualGarage from "./sections/VirtualGarage.jsx";
import RacingGame from "./sections/RacingGame.jsx";
import Parts from "./sections/Parts.jsx";
import Booking from "./sections/Booking.jsx";

export default function Landing() {
  return (
    <>
      <Hero />
      <Process />
      <VirtualGarage />
      <RacingGame />
      <Parts />
      <Booking />
    </>
  );
}
