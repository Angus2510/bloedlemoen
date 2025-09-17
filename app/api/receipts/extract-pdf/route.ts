import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

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
            resolve(fullText.trim());
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
