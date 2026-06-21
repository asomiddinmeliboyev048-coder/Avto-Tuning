// Bo'lim darajasidagi xatolik himoyasi.
// Bitta bo'lim (masalan 3D garaj) crash bo'lsa, butun sayt o'chmaydi —
// faqat o'sha bo'lim zaxira ko'rinish (fallback) ko'rsatadi.
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("Bo'lim xatosi:", this.props.name || "", error?.message);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.silent) return null;
      return (
        <section className="section" style={{ textAlign: "center" }}>
          <div className="container">
            <p style={{ color: "var(--text-dim)" }}>
              {this.props.label || "Bu bo'lim yuklanmadi."}
            </p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
