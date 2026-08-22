import { ensureDecimal, createConverter } from "../../src/engines/conversion.js";

const MAP = {
  length: "length.json", area: "area.json", volume: "volume.json", weight: "weight.json",
  pressure: "pressure.json", energy: "energy.json", power: "power.json", force: "force.json",
  torque: "torque.json", angle: "angle.json", time: "time.json", frequency: "frequency.json",
  capacitance: "capacitance.json", inductance: "inductance.json", data: "data.json",
  amount_of_substance: "amount_of_substance.json", luminescence: "luminescence.json",
  "viscosity-dynamic": "viscosity-dynamic.json", "viscosity-kinematic": "viscosity-kinematic.json"
};

export async function init(container, opts={}) {
  await ensureDecimal();
  const hubType = container.querySelector("#hub-type");
  const hubLocked = container.querySelector("#hub-locked");
  const hubRow = container.querySelector("#hub-type-row");
  const preset = opts.preset || container.dataset.preset || new URLSearchParams(location.hash).get("preset");
  const locked = !!opts.locked || !!preset;
  let catalog = [];
  try { catalog = await fetch("src/modules.json").then(r=>r.json()); } catch {}
  const nameOf = (id) => catalog.find(m=>m.id===id)?.name || id;

  // si verrouillé, cache le select et affiche le nom
  if (locked && preset) {
    hubType.style.display = "none";
    hubLocked.style.display = "";
    hubLocked.textContent = nameOf(preset);
  } else {
    // hub déverrouillé : peuple le select avec noms traduits
    Object.keys(MAP).forEach(k => hubType.appendChild(new Option(nameOf(k), k)));
    hubType.addEventListener("change", () => load(hubType.value));
  }

  async function load(type) {
    const file = MAP[type];
    if (!file) { container.querySelector("#result").innerText = "Type inconnu"; return; }
    const cfgRaw = await fetch(`src/engines/configs/${file}`).then(r=>r.json());
    // convert string rates -> Decimal
    const cfg = {
      ...cfgRaw,
      rates: cfgRaw.rates ? Object.fromEntries(Object.entries(cfgRaw.rates).map(([k,v])=>[k, new Decimal(v)])) : undefined,
      displayNames: cfgRaw.displayNames,
      groups: cfgRaw.groups,
      type: cfgRaw.type
    };
    // mount generic UI
    const { mountConverter } = await import("../../src/engines/conversion.js");
    // for mach etc, need extra handling
    mountConverter(container, cfg, { locked, preset: type });
    // Mach temp show
    const machRow = container.querySelector("#hub-mach");
    if (cfg.mach || type==="speed") machRow.style.display = "";
    else machRow.style.display = "none";
  }

  const start = (locked && preset) ? preset : (hubType.value || "length");
  await load(start);
}
