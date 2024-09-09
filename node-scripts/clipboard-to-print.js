import clipboardy from "clipboardy";
import http from "http";
import https from "https";

const SERVER_URL = "http://192.168.1.41:5173";

async function main() {
  try {
    const clipboardContent = clipboardy.readSync();

    if (!clipboardContent || clipboardContent.trim() === "") {
      throw new Error("Clipboard is empty or contains invalid content.");
    }

    const parsedUrl = new URL(SERVER_URL);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: "/actions/print-markdown",
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(clipboardContent),
      },
    };

    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const req = protocol.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          if (parsedResponse.success) {
            console.log("Success:", parsedResponse.message);
          } else {
            console.error("Error:", parsedResponse.message);
          }
        } catch (error) {
          console.error("Error parsing response:", error.message);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Error:", error.message);
    });

    req.write(clipboardContent);
    req.end();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
