import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// the loader opens onto the top of the page: a load starts there, not wherever
// the browser remembers (the html scrolls smoothly, so jump). A reload is put
// back where it was by client/scrollMemory once the page is rendered. The
// loader sets restoration back to "auto" once the page is live, so Back and
// Forward between nav hashes still move the page.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
