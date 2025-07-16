# DataviewJS Integration

BibleLink integrates with Obsidian's Dataview plugin through **DataviewJS** queries. This allows you to query Bible verses directly from your notes using JavaScript.

## Overview

DataviewJS provides the most flexible way to access BibleLink's data. Unlike Dataview's DQL (Dataview Query Language), which only works with indexed metadata from your vault, DataviewJS can directly access the BibleLink plugin's API and data.

## Prerequisites

1. **Dataview Plugin**: Make sure you have the Dataview plugin installed and enabled
2. **BibleLink Plugin**: Ensure BibleLink is installed and enabled
3. **Reload Plugin**: After installation, reload the BibleLink plugin to ensure the API is available

## Available API

BibleLink exposes a global API that you can access in DataviewJS:

### Global Objects
- `BibleLinkAPI` - Recommended API interface
- `BibleLinkPlugin` - Direct plugin instance
- `app.plugins.plugins["obsidian-biblelink"].instance` - Alternative access method

### API Methods

#### `BibleLinkAPI.searchVerses(options)`
Search for Bible verses with various criteria.

**Parameters:**
- `options` (object):
  - `text` (string, optional): Search text within verse content
  - `translation` (string, optional): Bible translation (e.g., "ASV", "NASB")
  - `book` (string, optional): Specific book name
  - `chapter` (number, optional): Specific chapter number
  - `verse` (number, optional): Specific verse number
  - `limit` (number, optional): Maximum number of results (default: 50)

**Returns:** Array of verse objects with properties: `book`, `chapter`, `verse`, `text`, `translation`

#### `BibleLinkAPI.getAvailableTranslations()`
Get list of available Bible translations.

**Returns:** Array of translation names (strings)

#### `BibleLinkAPI.getVerse(book, chapter, verse, translation)`
Get a specific verse.

**Parameters:**
- `book` (string): Book name
- `chapter` (number): Chapter number
- `verse` (number): Verse number
- `translation` (string, optional): Translation (defaults to first available)

**Returns:** Verse object or null if not found

## Basic Usage

### Simple Table Display

```javascript
```dataviewjs
// Check if API is available
if (typeof BibleLinkAPI !== 'undefined') {
    // Search for verses containing "I am"
    const verses = BibleLinkAPI.searchVerses({
        text: "I am",
        translation: "ASV"
    });
    
    // Display in table format
    dv.table(["Book", "Chapter", "Verse", "Text"], 
        verses.map(v => [v.book, v.chapter, v.verse, v.text])
    );
} else {
    dv.paragraph("❌ BibleLink API not available. Please reload the plugin.");
}
```
```

### Advanced Search with Multiple Criteria

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        text: "love",
        translation: "ASV",
        book: "John",
        limit: 20
    });
    
    dv.table(["Reference", "Text"], 
        verses.map(v => [
            `${v.book} ${v.chapter}:${v.verse}`,
            v.text
        ])
    );
} else {
    dv.paragraph("❌ BibleLink API not available.");
}
```
```

## Advanced Examples

### 1. Search with Multiple Translations

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const translations = BibleLinkAPI.getAvailableTranslations();
    let allResults = [];
    
    // Search across all available translations
    for (const translation of translations) {
        const results = BibleLinkAPI.searchVerses({
            text: "faith",
            translation: translation,
            limit: 10
        });
        allResults = allResults.concat(results);
    }
    
    // Sort by book, chapter, verse
    allResults.sort((a, b) => {
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });
    
    dv.table(["Translation", "Reference", "Text"], 
        allResults.map(v => [
            v.translation,
            `${v.book} ${v.chapter}:${v.verse}`,
            v.text
        ])
    );
} else {
    dv.paragraph("❌ BibleLink API not available.");
}
```
```

### 2. Chapter Summary

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const book = "John";
    const chapter = 3;
    const translation = "ASV";
    
    const verses = [];
    for (let verse = 1; verse <= 36; verse++) { // John 3 has 36 verses
        const verseData = BibleLinkAPI.getVerse(book, chapter, verse, translation);
        if (verseData) {
            verses.push(verseData);
        }
    }
    
    dv.header(3, `${book} Chapter ${chapter} (${translation})`);
    dv.table(["Verse", "Text"], 
        verses.map(v => [v.verse, v.text])
    );
} else {
    dv.paragraph("❌ BibleLink API not available.");
}
```
```

### 3. Word Frequency Analysis

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const searchWord = "grace";
    const verses = BibleLinkAPI.searchVerses({
        text: searchWord,
        translation: "ASV"
    });
    
    // Count occurrences by book
    const bookCounts = {};
    verses.forEach(v => {
        bookCounts[v.book] = (bookCounts[v.book] || 0) + 1;
    });
    
    // Sort by count
    const sortedBooks = Object.entries(bookCounts)
        .sort(([,a], [,b]) => b - a);
    
    dv.header(3, `"${searchWord}" occurrences by book`);
    dv.table(["Book", "Occurrences"], sortedBooks);
    
    dv.header(4, `Total verses found: ${verses.length}`);
} else {
    dv.paragraph("❌ BibleLink API not available.");
}
```
```

### 4. Cross-Reference Search

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const reference = "John 3:16";
    const translation = "ASV";
    
    // Parse reference
    const match = reference.match(/(\w+)\s+(\d+):(\d+)/);
    if (match) {
        const [, book, chapter, verse] = match;
        const verseData = BibleLinkAPI.getVerse(book, parseInt(chapter), parseInt(verse), translation);
        
        if (verseData) {
            dv.header(3, `${reference} (${translation})`);
            dv.paragraph(`**${verseData.text}**`);
            
            // Find similar verses
            const similar = BibleLinkAPI.searchVerses({
                text: "God so loved",
                translation: translation,
                limit: 5
            });
            
            if (similar.length > 1) {
                dv.header(4, "Similar verses:");
                dv.list(similar
                    .filter(v => !(v.book === book && v.chapter === parseInt(chapter) && v.verse === parseInt(verse)))
                    .map(v => `${v.book} ${v.chapter}:${v.verse} - ${v.text}`)
                );
            }
        } else {
            dv.paragraph(`❌ Verse not found: ${reference}`);
        }
    } else {
        dv.paragraph("❌ Invalid reference format. Use 'Book Chapter:Verse'");
    }
} else {
    dv.paragraph("❌ BibleLink API not available.");
}
```
```

## Troubleshooting

### Check API Availability

```javascript
```dataviewjs
// Test if BibleLink API is available
if (typeof BibleLinkAPI !== 'undefined') {
    dv.paragraph("✅ BibleLink API is available");
    
    const translations = BibleLinkAPI.getAvailableTranslations();
    dv.paragraph(`Available translations: ${translations.join(', ')}`);
    
    // Test a simple search
    const testResults = BibleLinkAPI.searchVerses({ text: "God", limit: 1 });
    if (testResults.length > 0) {
        dv.paragraph("✅ Search functionality working");
    } else {
        dv.paragraph("⚠️ Search returned no results (may be normal if no matching verses)");
    }
} else {
    dv.paragraph("❌ BibleLink API not available");
    dv.paragraph("Please ensure:");
    dv.list([
        "BibleLink plugin is installed and enabled",
        "Plugin has been reloaded after installation",
        "You have Bible data imported"
    ]);
}
```
```

### Common Issues

1. **"BibleLink API not available"**
   - Reload the BibleLink plugin
   - Check that the plugin is enabled
   - Restart Obsidian if necessary

2. **No search results**
   - Check available translations: `BibleLinkAPI.getAvailableTranslations()`
   - Verify your search terms
   - Ensure you have Bible data imported

3. **Translation not found**
   - The default data includes only "ASV"
   - Import additional translations through the plugin settings
   - Use `BibleLinkAPI.getAvailableTranslations()` to see what's available

## Best Practices

1. **Always check API availability** before using it
2. **Use appropriate limits** for large searches to avoid performance issues
3. **Handle errors gracefully** with user-friendly messages
4. **Sort results** for better readability when displaying multiple verses
5. **Use meaningful column headers** in tables
6. **Consider performance** - avoid very large result sets in a single query

## Integration Tips

- **Combine with other DataviewJS features** like date functions, file operations, etc.
- **Create reusable templates** for common Bible queries
- **Use in daily notes** to display daily Bible verses
- **Link to specific verses** using Obsidian's internal linking syntax
- **Export results** to other formats or plugins as needed 