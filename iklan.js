function iklanJalan() {
    // Tambahkan script global
    const globalScript = document.createElement('script');
    globalScript.type = 'text/javascript';
    globalScript.src = '//frontinventory.com/2a/a9/83/2aa98351ebb626f6e3d03a97ff336860.js';
    document.head.appendChild(globalScript);

    // Iklan pertama (di bawah judul)
    const adsContainer = document.getElementById('ads-below-title');
    if (adsContainer) {
        setTimeout(() => {
            const atOptionsScript = document.createElement('script');
            atOptionsScript.type = 'text/javascript';
            atOptionsScript.text = `
                var atOptions1 = {
                    'key' : '6c6b20be493d7f35f4dd8ae6d105d36f',
                    'format' : 'iframe',
                    'height' : 250,
                    'width' : 300,
                    'params' : {}
                };
                window.atOptions = atOptions1;
            `;
            
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = 'https://frontinventory.com/6c6b20be493d7f35f4dd8ae6d105d36f/invoke.js';
            
            adsContainer.appendChild(atOptionsScript);
            adsContainer.appendChild(invokeScript);
        }, 0);
    }
}