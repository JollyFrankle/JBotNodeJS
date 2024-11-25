import { Request, Response } from "express";
import puppeteer, { Browser } from "puppeteer-core";

let browser: Browser | null = null
async function getBrowser() {
    if (browser?.connected) {
        console.log("Reusing existing browser")
        return browser
    } else {
        console.log("Creating new browser")
        browser = await puppeteer.connect({
            browserWSEndpoint: "ws://107.174.88.213:3000"
        });
        return browser
    }
}
getBrowser()

function sanitizeInput(input: any, type: 'string' | 'number' | 'boolean', required: boolean = false) {
    if (input === null || input === undefined) {
        if (required) {
            throw new Error("Missing required input");
        } else {
            return undefined;
        }
    }
    if (type === "string") {
        return input.toString();
    } else if (type === "number") {
        return Number(input);
    } else if (type === "boolean") {
        return input.toString().toLowerCase() === "true" || input === 1 || input === true;
    } else {
        return input;
    }
}

export default class PptrAASController {
    static async htmlToPdf(req: Request, res: Response) {
        const ALLOWED_FORMATS = ["Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", "A6"];

        try {
            const reqOptions = req.body.options;
            const reqHtml = req.body.html;
            if (!reqHtml) {
                return res.status(400).json({
                    error: "Missing required input",
                })
            }
            // PDFOptions
            const options = {
                scale: sanitizeInput(reqOptions?.scale, "number"),
                displayHeaderFooter: sanitizeInput(reqOptions?.displayHeaderFooter, "boolean"),
                headerTemplate: sanitizeInput(reqOptions?.headerTemplate, "string"),
                footerTemplate: sanitizeInput(reqOptions?.footerTemplate, "string"),
                printBackground: sanitizeInput(reqOptions?.printBackground, "boolean"),
                landscape: sanitizeInput(reqOptions?.landscape, "boolean"),
                pageRanges: sanitizeInput(reqOptions?.pageRanges, "string"),
                format: reqOptions?.format?.includes(ALLOWED_FORMATS) ? reqOptions?.format : undefined,
                width: sanitizeInput(reqOptions?.width, "string"),
                height: sanitizeInput(reqOptions?.height, "string"),
                margin: reqOptions?.margin ? {
                    top: sanitizeInput(reqOptions?.margin?.top, "string"),
                    right: sanitizeInput(reqOptions?.margin?.right, "string"),
                    bottom: sanitizeInput(reqOptions?.margin?.bottom, "string"),
                    left: sanitizeInput(reqOptions?.margin?.left, "string"),
                } : undefined,
                preferCSSPageSize: sanitizeInput(reqOptions?.preferCSSPageSize, "boolean"),
            }

            const browser = await getBrowser();

            const page = await browser.newPage();

            await page.setContent(reqHtml, {
                waitUntil: "networkidle0",
            });

            const pdf = await page.pdf(options);

            await page.close();

            res.statusCode = 200;
            res.setHeader("Content-Type", `application/pdf`);
            res.end(pdf);
        } catch (err) {
            console.log(err);
            res.statusCode = 500;
            res.json({
                error: (err as any).toString(),
            });
            res.end();
        }
    }

    static async htmlToImg(req: Request, res: Response) {
        const ALLOWED_TYPES = ["jpeg", "webp", "png"];

        try {
            const reqOptions = req.body.options;
            const reqHtml = req.body.html;
            const reqViewport = req.body.viewport;
            if (!reqHtml) {
              return res.status(400).json({
                error: "Missing required input",
              })
            }
            // SS Options
            const options = {
              optimizeForSpeed: sanitizeInput(reqOptions?.optimizeForSpeed, "boolean"),
              type: reqOptions?.type?.includes(ALLOWED_TYPES) ? reqOptions?.type : undefined,
              quality: sanitizeInput(reqOptions?.quality, "number"),
              fromSurface: sanitizeInput(reqOptions?.fromSurface, "boolean"),
              clip: reqOptions?.clip ? {
                x: sanitizeInput(reqOptions?.clip?.x, "number"),
                y: sanitizeInput(reqOptions?.clip?.y, "number"),
                width: sanitizeInput(reqOptions?.clip?.width, "number"),
                height: sanitizeInput(reqOptions?.clip?.height, "number"),
              } : undefined,
              fullPage: sanitizeInput(reqOptions?.fullPage, "boolean"),
            }

            const viewport = {
              width: sanitizeInput(reqViewport?.width, "number"),
              height: sanitizeInput(reqViewport?.height, "number"),
              deviceScaleFactor: sanitizeInput(reqViewport?.deviceScaleFactor, "number"),
              isMobile: sanitizeInput(reqViewport?.isMobile, "boolean"),
              hasTouch: sanitizeInput(reqViewport?.hasTouch, "boolean"),
              isLandscape: sanitizeInput(reqViewport?.isLandscape, "boolean"),
            }

            const browser = await getBrowser();

            const page = await browser.newPage();

            await page.setViewport(viewport);

            await page.setContent(reqHtml, {
              waitUntil: "networkidle0",
            });

            const file = await page.screenshot(options);

            await page.close();

            res.statusCode = 200;
            res.setHeader("Content-Type", `image/${options.type}`);
            res.end(file);
          } catch (err) {
            console.log(err);
            res.statusCode = 500;
            res.json({
              error: (err as any).toString(),
            });
            res.end();
          }
    }
}