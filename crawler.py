import os
import json
from urllib.parse import urljoin
from crawl4ai import WebCrawler
from crawl4ai.extraction_strategy import NoExtractionStrategy
from bs4 import BeautifulSoup

def create_crawler():
    crawler = WebCrawler(verbose=True)
    crawler.warmup()
    return crawler

crawler = create_crawler()

url = "https://crawl4ai.com/mkdocs/"

def extract_main_content(html):
    soup = BeautifulSoup(html, 'html.parser')
    main_content = soup.find('main')
    if main_content:
        return str(main_content)
    return ''

def process_and_save_content(url, content):
    soup = BeautifulSoup(content, 'html.parser')
    main_content = soup.find('main')
    if main_content:
        markdown = f"**{url}**\n\n---\n\n{main_content.get_text(separator='\n\n', strip=True)}"
        filename = f"output/{url.replace('https://', '').replace('/', '_')}.md"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(markdown)
    else:
        print(f"[ERROR] 🚫 No main content found for {url}")

result = crawler.run(
    url=url,
    extraction_strategy=NoExtractionStrategy(),
    word_count_threshold=10,
    bypass_cache=False,
    css_selector='main'
)

process_and_save_content(url, result.cleaned_html)

unique_internal_links = set(link['href'] for link in result.links.get('internal', []) if link.get('href'))

for link_href in unique_internal_links:
    link_url = urljoin(url, link_href)
    link_result = crawler.run(
        url=link_url,
        extraction_strategy=NoExtractionStrategy(),
        word_count_threshold=10,
        bypass_cache=False,
        css_selector='main'
    )
    if link_result.cleaned_html:
        process_and_save_content(link_url, link_result.cleaned_html)
    else:
        print(f"[ERROR] 🚫 Failed to extract content for {link_url}")
