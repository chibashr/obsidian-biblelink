# BibleLink - Simple Bible Study for Obsidian

A free, open-source Obsidian plugin designed for minimal, intuitive Bible study, adhering to the KISS (Keep It Simple, Stupid) principle.

> **Vibe Coded** ✨ - This plugin was crafted with good vibes and positive energy during development.

## Features

- **Single Command Interface**: Insert Bible references with one simple command
- **Local Bible Database**: Store full Bible translations locally in JSON format for offline access
- **140+ Bible Translations**: Access to the complete scrollmapper/bible_databases repository
- **Preloaded ASV**: Comes with the public-domain American Standard Version (ASV)
- **Multiple Output Formats**: 
  - Full verse text with reference
  - [Literal Word](https://literalword.com) links
- **Translation Management**: 
  - One-click download of 140+ Bible translations
  - Upload custom Bible databases
  - Import XML Bible files (e.g., Bible_English_NASB_Strong.xml)
- **Dataview Integration**: Query Bible verses with basic Dataview syntax
- **Virtual Notes**: Automatically creates Dataview-compatible notes for referenced verses

## Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins
3. Search for "BibleLink"
4. Install and enable the plugin

### Manual Installation
1. Download the latest release from GitHub
2. Extract to `.obsidian/plugins/biblelink/` in your vault
3. Enable the plugin in Obsidian settings

## Quick Start

1. **Enable the plugin** - ASV Bible is automatically loaded
2. **Use the command** - Press `Ctrl+P` (or `Cmd+P` on Mac) and search for "Insert Bible Reference"
3. **Select your verse** - Choose book, chapter, verse, translation, and output type
4. **Insert** - The reference is inserted at your cursor position

## Usage Examples

### Text Output
```
John 3:16 (ASV): For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.
```

### Link Output
```
[John 3:16](https://literalword.com/?q=John+3%3A16)
```

## Translation Management

### Available Bible Translations

BibleLink provides access to **140+ Bible translations** from the [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) repository, including:

#### Popular English Translations
- **ASV** - American Standard Version (1901)
- **KJV** - King James Version
- **WEB** - World English Bible
- **YLT** - Young's Literal Translation (1898)
- **BBE** - Bible in Basic English (1949/1964)
- **BSB** - Berean Standard Bible
- **CPDV** - Catholic Public Domain Version

#### Historical Translations
- **Tyndale** - William Tyndale Bible (1525/1530)
- **Wycliffe** - John Wycliffe Bible (c.1395)
- **Webster** - Webster Bible
- **Vulgate** - Latin Vulgate

#### Original Languages
- **Byz** - Byzantine Textform (Greek)
- **TR** - Textus Receptus (Greek)
- **WLC** - Westminster Leningrad Codex (Hebrew)

#### International Translations
- **SpaRV** - Spanish Reina-Valera (1909)
- **UkrOgienko** - Ukrainian Bible (Ogienko)
- **Viet** - Vietnamese Bible (1934)
- **ThaiKJV** - Thai King James Version
- And 120+ more translations in 40+ languages

### Adding Translations

#### One-Click Downloads
- Go to Plugin Settings → BibleLink
- Browse the "Popular Translations" or "All Available Translations" sections
- Click any translation abbreviation to download instantly
- Translations are stored locally for offline access

#### Upload Custom Files
- Click "Upload SQLite" to add custom Bible databases
- Click "Upload XML" to import XML Bible files
- Supports both scrollmapper format and custom schemas

### Removing Translations
- Use the dropdown in settings to select a translation
- Click "Remove" (ASV cannot be removed)
- Deleted translations are permanently removed from the database

## Dataview Integration

BibleLink creates virtual notes for referenced verses with metadata:

```yaml
---
book: John
chapter: 3
verse: 16
translation: ASV
text: "For God so loved the world..."
---
```

### Example Dataview Queries

#### List verses from John
```dataview
TABLE verse, text
FROM "Bible/John"
WHERE translation = "ASV"
SORT chapter, verse
```

#### Find verses containing "love"
```dataview
LIST text
FROM "Bible"
WHERE contains(text, "love") AND translation = "ASV"
```

#### Show verses from specific chapter
```dataview
TABLE book, verse, text
FROM "Bible"
WHERE book = "John" AND chapter = 3
```

#### Compare translations
```dataview
TABLE translation, text
FROM "Bible"
WHERE book = "John" AND chapter = 3 AND verse = 16
```

## Settings

### Default Translation
Choose your preferred Bible translation for the selector modal.

### Output Type
- **Full Verse Text**: Inserts complete verse with reference
- **Literal Word Link**: Creates clickable link to Literal Word website

## Technical Details

### Data Storage
BibleLink uses JSON-based storage for maximum compatibility with Obsidian's plugin system:
- **Data Location**: `.biblelink/bible_data.json` in your vault
- **Format**: Structured JSON with translations and verses
- **Automatic Backup**: Data is automatically saved with your vault
- **Sample Data**: See `data/sample_bible_data.json` for the expected data structure

### File Structure
```
.obsidian/plugins/biblelink/
├── main.js                 # Plugin bundle
├── manifest.json           # Plugin metadata
└── .biblelink/
    └── bible_data.json     # Bible data storage
```

### Supported Bible Formats

#### scrollmapper Database Format
The plugin can handle the scrollmapper database schema:
- `<translation>_books` table: book information
- `<translation>_verses` table: verse data with book_id references

#### Custom Database Format
Must contain a `verses` table with columns:
- `book` (TEXT): Book name
- `chapter` (INTEGER): Chapter number  
- `verse` (INTEGER): Verse number
- `text` (TEXT): Verse text

#### XML Format
Must follow structure:
```xml
<XMLBIBLE>
  <BIBLEBOOK bname="Genesis">
    <CHAPTER cnumber="1">
      <VERS>In the beginning God created...</VERS>
    </CHAPTER>
  </BIBLEBOOK>
</XMLBIBLE>
```

## Development

### Building from Source
```bash
npm install
npm run build
```

### Project Structure
```
src/
├── main.ts         # Main plugin class
├── database.ts     # JSON database management
├── selector.ts     # Bible reference selector modal
└── settings.ts     # Settings tab and translation management
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Copyright and Licensing Notes

- **ASV (American Standard Version)**: Public domain
- **Plugin Code**: MIT License
- **Bible Translations**: Various licenses - see [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) for individual translation licensing
- **User-uploaded translations**: Users are responsible for ensuring they have appropriate rights

Note: Some Bible translations are copyrighted and cannot be freely distributed. Users can upload their own licensed copies via the XML/SQLite import features.

## Data Source

BibleLink uses the [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) repository as its primary source for Bible translations. This repository provides:

- **140+ Bible translations** in multiple languages
- **Multiple formats**: SQLite, CSV, JSON, XML
- **Historical texts**: Ancient manuscripts and early translations
- **Modern translations**: Contemporary Bible versions
- **Original languages**: Hebrew, Greek, Aramaic texts

The repository is maintained by the open-source community and provides a comprehensive collection of Bible texts for study and research.

## Development Philosophy

This plugin was developed using the **"Vibe Coding"** approach - a development methodology that emphasizes:

- **Positive Energy**: Writing code with good vibes and positive intentions
- **Flow State**: Maintaining a smooth, enjoyable development experience
- **User-Centric Design**: Focusing on creating delightful user experiences
- **Simplicity**: Keeping things simple and intuitive
- **Community**: Building with the community in mind

The goal is to create software that not only works well but also brings joy to both developers and users. ✨ 