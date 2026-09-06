# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Developer Handoff Instructions

This project uses a global `<DashboardLayout>` shell built with `react-router-dom` v6. To add a new page to the dashboard:

1. Create your component in `src/pages/YourPage.jsx`.
2. Open `src/App.jsx`.
3. Wrap your route inside the main `DashboardLayout` route wrapper to inherit the Navbar and Sidebar automatically.

Example:
```jsx
// src/App.jsx
<Route path="/" element={<DashboardLayout />}>
  {/* Add your new route here! */}
  <Route path="your-page" element={<YourPage />} />
</Route>
```

4. If you want the page to appear in the Sidebar navigation, update the role arrays in `src/config/navigationConfig.js` with your path and an icon from `lucide-react`.
