const fs = require('fs');
const axios = require('axios');
const Browser = require('./browser');
const FFMPEG = require('fluent-ffmpeg');

const execute = async() => {
    console.log(`Opening browser...`);
    const b = await Browser.createBrowser();
    const tab = await Browser.makeNewTab(b);
    console.log(`Opening the KHInsider OST...`);
    await tab.goto(`https://downloads.khinsider.com/game-soundtracks/album/${process.argv[2]}`);
    await tab.waitForTimeout(1000);
    const links = await tab.evaluate(() => {
        const ret = [];
        const items = document.getElementById('songlist').children[0].children;
        for (let idx in items) {
            const item = items[idx];
            if (["songlist_header", "songlist_footer"].indexOf(item.id) == -1) {
                const link = item.children;
                if (link) {
                    ret.push(link[3].children[0].href);
                }
            }
        }
        return ret;
    });
    await downloadSong(tab, links, 0);
    await tab.waitForTimeout(3000);
    await tab.close();
    await b.close();
}

const downloadSong = async (tab, list, idx) => {
    let songName = list[idx].split('/');
    songName = songName[songName.length - 1];
    songName = decodeURIComponent(decodeURIComponent(songName));
    console.log(`Downloading song ${idx + 1} of ${list.length} (${songName})...`);
    await tab.goto(list[idx]);
    await tab.waitForTimeout(2000);
    const songLink = await tab.evaluate(() => {
        return document.querySelector('audio').src;
    });
    const {data: song} = await axios.get(songLink, {responseType: 'arraybuffer', headers: {
        'Content-Type': 'audio/mpeg',
    }});
    console.log(`Writing to disk...`);
    try {
        await fs.mkdirSync(`./results`);
    } catch {}
    try {
        await fs.mkdirSync(`./results/${process.argv[2]}`);
    } catch {}
    try {
        await fs.mkdirSync(`/tmp`);
    } catch {}
    try {
        await fs.mkdirSync(`/tmp/${process.argv[2]}`);
    } catch {}
    await fs.writeFileSync(`/tmp/${process.argv[2]}/${songName}`, song);

    FFMPEG(`/tmp/${process.argv[2]}/${songName}`)
    .output(`./results/${process.argv[2]}/${songName}`)
    .on('error', function(err) {
        console.log('An error occurred: ' + err.message);
    })
    .on('end', function() {
        console.log('Processing finished !');
    })
    .run();

    console.log(`Downloaded successfully`);
    if ((idx + 1) >= list.length) {
        return true;
    } else {
        await downloadSong(tab, list, ++idx);
    }
}

execute();
