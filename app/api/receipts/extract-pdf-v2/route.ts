import { NextRequest, NextResponse } from "next/server";

interface PDFExtractionRequest {
  pdfData: number[];
  fileName: string;
}

interface PDFExtractionResponse {
  text: string;
  method: string;
  success: boolean;
  fallbackAttempts?: string[];
}

// Clean and validate extracted text
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s{3,}/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function isTextReadable(text: string): boolean {
  const words = (text.match(/\b[a-zA-Z]{3,}\b/g) || []).length;
  const totalChars = text.length;
  const wordDensity = words / Math.max(totalChars / 10, 1);

  // Check for various corruption patterns
  const gggRatio = ((text.match(/GGG/g) || []).length * 3) / totalChars;
  const vggRatio = ((text.match(/VGG/g) || []).length * 3) / totalChars;
  const totalCorruptionRatio = gggRatio + vggRatio;

  console.log(
    `Text analysis: ${words} words, ${totalChars} chars, density: ${wordDensity.toFixed(
      2
    )}, corruption ratio: ${(totalCorruptionRatio * 100).toFixed(1)}%`
  );

  return wordDensity > 1.0 && totalCorruptionRatio < 0.3 && words > 10;
}

function detectCorruptionType(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Check for email-to-PDF corruption patterns
  const hasGGGPattern = /[VG]{3,}/.test(text);
  const hasOrderNumber = /order.*#?\s*1933/i.test(text);
  const hasEmailHeaders = /subject:|from:|to:/i.test(text);

  if (hasGGGPattern && hasOrderNumber && hasEmailHeaders) {
    return "email-pdf-corruption";
  }

  if (hasGGGPattern) {
    return "glyph-corruption";
  }

  if (text.length < 50) {
    return "insufficient-text";
  }

  return null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<PDFExtractionResponse | { error: string }>> {
  try {
    const body: PDFExtractionRequest = await request.json();
    const { pdfData, fileName } = body;

    console.log("🔄 Enhanced PDF extraction starting...");
    console.log("PDF data length:", pdfData.length);
    console.log("File name:", fileName);

    const pdfBuffer = Buffer.from(pdfData);
    const fallbackAttempts: string[] = [];
    let finalText = "";
    let extractionMethod = "unknown";

    // Strategy 1: Enhanced PDF.js text extraction
    try {
      console.log("📄 Attempting enhanced PDF.js text extraction...");

      // Dynamic import to avoid build-time issues
      const pdfjsLib = await import("pdfjs-dist");

      // Set up worker for Node.js environment
      if (typeof window === "undefined") {
        // Node.js environment
        pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
          "pdfjs-dist/build/pdf.worker.min.js"
        );
      } else {
        // Browser environment
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      }

      const loadingTask = pdfjsLib.getDocument({
        data: pdfBuffer,
        useSystemFonts: true,
        disableFontFace: false,
        verbosity: 0,
      });

      const pdf = await loadingTask.promise;
      let textContent = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}`);
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Simple text extraction
        const pageText = content.items
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => {
            return "str" in item ? item.str : "";
          })
          .join(" ");

        textContent += pageText + "\n";
      }

      const cleanedText = cleanExtractedText(textContent);

      console.log("PDF.js extracted text length:", cleanedText.length);
      console.log("PDF.js text preview:", cleanedText.slice(0, 200));

      if (isTextReadable(cleanedText)) {
        finalText = cleanedText;
        extractionMethod = "enhanced-pdfjs";
        console.log("✅ Enhanced PDF.js extraction successful");
      } else {
        fallbackAttempts.push("enhanced-pdfjs-unreadable");
        console.log("⚠️ Enhanced PDF.js produced unreadable results");
      }
    } catch (error) {
      fallbackAttempts.push(
        `enhanced-pdfjs-error: ${
          error instanceof Error ? error.message : "unknown"
        }`
      );
      console.log("❌ Enhanced PDF.js extraction failed:", error);
    }

    // Strategy 2: Fallback to original pdf2json method
    if (!finalText) {
      try {
        console.log("📋 Falling back to pdf2json...");

        // Dynamic import to avoid TypeScript issues
        const pdf2json = await import("pdf2json");
        const PDFParser = pdf2json.default;

        const pdfParser = new PDFParser();

        const parsePromise = new Promise<string>((resolve, reject) => {
          pdfParser.on("pdfParser_dataError", reject);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            try {
              let text = "";

              if (pdfData.formImage?.Pages) {
                for (const page of pdfData.formImage.Pages) {
                  if (page.Texts) {
                    for (const textObj of page.Texts) {
                      if (textObj.R) {
                        for (const run of textObj.R) {
                          if (run.T) {
                            text += decodeURIComponent(run.T) + " ";
                          }
                        }
                      }
                    }
                  }
                }
              }
              resolve(text);
            } catch (error) {
              reject(error);
            }
          });
        });

        pdfParser.parseBuffer(pdfBuffer);
        const pdf2jsonText = await parsePromise;
        const cleanedPdf2jsonText = cleanExtractedText(pdf2jsonText);

        console.log(
          "pdf2json extracted text length:",
          cleanedPdf2jsonText.length
        );
        console.log(
          "pdf2json text preview:",
          cleanedPdf2jsonText.slice(0, 200)
        );

        if (cleanedPdf2jsonText.length > 100) {
          finalText = cleanedPdf2jsonText;
          extractionMethod = "pdf2json-fallback";
          console.log("✅ pdf2json fallback successful");
        } else {
          fallbackAttempts.push("pdf2json-too-short");
        }
      } catch (error) {
        fallbackAttempts.push(
          `pdf2json-error: ${
            error instanceof Error ? error.message : "unknown"
          }`
        );
        console.log("❌ pdf2json fallback failed:", error);
      }
    }

    if (!finalText) {
      console.log("💥 All extraction methods failed");

      // Try to detect what went wrong and provide helpful guidance
      let errorMessage = "All PDF extraction methods failed.";
      let errorDetails = "";

      // Check if we got any text at all from the first method
      if (fallbackAttempts.includes("enhanced-pdfjs-unreadable")) {
        // We got text but it was corrupted - analyze it
        try {
          const loadingTask = await (
            await import("pdfjs-dist")
          ).getDocument({
            data: pdfBuffer,
            verbosity: 0,
          });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const content = await page.getTextContent();
          const rawText = content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => ("str" in item ? item.str : ""))
            .join(" ");

          const corruptionType = detectCorruptionType(rawText);

          if (corruptionType === "email-pdf-corruption") {
            errorMessage = "Email-to-PDF corruption detected";
            errorDetails =
              "This PDF was likely created by converting an email to PDF, which corrupted the text. The original email text should be copied and pasted instead of using the PDF.";
          } else if (corruptionType === "glyph-corruption") {
            errorMessage = "Font/glyph corruption detected";
            errorDetails =
              "This PDF contains custom fonts that cannot be properly decoded. Try using the original receipt image or text instead.";
          }
        } catch (error) {
          console.log("Could not analyze corruption type:", error);
        }
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          fallbackAttempts,
          corruptionDetected: errorDetails !== "",
        },
        { status: 400 }
      );
    }

    console.log(`✅ PDF extraction successful using: ${extractionMethod}`);
    console.log("Final text length:", finalText.length);
    console.log("Final text preview:", finalText.slice(0, 200));

    return NextResponse.json({
      text: finalText,
      method: extractionMethod,
      success: true,
      fallbackAttempts,
    });
  } catch (error) {
    console.error("💥 Enhanced PDF extraction error:", error);
    return NextResponse.json(
      {
        error: "Enhanced PDF extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
