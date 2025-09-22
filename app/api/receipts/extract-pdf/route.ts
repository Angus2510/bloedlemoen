import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

// Enhanced text cleaning function for email-to-PDF artifacts
function cleanExtractedText(text: string): string {
  return (
    text
      // Remove excessive spacing patterns common in email PDFs
      .replace(/\s{3,}/g, " ") // Replace 3+ spaces with single space
      .replace(/([A-Z])\s+([A-Z])\s+([A-Z])/g, "$1$2$3") // Fix "B L O E D L E M O E N" -> "BLOEDLEMOEN"
      .replace(/([a-z])\s+([a-z])\s+([a-z])/g, "$1$2$3") // Fix lowercase versions
      // Fix common brand name patterns
      .replace(/B\s*L\s*O\s*E\s*D\s*L\s*E\s*M\s*O\s*E\s*N/gi, "Bloedlemoen")
      .replace(/F\s*E\s*V\s*E\s*R\s*[\s\-]*T\s*R\s*E\s*E/gi, "Fever Tree")
      .replace(/F\s*e\s*v\s*e\s*r\s*[\s\-]*T\s*r\s*e\s*e/gi, "Fever Tree")
      // Fix product types
      .replace(/T\s*O\s*N\s*I\s*C/gi, "Tonic")
      .replace(/W\s*A\s*T\s*E\s*R/gi, "Water")
      .replace(/I\s*N\s*D\s*I\s*A\s*N/gi, "Indian")
      .replace(/E\s*L\s*D\s*E\s*R\s*F\s*L\s*O\s*W\s*E\s*R/gi, "Elderflower")
      .replace(
        /M\s*E\s*D\s*I\s*T\s*E\s*R\s*R\s*A\s*N\s*E\s*A\s*N/gi,
        "Mediterranean"
      )
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Check if text appears to be gibberish
function isGibberishText(text: string): boolean {
  const sample = text.slice(0, 300).toLowerCase();

  // Check for excessive single-letter patterns
  const singleLetterRatio =
    (sample.match(/\b[a-z]\b/g) || []).length / sample.length;
  if (singleLetterRatio > 0.3) return true;

  // Check for repetitive patterns like "G G G G"
  const repetitivePattern = /([a-z])\s+\1\s+\1\s+\1/i;
  if (repetitivePattern.test(sample)) return true;

  // Check for lack of real words
  const wordCount = (sample.match(/\b[a-z]{3,}\b/gi) || []).length;
  if (wordCount < 5 && sample.length > 100) return true;

  return false;
}

export async function POST(request: NextRequest) {
  try {
    console.log("PDF extraction request received");
    const { pdfData, fileName } = await request.json();

    console.log("PDF data length:", pdfData?.length);
    console.log("File name:", fileName);

    if (!pdfData || !Array.isArray(pdfData)) {
      console.error("Invalid PDF data provided");
      return NextResponse.json({ error: "Invalid PDF data" }, { status: 400 });
    }

    // Convert array back to buffer
    const pdfBuffer = Buffer.from(pdfData);
    console.log("PDF buffer created, size:", pdfBuffer.length);

    // Create PDF parser instance
    const pdfParser = new PDFParser();

    // Promise wrapper for PDF parsing
    const extractText = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (errData: unknown) => {
          console.error("PDF parsing error:", errData);
          const errorMessage =
            typeof errData === "object" &&
            errData !== null &&
            "parserError" in errData
              ? String(
                  (errData as { parserError?: { message?: string } })
                    .parserError?.message
                )
              : "PDF parsing failed";
          reject(new Error(errorMessage));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
          try {
            // Extract text from all pages
            let fullText = "";

            if (
              typeof pdfData === "object" &&
              pdfData !== null &&
              "Pages" in pdfData
            ) {
              const data = pdfData as { Pages?: unknown[] };
              if (data.Pages && Array.isArray(data.Pages)) {
                data.Pages.forEach((page: unknown) => {
                  if (
                    typeof page === "object" &&
                    page !== null &&
                    "Texts" in page
                  ) {
                    const pageData = page as { Texts?: unknown[] };
                    if (pageData.Texts && Array.isArray(pageData.Texts)) {
                      pageData.Texts.forEach((textItem: unknown) => {
                        if (
                          typeof textItem === "object" &&
                          textItem !== null &&
                          "R" in textItem
                        ) {
                          const textData = textItem as { R?: unknown[] };
                          if (textData.R && Array.isArray(textData.R)) {
                            textData.R.forEach((run: unknown) => {
                              if (
                                typeof run === "object" &&
                                run !== null &&
                                "T" in run
                              ) {
                                const runData = run as { T?: string };
                                if (runData.T) {
                                  // Decode URI-encoded text
                                  const decodedText = decodeURIComponent(
                                    runData.T
                                  );
                                  fullText += decodedText + " ";
                                }
                              }
                            });
                          }
                        }
                      });
                      fullText += "\n"; // Add newline after each page
                    }
                  }
                });
              }
            }

            console.log(
              "PDF text extracted successfully, length:",
              fullText.length
            );

            // Clean the extracted text
            const cleanedText = cleanExtractedText(fullText.trim());
            console.log("Text after cleaning, length:", cleanedText.length);
            console.log(
              "First 200 chars after cleaning:",
              cleanedText.slice(0, 200)
            );

            // Check if the result is still gibberish
            if (isGibberishText(cleanedText)) {
              console.warn(
                "Extracted text appears to be gibberish even after cleaning"
              );
              resolve(cleanedText); // Still return it, let the frontend handle it
            } else {
              console.log("Text extraction and cleaning successful");
              resolve(cleanedText);
            }
          } catch (error) {
            console.error("Error processing PDF data:", error);
            reject(error);
          }
        });

        // Parse the PDF buffer
        pdfParser.parseBuffer(pdfBuffer);
      });
    };

    const extractedText = await extractText();

    return NextResponse.json({
      success: true,
      text: extractedText,
      pages: "unknown", // pdf2json doesn't easily provide page count
      fileName: fileName || "unknown.pdf",
    });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract text from PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
