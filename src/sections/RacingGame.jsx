// Landing'dagi poyga bo'limi — yengil teaser.
// Haqiqiy o'yin alohida to'liq ekran /race sahifasida.
import { useNavigate } from "react-router-dom";
import { Gamepad2, Play, Flag, Cpu, Volume2 } from "lucide-react";
import "./RacingGame.css";

export default function RacingGame() {
  const navigate = useNavigate();

  return (
    <section id="race" className="section race-teaser">
      <div className="container">
        <div className="rt__card glass">
          <div className="rt__glow" />
          <div className="rt__content">
            <span className="eyebrow"><Gamepad2 size={14} /> Poyga rejimi</span>
            <h2 className="section-title">
              Start chizig'idan <span className="gradient-text">finishgacha</span>
            </h2>
            <p className="section-sub">
              To'liq ekranli 3D poyga arenasi — real trassa, AI raqiblar,
              dvigatel tovushi va Forza uslubidagi boshqaruv. Desktopda WASD,
              telefonda landscape + ekran tugmalari bilan o'ynang.
            </p>

            <div className="rt__features">
              <span><Flag size={15} /> Finishgacha poyga</span>
              <span><Cpu size={15} /> AI raqiblar</span>
              <span><Volume2 size={15} /> Dvigatel SFX</span>
            </div>

            <button className="rt__btn" onClick={() => navigate("/race")}>
              <Play size={20} fill="#fff" /> Poyga arenasiga kirish
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
