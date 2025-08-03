// Paper Info Module
// Extracts paper information from ArXiv and other academic sites

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.PaperInfo = class {
    constructor() {
        this.paperData = null;
        this.extractors = {
            arxiv: this.extractArxivInfo.bind(this),
            generic: this.extractGenericInfo.bind(this)
        };
    }

    // Main function to extract paper information from the current page
    getPaperInfo() {
        try {
            const url = window.location.href;
            console.log('Extracting paper info from:', url);

            // Cache the result if we've already extracted it
            if (this.paperData) {
                return this.paperData;
            }

            let paperInfo = {};

            // Check if we're on an ArXiv page
            if (url.includes('arxiv.org')) {
                paperInfo = this.extractArxivInfo();
            } else {
                // Try generic extraction for other academic sites
                paperInfo = this.extractGenericInfo();
            }

            // Add metadata
            paperInfo.url = url;
            paperInfo.extractedAt = new Date().toISOString();
            paperInfo.domain = new URL(url).hostname;

            // Cache the result
            this.paperData = paperInfo;

            console.log('Extracted paper info:', paperInfo);
            return paperInfo;

        } catch (error) {
            console.error('Error extracting paper info:', error);
            return this.getFallbackInfo();
        }
    }

    // Extract information from ArXiv pages
    extractArxivInfo() {
        const paperInfo = {};

        try {
            // Extract title
            const titleElement = document.querySelector('h1.title.mathjax') || 
                                document.querySelector('h1.title') ||
                                document.querySelector('.title');
            
            if (titleElement) {
                // Remove "Title:" prefix if present
                paperInfo.title = titleElement.textContent.replace(/^Title:\s*/i, '').trim();
            }

            // Extract authors
            const authorsElement = document.querySelector('.authors') ||
                                 document.querySelector('.author') ||
                                 document.querySelector('[class*="author"]');
            
            if (authorsElement) {
                // Clean up authors text
                paperInfo.authors = authorsElement.textContent
                    .replace(/^Authors?:\s*/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Extract abstract
            const abstractElement = document.querySelector('.abstract') ||
                                  document.querySelector('[class*="abstract"]') ||
                                  document.querySelector('#abstract');
            
            if (abstractElement) {
                paperInfo.abstract = abstractElement.textContent
                    .replace(/^Abstract:\s*/i, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Extract ArXiv ID from URL or page
            const arxivMatch = window.location.href.match(/arxiv\.org\/(?:abs|pdf)\/([^\/\?]+)/);
            if (arxivMatch) {
                paperInfo.arxivId = arxivMatch[1];
            }

            // Extract submission date
            const submissionElement = document.querySelector('.submission-history') ||
                                    document.querySelector('[class*="date"]') ||
                                    document.querySelector('.dateline');
            
            if (submissionElement) {
                const dateMatch = submissionElement.textContent.match(/\d{1,2}\s+\w+\s+\d{4}/);
                if (dateMatch) {
                    paperInfo.submissionDate = dateMatch[0];
                }
            }

            // Extract categories/subjects
            const subjectsElement = document.querySelector('.subjects') ||
                                   document.querySelector('[class*="subject"]') ||
                                   document.querySelector('.primary-subject');
            
            if (subjectsElement) {
                paperInfo.subjects = subjectsElement.textContent
                    .replace(/^Subjects?:\s*/i, '')
                    .trim();
            }

            // Extract PDF link
            const pdfLink = document.querySelector('a[href*=".pdf"]') ||
                           document.querySelector('.download-pdf a') ||
                           document.querySelector('[href*="/pdf/"]');
            
            if (pdfLink) {
                paperInfo.pdfUrl = pdfLink.href;
            }

        } catch (error) {
            console.error('Error in ArXiv extraction:', error);
        }

        return paperInfo;
    }

    // Extract information from generic academic pages
    extractGenericInfo() {
        const paperInfo = {};

        try {
            // Try to extract title from various common selectors
            const titleSelectors = [
                'h1',
                '.title',
                '.article-title',
                '.paper-title',
                '[class*="title"]',
                'title'
            ];

            for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    paperInfo.title = element.textContent.trim();
                    break;
                }
            }

            // Try to extract authors
            const authorSelectors = [
                '.authors',
                '.author',
                '.author-list',
                '[class*="author"]',
                '.byline'
            ];

            for (const selector of authorSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    paperInfo.authors = element.textContent
                        .replace(/^Authors?:\s*/i, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    break;
                }
            }

            // Try to extract abstract
            const abstractSelectors = [
                '.abstract',
                '#abstract',
                '.summary',
                '[class*="abstract"]',
                '.description'
            ];

            for (const selector of abstractSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim().length > 50) {
                    paperInfo.abstract = element.textContent
                        .replace(/^Abstract:?\s*/i, '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    break;
                }
            }

            // Try to extract publication date
            const dateSelectors = [
                '.publication-date',
                '.date',
                '[class*="date"]',
                'time'
            ];

            for (const selector of dateSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const dateText = element.textContent || element.getAttribute('datetime');
                    if (dateText) {
                        paperInfo.publicationDate = dateText.trim();
                        break;
                    }
                }
            }

        } catch (error) {
            console.error('Error in generic extraction:', error);
        }

        return paperInfo;
    }

    // Fallback information when extraction fails
    getFallbackInfo() {
        return {
            title: document.title || 'Unknown Paper',
            authors: 'Unknown',
            abstract: 'Abstract not available',
            url: window.location.href,
            extractedAt: new Date().toISOString(),
            domain: new URL(window.location.href).hostname,
            extractionFailed: true
        };
    }

    // Get formatted paper info for display
    getFormattedInfo() {
        const info = this.getPaperInfo();
        
        return {
            title: info.title || 'Unknown Paper',
            authors: info.authors || 'Unknown Authors',
            abstract: info.abstract || 'Abstract not available',
            shortAbstract: info.abstract ? 
                (info.abstract.length > 120 ? info.abstract.substring(0, 120) + '...' : info.abstract) :
                'Abstract not available',
            url: info.url,
            arxivId: info.arxivId,
            domain: info.domain
        };
    }

    // Clear cached paper data (useful when page changes)
    clearCache() {
        this.paperData = null;
    }

    // Update paper info (useful for dynamic pages)
    refresh() {
        this.clearCache();
        return this.getPaperInfo();
    }

    // Check if we're on a supported academic site
    isSupportedSite() {
        const url = window.location.href;
        const supportedDomains = [
            'arxiv.org',
            'scholar.google.com',
            'ieeexplore.ieee.org',
            'acm.org',
            'springer.com',
            'nature.com',
            'science.org',
            'pnas.org'
        ];

        return supportedDomains.some(domain => url.includes(domain));
    }

    // Get paper type based on URL and content
    getPaperType() {
        const url = window.location.href;
        
        if (url.includes('arxiv.org')) {
            return 'preprint';
        } else if (url.includes('ieee') || url.includes('acm')) {
            return 'conference';
        } else if (url.includes('nature') || url.includes('science')) {
            return 'journal';
        }
        
        return 'unknown';
    }
}
