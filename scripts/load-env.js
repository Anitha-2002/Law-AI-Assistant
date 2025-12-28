// Load .env.local before any other modules
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') })


