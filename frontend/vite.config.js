import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // basicSsl()
  ],
  server: {
    host: true // Cho phép truy cập qua Lan
  }
})
