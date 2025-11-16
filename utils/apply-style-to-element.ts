export function applyStyleToElement(
  element: HTMLElement,
  key: string,
  value: string
) {
  // Only run in the browser where document is available
  if (typeof document === "undefined") return;

  const currentStyle = element.getAttribute("style") || "";
  // Remove the existing variable definitions with the same name
  const cleanedStyle = currentStyle.replace(
    new RegExp(`--${key}:\\s*[^;]+;?`, "g"), 
    ""
  ).trim();

  element.setAttribute(
    "style",
    `${cleanedStyle}--${key}: ${value};`
  );
}
