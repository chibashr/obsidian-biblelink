# BibleLink for Obsidian

A powerful Obsidian plugin that integrates Bible verse data and provides seamless DataviewJS integration for advanced Bible study and research.

## Features

- **📖 Bible Data Integration**: Access complete Bible text data with support for multiple translations
- **🔍 Advanced Search**: Search verses by text content, book, chapter, verse, and translation
- **📊 DataviewJS Integration**: Query Bible data directly in your notes using DataviewJS
- **🌐 Multiple Translations**: Support for various Bible translations (ASV included by default)
- **⚡ Fast Performance**: Optimized data storage and retrieval for smooth operation
- **🔧 Easy Configuration**: Simple settings interface for managing translations and preferences

## Installation

### From GitHub Release

1. Go to the [Releases](https://github.com/YOUR_GITHUB_USERNAME/obsidian-biblelink/releases) page.
2. Download the latest `obsidian-biblelink.zip` from the **Assets** section (do **not** use the "Source code" ZIP).
3. Unzip the file. Copy `main.js` and `manifest.json` into a folder named `obsidian-biblelink` inside your vault’s `.obsidian/plugins/` directory.
4. Reload Obsidian and enable the plugin in Settings → Community Plugins.

> **Note:** Only use the `obsidian-biblelink.zip` file from the Assets section. Do **not** use the automatically generated "Source code" ZIP or TAR files, as they contain the entire repository and are not suitable for plugin installation.

### From Obsidian (when available)
- Go to Settings → Community plugins
- Turn off Safe mode
- Browse and search for "BibleLink"
- Install and enable the plugin

## Quick Start

### 1. Basic DataviewJS Query

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

### 2. Search Specific Book

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
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

### 3. Get Specific Verse

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verse = BibleLinkAPI.getVerse("John", 3, 16, "ASV");
    if (verse) {
        dv.paragraph(`**${verse.book} ${verse.chapter}:${verse.verse}**`);
        dv.paragraph(verse.text);
    }
}
```
```

## DataviewJS Integration

BibleLink provides comprehensive DataviewJS integration, allowing you to query Bible data directly in your Obsidian notes. Unlike Dataview's DQL, which only works with indexed metadata, DataviewJS can access the plugin's API directly.

### Available API

- `BibleLinkAPI.searchVerses(options)` - Search verses with various criteria
- `BibleLinkAPI.getVerse(book, chapter, verse, translation)` - Get specific verse
- `BibleLinkAPI.getAvailableTranslations()` - List available translations

### Advanced Examples

#### Word Frequency Analysis
```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const searchWord = "grace";
    const verses = BibleLinkAPI.searchVerses({
        text: searchWord,
        translation: "ASV"
    });
    
    const bookCounts = {};
    verses.forEach(v => {
        bookCounts[v.book] = (bookCounts[v.book] || 0) + 1;
    });
    
    const sortedBooks = Object.entries(bookCounts)
        .sort(([,a], [,b]) => b - a);
    
    dv.header(3, `"${searchWord}" occurrences by book`);
    dv.table(["Book", "Occurrences"], sortedBooks);
}
```
```

#### Chapter Summary
```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const book = "John";
    const chapter = 3;
    const translation = "ASV";
    
    const verses = [];
    for (let verse = 1; verse <= 36; verse++) {
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

## Configuration

### Settings

Access plugin settings through Obsidian's Settings → Community plugins → BibleLink:

- **Data Management**: Import/export Bible translations
- **Search Preferences**: Configure default search behavior
- **Performance Options**: Adjust caching and search limits

### Adding Translations

1. Obtain Bible data in the supported JSON format
2. Use the plugin settings to import the translation
3. The translation will be available for all DataviewJS queries

## Troubleshooting

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

### API Availability Check

```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    dv.paragraph("✅ BibleLink API is available");
    
    const translations = BibleLinkAPI.getAvailableTranslations();
    dv.paragraph(`Available translations: ${translations.join(', ')}`);
} else {
    dv.paragraph("❌ BibleLink API not available");
    dv.paragraph("Please ensure the plugin is installed and enabled.");
}
```
```

## Examples

See the [examples folder](examples/) for comprehensive DataviewJS examples and use cases.

## Development

### Building

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the [documentation](DATAVIEW_INTEGRATION.md)
- Review the [examples](examples/)
- Open an issue on GitHub

---

**Note**: This plugin requires the Dataview plugin to be installed for DataviewJS functionality. Dataview's DQL (Dataview Query Language) cannot directly query plugin data, but DataviewJS provides full access to all BibleLink features. 

---

## Maintainer Release Instructions

To create a new release for Obsidian:

1. **Build the plugin**
   ```bash
   npm install
   npm run build
   ```
   This generates `main.js` in the project root.

2. **Push your changes and tag a new release**
   ```bash
   git add main.js manifest.json .github/workflows/release.yml
   git commit -m "Release vX.Y.Z"
   git tag vX.Y.Z
   git push origin master --tags
   ```

3. **The GitHub Actions workflow will automatically create a ZIP**
   - The workflow will upload `obsidian-biblelink.zip` containing only `main.js` and `manifest.json` as the release asset.
   - No manual ZIP creation is needed.

**Note:** Do not include source files, node_modules, or development artifacts in the release ZIP. Only `main.js` and `manifest.json` are required for users. 

## Changelog

### v1.2.0
- Initial release of BibleLink plugin for Obsidian with ASV translation, DataviewJS integration, and advanced search features. 