const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer')

router.get('/' , (req, res, next) => {
    const createPdf = async () => {
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        const options = {
            path: 'pdf/web.pdf',
            format: 'A4',
            printBackground: true,
        }

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: './pdf'
        });

        await page.goto('http://ezqual.fr/devis/facture_html/facture_communication.php?id=32', { waitUntil: 'networkidle0'})
        await page.pdf(options)

        await browser.close()
    }

    createPdf()
});

module.exports = router;