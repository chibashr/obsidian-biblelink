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
  - **Code blocks** with customizable styling
- **Advanced Code Block Features**:
  - Customizable background and text colors
  - Multiple heading styles (none, simple, detailed)
  - Verse number highlighting
  - Red-letter text for Jesus' words
  - Configurable language identifier
- **Translation Management**: 
  - One-click download of 140+ Bible translations
  - Upload custom Bible databases (SQLite)
  - Import XML Bible files (e.g., Bible_English_NASB_Strong.xml)
  - Edit translation metadata and processing rules
- **Keyboard Shortcuts**: Quick access to frequently used verses
- **Dataview Integration**: Query Bible verses with basic Dataview syntax
- **Virtual Notes**: Automatically creates Dataview-compatible notes for referenced verses
- **Reference Parsing**: Supports complex references like "John 1:13-25" or "Genesis 1:1-2:3"
- **Modal Persistence**: Remembers your last used settings

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

### Code Block Output
````markdown
```bible[red-letter,detailed]
John 3:16 ASV
For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.
```
````

### Complex References
- **Single verse**: `John 3:16`
- **Verse range**: `John 1:13-25`
- **Chapter**: `Genesis 1`
- **Cross-chapter**: `Genesis 1:1-2:3`

## Code Block Features

### Syntax Options
Use options in square brackets after the language identifier:

```markdown
```bible[option1,option2]
reference
```
```

### Available Options
- `red-letter` - Highlights Jesus' words in red
- `simple` - Simple heading style (John 3:16)
- `detailed` - Detailed heading style (John 3:16 ASV)
- `none` - No heading
- `verse-numbers` - Shows verse numbers
- `no-verse-numbers` - Hides verse numbers

### Examples

#### Basic Code Block
````markdown
```bible
John 3:16
For God so loved the world...
```
````

#### Red Letter Text
````markdown
```bible[red-letter]
John 14:6
I am the way, and the truth, and the life...
```
````

#### Custom Styling
````markdown
```bible[detailed,verse-numbers]
John 3:16-17 ASV
For God so loved the world...
```
````

## Keyboard Shortcuts

Configure quick access to frequently used verses:

### Default Shortcuts
- `jn316` → John 3:16
- `gen11` → Genesis 1:1
- `ps231` → Psalm 23:1
- `rom828` → Romans 8:28
- `jn11` → John 1:1

### Adding Custom Shortcuts
1. Go to Plugin Settings → BibleLink → Shortcuts
2. Click "Add Shortcut"
3. Enter shortcut key (e.g., `jn1414`)
4. Enter reference (e.g., `John 14:14`)
5. Save

### Using Shortcuts
- Type the shortcut in any note
- Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
- The reference is automatically inserted

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
- Go to Plugin Settings → BibleLink → Translations
- Browse the "Popular Translations" or "All Available Translations" sections
- Click any translation abbreviation to download instantly
- Translations are stored locally for offline access

#### Upload Custom Files
- Click "Upload SQLite" to add custom Bible databases
- Click "Upload XML" to import XML Bible files
- Supports both scrollmapper format and custom schemas

#### Edit Translation Metadata
- Click the edit icon next to any translation
- Modify name, abbreviation, language, category
- Add custom processing rules for text formatting

### Removing Translations
- Use the dropdown in settings to select a translation
- Click "Remove" (ASV cannot be removed)
- Deleted translations are permanently removed from the database

## Settings

### Basic Settings
- **Default Translation**: Choose your preferred Bible translation
- **Default Output Type**: text, link, or codeblock
- **Show Translation Abbreviation**: Include translation abbreviation in output
- **Show Book Abbreviations**: Use abbreviated book names (e.g., Jn instead of John)

### Code Block Styling
- **Background Color**: Customize code block background
- **Text Color**: Customize verse text color
- **Verse Number Color**: Customize verse number highlighting
- **Heading Style**: none, simple, or detailed
- **Code Block Language**: Customize language identifier (default: "bible")

### Shortcuts
- **Enable Shortcuts**: Turn keyboard shortcuts on/off
- **Manage Shortcuts**: Add, edit, or remove quick access shortcuts

### Dataview Integration
- **Enable Dataview Metadata**: Create virtual notes for Dataview queries
- **Metadata Fields**: Configure which fields to include in virtual notes

## Dataview Integration

BibleLink creates virtual notes for referenced verses with metadata:

```yaml
---
book: John
chapter: 3
verse: 16
translation: ASV
text: "For God so loved the world..."
reference: "John 3:16"
language: "en"
category: "English"
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

#### Find Jesus' words
```dataview
LIST text
FROM "Bible"
WHERE contains(text, "I am") AND translation = "ASV"
```

## Technical Details

### Data Storage
BibleLink uses JSON-based storage for maximum compatibility with Obsidian's plugin system:
- **Data Location**: `.obsidian/plugins/obsidian-biblelink/data/bible_data.json`
- **Format**: Structured JSON with translations and verses
- **Automatic Backup**: Data is automatically saved with your vault
- **Sample Data**: See `data/sample_bible_data.json` for the expected data structure

### File Structure
```
.obsidian/plugins/obsidian-biblelink/
├── main.js                 # Plugin bundle
├── manifest.json           # Plugin metadata
├── data/
│   ├── bible_data.json     # Bible data storage
│   └── settings.json       # Plugin settings
└── src/                    # Source code
    ├── main.ts            # Main plugin class and command registration
    ├── database.ts        # JSON database management and data operations
    ├── selector.ts        # Bible reference selector modal with grid interface
    └── settings.ts        # Settings tab and translation management
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

### Processing Rules
Custom text formatting rules can be applied to translations:
- **Regex Patterns**: Match specific text patterns
- **Formatting**: Apply HTML formatting or text replacements
- **Escape Options**: Handle special characters

## Development

### Building from Source
```bash
npm install
npm run build
```

### Project Structure
```
src/
├── main.ts         # Main plugin class and command registration
├── database.ts     # JSON database management and data operations
├── selector.ts     # Bible reference selector modal with grid interface
└── settings.ts     # Settings tab and translation management
```

### Key Features Implementation
- **Modal Grid Interface**: Modern grid-based book/chapter/verse selection
- **Reference Parsing**: Complex reference parsing with validation
- **Code Block Processing**: Custom markdown processor with styling options
- **Shortcut System**: Keyboard shortcut registration and processing
- **Dataview Integration**: Virtual note creation for query support

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