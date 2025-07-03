# DYPE – v1.0.0

A VS Code extension powered by AI that analyzes your code and provides actionable, inline feedback. Whether you need quick error spotting, stylistic advice, or guidance on best practices, Dype gives you intelligent comments directly where you write.

## 🛠️ Features

- **Inline Comment Generation**  
  AI‑powered tips inserted right next to your code—no extra panels required.

- **Multi‑Model Support**  
  Choose from a variety of Gemini models (`gemini-2.5-flash`, `gemini-1.5-pro`, etc.) to balance speed vs. depth.

- **Rate‑Limit & Token Management**  
  Built‑in cooldown prevents API overuse; tokens automatically replenish after 30 seconds.

- **Live Configuration Reload**  
  Change models and API keys on the fly.

## ⚙️ Requirements

- A Google Studio AI (Generative Language) API Key

## 🔧 Extension Settings

| Setting        | Type     | Default            | Description                             |
|----------------|----------|--------------------|-----------------------------------------|
| `dype.apiKey`  | `string` | *none*             | Your Google Generative Language API key.|
| `dype.model`   | `string` | `gemini-2.5-flash` | Which Gemini model to use for analysis. |

## 🐛 Known Issues

- **Long Files**  
  Very large files may hit the API’s context‑window limit. Consider selecting smaller regions.

- **Formatting Quirks**  
  Occasionally indentation can be off by a space—fixable in the next patch.

- **Language Coverage**  
  Some less‑common languages may not be fully supported yet (e.g., Haskell, Rust). Contributions welcome!
