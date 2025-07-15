# BibleLink Features

This document provides a comprehensive overview of all BibleLink features with detailed examples and usage instructions.

## Core Features

### 1. Bible Reference Insertion

Insert Bible references in three different formats:

#### Text Output
```
John 3:16 (ASV): For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.
```

#### Link Output
```
[John 3:16](https://literalword.com/?q=John+3%3A16)
```

#### Code Block Output
````markdown
```bible[red-letter,detailed]
John 3:16 ASV
For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.
```
````

### 2. Advanced Code Block Features

#### Syntax Options
Use options in square brackets to customize the output:

```markdown
```bible[option1,option2]
reference
```
```

#### Available Options
- `red-letter` - Highlights Jesus' words in red
- `simple` - Simple heading style (John 3:16)
- `detailed` - Detailed heading style (John 3:16 ASV)
- `none` - No heading
- `verse-numbers` - Shows verse numbers
- `no-verse-numbers` - Hides verse numbers

#### Code Block Examples

**Basic Code Block**
````markdown
```bible
John 3:16
For God so loved the world...
```
````

**Red Letter Text**
````markdown
```bible[red-letter]
John 14:6
I am the way, and the truth, and the life...
```
````

**Custom Styling**
````markdown
```bible[detailed,verse-numbers]
John 3:16-17 ASV
For God so loved the world...
```
````

**No Heading**
````markdown
```bible[none]
John 3:16
For God so loved the world...
```
````

### 3. Complex Reference Parsing

Support for various reference formats:

#### Single Verse
```
John 3:16
```

#### Verse Range
```
John 1:13-25
```

#### Chapter Reference
```
Genesis 1
```

#### Cross-Chapter Range
```
Genesis 1:1-2:3
```

#### Multiple Verses
```
John 3:16, 17, 18
```

### 4. Keyboard Shortcuts

#### Default Shortcuts
- `jn316` → John 3:16
- `gen11` → Genesis 1:1
- `ps231` → Psalm 23:1
- `rom828` → Romans 8:28
- `jn11` → John 1:1

#### Custom Shortcuts
Configure your own shortcuts in settings:
- Shortcut: `jn1414`
- Reference: `John 14:14`

#### Using Shortcuts
1. Type the shortcut in any note
2. Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
3. The reference is automatically inserted

### 5. Translation Management

#### Available Translations (140+)

**Popular English Translations**
- ASV - American Standard Version (1901)
- KJV - King James Version
- WEB - World English Bible
- YLT - Young's Literal Translation (1898)
- BBE - Bible in Basic English (1949/1964)
- BSB - Berean Standard Bible
- CPDV - Catholic Public Domain Version

**Historical Translations**
- Tyndale - William Tyndale Bible (1525/1530)
- Wycliffe - John Wycliffe Bible (c.1395)
- Webster - Webster Bible
- Vulgate - Latin Vulgate

**Original Languages**
- Byz - Byzantine Textform (Greek)
- TR - Textus Receptus (Greek)
- WLC - Westminster Leningrad Codex (Hebrew)

**International Translations**
- SpaRV - Spanish Reina-Valera (1909)
- UkrOgienko - Ukrainian Bible (Ogienko)
- Viet - Vietnamese Bible (1934)
- ThaiKJV - Thai King James Version
- And 120+ more translations in 40+ languages

#### Adding Translations

**One-Click Downloads**
1. Go to Plugin Settings → BibleLink → Translations
2. Browse "Popular Translations" or "All Available Translations"
3. Click any translation abbreviation to download instantly

**Upload Custom Files**
- **SQLite**: Upload custom Bible databases
- **XML**: Import XML Bible files (e.g., Bible_English_NASB_Strong.xml)

**Edit Translation Metadata**
- Modify name, abbreviation, language, category
- Add custom processing rules for text formatting

### 6. Dataview Integration

#### Virtual Notes
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

#### Example Dataview Queries

**List verses from John**
```dataview
TABLE verse, text
FROM "Bible/John"
WHERE translation = "ASV"
SORT chapter, verse
```

**Find verses containing "love"**
```dataview
LIST text
FROM "Bible"
WHERE contains(text, "love") AND translation = "ASV"
```

**Show verses from specific chapter**
```dataview
TABLE book, verse, text
FROM "Bible"
WHERE book = "John" AND chapter = 3
```

**Compare translations**
```dataview
TABLE translation, text
FROM "Bible"
WHERE book = "John" AND chapter = 3 AND verse = 16
```

**Find Jesus' words**
```dataview
LIST text
FROM "Bible"
WHERE contains(text, "I am") AND translation = "ASV"
```

**Search by book and verse range**
```dataview
TABLE verse, text
FROM "Bible"
WHERE book = "John" AND chapter = 3 AND verse >= 16 AND verse <= 18
```

### 7. Settings Configuration

#### Basic Settings
- **Default Translation**: Choose your preferred Bible translation
- **Default Output Type**: text, link, or codeblock
- **Show Translation Abbreviation**: Include translation abbreviation in output
- **Show Book Abbreviations**: Use abbreviated book names (e.g., Jn instead of John)

#### Code Block Styling
- **Background Color**: Customize code block background
- **Text Color**: Customize verse text color
- **Verse Number Color**: Customize verse number highlighting
- **Heading Style**: none, simple, or detailed
- **Code Block Language**: Customize language identifier (default: "bible")

#### Shortcuts
- **Enable Shortcuts**: Turn keyboard shortcuts on/off
- **Manage Shortcuts**: Add, edit, or remove quick access shortcuts

#### Dataview Integration
- **Enable Dataview Metadata**: Create virtual notes for Dataview queries
- **Metadata Fields**: Configure which fields to include in virtual notes

### 8. Modal Interface

#### Grid-Based Selection
- **Book Grid**: Visual grid of all Bible books
- **Chapter Grid**: Dynamic chapter selection based on selected book
- **Verse Grid**: Verse selection with multi-select support

#### Reference Input
- **Direct Input**: Type references directly (e.g., "John 1:13-25")
- **Real-time Validation**: Instant feedback on reference format
- **Auto-completion**: Suggestions based on available data

#### Modal Persistence
- **Remembers Settings**: Last used translation, output type, and options
- **Quick Access**: Fast access to frequently used configurations

### 9. Data Management

#### Local Storage
- **JSON Format**: Efficient local storage in JSON format
- **Automatic Backup**: Data saved with your vault
- **Offline Access**: All translations available offline

#### Import Support
- **SQLite Databases**: Import from scrollmapper format
- **XML Files**: Import from various XML Bible formats
- **Custom Schemas**: Support for custom database structures

#### Processing Rules
- **Regex Patterns**: Match specific text patterns
- **Formatting**: Apply HTML formatting or text replacements
- **Escape Options**: Handle special characters

### 10. Technical Features

#### Error Handling
- **Graceful Degradation**: Plugin continues working even with data issues
- **User-Friendly Messages**: Clear error messages for users
- **Comprehensive Logging**: Detailed logging for debugging

#### Performance
- **Efficient Data Structures**: Optimized for fast lookups
- **Lazy Loading**: Load data only when needed
- **Memory Management**: Proper cleanup and resource management

#### Compatibility
- **Obsidian 0.15.0+**: Compatible with current Obsidian versions
- **Dataview Plugin**: Optional integration with Dataview
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Usage Examples

### Study Notes
```markdown
# Bible Study: John 3

## Key Verses

```bible[red-letter,detailed]
John 3:16 ASV
For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.
```

## Cross-References

```bible[simple]
Romans 8:28
And we know that to them that love God all things work together for good, even to them that are called according to his purpose.
```

## Jesus' Words

```bible[red-letter,none]
John 14:6
I am the way, and the truth, and the life: no one cometh unto the Father, but by me.
```
```

### Sermon Notes
```markdown
# Sermon: God's Love

## Main Text
```bible[detailed,verse-numbers]
John 3:16-17 ASV
For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life. For God sent not the Son into the world to judge the world; but that the world should be saved through him.
```

## Supporting Verses
- [Romans 5:8](https://literalword.com/?q=Romans+5%3A8)
- [1 John 4:9](https://literalword.com/?q=1+John+4%3A9)
```

### Dataview Queries
```markdown
## All Verses About Love

```dataview
LIST text
FROM "Bible"
WHERE contains(text, "love") AND translation = "ASV"
SORT book, chapter, verse
```

## Jesus' "I Am" Statements

```dataview
TABLE book, chapter, verse, text
FROM "Bible"
WHERE contains(text, "I am") AND translation = "ASV"
SORT book, chapter, verse
```
```

## Advanced Features

### Custom Processing Rules
Add custom text formatting rules for translations:

```json
{
  "regex": "\\bGod\\b",
  "formatting": "<strong>God</strong>",
  "escape": false
}
```

### Reference Validation
The plugin validates references before insertion:
- Checks if book exists
- Validates chapter and verse numbers
- Ensures translation is available
- Provides helpful error messages

### Modal Customization
- Persistent settings across sessions
- Customizable grid layouts
- Responsive design for different screen sizes
- Keyboard navigation support

This comprehensive feature set makes BibleLink a powerful tool for Bible study within Obsidian, providing both simplicity for beginners and advanced features for power users. 