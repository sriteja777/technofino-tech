// src/services/scraperService.js

/**
 * Extracts messages from a single HTML document.
 * @param {Document} doc - The parsed HTML document.
 * @param {string} pageUrl - The URL of the page being scraped (for logging/debugging).
 * @returns {Array} Array of message objects ({ user, date, content }).
 */
const extractMessagesFromDoc = (doc, pageUrl) => {
  const messages = [];
  const messageArticles = doc.querySelectorAll('article.message');

  messageArticles.forEach(article => {
    const userTag = article.querySelector('.message-user .username');
    // More specific date selector if time.u-dt is inside a known parent like .message-attribution-main
    const dateTag = article.querySelector('.message-attribution-main time.u-dt, time.u-dt');
    const contentTag = article.querySelector('.message-content .bbWrapper');

    let date = dateTag ? (dateTag.getAttribute('datetime') || dateTag.textContent.trim()) : 'Unknown date';
    try {
        // Attempt to convert to ISO if it's a common, non-ISO format
        if (date && !date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}/)) {
            const parsedDate = new Date(date);
            // Check if parsing was successful (Date object is not "Invalid Date")
            if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString();
            }
            // else keep original if parsing failed
        } else if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) { // YYYY-MM-DD
            date = `${date}T00:00:00.000Z`;
        }
    } catch (e) {
        console.warn(`Could not parse date string "${date}" from ${pageUrl}, using as is:`, e);
    }

    let content = '';
    if (contentTag) {
      contentTag.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          content += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName.toLowerCase() === 'br') {
            content += '\n';
          } else {
            content += node.textContent;
          }
        }
      });
      content = content.trim();
    }

    // Only add message if there's actual content
    if (content) {
        messages.push({
          user: userTag ? userTag.textContent.trim() : 'Unknown User',
          date: date,
          content: content,
        });
    }
  });
  return messages;
};

const fetchAndParsePage = async (pageUrl, setStatus, currentPage, totalPages) => {
  if (setStatus && currentPage && totalPages) {
    setStatus({ message: `Fetching page ${currentPage} of ${totalPages}: ${pageUrl}`, type: 'info' });
  }
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      // Provide more specific error messages for common HTTP errors
      let httpErrorMsg = `HTTP error! Status: ${response.status} for ${pageUrl}.`;
      if (response.status === 404) httpErrorMsg += " (Page not found)";
      if (response.status === 403) httpErrorMsg += " (Access forbidden)";
      if (response.status === 503) httpErrorMsg += " (Service unavailable)";
      throw new Error(httpErrorMsg);
    }
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    return extractMessagesFromDoc(doc, pageUrl);
  } catch (error) {
    console.error(`Error fetching or parsing page ${pageUrl}:`, error);
    if (setStatus) setStatus({ message: `Error fetching page ${pageUrl}: ${error.message}. Possible CORS issue or network problem.`, type: 'error' });
    throw error;
  }
};

export const scrapeTechnofinoThread = async (initialThreadUrl, setStatus) => {
  setStatus({ message: 'Validating URL and starting scraping process...', type: 'info' });
  let threadUrl = initialThreadUrl;

  try {
    const urlObj = new URL(initialThreadUrl);
    if (!urlObj.hostname.includes('technofino.in')) {
        setStatus({ message: 'Invalid domain. Please provide a Technofino thread URL.', type: 'error'});
        return null;
    }
    urlObj.pathname = urlObj.pathname.replace(/\/page-\d+(\/)?$/, '');
    urlObj.hash = '';
    threadUrl = urlObj.toString();
    if (urlObj.pathname && urlObj.pathname !== '/' && !threadUrl.endsWith('/')) {
        threadUrl += '/';
    }
  } catch (e) {
    setStatus({ message: 'Invalid URL provided. Please check the format (e.g., includes "https://").', type: 'error' });
    console.error("Invalid URL:", e);
    return null;
  }

  let allMessages = [];
  try {
    setStatus({ message: `Fetching initial page: ${threadUrl}`, type: 'info' });
    const firstPageResponse = await fetch(threadUrl);
    if (!firstPageResponse.ok) {
      setStatus({ message: `HTTP error! Status: ${firstPageResponse.status} for initial page. The thread might be private or the URL invalid.`, type: 'error' });
      return null;
    }
    const firstPageHtmlText = await firstPageResponse.text();
    const parser = new DOMParser();
    const firstPageDoc = parser.parseFromString(firstPageHtmlText, 'text/html');

    if (firstPageDoc.title.includes("Oops! We ran into some problems.") || firstPageDoc.querySelector('.blockMessage--error')) {
        setStatus({ message: "Error: Could not access thread content. It may be private, require login on Technofino, or the URL is incorrect.", type: 'error'});
        return null;
    }

    allMessages = allMessages.concat(extractMessagesFromDoc(firstPageDoc, threadUrl));

    let totalPages = 1;
    const pageNav = firstPageDoc.querySelector('.pageNav-main');
    if (pageNav) {
      const pageLinks = pageNav.querySelectorAll('li.pageNav-page a');
      if (pageLinks.length > 0) {
        const lastPageLink = pageLinks[pageLinks.length - 1];
        totalPages = parseInt(lastPageLink.textContent.trim(), 10) || 1;
      } else {
         const lastPageText = pageNav.querySelector('.pageNav-page.pageNav-page--current, .pageNav-page--current');
         if (lastPageText && lastPageText.textContent.toLowerCase().includes(' of ')) {
            totalPages = parseInt(lastPageText.textContent.toLowerCase().split(' of ')[1].trim(), 10) || 1;
         } else if (lastPageText) {
            totalPages = parseInt(lastPageText.textContent.trim(), 10) || 1;
         }
      }
    }

    if (allMessages.length === 0 && totalPages === 1 && !firstPageDoc.querySelector('article.message')) {
        // If no messages and no message articles found on what appears to be a single page, it's likely an issue.
        setStatus({ message: 'No messages found. The page might not be a valid thread page or it is empty.', type: 'warning' });
        return []; // Return empty array, but with a warning.
    }
    setStatus({ message: `Total pages identified: ${totalPages}. Found ${allMessages.length} messages on page 1.`, type: 'info' });


    if (totalPages > 1) {
      const pagePromises = [];
      for (let i = 2; i <= totalPages; i++) {
        const pageUrl = `${threadUrl}page-${i}`;
        await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay slightly
        pagePromises.push(fetchAndParsePage(pageUrl, setStatus, i, totalPages));
      }
      const resultsFromOtherPages = await Promise.allSettled(pagePromises);
      resultsFromOtherPages.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allMessages = allMessages.concat(result.value);
        } else if (result.status === 'rejected') {
          console.warn("A page fetch failed, skipping messages from that page:", result.reason);
          // setStatus for individual page failures is handled in fetchAndParsePage
        }
      });
    }

    if (allMessages.length === 0) {
        // This condition means either the first page had no messages AND no other pages were found/fetched,
        // OR all subsequent page fetches failed or returned no messages.
        setStatus({ message: 'No messages were found after checking all pages. The thread might be empty or inaccessible after the first page.', type: 'warning' });
        return [];
    }

    setStatus({ message: `Scraping complete! Found ${allMessages.length} messages in total.`, type: 'success' });
    return allMessages;

  } catch (error) {
    console.error("Error during scraping process:", error);
    if (status.type !== 'error') { // Avoid overwriting a more specific error from fetchAndParsePage
        setStatus({ message: `Scraping failed: ${error.message}. Check browser console for CORS details or network problems.`, type: 'error' });
    }
    return null;
  }
};
