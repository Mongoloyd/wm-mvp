import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Forensic Noir fonts
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/barlow-condensed/900.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";
import "@fontsource/dm-mono/500.css";

createRoot(document.getElementById("root")!).render(<App />);
