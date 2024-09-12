import os
import json
from urllib.parse import urljoin
from crawl4ai import WebCrawler
from crawl4ai.extraction_strategy import LLMExtractionStrategy, NoExtractionStrategy

# Add flags to control link following and extraction strategy
FOLLOW_INTERNAL_LINKS = True
USE_EXTRACTION_STRATEGY = False

def create_crawler():
    crawler = WebCrawler(verbose=True)
    crawler.warmup()
    return crawler

crawler = create_crawler()

url = "https://download4.epson.biz/sec_pubs/pos/reference_en/escpos/tmt88vi.html"

def process_and_save_content(url, content):
    filename = f"output/{url.replace('https://', '').replace('/', '_')}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"**{url}**\n\n---\n\n{content}")

def save_full_result(result, url):
    result_dict = {
        "url": url,
        "success": result.success,
        "cleaned_html": result.cleaned_html,
        "media": result.media,
        "links": result.links,
        "markdown": result.markdown,
        "extracted_content": result.extracted_content,
        "metadata": result.metadata,
        "error_message": result.error_message
    }
    filename = f"output/full_result_{url.replace('https://', '').replace('/', '_')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result_dict, f, indent=2, ensure_ascii=False)

llm_extraction_strategy = LLMExtractionStrategy(
    provider="openai/gpt-4o",
    api_token=os.getenv('OPENAI_API_KEY'),
    instruction="Analyze this page and extract the formatted printer command spec. If there are multiple applicable printer models, only focus on the TM-T88VI. Special instructions for printers besides the TM-T88VI may be discarded, but always make sure to keep the full command details."
)

no_extraction_strategy = NoExtractionStrategy()

def get_extraction_strategy():
    return llm_extraction_strategy if USE_EXTRACTION_STRATEGY else no_extraction_strategy

result = crawler.run(
    url=url,
    extraction_strategy=get_extraction_strategy(),
    word_count_threshold=10,
    bypass_cache=True,
    css_selector="#main"
)

# Save full result
save_full_result(result, url)

if USE_EXTRACTION_STRATEGY and result.extracted_content:
    process_and_save_content(url, result.extracted_content)
elif result.markdown:
    process_and_save_content(url, result.markdown)
else:
    print(f"[ERROR] 🚫 No content extracted for {url}")
    print(f"Raw HTML content length: {len(result.raw_html) if result.raw_html else 'N/A'}")

# Only follow internal links if the flag is set to True
if FOLLOW_INTERNAL_LINKS:
    unique_internal_links = set(link['href'] for link in result.links.get('internal', []) if link.get('href'))

    for link_href in unique_internal_links:
        link_url = urljoin(url, link_href)
        link_result = crawler.run(
            url=link_url,
            extraction_strategy=get_extraction_strategy(),
            word_count_threshold=10,
            bypass_cache=True
        )
        
        # Save full result for each internal link
        save_full_result(link_result, link_url)
        
        if USE_EXTRACTION_STRATEGY and link_result.extracted_content:
            process_and_save_content(link_url, link_result.extracted_content)
        elif link_result.markdown:
            process_and_save_content(link_url, link_result.markdown)
        else:
            print(f"[ERROR] 🚫 Failed to extract content for {link_url}")
else:
    print("Skipping internal links as FOLLOW_INTERNAL_LINKS is set to False")
