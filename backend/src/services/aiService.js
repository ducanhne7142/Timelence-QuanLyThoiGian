const { GoogleGenerativeAI } = require('@google/generative-ai');
const { differenceInHours, differenceInMinutes } = require('date-fns');
const webSearchService = require('./webSearchService');

class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    calculatePriorityScore(event) {
        let score = 0;
        const reasons = [];
        const now = new Date();
        const eventStart = new Date(event.start_time);
        const hoursUntilEvent = differenceInHours(eventStart, now);

        if (hoursUntilEvent <= 1) {
            score += 40;
            reasons.push('Bắt đầu trong 1 giờ tới');
        } else if (hoursUntilEvent <= 3) {
            score += 30;
            reasons.push('Bắt đầu trong 3 giờ');
        } else if (hoursUntilEvent <= 6) {
            score += 20;
            reasons.push('Bắt đầu trong 6 giờ');
        } else if (hoursUntilEvent <= 24) {
            score += 10;
            reasons.push('Bắt đầu trong 24 giờ');
        } else {
            score += 5;
        }

        const categoryPriority = {
            'work': 25, 'urgent': 25, 'important': 20, 'deadline': 25,
            'health': 22, 'meeting': 18, 'education': 15, 'personal': 10
        };
        const catName = (event.category_name || '').toLowerCase();
        let catScore = 10;
        for (const [key, val] of Object.entries(categoryPriority)) {
            if (catName.includes(key)) catScore = val;
        }
        score += catScore;

        const durationMins = differenceInMinutes(new Date(event.end_time), eventStart);
        if (durationMins >= 120) score += 15;
        else if (durationMins >= 60) score += 10;
        else if (durationMins >= 30) score += 5;

        if (event.reminders && event.reminders.length > 0) {
            score += 10;
            reasons.push(`${event.reminders.length} nhắc nhở đã đặt`);
        }

        if (event.location) score += 5;

        let level = 'low';
        if (score >= 70) level = 'critical';
        else if (score >= 50) level = 'high';
        else if (score >= 30) level = 'medium';

        return { 
            total: score, 
            level, 
            reason: reasons, 
            urgencyPercent: Math.min(100, hoursUntilEvent <= 1 ? 100 : (1 - hoursUntilEvent / 24) * 100) 
        };
    }

    async analyzePriority(events) {
        if (!events || events.length === 0) return { data: [], categorized: {} };

        const analyzed = events.map(e => ({
            ...e,
            ...this.calculatePriorityScore(e)
        })).sort((a, b) => b.total - a.total);

        return {
            data: analyzed,
            categorized: {
                critical: analyzed.filter(e => e.level === 'critical'),
                high: analyzed.filter(e => e.level === 'high'),
                medium: analyzed.filter(e => e.level === 'medium'),
                low: analyzed.filter(e => e.level === 'low')
            }
        };
    }

    findFreeTimeSlots(events, dayStart, dayEnd) {
        if (!events || events.length === 0) {
            return [{
                start: dayStart,
                end: dayEnd,
                durationHours: differenceInHours(dayEnd, dayStart),
                available: true
            }];
        }

        const sorted = events.slice().sort((a, b) => 
            new Date(a.start_time) - new Date(b.start_time)
        );

        const slots = [];
        let currentTime = new Date(dayStart);

        for (const event of sorted) {
            const eventStart = new Date(event.start_time);
            if (currentTime < eventStart) {
                slots.push({
                    start: new Date(currentTime),
                    end: new Date(eventStart),
                    durationHours: differenceInHours(eventStart, currentTime),
                    available: true
                });
            }
            currentTime = new Date(event.end_time);
        }

        if (currentTime < new Date(dayEnd)) {
            slots.push({
                start: new Date(currentTime),
                end: new Date(dayEnd),
                durationHours: differenceInHours(dayEnd, currentTime),
                available: true
            });
        }

        return slots.filter(s => s.durationHours >= 0.5);
    }

    // Format time schedule for hourly view
    getHourlySchedule(events, dayDate) {
        const dayStart = new Date(dayDate);
        dayStart.setHours(6, 0, 0, 0); // Start from 6 AM
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 0, 0, 0); // End at 11 PM

        const schedule = [];
        for (let hour = 6; hour < 23; hour++) {
            const hourStart = new Date(dayDate);
            hourStart.setHours(hour, 0, 0, 0);
            const hourEnd = new Date(dayDate);
            hourEnd.setHours(hour + 1, 0, 0, 0);

            const eventsInHour = events.filter(e => {
                const eStart = new Date(e.start_time);
                const eEnd = new Date(e.end_time);
                return (eStart < hourEnd && eEnd > hourStart);
            });

            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            schedule.push({
                hour,
                timeStr,
                isBusy: eventsInHour.length > 0,
                events: eventsInHour,
                status: eventsInHour.length > 0 ? '❌ Đã có lịch' : '✅ Rảnh'
            });
        }

        return schedule;
    }

    // Suggest best time slots for scheduling
    suggestBestScheduleSlots(events, durationMins = 60) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEvents = events.filter(e => {
            const eDate = new Date(e.start_time);
            return eDate >= today && eDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        const dayStart = new Date(today);
        dayStart.setHours(8, 0, 0, 0);
        const dayEnd = new Date(today);
        dayEnd.setHours(22, 0, 0, 0);

        const freeSlots = this.findFreeTimeSlots(todayEvents, dayStart, dayEnd);
        const suitableSlots = freeSlots.filter(slot => slot.durationHours * 60 >= durationMins);

        // Sort by morning/afternoon preference
        suitableSlots.sort((a, b) => {
            const aHour = a.start.getHours();
            const bHour = b.start.getHours();
            
            // Prefer mid-morning (9-11) and mid-afternoon (14-16)
            const aScore = Math.abs(aHour - 10) < Math.abs(aHour - 15) 
                ? Math.abs(aHour - 10) 
                : Math.abs(aHour - 15);
            const bScore = Math.abs(bHour - 10) < Math.abs(bHour - 15) 
                ? Math.abs(bHour - 10) 
                : Math.abs(bHour - 15);
            
            return aScore - bScore;
        });

        return suitableSlots.slice(0, 5); // Return top 5 suggestions
    }

    async suggestScheduleTime(events, durationMins = 60) {
        // Convert minutes to hours
        const durationHours = durationMins / 60;
        const now = new Date();
        const nextDays = [];

        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(now);
            dayStart.setDate(dayStart.getDate() + i);
            dayStart.setHours(8, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(22, 0, 0, 0);

            // Get all events for this day
            const dayEvents = events.filter(e => {
                if (!e.start_time) return false;
                const eStart = new Date(e.start_time);
                const eDate = new Date(eStart.getFullYear(), eStart.getMonth(), eStart.getDate());
                const checkDate = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate());
                return eDate.getTime() === checkDate.getTime();
            });

            console.log(`📅 Day ${i}: ${dayStart.toDateString()}, Events: ${dayEvents.length}`);

            const slots = this.findFreeTimeSlots(dayEvents, dayStart, dayEnd);
            
            for (const slot of slots) {
                console.log(`  Slot: ${slot.durationHours.toFixed(1)}h (need ${durationHours}h)`);
                if (slot.durationHours >= durationHours) {
                    const endTime = new Date(slot.start.getTime() + durationMins * 60000);
                    nextDays.push({
                        date: dayStart.toLocaleDateString('vi-VN'),
                        day: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `${i} ngày tới`,
                        start: slot.start.toISOString(),
                        end: endTime.toISOString(),
                        reason: `Có ${slot.durationHours.toFixed(1)}h rảnh`,
                        availableSlots: slots.map(s => ({
                            start: s.start.toISOString(),
                            end: s.end.toISOString(),
                            durationMins: s.durationHours * 60
                        }))
                    });
                    if (nextDays.length >= 3) break;
                }
            }

            if (nextDays.length >= 3) break;
        }

        console.log(`✅ Found ${nextDays.length} suggestions`);
        return nextDays;
    }

    async chatWithAI(userMessage, events = []) {
        try {
            console.log('🤖 chatWithAI called with message:', userMessage);
            console.log('📋 Total events:', events ? events.length : 0);
            
            const eventSummary = events && events.length > 0 
                ? `Lịch của user hôm nay: ${events.map(e => `"${e.title}" (${new Date(e.start_time).getHours()}:${String(new Date(e.start_time).getMinutes()).padStart(2, '0')})`).join(', ')}`
                : 'User chưa có sự kiện nào hôm nay.';

            console.log('📅 Event summary:', eventSummary);
            console.log('🔑 Gemini API Key exists:', !!process.env.GEMINI_API_KEY);

            const systemPrompt = `Bạn là AI assistant quản lý lịch thông minh. ${eventSummary}. 
                    Trả lời tiếng Việt. Giúp user hỏi về sự kiện, thời gian rảnh, ưu tiên công việc.
                    Câu trả lời ngắn (max 100 từ), dễ hiểu, hữu ích. Không trả lời những câu hỏi không liên quan đến lịch.`;

            const fullMessage = `${systemPrompt}\n\nCâu hỏi: ${userMessage}`;

            console.log('🚀 Calling Gemini API...');
            try {
                const result = await this.model.generateContent(fullMessage);
                const response = await result.response;
                const text = response.text();

                console.log('✅ Gemini response received');
                return text;
            } catch (geminiError) {
                console.error('⚠️ Gemini API Error Details:');
                console.error('  Error Message:', geminiError.message);
                console.error('  Full Error:', geminiError);
                console.warn('⚠️ Gemini API failed, using fallback local AI');
                // Fallback to local pattern matching
                return this.answerQuestion(userMessage, events);
            }
        } catch (error) {
            console.error('❌ ChatWithAI Error:', error.message);
            console.error('Error details:', error);
            // Final fallback - generic response
            return 'Xin lỗi, AI gặp lỗi. Vui lòng thử lại sau.';
        }
    }

    // Format events for display
    formatEventDetails(event) {
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
        const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        const duration = Math.round((end - start) / (1000 * 60 / 60) * 10) / 10; // hours
        
        let details = `📌 ${event.title} (${startTime} - ${endTime})`;
        if (event.location) details += ` 📍 ${event.location}`;
        if (event.description) details += ` 📝 ${event.description}`;
        return details;
    }

    // Get priority level with emoji
    getPriorityEmoji(level) {
        switch(level) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    }

    // Get priority description
    getPriorityDescription(level) {
        switch(level) {
            case 'critical': return 'CẦP BẠC CAO - ƯU TIÊN NGAY';
            case 'high': return 'Quan trọng - Ưu tiên';
            case 'medium': return 'Bình thường';
            case 'low': return 'Thấp';
            default: return 'Chưa xác định';
        }
    }

    // Local AI - Pattern matching for common questions
    answerQuestion(question, events = []) {
        const q = question.toLowerCase();
        
        // Count total events
        const totalEvents = events ? events.length : 0;
        
        // Analyze today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(today);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        
        const todayEvents = events.filter(e => {
            const eDate = new Date(e.start_time);
            return eDate >= today && eDate < tomorrowStart;
        }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

        // Calculate priority scores for today's events (real-time)
        const todayEventsWithPriority = todayEvents.map(e => ({
            ...e,
            ...this.calculatePriorityScore(e)
        }));

        // Check if user is asking to schedule/arrange schedule
        if (q.includes('xếp lịch') || q.includes('arrange') || q.includes('schedule') || q.includes('lên lịch')) {
            console.log('📅 Scheduling request detected');
            
            // Get hourly view for today
            const hourlySchedule = this.getHourlySchedule(todayEvents, today);
            
            // Build hourly timeline display
            let response = '📊 **LỊCh HÔM NAY THEO GIỜ**:\n\n';
            response += '⏰ Khung giờ | 📌 Trạng thái\n';
            response += '─'.repeat(40) + '\n';
            
            for (const slot of hourlySchedule) {
                if (slot.isBusy) {
                    const eventName = slot.events[0]?.title || 'Sự kiện';
                    response += `${slot.timeStr} - ${String(slot.hour + 1).padStart(2, '0')}:00 | ❌ ${eventName}\n`;
                } else {
                    response += `${slot.timeStr} - ${String(slot.hour + 1).padStart(2, '0')}:00 | ✅ Rảnh\n`;
                }
            }

            response += '\n📍 **GỢI Ý XẾP LỊCH HÔNG NAY**:\n\n';
            
            // Get suggestions
            const suggestions = this.suggestBestScheduleSlots(events, 60);
            
            if (suggestions.length === 0) {
                response += '😅 Hôm nay bạn khá bận! Không có slot 1h rảnh liên tục.\n';
                response += '💡 Gợi ý: Xây lịch vào ngày khác hoặc chia nhỏ thời gian họp.';
            } else {
                response += `✨ Có ${suggestions.length} khung giờ phù hợp để xếp lịch 1h:\n\n`;
                
                suggestions.forEach((slot, index) => {
                    const startTime = slot.start.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
                    const endTime = slot.end.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
                    const quality = index === 0 ? '⭐⭐⭐ Tối ưu' : index === 1 ? '⭐⭐ Tốt' : '⭐ Có thể';
                    
                    response += `${index + 1}. ${startTime} - ${endTime}`;
                    response += ` (${Math.round(slot.durationHours * 60)} phút) ${quality}\n`;
                });
                
                response += '\n💡 Gợi ý: Những slot sáng (9-11h) hoặc chiều (14-16h) thường tốt nhất!';
            }

            return response;
        }

        // Check if user is asking about today's events (list all)
        if (q.includes('hôm nay') && (q.includes('có gì') || q.includes('sự kiện') || q.includes('lịch') || q.includes('làm gì'))) {
            if (todayEvents.length === 0) {
                return '📅 Hôm nay bạn không có sự kiện nào. Bạn có thời gian hoàn toàn rảnh!';
            }
            const eventsList = todayEvents.map(e => this.formatEventDetails(e)).join('\n');
            const totalDuration = todayEvents.reduce((sum, e) => {
                return sum + (new Date(e.end_time) - new Date(e.start_time)) / (1000 * 60 * 60);
            }, 0);
            return `📅 Hôm nay bạn có ${todayEvents.length} sự kiện (tổng ${Math.round(totalDuration * 10) / 10}h):\n${eventsList}`;
        }

        // Check if user is asking about important/urgent events
        if (q.includes('quan trọng') || q.includes('urgent') || q.includes('khẩn') || q.includes('cấp bách') || q.includes('ưu tiên')) {
            // Separate by priority level
            const criticalEvents = todayEventsWithPriority.filter(e => e.level === 'critical');
            const highEvents = todayEventsWithPriority.filter(e => e.level === 'high');
            const mediumEvents = todayEventsWithPriority.filter(e => e.level === 'medium');

            if (criticalEvents.length === 0 && highEvents.length === 0) {
                return '✅ Hôm nay không có sự kiện quan trọng nào. Bạn có thể xếp lịch thêm hoặc nghỉ ngơi!';
            }

            let response = '📊 **Sự kiện quan trọng hôm nay**:\n\n';

            if (criticalEvents.length > 0) {
                response += `🔴 **CẦP BẠC CAO (ưu tiên ngay)**:\n`;
                criticalEvents.forEach(e => {
                    const emoji = e.level === 'critical' ? '🔴' : '🟠';
                    response += `${emoji} ${e.title} (${Math.round(e.total)} điểm)\n`;
                    response += `   ⏰ ${new Date(e.start_time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}\n`;
                    if (e.reason.length > 0) {
                        response += `   📌 ${e.reason.join(', ')}\n`;
                    }
                });
                response += '\n';
            }

            if (highEvents.length > 0) {
                response += `🟠 **Quan trọng (ưu tiên)**:\n`;
                highEvents.forEach(e => {
                    response += `🟠 ${e.title} (${Math.round(e.total)} điểm)\n`;
                    response += `   ⏰ ${new Date(e.start_time).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}\n`;
                });
            }

            return response.trim();
        }

        // Check if user is busy
        const isBusy = todayEvents.length > 0;
        const busyHours = todayEvents.reduce((sum, e) => 
            sum + (new Date(e.end_time) - new Date(e.start_time)) / (1000 * 60 * 60), 0);

        // Response logic for "bận/rảnh"
        if (q.includes('bận') || q.includes('rảnh') || q.includes('free')) {
            if (isBusy) {
                return `⏰ Hôm nay bạn có ${todayEvents.length} sự kiện, bận khoảng ${Math.round(busyHours * 10) / 10}h. Bạn còn ${Math.round((24 - busyHours) * 10) / 10}h rảnh.`;
            } else {
                return '✨ Hôm nay bạn hoàn toàn rảnh! Có thể xếp lịch mới hoặc nghỉ ngơi.';
            }
        }

        if (q.includes('nào') && (q.includes('rảnh') || q.includes('trống'))) {
            const freeDays = [];
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date();
                checkDate.setDate(checkDate.getDate() + i);
                const checkEnd = new Date(checkDate);
                checkEnd.setDate(checkEnd.getDate() + 1);
                
                const dayEvents = events.filter(e => {
                    const eDate = new Date(e.start_time);
                    return eDate >= checkDate && eDate < checkEnd;
                });

                if (dayEvents.length === 0) {
                    const dayName = ['Hôm nay', 'Ngày mai', `${i} ngày tới`][i] || `${i} ngày tới`;
                    freeDays.push(dayName);
                    if (freeDays.length >= 3) break;
                }
            }
            return freeDays.length > 0 
                ? `📆 Các ngày rảnh: ${freeDays.join(', ')}`
                : '😅 Bạn khá bận trong 7 ngày tới!';
        }

        if (q.includes('công việc') || q.includes('task') || q.includes('nhiệm vụ')) {
            const workEvents = todayEvents.filter(e => 
                e.title && (e.title.toLowerCase().includes('work') || 
                           e.title.toLowerCase().includes('việc') ||
                           e.title.toLowerCase().includes('task'))
            );
            if (workEvents.length > 0) {
                const workList = workEvents.map(e => this.formatEventDetails(e)).join('\n');
                return `💼 Công việc hôm nay (${workEvents.length} cái):\n${workList}`;
            } else {
                return '✅ Bạn không có công việc gì hôm nay!';
            }
        }

        // Default response
        if (totalEvents > 0) {
            return `📊 Bạn có ${totalEvents} sự kiện trong lịch. Hôm nay có ${todayEvents.length} cái. Hãy hỏi "Hôm nay có gì?" để xem chi tiết!`;
        } else {
            return '📭 Lịch của bạn trống rỗi! Hãy thêm các sự kiện mới.';
        }
    }

    // Enhanced chat with web search context
    async chatWithWebSearch(message, events = []) {
        try {
            console.log('🌐 Chat with web search:', message);

            // Check if question needs web search
            const needsWebSearch = this.shouldSearchWeb(message);
            let searchContext = '';

            if (needsWebSearch) {
                console.log('📡 Performing web search...');
                const searchResults = await webSearchService.searchWeb(message, 3);
                searchContext = webSearchService.formatSearchResults(searchResults);
            }

            // Build context
            const eventContext = this.formatEventsContext(events);
            const systemPrompt = `Bạn là trợ lý lịch thông minh người Việt. 
Hãy trả lời câu hỏi của người dùng một cách ngắn gọn và hữu ích (1-3 câu).

Thông tin lịch của người dùng:
${eventContext}

${searchContext ? `\nThông tin từ web:\n${searchContext}` : ''}

Nếu được hỏi về thông tin thực tế, hãy sử dụng thông tin web search ở trên.
Nếu được hỏi về lịch cá nhân, hãy sử dụng thông tin lịch.`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            const reply = response.choices[0].message.content;
            console.log('✅ Web search AI response:', reply);
            return reply;
        } catch (error) {
            console.error('❌ Web search chat error:', error.message);
            return this.answerQuestion(message, events);
        }
    }

    // Check if message needs web search
    shouldSearchWeb(message) {
        const searchKeywords = [
            'tin tức', 'news', 'thời tiết', 'weather', 'giá cả', 'price',
            'sự kiện', 'event', 'hội chợ', 'conference', 'công nghệ', 'tech',
            'khuyến nghị', 'suggest', 'gợi ý', 'review', 'đánh giá'
        ];
        
        return searchKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    // Format events for context
    formatEventsContext(events) {
        if (!events || events.length === 0) {
            return 'Không có sự kiện nào.';
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEvents = events.filter(e => {
            const eDate = new Date(e.start_time);
            eDate.setHours(0, 0, 0, 0);
            return eDate.getTime() === today.getTime();
        });

        if (todayEvents.length === 0) {
            return 'Hôm nay không có sự kiện.';
        }

        return `Hôm nay có ${todayEvents.length} sự kiện: ${todayEvents.map(e => e.title).join(', ')}`;
    }

    /**
     * Chat with web search enabled
     * Searches web for relevant info and includes in AI context
     */
    async chatWithWebSearch(userMessage, events = []) {
        try {
            console.log('🌐 Chat with web search enabled');
            
            // Detect if user is asking for real-time info
            const needsSearch = this.shouldSearchWeb(userMessage);
            
            if (needsSearch) {
                console.log('🔍 Performing web search for context...');
                const searchResults = await webSearchService.searchWeb(userMessage, 2);
                const formattedResults = webSearchService.formatSearchResults(searchResults);
                
                return await this.chatWithAI(
                    `${userMessage}\n\n[Kết quả tìm kiếm web:\n${formattedResults}]`,
                    events
                );
            } else {
                // Regular chat without web search
                return await this.chatWithAI(userMessage, events);
            }
        } catch (error) {
            console.error('❌ Web search chat error:', error.message);
            return await this.chatWithAI(userMessage, events);
        }
    }

    /**
     * Detect if question needs web search
     */
    shouldSearchWeb(message) {
        const searchKeywords = [
            'tin tức', 'news', 'hôm nay', 'mới nhất', 'latest',
            'thời tiết', 'weather', 'sự kiện', 'event',
            'hội thảo', 'hội nghị', 'seminar', 'conference',
            'con số', 'statistics', 'thống kê',
            'giá', 'price', 'chi phí', 'cost'
        ];

        const lowerMessage = message.toLowerCase();
        return searchKeywords.some(keyword => lowerMessage.includes(keyword));
    }
}

module.exports = new AIService();