// Search-focused editorial copy for actual tools; no fabricated ratings, search volumes or features.
export type ToolSeo={title:string;description:string;guide:string;related:string[]};
const entries:Record<string,[string,string,string,string]>={
  "word-counter": [
    "Word Counter Online – Count Words & Characters",
    "Count words, characters and lines in your text. Check article length, captions and writing drafts directly in your browser.",
    "Paste your draft to check length before submitting an assignment or publishing a caption. Counts can differ from another editor if it treats punctuation or whitespace differently.",
    "text-sorter,text-compare,case-converter"
  ],
  "case-converter": [
    "Text Case Converter Online – Uppercase & Lowercase",
    "Change the capitalization of text without retyping it. Useful for headings, labels, documents and copied text.",
    "Paste text, choose the case option and review names and acronyms before copying the result.",
    "word-counter,text-sorter,text-reverser"
  ],
  "text-reverser": [
    "Text Reverser Online – Reverse Characters",
    "Reverse the order of characters in a text string for puzzles, testing or creative writing.",
    "Paste a short string to reverse it. Reversed text is not encryption and should not be used to protect confidential information.",
    "case-converter,word-counter,text-compare"
  ],
  "password-generator": [
    "Random Password Generator Online",
    "Generate random passwords with configurable length and character options for stronger account security.",
    "Choose a long password and save it in a trusted password manager. Use a different password for each account.",
    "uuid-generator,sha-file-checker"
  ],
  "uuid-generator": [
    "UUID v4 Generator Online – Random UUID",
    "Create random version 4 UUID identifiers for database records, test data and application development.",
    "Generate an identifier when you need a unique record key. A UUID is not a password or authentication token.",
    "password-generator,json-formatter"
  ],
  "json-formatter": [
    "JSON Formatter & Validator Online",
    "Format and validate JSON data for easier reading, API debugging and configuration editing.",
    "Paste JSON and check validation before copying. JSON requires quoted property names and does not allow trailing commas.",
    "json-to-csv,csv-to-json,base64-encoder"
  ],
  "base64-encoder": [
    "Base64 Encoder & Decoder Online",
    "Encode text to Base64 or decode Base64 back to text in your browser.",
    "Use Base64 for data transport, not secrecy. Encoded information can be decoded by anyone with access to it.",
    "image-to-base64,url-encoder"
  ],
  "url-encoder": [
    "URL Encoder & Decoder Online",
    "Encode and decode URI components for query parameters, links and web development.",
    "Encode individual query values rather than an entire URL when you need to preserve its separators.",
    "utm-campaign-builder,base64-encoder"
  ],
  "qr-code-generator": [
    "QR Code Generator Online for Text & Links",
    "Create a QR code from text or a web link, preview the result and export with an eligible plan.",
    "Enter the intended destination and scan the preview before printing or distributing a QR code.",
    "url-encoder,utm-campaign-builder,invoice-generator"
  ],
  "gst-calculator": [
    "GST Calculator India – Inclusive & Exclusive GST",
    "Calculate GST-inclusive or GST-exclusive amounts with a selected tax percentage. Review tax and base amounts online.",
    "For a tax-inclusive price, the base is the total divided by one plus the tax rate. Confirm the applicable GST rate separately.",
    "invoice-generator,percentage-calculator,profit-margin"
  ],
  "percentage-calculator": [
    "Percentage Calculator Online",
    "Calculate a percentage of a number for discounts, marks and everyday calculations.",
    "Enter the percentage and base amount. For example, 15 percent of 200 is 30.",
    "gst-calculator,profit-margin,emi-calculator"
  ],
  "profit-margin": [
    "Profit Margin Calculator Online",
    "Calculate profit and sales margin using cost and selling price. Compare business pricing scenarios.",
    "Profit is selling price minus cost. Margin uses selling price as its denominator, unlike markup.",
    "gst-calculator,percentage-calculator,invoice-generator"
  ],
  "image-resizer": [
    "Image Resizer Online – Change Photo Dimensions",
    "Resize an image to new pixel dimensions in your browser. Preview the result before exporting.",
    "Choose dimensions that fit the destination. Preserve the aspect ratio when stretching would distort a photo.",
    "image-cropper,image-compressor,aspect-ratio-resizer"
  ],
  "image-to-png": [
    "Image to PNG Converter Online",
    "Convert supported images to PNG for editing, graphics or a lossless output format.",
    "PNG can preserve transparency when it exists in the source. Conversion does not restore detail previously lost in a JPEG.",
    "image-to-jpg,image-to-webp,image-compressor"
  ],
  "image-to-jpg": [
    "Image to JPG Converter Online",
    "Convert supported images to JPEG for photo sharing and applications that require JPG files.",
    "JPEG is lossy and does not support transparency. Inspect the converted background and image quality before exporting.",
    "image-to-png,image-compressor,image-to-webp"
  ],
  "image-to-webp": [
    "Image to WebP Converter Online",
    "Convert supported image files to WebP for websites and compatible applications.",
    "Check whether your destination accepts WebP; older software may require JPG or PNG instead.",
    "image-to-jpg,image-to-png,image-compressor"
  ],
  "image-to-pdf": [
    "Image to PDF Converter – Combine Photos Online",
    "Combine supported image files into one PDF document for sharing, forms or document scans.",
    "Select images in the intended reading order and inspect the resulting pages. This is not an OCR text extraction tool.",
    "merge-pdf,rotate-pdf,split-pdf"
  ],
  "text-to-pdf": [
    "Text to PDF Converter Online",
    "Create a PDF document from typed or pasted text in your browser.",
    "Use this for simple text documents. Check line breaks and special characters in the preview or exported file.",
    "image-to-pdf,merge-pdf,resume-builder"
  ],
  "merge-pdf": [
    "Merge PDF Online – Combine PDF Files",
    "Combine multiple PDF documents into one file in the selected order using browser-based PDF processing.",
    "Arrange documents in reading order before merging. Password-protected or malformed files may require other software.",
    "split-pdf,reorder-pdf,pdf-page-numbers"
  ],
  "split-pdf": [
    "Split PDF Online – Extract Selected Pages",
    "Select individual pages or page ranges and export them from a PDF document.",
    "Enter page numbers using the displayed range syntax. Check that the output includes every page you need.",
    "merge-pdf,delete-pdf-pages,reorder-pdf"
  ],
  "pdf-compressor": [
    "PDF Optimizer Online – Reduce PDF Overhead",
    "Optimize PDF structure to reduce unnecessary file overhead. Savings vary with the input document.",
    "A scanned PDF may remain large because this tool does not downsample embedded photographs. Compare output size before replacing the original.",
    "merge-pdf,split-pdf,image-compressor"
  ],
  "rotate-pdf": [
    "Rotate PDF Pages Online – 90°, 180°, 270°",
    "Rotate selected PDF pages to correct sideways or upside-down document scans.",
    "Select the affected page range and rotation angle, then verify orientation and readability in the output.",
    "reorder-pdf,split-pdf,image-to-pdf"
  ],
  "pdf-watermark": [
    "Add Text Watermark to PDF Online",
    "Overlay a text watermark on PDF pages for drafts, internal documents or ownership labels.",
    "Choose watermark settings that leave the underlying text legible. A watermark does not prevent someone from editing a document.",
    "protect-pdf,pdf-page-numbers,pdf-metadata"
  ],
  "pdf-page-numbers": [
    "Add Page Numbers to PDF Online",
    "Insert page numbers into an existing PDF for reports, manuals and organized documents.",
    "Check the order of the pages before numbering them. Keep a copy of the original PDF in case the layout needs revision.",
    "reorder-pdf,merge-pdf,pdf-watermark"
  ],
  "reorder-pdf": [
    "Reorder PDF Pages Online",
    "Rearrange PDF pages using a custom page order without manually rebuilding the document.",
    "Enter the desired order and check it against the original. Reordering is useful for correcting mixed-up scanned pages.",
    "delete-pdf-pages,rotate-pdf,merge-pdf"
  ],
  "delete-pdf-pages": [
    "Delete Pages from PDF Online",
    "Remove selected unwanted pages from a PDF and create a revised document.",
    "Identify pages by their actual PDF position, which may differ from printed page labels. Keep the original document.",
    "split-pdf,reorder-pdf,merge-pdf"
  ],
  "protect-pdf": [
    "Password Protect PDF Online – AES-256",
    "Apply AES-256 password encryption to a PDF in your browser using the document protection tool.",
    "Use a strong password and share it through a separate secure channel. Existing encrypted PDFs may not be supported.",
    "password-generator,pdf-watermark,pdf-metadata"
  ],
  "pdf-metadata": [
    "PDF Metadata Editor Online",
    "View or update a PDF title, author and subject for better document organization.",
    "Metadata describes the file but does not change its visible pages. Editing these fields is not a complete privacy sanitization process.",
    "pdf-watermark,protect-pdf,pdf-page-numbers"
  ],
  "image-compressor": [
    "Image Compressor Online – JPEG & WebP",
    "Compress JPEG or WebP images with adjustable quality settings and review the output.",
    "Lower quality may reduce file size at the cost of visual detail. Inspect edges and small text before choosing the result.",
    "image-resizer,image-to-jpg,image-to-webp"
  ],
  "image-cropper": [
    "Image Cropper Online – Crop Photos",
    "Crop a selected area of an image by adjusting its position and dimensions in your browser.",
    "Keep the important subject inside the crop. Cropping removes pixels outside the selection rather than changing the whole image proportionally.",
    "image-resizer,aspect-ratio-resizer,passport-photo-maker"
  ],
  "background-remover": [
    "Solid Color Background Remover Online",
    "Remove a solid image background using a selected color and adjustable tolerance.",
    "This utility works best with a uniform background. For automatic subject separation, use the dedicated AI Background Remover Studio.",
    "studio/background-remove,image-to-png,image-cropper"
  ],
  "image-watermark": [
    "Add Text Watermark to Image Online",
    "Place your own text watermark on an image for previews, branding or shared drafts.",
    "Choose a readable placement that does not cover important details. A watermark is not a security control.",
    "image-resizer,image-to-png,pdf-watermark"
  ],
  "image-to-base64": [
    "Image to Base64 Converter Online",
    "Convert a local image into a Base64 data URL for supported web and development workflows.",
    "Base64 generally increases the encoded size; use it for small inline assets rather than large photos.",
    "base64-encoder,image-compressor,image-to-webp"
  ],
  "color-picker": [
    "Image Color Picker – HEX & RGB Online",
    "Pick colors from an uploaded image and inspect their HEX and RGB values.",
    "Select a pixel from your source image for a matching design color. Anti-aliased edges can contain blended colors.",
    "hex-rgb-converter,image-cropper,studio/svg-editor"
  ],
  "passport-photo-maker": [
    "Passport Photo Maker Online – Print Sheet",
    "Create a passport photo sheet using manual crop controls in your browser.",
    "Check the dimensions and head-position requirements of your specific authority before submitting a photo. The tool does not certify acceptance.",
    "studio/passport-social,image-cropper,image-resizer"
  ],
  "html-formatter": [
    "HTML Formatter Online – Indent HTML Code",
    "Format HTML source to make nested markup easier to read and maintain.",
    "Review formatted markup before saving; whitespace can be significant in some HTML contexts.",
    "css-minifier,javascript-minifier,seo-meta-generator"
  ],
  "css-minifier": [
    "CSS Minifier Online",
    "Reduce CSS source size using a CSS-aware minifier that preserves quoted strings.",
    "Test the minified stylesheet on your page before deployment. Keep the readable source for maintenance.",
    "html-formatter,javascript-minifier"
  ],
  "javascript-minifier": [
    "JavaScript Minifier Online",
    "Minify JavaScript using a parser-based tool for smaller source output.",
    "Check for syntax errors before minifying and run your application tests on the resulting code.",
    "css-minifier,html-formatter,json-formatter"
  ],
  "regex-tester": [
    "Regex Tester Online – Test Regular Expressions",
    "Test regular expressions against sample text with configurable flags and inspect matches.",
    "Start with a small test string and check both matching and nonmatching examples. Regex syntax differs among programming languages.",
    "text-compare,json-formatter"
  ],
  "jwt-decoder": [
    "JWT Decoder Online – Inspect Header & Payload",
    "Decode JWT headers and payloads to inspect claims without verifying the token signature.",
    "Never treat decoded claims as authenticated. Avoid pasting live credentials or sensitive tokens into shared devices.",
    "base64-encoder,json-formatter"
  ],
  "sql-formatter": [
    "SQL Formatter Online – Format SQL Queries",
    "Format SQL with a dialect-aware parser for more readable queries.",
    "Select the appropriate dialect and review the resulting query. Formatting does not execute or validate database permissions.",
    "json-formatter,html-formatter"
  ],
  "hex-rgb-converter": [
    "HEX to RGB & RGB to HEX Converter",
    "Convert between hexadecimal and RGB color values for CSS, branding and graphics.",
    "Use the converted value in your design system and compare the color against the intended background.",
    "color-picker,studio/svg-editor"
  ],
  "timestamp-converter": [
    "Unix Timestamp Converter Online",
    "Convert Unix timestamps and ISO date values to inspect date and time representations.",
    "Confirm whether your source timestamp is in seconds or milliseconds and check the displayed time zone.",
    "date-difference,age-calculator"
  ],
  "invoice-generator": [
    "GST Invoice & Bill Maker Online – A4 PDF",
    "Create GST and non-GST invoices with item discounts, HSN/SAC, logo and signature. Preview your A4 bill; paid plans unlock PDF and print.",
    "Add seller and buyer details, choose CGST/SGST or IGST as appropriate, enter quantities and prices, and check totals and balance. Verify statutory invoice requirements before issuing; this is not GST filing or e-invoicing software.",
    "gst-calculator,quotation-maker,profit-margin"
  ],
  "quotation-maker": [
    "Quotation Maker Online – Business Quote PDF",
    "Create a business quotation with itemized prices and tax totals, then export a PDF with an eligible plan.",
    "A quotation proposes a price before a sale. Use the invoice maker when preparing the actual bill and confirm your terms separately.",
    "invoice-generator,gst-calculator,profit-margin"
  ],
  "emi-calculator": [
    "EMI Calculator Online – Monthly Loan Payment",
    "Estimate monthly loan instalments and repayment totals from principal, interest rate and duration.",
    "Results assume the entered rate and term; lenders may apply fees or different interest conventions. Compare against the official loan offer.",
    "percentage-calculator,profit-margin"
  ],
  "age-calculator": [
    "Age Calculator Online – Years, Months & Days",
    "Calculate age between a birth date and a reference date in years, months and days.",
    "Use the reference date required by an application or eligibility rule; the tool calculates age, not eligibility.",
    "date-difference,timestamp-converter"
  ],
  "date-difference": [
    "Date Difference Calculator – Days & Weeks",
    "Calculate the difference between two dates in days and weeks.",
    "Confirm whether your deadline includes both the start and end dates; elapsed days and inclusive calendar counts can differ.",
    "age-calculator,timestamp-converter"
  ],
  "resume-builder": [
    "Resume Builder Online – Create Resume PDF",
    "Prepare a simple resume from your details and export a clean PDF with an eligible plan.",
    "Use accurate employment and education information, concise achievements and a readable structure. Review the final document before applying.",
    "text-to-pdf,word-counter"
  ],
  "text-compare": [
    "Text Compare Online – Line-by-Line Diff",
    "Compare two text blocks and see line-level differences for drafts or configuration changes.",
    "Paste the original and revised versions. Line-based comparisons may highlight a full line when only one word changes.",
    "word-counter,text-sorter,json-formatter"
  ],
  "youtube-thumbnail-downloader": [
    "YouTube Thumbnail Downloader – Preview JPG Sizes",
    "Paste a public YouTube video or Shorts link and preview available thumbnail resolutions. Verified paid plans unlock JPG downloads.",
    "Choose only a size that is actually available for the video. Download images you have permission to reuse; a public thumbnail is not automatically licensed for reuse.",
    "aspect-ratio-resizer,image-resizer,image-compressor"
  ],
  "aspect-ratio-resizer": [
    "Image Aspect Ratio Resizer – 9:16, 16:9 & Square",
    "Resize or crop images for vertical reels, landscape thumbnails and square social posts.",
    "Select the destination ratio and keep the subject inside the crop. This tool resizes images, not video files.",
    "studio/passport-social,image-cropper,image-resizer"
  ],
  "ai-title-hashtag-generator": [
    "AI Title & Hashtag Generator for Social Media",
    "Create title, caption and hashtag suggestions with optional Gemini AI or an offline suggestion mode.",
    "Choose the platform and topic, then edit suggestions for accuracy and relevance. AI availability depends on configured quotas; hashtags do not guarantee reach.",
    "youtube-thumbnail-downloader,seo-meta-generator,word-counter"
  ],
  "csv-to-json": [
    "CSV to JSON Converter Online",
    "Convert CSV rows into JSON data with support for quoted values and delimiters within quoted fields.",
    "Ensure the CSV header names are meaningful and review the output structure before importing into an application.",
    "json-to-csv,json-formatter"
  ],
  "image-flipper": [
    "Flip & Rotate Image Online",
    "Flip or rotate a local image and preview the transformed result before downloading.",
    "Use horizontal flip for mirroring and rotation for orientation correction. Check text and logos after mirroring.",
    "image-cropper,image-resizer,rotate-pdf"
  ],
  "text-sorter": [
    "Text Sorter Online – Sort & Deduplicate Lines",
    "Sort text lines and remove duplicates when needed, for lists and simple data cleanup.",
    "Paste one entry per line and choose the intended sorting mode. Review capitalization differences before removing duplicates.",
    "text-compare,word-counter,case-converter"
  ],
  "json-to-csv": [
    "JSON to CSV Converter Online",
    "Convert JSON records into CSV with formula-injection protection for spreadsheet workflows.",
    "Check flattened field names and how nested values are represented. Review the CSV in your target spreadsheet software.",
    "csv-to-json,json-formatter"
  ],
  "sha-file-checker": [
    "SHA-256 & SHA-512 File Checksum Checker",
    "Compute or verify SHA-256 and SHA-512 checksums for local files in your browser.",
    "Compare the hash with a trusted publisher's value. A matching checksum verifies file equality, not that a file is safe to run.",
    "password-generator,base64-encoder"
  ],
  "utm-campaign-builder": [
    "UTM Campaign URL Builder Online",
    "Build campaign tracking URLs with source, medium and campaign values while preserving other URL parameters.",
    "Use consistent campaign naming across channels and avoid placing personal information in tracking parameters.",
    "url-encoder,qr-code-generator,seo-meta-generator"
  ],
  "seo-meta-generator": [
    "SEO Meta Tag Generator – Open Graph & Twitter",
    "Generate HTML metadata for page titles, descriptions and social previews with escaped tag values.",
    "Use a unique title and accurate description for each real page. Metadata helps describe content but cannot guarantee Google rankings.",
    "html-formatter,utm-campaign-builder,word-counter"
  ],
  "studio/enhance": [
    "AI Image Enhancer & Photo Upscaler – 4K & 8K",
    "Enhance photo sharpness, noise and color with before-and-after preview and optional local neural detail. Paid exports up to 8K.",
    "Start with the clearest source available. Compare the original against the adjusted preview; enlarging pixels does not recover all missing detail.",
    "image-resizer,image-compressor,studio/restore"
  ],
  "studio/background-remove": [
    "AI Background Remover Online – Photo Cutout",
    "Separate image subjects with on-device AI or clean a solid background. Preview edges before eligible paid export.",
    "Upload a photo with a distinct subject and inspect hair and fine edges. The initial model download may take time; solid-color cleanup is an alternative.",
    "background-remover,image-to-png,studio/retouch"
  ],
  "studio/batch": [
    "Batch Image Enhancer & ZIP Export Online",
    "Process up to eight photos in a local sequence and export results together as ZIP with eligible Premium or Max access.",
    "Choose similar images when applying shared settings. Device memory and source resolution affect processing time and output limits.",
    "studio/enhance,studio/zip-maker,image-compressor"
  ],
  "studio/convert": [
    "SVG to PDF, EPS & DXF Converter Online",
    "Convert SVG artwork into real vector PDF, EPS or DXF outline formats for compatible design workflows.",
    "Check supported geometry before exporting. EPS and DXF outline conversion may approximate curves; native AI and CDR files are not supported.",
    "studio/svg-editor,studio/image-to-vector,studio/vector"
  ],
  "studio/image-to-vector": [
    "JPG & PNG to SVG – Image Vectorizer Online",
    "Trace supported raster images into editable SVG paths and compare against the original before exporting.",
    "Clean logos and high-contrast artwork often trace better than detailed photographs. Inspect small shapes and edges in the vector preview.",
    "studio/convert,studio/svg-editor,studio/vector"
  ],
  "studio/restore": [
    "Old Photo Restoration & Color Adjustment Online",
    "Denoise, sharpen and adjust the color of old photos using local image-processing controls.",
    "Scan or photograph the original at a good resolution. Conventional filters cannot guarantee reconstruction of missing faces or historically accurate colors.",
    "studio/enhance,studio/retouch,image-resizer"
  ],
  "studio/retouch": [
    "Photo Retouch & Small Object Remover Online",
    "Brush over small unwanted marks and heal them using browser-based image processing.",
    "Work on small areas with surrounding texture. Large objects, complex backgrounds and missing scene details may require another editing approach.",
    "studio/restore,studio/background-remove,studio/enhance"
  ],
  "studio/svg-editor": [
    "SVG Editor Online – Edit Vector Shapes & Colors",
    "Edit SVG fills, strokes, shapes and dimensions, then export editable SVG artwork.",
    "Keep an original copy before changing paths or colors. Check the output in the software where you intend to use it.",
    "studio/convert,studio/image-to-vector,studio/vector"
  ],
  "studio/vector": [
    "SVG Logo Maker & Vector Design Studio Online",
    "Create simple logos from preset shapes or trace images into editable SVG artwork in a browser workspace.",
    "Build a simple mark with readable shapes and test it at small sizes. Vector tracing does not automatically grant rights to another logo.",
    "studio/image-to-vector,studio/svg-editor,studio/convert"
  ],
  "studio/passport-social": [
    "Passport Photo & Social Media Image Size Maker",
    "Crop passport and ID photos or resize social images, prepare print sheets and preview before verified subscription export.",
    "Select a preset that matches the exact application or social platform. Check official photo dimensions and face requirements; acceptance is not guaranteed.",
    "passport-photo-maker,aspect-ratio-resizer,image-cropper"
  ],
  "studio/zip-maker": [
    "ZIP File Maker Online – Compress Files & Folders",
    "Create ZIP archives locally with files, folders and compression options. Export limits depend on your Starter to Max subscription.",
    "Add the files and folders you want to archive, select a compression mode, and review the file list. Already compressed images may not shrink much.",
    "studio/batch,image-compressor,merge-pdf"
  ]
};
export const toolSeo:Record<string,ToolSeo>=Object.fromEntries(Object.entries(entries).map(([key,[title,description,guide,related]])=>[key,{title,description,guide,related:related.split(',')} ]));
