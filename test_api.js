const fetch = require('node-fetch');

(async () => {
    // Start local dev server if needed, or just import the handler
    // Actually, I can just require the server handler directly
    const { executeFounderAiChat } = require('./HDmaster/dist/server/index.js') || {};
    
    if(!executeFounderAiChat) {
        console.log("Could not load from dist");
    }
})();
