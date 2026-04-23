# Neural Viz | Lightweight 3D Engine

A visually impressive yet highly optimized 3D neural/data visualization system designed for performance.

## 🚀 Key Features
- **High-Performance Rendering**: Uses `THREE.InstancedMesh` for nodes and pulses, ensuring smooth 60 FPS on mid-range laptops.
- **Dynamic Data Flow**: Animated light pulses moving across connections with adjustable speed.
- **Glassmorphic UI**: Premium, modern interface with real-time diagnostics (FPS, Node count).
- **Interactive Exploration**: Orbit controls for zoom/rotate and raycasting for node selection.
- **Adaptive Quality**: Real-time quality scaling (Low, Medium, High) to manage GPU load.

## 🛠 Tech Stack
- **Engine**: Three.js (Optimized usage)
- **Frontend**: Vanilla JS, Vite, CSS (Glassmorphism)
- **Icons**: SVG / CSS

## ⚙️ Performance Tips
- **Low Quality**: Reduces pixel ratio and disables antialiasing.
- **Node Density**: Adjust the slider to find the sweet spot for your hardware.
- **Auto-Rotation**: Can be disabled to save processing power during static viewing.

## 📂 Structure
- `src/engine/`: Core 3D logic (Scene, Network, Background).
- `src/ui/`: (Handled in main.js) UI interaction logic.
- `src/main.js`: Main entry point and state management.

---
Built for the **Anti Work** project suite.
