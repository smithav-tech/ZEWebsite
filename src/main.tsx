import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// every open and reload starts at the top, under the loader (the html scrolls
// smoothly, so jump). Scroll restoration stays off until the loader has run,
// then goes back to "auto" so Back and Forward between nav hashes still move
// the page. A leftover #section is dropped so it cannot pull the page down.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
