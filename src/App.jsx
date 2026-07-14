import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Loader from "./components/Loader.jsx";
import ScrollProgress from "./components/ScrollProgress.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import BottomNav from "./components/BottomNav.jsx";
import CartDrawer from "./components/cart/CartDrawer.jsx";
import Onboarding from "./components/auth/Onboarding.jsx";
import Landing from "./Landing.jsx";
import Profile from "./pages/Profile.jsx";
import Shop from "./pages/Shop.jsx";
import Reels from "./pages/Reels.jsx";
import RaceArena from "./pages/RaceArena.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isRace = location.pathname === "/race";

  useEffect(() => {
    const timer = setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => clearTimeout(timer);
  }, [loading]);

  if (isRace) {
    return (
      <>
        <Onboarding />
        <Routes>
          <Route path="/race" element={<RaceArena />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Onboarding />
      <ScrollProgress />
      {loading && <Loader onComplete={() => setLoading(false)} />}
      <div aria-hidden={loading}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dokon" element={<Shop />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/reels/:id" element={<Reels />} />
            {/* Eski havolalar bilan moslik uchun */}
            <Route path="/videolar" element={<Reels />} />
            <Route path="/videolar/:id" element={<Reels />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <BottomNav />
      </div>
    </>
  );
}
