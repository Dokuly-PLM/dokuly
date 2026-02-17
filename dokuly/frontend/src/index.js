import App from "./components/App";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

const container = document.getElementById("App");

function render(AppComponent = App) {
  root.render(
    <HashRouter>
      <AppComponent />
    </HashRouter>,
  );
}

// Reuse the same root across HMR updates
let root;
if (import.meta.hot) {
  root = import.meta.hot.data.root;
  if (!root) {
    root = createRoot(container);
    import.meta.hot.data.root = root;
  }
} else {
  root = createRoot(container);
}

render();

if (import.meta.hot) {
  import.meta.hot.accept("./components/App", (mod) => {
    render(mod.default);
  });
}
