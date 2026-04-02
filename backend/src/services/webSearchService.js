const https = require('https');

class WebSearchService {
    /**
     * Search using DuckDuckGo (No API key required, free)
     * @param {string} query - Search query
     * @param {number} count - Number of results (default 3)
     * @returns {Promise<Array>} Array of search results
     */
    async searchWeb(query, count = 3) {
        try {
            console.log(`🔍 Searching web for: "${query}"`);
            
            const results = await this.searchDuckDuckGo(query);
            const limited = results.slice(0, count);
            
            console.log(`✅ Found ${limited.length} search results`);
            return limited;
        } catch (error) {
            console.error('❌ Web search error:', error.message);
            return [];
        }
    }

    /**
     * Search using DuckDuckGo (No API key required)
     */
    searchDuckDuckGo(query) {
        return new Promise((resolve, reject) => {
            try {
                const searchQuery = encodeURIComponent(query);
                const url = `https://api.duckduckgo.com/?q=${searchQuery}&format=json&no_html=1`;

                https.get(url, { timeout: 5000 }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => { data += chunk; });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            const results = this.formatDuckDuckGoResults(parsed, query);
                            resolve(results);
                        } catch (e) {
                            reject(new Error('Failed to parse search results'));
                        }
                    });
                }).on('error', reject);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Format DuckDuckGo results
     */
    formatDuckDuckGoResults(data, query) {
        const results = [];

        // Extract from RelatedTopics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 3).forEach((topic) => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.substring(0, 100),
                        url: topic.FirstURL,
                        snippet: topic.Text.substring(0, 150)
                    });
                }
            });
        }

        // Extract from AbstractText if available
        if (data.AbstractText) {
            results.unshift({
                title: query,
                url: data.AbstractURL || '#',
                snippet: data.AbstractText.substring(0, 200)
            });
        }

        return results.slice(0, 3);
    }

    /**
     * Format search results for AI context
     */
    formatSearchResults(results) {
        if (results.length === 0) {
            return 'Không tìm thấy kết quả tìm kiếm.';
        }

        return results.map((r, i) => 
            `${i + 1}. ${r.title}\n   ${r.snippet}\n   Nguồn: ${r.url}`
        ).join('\n\n');
    }

    /**
     * Search for event-related information
     */
    async searchEventInfo(eventTitle, eventDate) {
        const query = `${eventTitle} ${eventDate} sự kiện`;
        return await this.searchWeb(query, 3);
    }

    /**
     * Search for productivity tips
     */
    async searchProductivityTips(keyword) {
        const query = `${keyword} mẹo năng suất 2025`;
        return await this.searchWeb(query, 3);
    }
}

module.exports = new WebSearchService();
