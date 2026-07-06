const express = require('express');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-client');

const app = express();
app.use(express.json());

// الكود مجهز الآن ليقرأ البيانات تلقائياً من إعدادات السيرفر الخارجي (Environment Variables)
const SUPABASE_URL = https://zzguillmxjngmtedbjvt.supabase.co/rest/v1/bots;
const SUPABASE_KEY = sb_publishable_c92ouwkc2uJxqs9JpY9w0w_ixDmLZvT;
const supabase = createClient(https://zzguillmxjngmtedbjvt.supabase.co/rest/v1/bots, sb_publishable_c92ouwkc2uJxqs9JpY9w0w_ixDmLZvT);

const activeTimers = {};
const channelMessageIndex = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/add-bot', async (req, res) => {
    const { token, channel, delaySeconds } = req.body;
    try {
        const { error } = await supabase.from('bots').insert([{
            token: token,
            channel: channel,
            delaySeconds: delaySeconds || 60,
            isSelected: true,
            messages: ["Hello Guys!", "Nice Stream!", "Good Luck 🔥", "Ledo Kick Here!"]
        }]);
        if (error) throw error;
        res.sendStatus(200);
        startLedoEngine();
    } catch (err) {
        res.status(500).send(err.message);
    }
});

async function getRealAccountName(token) {
    try {
        const response = await axios.get('https://kick.com/api/v1/user', {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        return response.data.username || "حساب غير معروف";
    } catch { return "توكن غير صالح"; }
}

async function startLedoEngine() {
    try {
        const { data: bots, error } = await supabase.from('bots').select('*').eq('isSelected', true);
        if (error || !bots || bots.length === 0) return;

        for (const bot of bots) {
            const token = bot.token;
            const channelSlug = bot.channel;
            const messages = bot.messages || [];
            const customDelaySeconds = bot.delaySeconds || 60;
            const delayMillis = customDelaySeconds * 1000;

            if (!token || !channelSlug) continue;
            if (activeTimers[channelSlug]) continue;

            const realAccountName = await getRealAccountName(token);
            channelMessageIndex[channelSlug] = 0;

            console.log(`🟢 مكنة نشطة لقناة: ${channelSlug} | الحساب الحقيقي: [ ${realAccountName} ] | تعمل كل ${customDelaySeconds} ثانية`);

            const timer = setInterval(async () => {
                try {
                    const channelCheck = await axios.get(`https://kick.com/api/v1/channels/${channelSlug}`, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    if (channelCheck.data.is_live && messages.length > 0) {
                        const currentIndex = channelMessageIndex[channelSlug];
                        const currentMessage = messages[currentIndex];
                        channelMessageIndex[channelSlug] = (currentIndex + 1) % messages.length;

                        const formattedMessage = `Send ${currentMessage} in https://kick.com/popout/${channelSlug}/chat`;

                        await axios.post('https://kick.com/api/v2/messages', {
                            content: formattedMessage, type: "text", channel: channelSlug
                        }, {
                            headers: { 
                                'Authorization': `Bearer ${token}`, 
                                'Content-Type': 'application/json',
                                'User-Agent': 'Mozilla/5.0'
                            }
                        });
                        console.log(`🚀 الحساب [${realAccountName}] أرسل بنجاح في بث ${channelSlug}`);
                    }
                } catch {
                    console.log(`⚠️ فحص دوري صامت في الخلفية لقناة ${channelSlug}...`);
                }
            }, delayMillis);

            activeTimers[channelSlug] = timer;
        }
    } catch (e) { console.log("⚠️ خطأ في السوبابيز: " + e.message); }
}

startLedoEngine();
setInterval(startLedoEngine, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 الماكينة تعمل الآن بنجاح على بورت: ${PORT}`);
});
