const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const puppeteer = require('puppeteer');


const writeStream = fs.createWriteStream('post.csv');

writeStream.write(`Title, Year, Rating, Image \n`)

const baseUrl = '[insert_url_here]';

async function start(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US'
    });

    await page.goto(url);  
    const pageContent = await page.content(); 
    ws = fs.createWriteStream('source.html')
    ws.write(pageContent);
    await browser.close();
}

async function getPageCount() {
    const response = start(baseUrl).then(() => {
        const $ = cheerio.load(fs.readFileSync('source.html'));
        const titleCount = $('.lister-total-num-results').text().replace(/\s\s+/g, '').replace(/\D/g, '');
        const pageCount = Math.ceil(titleCount / 100);
        return pageCount;
    });

    return response;
}

(async () => {
    console.log('Retrieving number of pages...');
    const pageCount = await getPageCount();
    console.log(`Found ${pageCount} pages.\nScraping...`);
    for (let i = 1; i <= pageCount; i++) {
        start(`${baseUrl}&page=${i}`).then(() => {
            const $ = cheerio.load(fs.readFileSync('source.html'));
        
            $('.lister-item').each((i, el) => {
                const content = $(el).find('.lister-item-content');
        
                const header = content.children('.lister-item-header');
                const title = header.children('a').text();
                const year = header.children('.lister-item-year').text()
        
                let rating = content.children('.ipl-rating-widget').children('.ipl-rating-star').children('.ipl-rating-star__rating').text()
                if (rating == '') {
                    rating = 'N/A';
                }
        
                let image = $(el).children('.lister-item-image').children('a').children('img').attr('loadlate');
                if (image == undefined) {
                    image = $(el).children('.lister-item-image').children('a').children('img').attr('src');
                }
        
                writeStream.write(`"${title}", ${year}, ${rating}, "${image}" \n`);
            });
        });
    }
    console.log(`Done!\nDataset saved to post.csv`);
})();
