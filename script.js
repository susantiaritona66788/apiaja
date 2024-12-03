// Konfigurasi
const API_URL = 'https://lc.begonoaja.site'; // Ganti dengan URL API Anda setelah di-deploy
// Router sederhana
function handleRoute() {
    const urlParams = new URLSearchParams(window.location.search);
    const questionKey = urlParams.get('question');
    
    if (questionKey) {
        fetchDetail(questionKey);
    } else {
        fetchList();
    }
}

// Fetch daftar pertanyaan
async function fetchList() {
    try {
        
        const response = await fetch(`${API_URL}/api/data`, {
            method: 'GET',
            credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Periksa apakah data ada dan merupakan array
        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Tidak ada data yang ditemukan');
        }
        
        // Cek status bot dan jalankan iklan jika bukan bot


        // Render list dengan data yang benar
        renderList(responseData.data);
        if (responseData.isBot === false) {
            iklanJalan();
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// Fetch detail pertanyaan
async function fetchDetail(key) {
    try {
        const response = await fetch(`${API_URL}/api/data`, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ key })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        
        if (responseData.status === 'error') {
            throw new Error(responseData.message);
        }
        
        if (!responseData.data || !responseData.data.value) {
            throw new Error('Invalid response format');
        }

        renderDetail(responseData.data, responseData.related || []);
                // Cek status bot dan jalankan iklan jika bukan bot
        if (responseData.isBot === false) {
            iklanJalan();
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

function showError(message) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div style="text-align: center; color: #c22; padding: 20px;">
            <h2>Error Occurred</h2>
            <p>${message}</p>
            <button onclick="handleRoute()" style="margin-top: 10px; padding: 8px 16px;">
                Try Again
            </button>
        </div>
    `;
}

function updateMetaTags(data = null) {
    // Hapus meta tags yang ada
    document.querySelectorAll('meta[data-dynamic="true"]').forEach(meta => meta.remove());
    
    const head = document.head;
    const metaTags = [];
    
    if (data) {
        // Ubah judul menggunakan Title Case
        document.title = data.value.judul.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Detail page meta tags
        metaTags.push(
            { name: 'description', content: data.value.des || data.value.isi.substring(0, 160) },
            { property: 'og:title', content: data.value.judul },
            { property: 'og:description', content: data.value.des || data.value.isi.substring(0, 160) },
            { property: 'og:type', content: 'article' },
            { name: 'keywords', content: data.value.cat.join(', ') }
        );
    } else {
        // Update title halaman daftar
        document.title = 'Q&A Platform - Programming Questions and Answers';
        
        // List page meta tags
        metaTags.push(
            { name: 'description', content: 'Find various questions and answers about programming and technology' },
            { property: 'og:title', content: 'Q&A Platform - Programming Questions and Answers' },
            { property: 'og:description', content: 'Find various questions and answers about programming and technology' },
            { property: 'og:type', content: 'website' }
        );
    }

    // Tambahkan meta tags baru
    metaTags.forEach(meta => {
        const metaTag = document.createElement('meta');
        metaTag.dataset.dynamic = 'true';
        if (meta.name) metaTag.name = meta.name;
        if (meta.property) metaTag.setAttribute('property', meta.property);
        metaTag.content = meta.content;
        head.appendChild(metaTag);
    });

    // Update canonical URL
    let canonicalURL = document.querySelector('link[rel="canonical"]');
    if (!canonicalURL) {
        canonicalURL = document.createElement('link');
        canonicalURL.rel = 'canonical';
        head.appendChild(canonicalURL);
    }
    canonicalURL.href = window.location.href.split('?')[0] + (data ? `?question=${data.key}` : '');
}

function generateJsonLD(data = null) {
    let jsonLD;
    
    if (data) {
        // JSON-LD untuk halaman detail
        jsonLD = {
            "@context": "https://schema.org",
            "@type": "QAPage",
            "mainEntity": {
                "@type": "Question",
                "name": data.value.judul,
                "text": data.value.des || "",
                "answerCount": 1,
                "dateCreated": new Date().toISOString(),
                "author": {
                    "@type": "Person",
                    "name": data.value.credit?.[0]?.user || "Anonymous"
                },
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": data.value.isi,
                    "dateCreated": new Date().toISOString(),
                    "author": {
                        "@type": "Person",
                        "name": data.value.credit?.[0]?.user || "Anonymous"
                    }
                }
            }
        };
    } else {
        // JSON-LD untuk halaman daftar
        jsonLD = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Q&A Platform",
            "description": "Kumpulan Pertanyaan dan Jawaban Seputar Pemrograman",
            "url": window.location.origin
        };
    }

    // Hapus script JSON-LD yang ada
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();

    // Tambahkan script JSON-LD baru
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLD);
    document.head.appendChild(script);
}

// Tambahkan fungsi untuk merender footer
function renderFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h3>About Us</h3>
                <p>Platform tanya jawab seputar pemrograman dan teknologi. Temukan solusi untuk masalah coding Anda.</p>
                <div class="social-links">
                    <a href="#" title="GitHub"><i class="fab fa-github"></i></a>
                    <a href="#" title="Twitter"><i class="fab fa-twitter"></i></a>
                    <a href="#" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
                </div>
            </div>
            <div class="footer-section">
                <h3>Popular Tags</h3>
                <div class="footer-tags">
                    <span class="footer-tag">JavaScript</span>
                    <span class="footer-tag">Python</span>
                    <span class="footer-tag">React</span>
                    <span class="footer-tag">Node.js</span>
                    <span class="footer-tag">CSS</span>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} Q&A Platform. All rights reserved.</p>
        </div>
    `;

    // Tambahkan style untuk footer
    footer.style.cssText = `
        background: linear-gradient(135deg, #1a1f25 0%, #2c3e50 100%);
        color: #fff;
        padding: 3rem 0 0 0;
        margin-top: 4rem;
        box-shadow: 0 -2px 20px rgba(0,0,0,0.1);
    `;

    // Tambahkan style untuk konten footer
    const style = document.createElement('style');
    style.textContent = `
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            padding: 0 2rem;
        }

        .footer-section {
            margin-bottom: 2rem;
        }

        .footer-section h3 {
            color: #fff;
            font-size: 1.2rem;
            margin-bottom: 1.2rem;
            position: relative;
            padding-bottom: 0.5rem;
        }

        .footer-section h3::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: 0;
            width: 50px;
            height: 2px;
            background: #0a95ff;
        }

        .footer-section p {
            color: #b3b3b3;
            line-height: 1.6;
        }

        .footer-section ul {
            list-style: none;
            padding: 0;
        }

        .footer-section ul li {
            margin-bottom: 0.8rem;
        }

        .footer-section ul li a {
            color: #b3b3b3;
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-section ul li a:hover {
            color: #0a95ff;
        }

        .social-links {
            display: flex;
            gap: 1rem;
            margin-top: 1.2rem;
        }

        .social-links a {
            color: #fff;
            background: rgba(255,255,255,0.1);
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .social-links a:hover {
            background: #0a95ff;
            transform: translateY(-3px);
        }

        .footer-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .footer-tag {
            background: rgba(255,255,255,0.1);
            color: #b3b3b3;
            padding: 0.4rem 0.8rem;
            border-radius: 15px;
            font-size: 0.85rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .footer-tag:hover {
            background: #0a95ff;
            color: #fff;
        }

        .footer-bottom {
            text-align: center;
            padding: 1.5rem;
            background: rgba(0,0,0,0.2);
            margin-top: 2rem;
        }

        .footer-bottom p {
            color: #b3b3b3;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .footer-content {
                grid-template-columns: 1fr;
                padding: 0 1rem;
            }
            
            .footer-section {
                text-align: center;
            }
            
            .footer-section h3::after {
                left: 50%;
                transform: translateX(-50%);
            }
            
            .social-links {
                justify-content: center;
            }
        }
    `;

    document.head.appendChild(style);

    // Tambahkan Font Awesome untuk ikon
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);

    document.body.appendChild(footer);
}

// Tambahkan fungsi untuk membuat tombol Back to Top
function createBackToTopButton() {
    const button = document.createElement('button');
    button.id = 'backToTop';
    button.innerHTML = '<i class="fas fa-arrow-up"></i>';
    
    // Tambahkan style untuk tombol
    const style = document.createElement('style');
    style.textContent = `
        #backToTop {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 45px;
            height: 45px;
            background: #0a95ff;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        #backToTop:hover {
            background: #0074cc;
            transform: translateY(-3px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        #backToTop.show {
            display: flex;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            #backToTop {
                bottom: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                font-size: 1rem;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(button);

    // Fungsi untuk scroll ke atas dengan animasi smooth
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Tambahkan event listener untuk scroll
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) { // Tombol muncul setelah scroll 300px
            button.classList.add('show');
        } else {
            button.classList.remove('show');
        }
    });

    // Tambahkan event listener untuk klik
    button.addEventListener('click', scrollToTop);
}

// Update fungsi renderList dan renderDetail untuk menambahkan footer
function renderList(data) {
    updateMetaTags();
    generateJsonLD();
    
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '<div class="question-list"></div>';
    const listDiv = contentDiv.querySelector('.question-list');
    
    if (!Array.isArray(data) || data.length === 0) {
        listDiv.innerHTML = '<p style="text-align: center; padding: 20px;">Tidak ada data yang tersedia</p>';
        return;
    }

    // Tambahkan div untuk iklan di bawah judul
    listDiv.innerHTML = `
        <div id="ads-homepage" style="margin: 20px 0;">
            <!-- Iklan akan ditampilkan di sini (Homepage) -->
        </div>
    `;
    
    data.forEach(item => {
        if (!item || !item.value) {
            console.warn('Item tidak valid:', item);
            return;
        }

        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        
        const titleLink = document.createElement('a');
        titleLink.className = 'question-title';
        titleLink.href = `?question=${item.key}`;
        titleLink.textContent = item.value.judul || 'Tidak ada judul';
        
        const description = document.createElement('div');
        description.className = 'question-description';
        description.textContent = item.value.des || 'Tidak ada deskripsi';
        
        const tags = document.createElement('div');
        tags.className = 'tags';
        if (Array.isArray(item.value.cat)) {
            item.value.cat.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                tags.appendChild(tagSpan);
            });
        }
        
        questionDiv.appendChild(titleLink);
        questionDiv.appendChild(description);
        questionDiv.appendChild(tags);
        
        listDiv.appendChild(questionDiv);
    });
    
    renderFooter();
    createBackToTopButton();
}

function renderDetail(data, related) {
    if (!data || !data.value) {
        showError('Invalid data');
        return;
    }

    updateMetaTags(data);
    generateJsonLD(data);
    
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = `
        <div class="detail-container">
            <a class="back-button" href="/">← Back to List</a>
            <h1 class="detail-title">${data.value.judul || 'No Title'}</h1>
            
            <!-- Iklan akan ditampilkan di bawah judul -->
            <div id="ads-below-title" style="margin: 20px 0;">
                <!-- Iklan akan ditampilkan di sini (Detail Page) -->
            </div>

            <div class="detail-content" style="overflow-x: auto;">
                ${data.value.isi || 'No content available'}
            </div>

            <!-- Iklan akan ditampilkan di dalam artikel -->
            <div id="ads-in-content" style="margin: 20px 0;">
                <!-- Iklan akan ditampilkan di sini (In Content) -->
            </div>

            ${data.value.cat && Array.isArray(data.value.cat) ? `
                <div class="tags" style="margin-top: 20px;">
                    ${data.value.cat.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
          ${related && related.length > 0 ? `
                <div class="related-posts">
                    <h2 style="margin-bottom: 1.5rem; color: #2c3e50; font-size: 1.5rem;">Related Articles</h2>
                    <div class="related-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                        ${related.map(item => `
                            <div class="related-item" style="
                                background: #fff;
                                padding: 1.2rem;
                                border-radius: 8px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                                transition: all 0.3s ease;
                                border: 1px solid #e1ecf4;
                            ">
                                ${item.url 
                                    ? `<a href="${item.url}?question=${item.key}" target="_blank" style="
                                        color: #2c3e50;
                                        text-decoration: none;
                                        font-weight: 500;
                                        font-size: 1.1rem;
                                        display: block;
                                        margin-bottom: 0.8rem;
                                        line-height: 1.4;
                                        transition: color 0.2s ease;
                                    " onmouseover="this.style.color='#0a95ff'" onmouseout="this.style.color='#2c3e50'">${item.judul}</a>`
                                    : `<a href="?question=${item.key}" style="
                                        color: #2c3e50;
                                        text-decoration: none;
                                        font-weight: 500;
                                        font-size: 1.1rem;
                                        display: block;
                                        margin-bottom: 0.8rem;
                                        line-height: 1.4;
                                        transition: color 0.2s ease;
                                    " onmouseover="this.style.color='#0a95ff'" onmouseout="this.style.color='#2c3e50'">${item.judul}</a>`
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Styling untuk pre tags
    const preTags = contentDiv.querySelectorAll('.detail-content pre');
    preTags.forEach(pre => {
        pre.style.maxWidth = '100%';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordWrap = 'break-word';
        pre.style.background = '#f5f5f5';
        pre.style.padding = '1rem';
        pre.style.borderRadius = '4px';
        pre.style.margin = '1rem 0';
    });

    // Styling untuk gambar
    const images = contentDiv.querySelectorAll('.detail-content img');
    images.forEach(img => {
        img.style.cssText = `
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1.5rem auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        `;

        // Tambahkan wrapper div untuk menangani overflow
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            max-width: 100%;
            margin: 1.5rem 0;
            overflow: hidden;
            border-radius: 8px;
        `;

        // Pindahkan gambar ke dalam wrapper
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);

        // Tambahkan event listener untuk zoom effect pada hover
        img.addEventListener('mouseover', () => {
            img.style.transform = 'scale(1.02)';
            img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        img.addEventListener('mouseout', () => {
            img.style.transform = 'none';
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        // Tambahkan event listener untuk lightbox jika gambar diklik
        img.addEventListener('click', () => {
            const lightbox = document.createElement('div');
            lightbox.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                cursor: pointer;
                padding: 20px;
            `;

            const lightboxImg = document.createElement('img');
            lightboxImg.src = img.src;
            lightboxImg.style.cssText = `
                max-width: 90%;
                max-height: 90vh;
                object-fit: contain;
                border-radius: 8px;
            `;

            lightbox.appendChild(lightboxImg);
            document.body.appendChild(lightbox);

            // Tutup lightbox saat diklik
            lightbox.addEventListener('click', () => {
                lightbox.remove();
            });
        });
    });

    // Tambahkan hover effect untuk related items
    const relatedItems = contentDiv.querySelectorAll('.related-item');
    relatedItems.forEach(item => {
        item.addEventListener('mouseover', () => {
            item.style.transform = 'translateY(-3px)';
            item.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            item.style.borderColor = '#0a95ff';
        });
        item.addEventListener('mouseout', () => {
            item.style.transform = 'none';
            item.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            item.style.borderColor = '#e1ecf4';
        });
    });
    
    renderFooter();
}

function createRelatedPostsHTML(relatedPosts) {
    return `
        <div class="related-posts">
            <h3>Related Articles</h3>
            <div class="related-posts-grid">
                ${relatedPosts.map(post => `
                    <article class="related-post-item">
                        <a href="${post.url}" class="related-post-title">
                            ${post.title}
                        </a>
                        <div class="related-post-meta">
                            <span class="related-post-date">
                                <i class="far fa-calendar"></i>
                                ${post.date}
                            </span>
                        </div>
                        <div class="related-tags">
                            ${post.tags.map(tag => `
                                <span class="related-tag">${tag}</span>
                            `).join('')}
                        </div>
                    </article>
                `).join('')}
            </div>
        </div>
    `;
}
// Panggil fungsi saat halaman dimuat
document.addEventListener('DOMContentLoaded', handleRoute); 
