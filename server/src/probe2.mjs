console.log('DEBUG A')
import { createApp } from './app.js'
console.log('DEBUG B: app created', typeof createApp)
const app = createApp()
console.log('DEBUG C: app instance', typeof app)
