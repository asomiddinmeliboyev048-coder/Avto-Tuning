import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Loader from "./components/Loader.jsx";
import ScrollProgress from "./components/ScrollProgress.jsx";
import Header from "./components/Header.jsx";
import Hero from "./sections/Hero.jsx";
import Process from "./sections/Process.jsx";
import VirtualGarage from "./sections/VirtualGarage.jsx";
import RacingGame from "./sections/RacingGame.jsx";
import Parts from "./sections/Parts.jsx";
import Footer from "./components/Footer.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const appRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <ScrollProgress />
      {loading && <Loader onComplete={() => setLoading(false)} />}
      <div ref={appRef} aria-hidden={loading}>
        <Header />
        <main>
          <Hero />
          <Process />
          <VirtualGarage />
          <RacingGame />
          <Parts />
        </main>
        <Footer />
      </div>
    </>
  );
}
