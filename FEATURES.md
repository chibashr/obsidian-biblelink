# BibleLink Features

BibleLink is a comprehensive Obsidian plugin that provides powerful Bible study capabilities through DataviewJS integration and advanced search functionality.

## Core Features

### 📖 Bible Data Integration
- **Local Bible Database**: Store complete Bible translations locally in JSON format
- **Multiple Translations**: Support for various Bible translations (ASV included by default)
- **Offline Access**: All Bible data stored locally for offline use
- **Fast Performance**: Optimized data storage and retrieval

### 🔍 Advanced Search
- **Text Search**: Search for specific words or phrases within verse content
- **Reference Search**: Find verses by book, chapter, and verse numbers
- **Translation Filtering**: Search within specific Bible translations
- **Combined Queries**: Use multiple search criteria simultaneously

### 📊 DataviewJS Integration
- **Direct API Access**: Query Bible data directly in your notes using DataviewJS
- **Rich Metadata**: Access comprehensive verse information including book, chapter, verse, text, and translation
- **Flexible Queries**: Create complex searches with JavaScript
- **Real-time Results**: Get instant results without creating additional files

### 🌐 Translation Management
- **Multiple Formats**: Support for JSON, SQLite, and XML Bible data formats
- **Easy Import**: Simple import process for additional translations
- **Metadata Editing**: Customize translation names, abbreviations, and categories
- **Data Validation**: Automatic validation of imported Bible data

## DataviewJS Capabilities

### Available API Methods

#### `BibleLinkAPI.searchVerses(options)`
Search for Bible verses with various criteria:
- `text`: Search text within verse content
- `translation`: Bible translation (e.g., "ASV", "NASB")
- `book`: Specific book name
- `chapter`: Specific chapter number
- `verse`: Specific verse number
- `limit`: Maximum number of results

#### `BibleLinkAPI.getVerse(book, chapter, verse, translation)`
Get a specific verse by reference.

#### `BibleLinkAPI.getAvailableTranslations()`
Get list of available Bible translations.

### Query Examples

#### Basic Search
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
}
```
```

#### Advanced Filtering
```javascript
```dataviewjs
if (typeof BibleLinkAPI !== 'undefined') {
    const verses = BibleLinkAPI.searchVerses({
        book: "John",
        chapter: 3,
        translation: "ASV",
        limit: 20
    });
    
    dv.table(["Verse", "Text"], 
        verses.map(v => [v.verse, v.text])
    );
}
```
```

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

## Technical Features

### Data Storage
- **JSON Format**: Efficient JSON-based storage for maximum compatibility
- **Automatic Backup**: Data automatically saved with your vault
- **Sample Data**: Included sample data for testing and development
- **Data Validation**: Automatic validation of Bible data structure

### Performance Optimization
- **Caching**: Intelligent caching for frequently accessed data
- **Search Limits**: Configurable limits to prevent performance issues
- **Efficient Queries**: Optimized search algorithms for fast results
- **Memory Management**: Efficient memory usage for large datasets

### Plugin Integration
- **Obsidian API**: Full integration with Obsidian's plugin system
- **Settings Interface**: Comprehensive settings tab for configuration
- **Error Handling**: Robust error handling and user feedback
- **Global API**: Exposes API globally for DataviewJS access

## User Experience Features

### Easy Setup
- **Automatic Installation**: Simple installation process
- **Default Data**: Pre-loaded with ASV translation
- **Quick Start**: Immediate access to basic functionality
- **Documentation**: Comprehensive documentation and examples

### Configuration Options
- **Search Preferences**: Configure default search behavior
- **Performance Settings**: Adjust caching and search limits
- **Translation Management**: Easy import and management of translations
- **API Access**: Multiple ways to access plugin functionality

### Error Handling
- **User-Friendly Messages**: Clear error messages and troubleshooting guidance
- **Graceful Degradation**: Plugin continues to work even with partial data
- **Validation**: Automatic validation of user inputs and data
- **Recovery**: Automatic recovery from common error conditions

## Advanced Features

### Cross-Reference Search
- **Similar Verses**: Find verses with similar content
- **Reference Parsing**: Parse complex Bible references
- **Context Awareness**: Provide context for search results

### Data Analysis
- **Word Frequency**: Analyze word usage across books and translations
- **Statistical Information**: Provide statistics about search results
- **Trend Analysis**: Identify patterns in Bible text

### Export and Integration
- **Data Export**: Export search results in various formats
- **External Integration**: Integration with other Obsidian plugins
- **Custom Scripts**: Support for custom JavaScript queries

## Security and Privacy

### Data Privacy
- **Local Storage**: All data stored locally on your device
- **No External Calls**: No data sent to external servers
- **User Control**: Complete control over your Bible data
- **Secure Access**: Secure API access through Obsidian's plugin system

### Data Integrity
- **Validation**: Automatic validation of imported data
- **Backup**: Automatic backup of plugin data
- **Recovery**: Data recovery options in case of corruption
- **Version Control**: Support for version control of Bible data

## Future Features

### Planned Enhancements
- **Advanced Search**: More sophisticated search algorithms
- **Translation Comparison**: Side-by-side translation comparison
- **Study Tools**: Additional Bible study features
- **Mobile Support**: Enhanced mobile experience
- **Community Features**: Sharing and collaboration tools

### Extensibility
- **Plugin API**: Public API for other plugins to integrate
- **Custom Formats**: Support for additional Bible data formats
- **Themes**: Customizable themes and styling
- **Workflows**: Integration with Obsidian workflows

## System Requirements

### Obsidian Version
- **Minimum**: Obsidian 0.15.0 or higher
- **Recommended**: Latest stable version

### Dependencies
- **Dataview Plugin**: Required for DataviewJS functionality
- **No External Dependencies**: All other functionality self-contained

### Performance
- **Memory**: Minimal memory footprint
- **Storage**: Efficient storage of Bible data
- **Speed**: Fast search and retrieval performance

## Support and Documentation

### Documentation
- **Comprehensive Guides**: Detailed documentation for all features
- **Examples**: Extensive collection of example queries
- **Tutorials**: Step-by-step tutorials for common use cases
- **API Reference**: Complete API documentation

### Community Support
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Self-service documentation and guides
- **Examples**: Community-contributed examples and use cases
- **Best Practices**: Recommended practices and workflows 