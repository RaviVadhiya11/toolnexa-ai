export type Category='Text'|'Developer'|'Business'|'Image'|'PDF';
export type Tool={slug:string;title:string;category:Category;icon:string;description:string};
export const tools:Tool[]=[
{slug:"word-counter",title:"Word Counter",category:"Text" as Category,icon:"🔤",description:"Count words, characters and lines"},
{slug:"case-converter",title:"Case Converter",category:"Text" as Category,icon:"🔡",description:"Change text case instantly"},
{slug:"text-reverser",title:"Text Reverser",category:"Text" as Category,icon:"↔️",description:"Reverse text characters"},
{slug:"password-generator",title:"Password Generator",category:"Developer" as Category,icon:"🔐",description:"Generate random secure passwords"},
{slug:"uuid-generator",title:"UUID Generator",category:"Developer" as Category,icon:"🆔",description:"Create unique UUID v4 identifiers"},
{slug:"json-formatter",title:"JSON Formatter",category:"Developer" as Category,icon:"🧩",description:"Validate and format JSON"},
{slug:"base64-encoder",title:"Base64 Encoder",category:"Developer" as Category,icon:"🔏",description:"Encode or decode Base64"},
{slug:"url-encoder",title:"URL Encoder",category:"Developer" as Category,icon:"🔗",description:"Encode or decode URI components"},
{slug:"qr-code-generator",title:"QR Code Generator",category:"Business" as Category,icon:"▦",description:"Create downloadable QR codes"},
{slug:"gst-calculator",title:"GST Calculator",category:"Business" as Category,icon:"🧮",description:"Calculate inclusive or exclusive GST"},
{slug:"percentage-calculator",title:"Percentage Calculator",category:"Business" as Category,icon:"📈",description:"Calculate a percentage of a number"},
{slug:"profit-margin",title:"Profit Margin",category:"Business" as Category,icon:"💰",description:"Calculate profit and sales margin"},
{slug:"image-resizer",title:"Image Resizer",category:"Image" as Category,icon:"🖼️",description:"Resize images locally"},
{slug:"image-to-png",title:"Image to PNG",category:"Image" as Category,icon:"🎨",description:"Convert images into PNG"},
{slug:"image-to-jpg",title:"Image to JPG",category:"Image" as Category,icon:"📷",description:"Convert images into JPEG"},
{slug:"image-to-webp",title:"Image to WebP",category:"Image" as Category,icon:"✨",description:"Convert images into WebP"},
{slug:"image-to-pdf",title:"Image to PDF",category:"PDF" as Category,icon:"📄",description:"Convert multiple images to a PDF"},
{slug:"text-to-pdf",title:"Text to PDF",category:"PDF" as Category,icon:"📑",description:"Create a PDF from text"},
{slug:"merge-pdf",title:"Merge PDF",category:"PDF" as Category,icon:"📚",description:"Combine multiple PDFs into one"},
{slug:"split-pdf",title:"Split PDF",category:"PDF" as Category,icon:"✂️",description:"Extract selected pages from a PDF"},
];
export const categories:('All'|Category)[]=['All','Text','Developer','Business','Image','PDF'];
