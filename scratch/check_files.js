import fs from "fs";
import path from "path";

// Test parsing files with Babel/ESLint or Node
console.log("Checking JS files syntax...");

const files = [
  "src/App.jsx",
  "src/context/AppContext.jsx",
  "src/components/Layout.jsx",
  "src/views/AdminView.jsx",
  "src/views/ConsultantView.jsx",
  "src/views/AddEmployeeWizard.jsx"
];

for (const f of files) {
  try {
    const code = fs.readFileSync(f, "utf8");
    console.log(`OK: ${f} (${code.length} bytes)`);
  } catch (err) {
    console.error(`ERROR reading ${f}:`, err.message);
  }
}
