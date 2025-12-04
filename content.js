

async function extractTranscriptPrompt() {
  const title =
    document.querySelector("h1.ytd-watch-metadata yt-formatted-string")
      ?.innerText ||
    document.querySelector("h1.title")?.innerText ||
    document.title;

  const creator =
    document.querySelector("ytd-channel-name#channel-name yt-formatted-string")
      ?.innerText ||
    document.querySelector("#text-container.ytd-channel-name")?.innerText ||
    "Unknown Creator";

  // Try to click transcript button
  const tryClickTranscriptButton = () => {
    const buttons = [
      ...document.querySelectorAll("button, yt-button-shape button"),
    ];
    const transcriptBtn = buttons.find((b) => {
      const text = b.innerText || b.getAttribute("aria-label") || "";
      return (
        text.toLowerCase().includes("transcript") ||
        text.toLowerCase().includes("show transcript")
      );
    });
    if (transcriptBtn) {
      transcriptBtn.click();
      return true;
    }
    return false;
  };

  const clicked = tryClickTranscriptButton();
  if (!clicked) {
    // Try clicking the more button first
    const moreBtn = [...document.querySelectorAll("button")].find((b) =>
      b.getAttribute("aria-label")?.toLowerCase().includes("more")
    );
    if (moreBtn) {
      moreBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      tryClickTranscriptButton();
    }
  }

  const waitForSegments = async () => {
    const maxTries = 40;
    let tries = 0;
    while (tries < maxTries) {
      const segments = document.querySelectorAll(
        "ytd-transcript-segment-renderer"
      );
      if (segments.length > 0) return [...segments];
      await new Promise((r) => setTimeout(r, 150));
      tries++;
    }
    return [];
  };

  const segments = await waitForSegments();
  if (segments.length === 0) return null;

  const transcript = segments
    .map((seg) => {
      const text =
        seg.querySelector(".segment-text")?.innerText || seg.innerText;
      return text.trim();
    })
    .filter(Boolean)
    .join("\n");

  const trimmed =
    transcript.length > 25000 ? transcript.slice(0, 25000) + "..." : transcript;

  return `You are an expert video content analyst. Analyze this YouTube video and provide a structured summary.

**Video Title:** ${title}
**Creator:** ${creator}

**Instructions:**
1. **Quick Summary** (2-3 sentences): Core message and main takeaways


3. **Detailed Summary:**
   - Key points covered (bullet format)
   - Main arguments or demonstrations
   - Conclusions and recommendations

4. **Trust Signals:**
   - Channel credibility assessment
   - Fact-checking notes (if claims seem questionable)

Format with clear headings and use markdown for readability.

**Transcript:**
${trimmed}`;
}

function markdownToHTML(md) {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headers
  html = html.replace(/^### (.*)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2 class="md-h2">$1</h2>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Lists
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  // Paragraphs
  html = html
    .split("\n\n")
    .map((para) => {
      if (para.match(/^<(h[123]|ul|li)/)) return para;
      return `<p>${para.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");

  return html;
}

function createOrShowPopup(text, isError = false) {
  let overlay = document.getElementById("yt-ai-overlay");
  let popup = document.getElementById("yt-ai-popup");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "yt-ai-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: "999998",
      display: "none",
      animation: "fadeIn 0.2s ease-out",
    });
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        popup.style.animation = "slideOut 0.2s ease-out";
        overlay.style.animation = "fadeOut 0.2s ease-out";
        setTimeout(() => {
          popup.style.display = "none";
          overlay.style.display = "none";
        }, 200);
      }
    };
    document.body.appendChild(overlay);
  }

  if (!popup) {
    popup = document.createElement("div");
    popup.id = "yt-ai-popup";
    Object.assign(popup.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      color: "#e8e8e8",
      padding: "0",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      width: "min(700px, 90vw)",
      maxHeight: "85vh",
      display: "flex",
      flexDirection: "column",
      boxShadow:
        "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      zIndex: "999999",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    });

    // Header
    const header = document.createElement("div");
    Object.assign(header.style, {
      padding: "20px 24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(255, 255, 255, 0.02)",
    });

    const title = document.createElement("div");
    title.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ✨
        </div>
        <div>
          <div style="font-weight: 600; font-size: 16px; color: #fff;">AI Video Summary by Dry Heartz 
          </div>
          <div style="font-size: 12px; color: #888; margin-top: 2px;">Powered by BRUCE WYANE</div>
        </div>
      </div>
    `;
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    Object.assign(closeBtn.style, {
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#fff",
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      fontSize: "24px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    });
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
      closeBtn.style.transform = "scale(1.05)";
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.05)";
      closeBtn.style.transform = "scale(1)";
    };
    closeBtn.onclick = () => {
      popup.style.animation = "slideOut 0.2s ease-out";
      overlay.style.animation = "fadeOut 0.2s ease-out";
      setTimeout(() => {
        popup.style.display = "none";
        overlay.style.display = "none";
      }, 200);
    };
    header.appendChild(closeBtn);
    popup.appendChild(header);

    // Content
    const contentDiv = document.createElement("div");
    contentDiv.id = "yt-ai-content";
    Object.assign(contentDiv.style, {
      padding: "24px",
      overflowY: "auto",
      fontSize: "14px",
      lineHeight: "1.7",
      flex: "1",
    });
    popup.appendChild(contentDiv);

    // Add CSS for markdown
    if (!document.getElementById("yt-ai-styles")) {
      const style = document.createElement("style");
      style.id = "yt-ai-styles";
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideIn {
          from { transform: translate(-50%, -48%) scale(0.95); opacity: 0; }
          to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          to { transform: translate(-50%, -48%) scale(0.95); opacity: 0; }
        }
        #yt-ai-content .md-h2 {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin: 24px 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(102, 126, 234, 0.3);
        }
        #yt-ai-content .md-h3 {
          font-size: 16px;
          font-weight: 600;
          color: #e0e0e0;
          margin: 20px 0 10px 0;
        }
        #yt-ai-content p {
          margin: 12px 0;
          color: #d0d0d0;
        }
        #yt-ai-content strong {
          color: #fff;
          font-weight: 600;
        }
        #yt-ai-content ul {
          margin: 12px 0;
          padding-left: 24px;
        }
        #yt-ai-content li {
          margin: 8px 0;
          color: #d0d0d0;
        }
        #yt-ai-content::-webkit-scrollbar {
          width: 8px;
        }
        #yt-ai-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        #yt-ai-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        #yt-ai-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .loading-dots {
          display: inline-flex;
          gap: 4px;
        }
        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: bounce 1.4s infinite ease-in-out;
        }
        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    popup.style.animation = "slideIn 0.3s ease-out";
    document.body.appendChild(popup);
  }

  overlay.style.display = "block";
  popup.style.display = "flex";

  const contentDiv = popup.querySelector("#yt-ai-content");

  if (text.includes("Loading") || text.includes("Analyzing")) {
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div class="loading-dots" style="justify-content: center; margin-bottom: 16px;">
          <span></span><span></span><span></span>
        </div>
        <p style="font-size: 16px; color: #999;">${text}</p>
      </div>
    `;
  } else if (isError || text.startsWith("❌")) {
    contentDiv.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; color: #fca5a5;">
        ${markdownToHTML(text)}
      </div>
    `;
  } else {
    contentDiv.innerHTML = markdownToHTML(
      text.replace("✅ AI Summary:\n\n", "")
    );
  }

  contentDiv.scrollTop = 0;
}

function injectButton() {
  if (document.getElementById("yt-ai-btn")) return;

  const tryAttach = setInterval(() => {
    const container =
      document.querySelector("#top-level-buttons-computed") ||
      document.querySelector("ytd-menu-renderer #top-level-buttons");

    if (container) {
      clearInterval(tryAttach);

      const btn = document.createElement("button");
      btn.id = "yt-ai-btn";
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        AI Summary
      `;

      Object.assign(btn.style, {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginLeft: "8px",
        padding: "10px 16px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "18px",
        fontWeight: "500",
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.2s",
        boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
      });

      btn.onmouseenter = () => {
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
      };
      btn.onmouseleave = () => {
        btn.style.transform = "translateY(0)";
        btn.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)";
      };

      btn.onclick = async () => {
        createOrShowPopup("Analyzing video transcript...");

        const prompt = await extractTranscriptPrompt();
        if (!prompt) {
          createOrShowPopup(
            "❌ Transcript not available. Please:\n\n1. Make sure the video has captions\n2. Try opening the transcript panel manually first\n3. Refresh the page and try again",
            true
          );
          return;
        }
        chrome.runtime.sendMessage({ action: "summarize", prompt });
      };

      container.appendChild(btn);
    }
  }, 500);

  setTimeout(() => clearInterval(tryAttach), 10000);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showSummary") {
    createOrShowPopup(
      msg.isError ? msg.summary : "✅ AI Summary:\n\n" + msg.summary,
      msg.isError
    );
  }
});

// Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectButton);
} else {
  injectButton();
}

// Re-inject on navigation (YouTube is SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(injectButton, 1000);
  }
}).observe(document, { subtree: true, childList: true });
