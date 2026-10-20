/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // 系统级无衬线:macOS 用 SF Pro,Windows 用 Segoe UI Variable,Inter 兜底
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', '"Segoe UI Variable"', '"Segoe UI"', '"Microsoft YaHei"', 'sans-serif']
      }
    }
  },
  plugins: []
}
