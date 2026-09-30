import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { chatProxyPlugin } from './server/chat-proxy.mjs'

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), chatProxyPlugin()] }
})