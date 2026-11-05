import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main
        style={{
          padding: 40,
          fontFamily: "system-ui",
          color: "#e9f4fb",
          background: "#0b1220",
          minHeight: "100vh",
        }}
      >
        <h1>AdigunPowerLab</h1>
        <h2>The workspace could not be displayed</h2>
        <p>{this.state.error}</p>
        <p>Your saved projects have not been deleted.</p>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>,
);
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then((reg) => {
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          )
            window.dispatchEvent(
              new CustomEvent("powerlab-update", { detail: reg }),
            );
        });
      });
    })
    .catch(() => {});
}
