export function Badge({ label, variant = "info" }) {
  return `<span class="badge ${variant}">${label}</span>`;
}
