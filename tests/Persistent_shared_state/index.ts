import { PersistentState } from "../../src/PersistentState.ts";
import "./index.css";

// The value of this state is persisted at the specified key in localStorage.
// Use `session: true` option to use sessionStorage, set `serialize` and
// `deserialize` options to define the state value transforms (default:
// `JSON.stringify()` and `JSON.parse()`.
const counterState = new PersistentState(42, {
  key: "bridgestate-dev-counter",
});
// Beyond the initialization, instances of PersistentState act pretty much
// the same way as instances of State.

document.querySelector(".plus")!.addEventListener("click", () => {
  counterState.setValue((value) => value + 1);
});

document.querySelector(".reset")!.addEventListener("click", () => {
  counterState.setValue(0);
});

counterState.on("set", ({ current }) => {
  document.querySelector("output")!.textContent = String(current);
});
