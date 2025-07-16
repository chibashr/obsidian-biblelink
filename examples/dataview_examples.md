# DataviewJS Examples for BibleLink

This document provides comprehensive examples of how to use BibleLink with DataviewJS for advanced Bible study and research.

## Prerequisites

Before using these examples, ensure you have:
1. **Dataview Plugin** installed and enabled
2. **BibleLink Plugin** installed and enabled
3. **Reloaded the BibleLink plugin** to ensure the API is available

## Basic Examples

### 1. Simple Text Search

Search for verses containing specific words or phrases:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        text: "I am",
        translation: "ASV"
    });
    
    dv.table(["Book", "Chapter", "Verse", "Text"], 
        verses.map(v => [v.book, v.chapter, v.verse, v.text])
    );
} else {
    dv.paragraph("❌ BibleLink API not available. Please reload the plugin.");
}
```
```

### 2. Search by Book

Find all verses from a specific book:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        book: "John",
        translation: "ASV",
        limit: 50
    });
    
    dv.table(["Chapter", "Verse", "Text"], 
        verses.map(v => [v.chapter, v.verse, v.text])
    );
}
```
```

### 3. Get Specific Verse

Retrieve a specific verse by reference:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verse = BibleLinkAPI.getVerse("John", 3, 16, "ASV");
    if (verse) {
        dv.header(3, `${verse.book} ${verse.chapter}:${verse.verse} (${verse.translation})`);
        dv.paragraph(`**${verse.text}**`);
    } else {
        dv.paragraph("❌ Verse not found");
    }
}
```
```

## Advanced Search Examples

### 4. Multiple Criteria Search

Search with multiple conditions:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        text: "love",
        book: "John",
        translation: "ASV",
        limit: 20
    });
    
    dv.table(["Chapter", "Verse", "Text"], 
        verses.map(v => [v.chapter, v.verse, v.text])
    );
}
```
```

### 5. Search Across All Translations

Search for a word across all available translations:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const translations = BibleLinkAPI.getAvailableTranslations();
    let allResults = [];
    
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
}
```
```

## Chapter and Book Analysis

### 6. Complete Chapter Display

Display all verses from a specific chapter:

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
}
```
```

### 7. Book Summary

Create a summary of a book with verse counts:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const book = "John";
    const translation = "ASV";
    
    const verses = BibleLinkAPI.searchVerses({
        book: book,
        translation: translation
    });
    
    // Group by chapter
    const chapterCounts = {};
    verses.forEach(v => {
        chapterCounts[v.chapter] = (chapterCounts[v.chapter] || 0) + 1;
    });
    
    const sortedChapters = Object.entries(chapterCounts)
        .sort(([a], [b]) => parseInt(a) - parseInt(b));
    
    dv.header(3, `${book} Summary (${translation})`);
    dv.table(["Chapter", "Verses"], sortedChapters);
    dv.paragraph(`**Total verses: ${verses.length}**`);
}
```
```

## Word and Phrase Analysis

### 8. Word Frequency Analysis

Analyze how often a word appears in different books:

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
}
```
```

### 9. Phrase Search

Search for specific phrases or combinations:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const phrases = ["kingdom of heaven", "kingdom of God"];
    let allResults = [];
    
    for (const phrase of phrases) {
        const results = BibleLinkAPI.searchVerses({
            text: phrase,
            translation: "ASV"
        });
        allResults = allResults.concat(results);
    }
    
    // Remove duplicates and sort
    const uniqueResults = allResults.filter((v, index, self) => 
        index === self.findIndex(t => 
            t.book === v.book && t.chapter === v.chapter && t.verse === v.verse
        )
    ).sort((a, b) => {
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });
    
    dv.header(3, "Kingdom References");
    dv.table(["Reference", "Text"], 
        uniqueResults.map(v => [
            `${v.book} ${v.chapter}:${v.verse}`,
            v.text
        ])
    );
}
```
```

## Cross-Reference and Study Tools

### 10. Cross-Reference Search

Find verses related to a specific reference:

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
}
```
```

### 11. Topical Study

Create a topical study on a specific theme:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const topic = "prayer";
    const keywords = ["pray", "prayer", "praying", "prayed"];
    let allResults = [];
    
    for (const keyword of keywords) {
        const results = BibleLinkAPI.searchVerses({
            text: keyword,
            translation: "ASV",
            limit: 20
        });
        allResults = allResults.concat(results);
    }
    
    // Remove duplicates and sort
    const uniqueResults = allResults.filter((v, index, self) => 
        index === self.findIndex(t => 
            t.book === v.book && t.chapter === v.chapter && t.verse === v.verse
        )
    ).sort((a, b) => {
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });
    
    dv.header(3, `Topical Study: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`);
    dv.table(["Reference", "Text"], 
        uniqueResults.map(v => [
            `${v.book} ${v.chapter}:${v.verse}`,
            v.text
        ])
    );
}
```
```

## Daily and Devotional Examples

### 12. Daily Bible Verse

Display a verse based on today's date:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Get verses from Proverbs chapter matching today's date
    const verses = BibleLinkAPI.searchVerses({
        book: "Proverbs",
        chapter: dayOfMonth,
        translation: "ASV"
    });
    
    if (verses.length > 0) {
        dv.header(3, `Daily Bible Study - Proverbs ${dayOfMonth}`);
        dv.table(["Verse", "Text"], 
            verses.map(v => [v.verse, v.text])
        );
    } else {
        dv.paragraph(`No verses found for Proverbs ${dayOfMonth}`);
    }
}
```
```

### 13. Random Verse

Display a random verse for daily inspiration:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        translation: "ASV",
        limit: 100
    });
    
    if (verses.length > 0) {
        const randomIndex = Math.floor(Math.random() * verses.length);
        const randomVerse = verses[randomIndex];
        
        dv.header(3, "Verse of the Day");
        dv.paragraph(`**${randomVerse.book} ${randomVerse.chapter}:${randomVerse.verse}**`);
        dv.paragraph(randomVerse.text);
    }
}
```
```

## Translation Comparison

### 14. Compare Translations

Compare the same verse across different translations:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const book = "John";
    const chapter = 3;
    const verse = 16;
    const translations = BibleLinkAPI.getAvailableTranslations();
    
    const comparisonResults = [];
    for (const translation of translations) {
        const verseData = BibleLinkAPI.getVerse(book, chapter, verse, translation);
        if (verseData) {
            comparisonResults.push(verseData);
        }
    }
    
    if (comparisonResults.length > 0) {
        dv.header(3, `Translation Comparison: ${book} ${chapter}:${verse}`);
        dv.table(["Translation", "Text"], 
            comparisonResults.map(v => [v.translation, v.text])
        );
    } else {
        dv.paragraph("❌ No translations found for this verse");
    }
}
```
```

## Troubleshooting Examples

### 15. API Availability Check

Test if the BibleLink API is available:

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

### 16. Translation Information

Display information about available translations:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const translations = BibleLinkAPI.getAvailableTranslations();
    
    dv.header(3, "Available Translations");
    dv.list(translations);
    
    // Show sample data for each translation
    for (const translation of translations) {
        const sample = BibleLinkAPI.searchVerses({
            translation: translation,
            limit: 1
        });
        
        if (sample.length > 0) {
            dv.header(4, `${translation} Sample`);
            dv.paragraph(`${sample[0].book} ${sample[0].chapter}:${sample[0].verse} - ${sample[0].text}`);
        }
    }
}
```
```

## Best Practices

### Performance Tips
1. **Use limits** for large searches to avoid performance issues
2. **Combine filters** to narrow down results before text searches
3. **Cache results** for frequently used queries
4. **Handle errors gracefully** with user-friendly messages

### Code Organization
1. **Always check API availability** before using it
2. **Use meaningful variable names** for clarity
3. **Add comments** to explain complex queries
4. **Sort results** for better readability

### User Experience
1. **Provide clear headers** for different sections
2. **Use appropriate table columns** for the data being displayed
3. **Include error messages** when things go wrong
4. **Format text appropriately** (bold for references, etc.)

## Customization Ideas

### Template Variables
You can create reusable templates by using variables:

```javascript
```dataviewjs
// Template variables - change these to customize the query
const SEARCH_TERM = "love";
const BOOK = "John";
const TRANSLATION = "ASV";
const LIMIT = 20;

if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        text: SEARCH_TERM,
        book: BOOK,
        translation: TRANSLATION,
        limit: LIMIT
    });
    
    dv.header(3, `Search Results: "${SEARCH_TERM}" in ${BOOK}`);
    dv.table(["Chapter", "Verse", "Text"], 
        verses.map(v => [v.chapter, v.verse, v.text])
    );
}
```
```

### Dynamic Queries
Create queries that adapt based on context:

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    // Get current note's tags to determine search context
    const currentFile = dv.current().file;
    const tags = currentFile.tags || [];
    
    let searchTerm = "God"; // default
    if (tags.includes("#love")) searchTerm = "love";
    if (tags.includes("#faith")) searchTerm = "faith";
    if (tags.includes("#hope")) searchTerm = "hope";
    
    const verses = BibleLinkAPI.searchVerses({
        text: searchTerm,
        translation: "ASV",
        limit: 10
    });
    
    dv.header(3, `Related verses for "${searchTerm}"`);
    dv.table(["Reference", "Text"], 
        verses.map(v => [
            `${v.book} ${v.chapter}:${v.verse}`,
            v.text
        ])
    );
}
```
```

These examples demonstrate the full power of BibleLink's DataviewJS integration. You can combine and modify these examples to create your own custom Bible study workflows. 