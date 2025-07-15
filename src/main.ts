import { Plugin, Editor, Notice, TAbstractFile, TFile } from 'obsidian';
import { BibleDatabase } from './database';
import { BibleSelectorModal } from './selector';
import { BibleLinkSettingTab, BibleLinkSettings, DEFAULT_SETTINGS } from './settings';
import * as fs from 'fs';
import * as path from 'path';

// Book abbreviations mapping
const BOOK_ABBREVIATIONS: Record<string, string> = {
    'Genesis': 'Gen', 'Exodus': 'Exo', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deu',
    'Joshua': 'Jos', 'Judges': 'Jdg', 'Ruth': 'Rut', '1 Samuel': '1Sa', '2 Samuel': '2Sa',
    '1 Kings': '1Ki', '2 Kings': '2Ki', '1 Chronicles': '1Ch', '2 Chronicles': '2Ch',
    'Ezra': 'Ezr', 'Nehemiah': 'Neh', 'Esther': 'Est', 'Job': 'Job', 'Psalms': 'Psa',
    'Proverbs': 'Pro', 'Ecclesiastes': 'Ecc', 'Song of Solomon': 'Sng', 'Isaiah': 'Isa',
    'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Ezk', 'Daniel': 'Dan',
    'Hosea': 'Hos', 'Joel': 'Jol', 'Amos': 'Amo', 'Obadiah': 'Oba', 'Jonah': 'Jon',
    'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zep', 'Haggai': 'Hag',
    'Zechariah': 'Zec', 'Malachi': 'Mal', 'Matthew': 'Mat', 'Mark': 'Mrk', 'Luke': 'Luk',
    'John': 'Jhn', 'Acts': 'Act', 'Romans': 'Rom', '1 Corinthians': '1Co', '2 Corinthians': '2Co',
    'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Php', 'Colossians': 'Col',
    '1 Thessalonians': '1Th', '2 Thessalonians': '2Th', '1 Timothy': '1Ti', '2 Timothy': '2Ti',
    'Titus': 'Tit', 'Philemon': 'Phm', 'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pe',
    '2 Peter': '2Pe', '1 John': '1Jn', '2 John': '2Jn', '3 John': '3Jn', 'Jude': 'Jud',
    'Revelation': 'Rev'
};

export default class BibleLinkPlugin extends Plugin {
    settings: BibleLinkSettings;
    db: BibleDatabase;
    private isFirstLoad = true;

    async onload() {
        await this.loadSettings();
        
        // Initialize database
        this.db = new BibleDatabase(this);
        
        // Initialize database and ASV data if first load
        if (this.isFirstLoad) {
            await this.db.initialize();
            this.isFirstLoad = false;
            
            // Show welcome notice
            new Notice('Welcome to BibleLink! ASV Bible is ready. Use "Insert Bible Reference" command to get started.');
        } else {
            await this.db.initialize();
        }

        // Parse reference (supports "Book Chapter:Verse", "Book Chapter:Verse-Verse", "Book Chapter", and "Book Chapter:Verse-Book Chapter:Verse")
        const parseReference = (ref: string): { book: string; chapter: number; verse?: number; } | null => {
            const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
            if (!match) return null;
            
            const [, book, chapter, verse] = match;
            return {
                book: book.trim(),
                chapter: parseInt(chapter),
                verse: verse ? parseInt(verse) : undefined
            };
        };

        // Register code block processor with current settings
        this.registerMarkdownCodeBlockProcessor(this.settings.codeBlockLanguage, (source, el, ctx) => {
            this.processCodeBlock(source, el, ctx);
        });

        // Register command
        this.addCommand({
            id: 'insert-bible-reference',
            name: 'Insert Bible Reference',
            editorCallback: (editor: Editor) => {
                new BibleSelectorModal(
                    this.app,
                    this,
                    (reference: string, translation: string, outputType: 'text' | 'link' | 'codeblock', options: string[]) => {
                        this.insertBibleReference(editor, reference, translation, outputType, options);
                    }
                ).open();
            }
        });

        // Register shortcut commands
        if (this.settings.enableShortcuts) {
            this.registerShortcutCommands();
        }

        // Add settings tab
        this.addSettingTab(new BibleLinkSettingTab(this.app, this));

        // Register Dataview source if available
        this.registerDataviewSource();

        // Add CSS for styling
        this.addStyles();

        // Update styles to ensure they're current
        this.updateStyles();

        // Test settings persistence
        this.testSettingsPersistence();

        console.log('BibleLink plugin loaded');
    }

    private testSettingsPersistence() {
        console.log('[BibleLink] [testSettingsPersistence] Current settings:', {
            defaultTranslation: this.settings.defaultTranslation,
            outputType: this.settings.outputType,
            modalOutputType: this.settings.modalOutputType,
            modalOptions: this.settings.modalOptions,
            codeBlockBackgroundColor: this.settings.codeBlockBackgroundColor,
            codeBlockTextColor: this.settings.codeBlockTextColor
        });

        // Verify settings file exists
        const settingsPath = path.join(this.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', 'data', 'settings.json');
        if (fs.existsSync(settingsPath)) {
            const content = fs.readFileSync(settingsPath, 'utf8');
            console.log('[BibleLink] [testSettingsPersistence] Settings file exists and contains:', content.slice(0, 500));
        } else {
            console.log('[BibleLink] [testSettingsPersistence] Settings file does not exist yet');
        }
    }

    async onunload() {
        if (this.db) {
            await this.db.close();
        }
        console.log('BibleLink plugin unloaded');
    }

    async loadSettings() {
        try {
            const settingsPath = path.join(this.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', 'data', 'settings.json');
            console.log(`[BibleLink] [loadSettings] Loading settings from: ${settingsPath}`);
            
            if (fs.existsSync(settingsPath)) {
                const content = fs.readFileSync(settingsPath, 'utf8');
                console.log(`[BibleLink] [loadSettings] Settings file found. First 200 chars:`, content.slice(0, 200));
                const savedSettings = JSON.parse(content);
                this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings);
                console.log(`[BibleLink] [loadSettings] Loaded settings successfully`);
            } else {
                console.log('[BibleLink] [loadSettings] No settings file found, using defaults');
                this.settings = Object.assign({}, DEFAULT_SETTINGS);
                
                // Save default settings to create the file
                await this.saveSettings();
                console.log('[BibleLink] [loadSettings] Created default settings file');
            }
        } catch (error) {
            console.error('[BibleLink] [loadSettings] Error loading settings:', error);
            this.settings = Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    async saveSettings() {
        try {
            // Ensure data directory exists
            const dataDir = path.join(this.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const settingsPath = path.join(dataDir, 'settings.json');
            const content = JSON.stringify(this.settings, null, 2);
            console.log(`[BibleLink] [saveSettings] Saving settings to: ${settingsPath}`);
            console.log(`[BibleLink] [saveSettings] Settings (first 200 chars):`, content.slice(0, 200));
            
            fs.writeFileSync(settingsPath, content, 'utf8');
            console.log(`[BibleLink] [saveSettings] Settings saved successfully`);

            // Note: Code block processor is registered in onload() and will be re-registered on plugin reload
            // No need to unregister/register here since we're using our own settings system
            
            // Update styles when settings change
            this.updateStyles();
        } catch (error) {
            console.error('[BibleLink] [saveSettings] Error saving settings:', error);
            new Notice('Failed to save settings');
        }
    }

    private addStyles() {
        this.updateStyles();
    }

    private updateStyles() {
        // Remove existing styles if they exist
        const existingStyle = document.getElementById('biblelink-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'biblelink-styles';
        style.textContent = `
            .bible-reference {
                color: ${this.settings.codeBlockTextColor};
                background-color: ${this.settings.codeBlockBackgroundColor};
                padding: 2px 6px;
                border-radius: 4px;
                display: inline-block;
                margin: 0 2px;
            }
            
            .bible-reference.simple {
                font-weight: normal;
                background: none;
                padding: 0;
                color: inherit;
            }
            
            .bible-reference.detailed {
                font-weight: 500;
            }
            
            .bible-reference.custom {
                font-style: italic;
            }

            .bible-verse-container {
                margin: 1em 0;
                line-height: 1.5;
            }

            .bible-verse-reference {
                font-weight: 500;
                color: var(--text-muted);
            }

            .bible-verse-text {
                margin-top: 0.5em;
            }

            .bible-verse-text sup {
                color: ${this.settings.codeBlockVerseNumberColor};
                font-size: 0.8em;
                font-weight: 500;
                vertical-align: super;
            }

            .red-letter-text {
                color: var(--text-red);
            }

            .chapter-number {
                font-weight: bold;
                color: var(--text-muted);
                margin-top: 1em;
                margin-bottom: 0.5em;
            }

            .bible-verse-link {
                margin-top: 1em;
                text-align: right;
            }

            .bible-verse-link a {
                color: var(--text-accent);
                font-size: 0.9em;
                text-decoration: none;
            }

            .bible-verse-link a:hover {
                text-decoration: underline;
            }

            /* BibleLink chapter/verse grid styles */
            .biblelink-chapter-grid, .biblelink-verse-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 8px;
            }
            .biblelink-chapter-btn, .biblelink-verse-btn {
                min-width: 32px;
                min-height: 32px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-secondary);
                cursor: pointer;
                font-size: 1em;
                transition: background 0.2s, color 0.2s;
            }
            .biblelink-chapter-btn.selected, .biblelink-verse-btn.selected {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    private processCodeBlock(source: string, el: HTMLElement, ctx: any) {
        // Apply code block styling based on settings
        el.style.backgroundColor = this.settings.codeBlockBackgroundColor;
        el.style.color = this.settings.codeBlockTextColor;
        
        // Parse the code block parameters
        const lines = source.trim().split('\n');
        if (lines.length === 0) return;

        const firstLine = lines[0].trim();
        const parts = firstLine.split(' ').filter(p => p.length > 0); // Filter out empty strings
        
        // Parse options
        const options = {
            verse: false,
            chapter: false,
            redText: false,
            link: false
        };

        // Find where the actual reference starts
        let translationIndex = 0;
        let referenceStartIndex = 1;

        // Check for options as direct arguments after 'bible'
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].toLowerCase();
            if (['verse', 'chapter', 'red-text', 'link'].includes(part)) {
                switch (part) {
                    case 'verse':
                        options.verse = true;
                        break;
                    case 'chapter':
                        options.chapter = true;
                        break;
                    case 'red-text':
                        options.redText = true;
                        break;
                    case 'link':
                        options.link = true;
                        break;
                }
                translationIndex = i + 1;
            } else {
                break;
            }
        }

        // Also check for options in square brackets at the end
        const lastPart = parts[parts.length - 1];
        let referenceEndIndex = parts.length;
        if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
            const optionsStr = lastPart.slice(1, -1);
            // Support both comma and pipe separators
            const optionsList = optionsStr.split(/[,|]/).map(o => o.trim()).filter(o => o.length > 0);
            
            options.verse = options.verse || optionsList.includes('verse');
            options.chapter = options.chapter || optionsList.includes('chapter');
            options.redText = options.redText || optionsList.includes('red-text');
            options.link = options.link || optionsList.includes('link');
            referenceEndIndex--;
        }

        if (translationIndex >= referenceEndIndex) {
            el.createSpan({ text: 'Invalid format. Use: ```bible [option1,option2] TRANSLATION REFERENCE``` or ```bible TRANSLATION REFERENCE [option1,option2]```' });
            return;
        }

        // Extract translation and reference
        const translation = parts[translationIndex];
        const referenceText = parts.slice(translationIndex + 1, referenceEndIndex).join(' ');

        // Check if it's a cross-chapter/book reference
        const crossRefMatch = referenceText.match(/^(.+?)\s+(\d+):(\d+)-(.+?)\s+(\d+):(\d+)$/);
        let verses: { chapter: number; verse: number; text: string; }[] = [];

        if (crossRefMatch) {
            // Cross reference (e.g., "1 Corinthians 1:2-1 Corinthians 3:4")
            const [, startBook, startChapter, startVerse, endBook, endChapter, endVerse] = crossRefMatch;
            const startChapterNum = parseInt(startChapter);
            const startVerseNum = parseInt(startVerse);
            const endChapterNum = parseInt(endChapter);
            const endVerseNum = parseInt(endVerse);

            // If books are different, show error (for now we only support cross-chapter in same book)
            if (startBook !== endBook) {
                el.createSpan({ text: 'Cross-book references are not supported yet.' });
                return;
            }

            // Collect verses from all chapters
            for (let chapter = startChapterNum; chapter <= endChapterNum; chapter++) {
                const start = chapter === startChapterNum ? startVerseNum : 1;
                const end = chapter === endChapterNum ? endVerseNum : 999; // Use high number to get all verses

                for (let verse = start; verse <= end; verse++) {
                    const verseData = this.db.getVerse(startBook, chapter, verse, translation);
                    if (verseData) {
                        verses.push({ chapter, verse, text: verseData.text });
                    }
                }
            }

            if (verses.length === 0) {
                el.createSpan({ text: `Invalid reference: ${referenceText} in ${translation}` });
                return;
            }

            // Create container with appropriate classes
            const container = el.createDiv({ 
                cls: `bible-verse-container${options.redText ? ' red-letter' : ''}${options.chapter ? ' show-chapter' : ''}${options.verse ? ' show-verse' : ''}`
            });

            // Add reference header
            const ref = `${startBook} ${startChapterNum}:${startVerseNum}-${endChapterNum}:${endVerseNum} (${translation})`;
            container.createSpan({ text: ref + ': ', cls: 'bible-verse-reference' });

            // Add verses
            const verseContainer = container.createDiv({ cls: 'bible-verse-text' });
            let lastChapter = -1;

            verses.forEach((verse) => {
                if (options.chapter && verse.chapter !== lastChapter) {
                    // Add chapter number when chapter changes
                    verseContainer.createEl('h4', { 
                        text: `Chapter ${verse.chapter}`,
                        cls: 'chapter-number'
                    });
                    lastChapter = verse.chapter;
                }

                if (options.verse) {
                    // Add verse number
                    const sup = verseContainer.createEl('sup', { text: verse.verse.toString() });
                    sup.style.marginRight = '0.3em';
                }

                // Apply processing rules first
                let processedText = this.db.applyProcessingRules(verse.text, translation);
                
                // Process text for red letter if enabled
                if (options.redText) {
                    const words = processedText.split(' ');
                    words.forEach((word, i) => {
                        const isJesusWord = this.isJesusWord(word);
                        verseContainer.createSpan({
                            text: word + (i < words.length - 1 ? ' ' : ''),
                            cls: isJesusWord ? 'red-letter-text' : ''
                        });
                    });
                } else {
                    // Create a span that can contain HTML from processing rules
                    const textSpan = verseContainer.createSpan();
                    textSpan.innerHTML = processedText + ' ';
                }
            });

            // Add link to Bible Gateway if requested
            if (options.link) {
                const linkContainer = container.createDiv({ cls: 'bible-verse-link' });
                const linkText = `${startBook} ${startChapterNum}:${startVerseNum}${endVerseNum !== startVerseNum ? '-' + endVerseNum : ''}`;
                const linkUrl = this.generateBibleGatewayUrl(linkText, translation);
                const link = linkContainer.createEl('a', {
                    text: `[@${linkUrl}]`,
                    href: linkUrl
                });
                link.addClass('external-link');
            }
        } else {
            // Regular reference (e.g., "John 3:16" or "Psalm 23")
            const match = referenceText.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
            if (!match) {
                el.createSpan({ text: `Invalid reference format: ${referenceText}` });
                return;
            }

            const [, book, chapter, startVerse, endVerse] = match;
            const startChapterNum = parseInt(chapter);
            const startVerseNum = startVerse ? parseInt(startVerse) : 1;
            const endVerseNum = endVerse ? parseInt(endVerse) : startVerseNum;

            // Get verse data
            for (let v = startVerseNum; v <= endVerseNum; v++) {
                const verseData = this.db.getVerse(book, startChapterNum, v, translation);
                if (verseData) {
                    verses.push({ chapter: startChapterNum, verse: v, text: verseData.text });
                }
            }

            if (verses.length === 0) {
                el.createSpan({ text: `Invalid reference: ${book} ${startChapterNum}:${startVerseNum}${endVerseNum !== startVerseNum ? '-' + endVerseNum : ''} in ${translation}` });
                return;
            }

            // Create container with appropriate classes
            const container = el.createDiv({ 
                cls: `bible-verse-container${options.redText ? ' red-letter' : ''}${options.chapter ? ' show-chapter' : ''}${options.verse ? ' show-verse' : ''}`
            });

            // Add reference header
            const ref = `${book} ${startChapterNum}:${startVerseNum}${endVerseNum !== startVerseNum ? '-' + endVerseNum : ''} (${translation})`;
            container.createSpan({ text: ref + ': ', cls: 'bible-verse-reference' });

            // Add verses
            const verseContainer = container.createDiv({ cls: 'bible-verse-text' });
            let lastChapter = -1;

            verses.forEach((verse) => {
                if (options.chapter && verse.chapter !== lastChapter) {
                    // Add chapter number when chapter changes
                    const chapterNum = verseContainer.createEl('strong', { 
                        text: verse.chapter.toString(),
                        cls: 'chapter-number'
                    });
                    chapterNum.style.marginRight = '0.5em';
                    lastChapter = verse.chapter;
                }

                if (options.verse || verses.length > 1) {
                    // Add verse number
                    const sup = verseContainer.createEl('sup', { text: verse.verse.toString() });
                    sup.style.marginRight = '0.3em';
                }

                // Apply processing rules first
                let processedText = this.db.applyProcessingRules(verse.text, translation);
                
                // Process text for red letter if enabled
                if (options.redText) {
                    const words = processedText.split(' ');
                    words.forEach((word, i) => {
                        const isJesusWord = this.isJesusWord(word);
                        verseContainer.createSpan({
                            text: word + (i < words.length - 1 ? ' ' : ''),
                            cls: isJesusWord ? 'red-letter-text' : ''
                        });
                    });
                } else {
                    // Create a span that can contain HTML from processing rules
                    const textSpan = verseContainer.createSpan();
                    textSpan.innerHTML = processedText + ' ';
                }
            });

            // Add link to Bible Gateway if requested (at the bottom)
            if (options.link) {
                const linkContainer = container.createDiv({ cls: 'bible-verse-link' });
                const linkText = `${book} ${startChapterNum}:${startVerseNum}${endVerseNum !== startVerseNum ? '-' + endVerseNum : ''}`;
                const linkUrl = this.generateBibleGatewayUrl(linkText, translation);
                const link = linkContainer.createEl('a', {
                    text: `[@${linkUrl}]`,
                    href: linkUrl
                });
                link.addClass('external-link');
            }
        }
    }



    private registerShortcutCommands() {
        Object.entries(this.settings.shortcuts).forEach(([shortcut, reference]) => {
            this.addCommand({
                id: `bible-shortcut-${shortcut}`,
                name: `Insert ${reference} (${shortcut})`,
                editorCallback: (editor: Editor) => {
                    this.insertShortcutReference(editor, reference);
                }
            });
        });
    }

    private insertShortcutReference(editor: Editor, reference: string) {
        // Parse the reference (e.g., "John 3:16")
        const match = reference.match(/^(\w+)\s+(\d+):(\d+)$/);
        if (!match) {
            new Notice(`Invalid reference format: ${reference}`);
            return;
        }

        const [, book, chapter, verse] = match;
        const chapterNum = parseInt(chapter);
        const verseNum = parseInt(verse);

        // Get verse data
        const verseData = this.db.getVerse(book, chapterNum, verseNum, this.settings.defaultTranslation);
        if (!verseData) {
            new Notice(`Verse not found: ${reference} in ${this.settings.defaultTranslation}`);
            return;
        }

        this.insertBibleReference(editor, reference, this.settings.defaultTranslation, this.settings.outputType, []);
    }

    private insertBibleReference(
        editor: Editor,
        reference: string,
        translation: string,
        outputType: 'text' | 'link' | 'codeblock',
        options: string[]
    ) {
        // Parse the reference
        const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (!match) {
            new Notice(`Invalid reference format: ${reference}`);
            return;
        }

        const [, book, chapter, startVerse, endVerse] = match;
        const chapterNum = parseInt(chapter);
        const startVerseNum = startVerse ? parseInt(startVerse) : 1;
        const endVerseNum = endVerse ? parseInt(endVerse) : (startVerse ? startVerseNum : null);

        // Get verse data
        let verses: { verse: number; text: string; }[] = [];
        const verseRange = endVerseNum 
            ? Array.from({length: endVerseNum - startVerseNum + 1}, (_, i) => startVerseNum + i)
            : [startVerseNum];

        for (const verse of verseRange) {
            const verseData = this.db.getVerse(book, chapterNum, verse, translation);
            if (verseData) {
                verses.push({ verse, text: verseData.text });
            }
        }

        if (verses.length === 0) {
            new Notice(`Invalid reference: ${reference} in ${translation}`);
            return;
        }

        let text: string;
        if (outputType === 'text') {
            const verseTexts = verses.map(v => {
                return verses.length > 1 ? `${v.verse} ${v.text}` : v.text;
            });
            text = `${reference} (${translation}): ${verseTexts.join(' ')}`;
        } else if (outputType === 'link') {
            text = `[${reference} (${translation})](${this.generateBibleGatewayUrl(reference, translation)})`;
        } else {
            // Code block output
            const optionsStr = options.length > 0 ? ` [${options.join('|')}]` : '';
            text = `\`\`\`${this.settings.codeBlockLanguage}\n${translation} ${reference}${optionsStr}\n${verses.map(v => v.text).join(' ')}\n\`\`\``;
        }

        // Insert the text
        editor.replaceSelection(text);

        // Create virtual note for Dataview
        this.createVerseNote(book, chapterNum, startVerseNum, translation);
    }

    private formatReference(book: string, chapter: number, verse: number, translation: string): string {
        let formattedBook = book;
        if (this.settings.showBookAbbr && BOOK_ABBREVIATIONS[book]) {
            formattedBook = BOOK_ABBREVIATIONS[book];
        }

        return this.settings.showTranslationAbbr 
            ? `${formattedBook} ${chapter}:${verse} ${translation}`
            : `${formattedBook} ${chapter}:${verse}`;
    }



    private async createVerseNote(book: string, chapter: number, verse: number, translation: string) {
        try {
            const verseData = this.db.getVerse(book, chapter, verse, translation);
            if (!verseData) return;

            // Create virtual note path
            const notePath = `Bible/${book}/${chapter}/${verse}.md`;

            // Check if note already exists
            const existingFile = this.app.vault.getAbstractFileByPath(notePath);
            if (existingFile) return;

            // Create the directory structure if it doesn't exist
            const dirPath = `Bible/${book}/${chapter}`;
            const dirExists = this.app.vault.getAbstractFileByPath(dirPath);
            if (!dirExists) {
                // Create the directory structure
                await this.createDirectoryRecursive(dirPath);
            }

            // Get translation metadata
            const translationInfo = this.getTranslationInfo(translation);
            const reference = this.formatReference(book, chapter, verse, translation);

            // Create note content with rich YAML frontmatter
            const content = `---
book: ${book}
chapter: ${chapter}
verse: ${verse}
translation: ${translation}
text: "${verseData.text.replace(/"/g, '\\"')}"
reference: "${reference}"
language: "${translationInfo.language}"
category: "${translationInfo.category}"
translation_name: "${translationInfo.name}"
created: ${new Date().toISOString()}
---

# ${reference}

${verseData.text}

*Translation: ${translationInfo.name} (${translation})*

## Metadata

- **Book**: ${book}
- **Chapter**: ${chapter}
- **Verse**: ${verse}
- **Translation**: ${translation}
- **Language**: ${translationInfo.language}
- **Category**: ${translationInfo.category}
- **Reference**: ${reference}

## Related Verses

\`\`\`dataview
LIST reference, text
FROM "Bible"
WHERE book = "${book}" AND chapter = ${chapter}
SORT verse
\`\`\`

## Cross-References

\`\`\`dataview
LIST reference, text
FROM "Bible"
WHERE contains(text, "${verseData.text.split(' ').slice(0, 3).join(' ')}")
AND file.name != this.file.name
LIMIT 5
\`\`\`
`;

            // Create the file
            await this.app.vault.create(notePath, content);
            
        } catch (error) {
            console.error('Error creating verse note:', error);
            // Don't show notice to user as this is a background operation
        }
    }

    private getTranslationInfo(abbreviation: string): { name: string; language: string; category: string } {
        // Get from database first
        const translation = this.db.getTranslations().find(t => t.abbreviation === abbreviation);
        if (translation) {
            // Try to get additional info from our known translations
            const knownTranslation = this.getKnownTranslation(abbreviation);
            return {
                name: translation.name,
                language: knownTranslation?.language || 'unknown',
                category: knownTranslation?.category || 'Unknown'
            };
        }
        
        return {
            name: abbreviation,
            language: 'unknown',
            category: 'Unknown'
        };
    }

    private getKnownTranslation(abbreviation: string): { name: string; language: string; category: string } | null {
        const knownTranslations = {
            'ASV': { name: 'American Standard Version (1901)', language: 'en', category: 'English' },
            'KJV': { name: 'King James Version', language: 'en', category: 'English' },
            'WEB': { name: 'World English Bible', language: 'en', category: 'English' },
            'YLT': { name: 'Young\'s Literal Translation (1898)', language: 'en', category: 'English' },
            'BBE': { name: 'Bible in Basic English (1949/1964)', language: 'en', category: 'English' },
            'BSB': { name: 'Berean Standard Bible', language: 'en', category: 'English' },
            'CPDV': { name: 'Catholic Public Domain Version', language: 'en', category: 'English' },
            'SpaRV': { name: 'La Santa Biblia Reina-Valera (1909)', language: 'es', category: 'Spanish' },
            'Vulgate': { name: 'Latin Vulgate', language: 'la', category: 'Latin' },
            'Byz': { name: 'Byzantine Textform (Greek)', language: 'grc', category: 'Greek' },
            'WLC': { name: 'Westminster Leningrad Codex', language: 'hbo', category: 'Hebrew' }
        };
        
        return knownTranslations[abbreviation] || null;
    }

    private async createDirectoryRecursive(dirPath: string) {
        const parts = dirPath.split('/');
        let currentPath = '';
        
        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const exists = this.app.vault.getAbstractFileByPath(currentPath);
            if (!exists) {
                try {
                    await this.app.vault.createFolder(currentPath);
                } catch (error) {
                    // Folder might already exist, continue
                }
            }
        }
    }

    private registerDataviewSource() {
        // Check if Dataview plugin is available
        const dataviewPlugin = this.app.plugins.plugins['dataview'];
        if (!dataviewPlugin) {
            return;
        }

        try {
            // Register Bible source with Dataview
            const dataviewAPI = dataviewPlugin.api;
            if (dataviewAPI && dataviewAPI.registerSource) {
                dataviewAPI.registerSource('bible', {
                    // Provide access to Bible data for Dataview queries
                    query: (query: string) => {
                        return this.handleDataviewQuery(query);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to register Dataview source:', error);
        }
    }

    private handleDataviewQuery(query: string): any[] {
        try {
            // Parse simple Dataview-style queries
            // This is a basic implementation - a full implementation would need more sophisticated parsing
            
            // Example: WHERE book = "John" AND translation = "ASV"
            const whereMatch = query.match(/WHERE\s+(.+)/i);
            if (!whereMatch) return [];

            const conditions = whereMatch[1];
            let results: any[] = [];

            // Parse book condition
            const bookMatch = conditions.match(/book\s*=\s*"([^"]+)"/i);
            const translationMatch = conditions.match(/translation\s*=\s*"([^"]+)"/i);
            const chapterMatch = conditions.match(/chapter\s*=\s*(\d+)/i);
            const textMatch = conditions.match(/contains\(text,\s*"([^"]+)"\)/i);

            // Get all verses and filter in memory
            const allVerses = this.db.getTranslations().flatMap(translation => {
                return this.db.getBooks().flatMap(book => {
                    const chapters = this.db.getChaptersForBook(book, translation.abbreviation);
                    return chapters.flatMap(chapter => {
                        const verses = this.db.getVersesForChapter(book, chapter, translation.abbreviation);
                        return verses.map(verse => {
                            const verseData = this.db.getVerse(book, chapter, verse, translation.abbreviation);
                            return {
                                book: verseData?.book || book,
                                chapter: verseData?.chapter || chapter,
                                verse: verseData?.verse || verse,
                                text: verseData?.text || '',
                                translation: translation.abbreviation
                            };
                        });
                    });
                });
            });

            // Apply filters
            results = allVerses.filter(verse => {
                if (bookMatch && verse.book !== bookMatch[1]) return false;
                if (translationMatch && verse.translation !== translationMatch[1]) return false;
                if (chapterMatch && verse.chapter !== parseInt(chapterMatch[1])) return false;
                if (textMatch && !verse.text.includes(textMatch[1])) return false;
                return true;
            });

            return results.slice(0, 100); // Limit results

        } catch (error) {
            console.error('Dataview query error:', error);
            return [];
        }
    }

    // Utility method to get all verses for a specific query
    public queryVerses(book?: string, chapter?: number, translation?: string): any[] {
        const results: any[] = [];
        
        const translations = translation ? 
            this.db.getTranslations().filter(t => t.abbreviation === translation) :
            this.db.getTranslations();
            
        const books = book ? [book] : this.db.getBooks();

        for (const t of translations) {
            for (const b of books) {
                const chapters = chapter ? [chapter] : this.db.getChaptersForBook(b, t.abbreviation);
                for (const c of chapters) {
                    const verses = this.db.getVersesForChapter(b, c, t.abbreviation);
                    for (const v of verses) {
                        const verseData = this.db.getVerse(b, c, v, t.abbreviation);
                        if (verseData) {
                            results.push({
                                book: verseData.book,
                                chapter: verseData.chapter,
                                verse: verseData.verse,
                                text: verseData.text,
                                translation: t.abbreviation,
                                translation_name: t.name
                            });
                        }
                    }
                }
            }
        }

        return results.slice(0, 1000); // Limit results
    }

    private isJesusWord(word: string): boolean {
        // Add logic to identify words of Jesus
        const jesusWords = ['Jesus', 'Christ', 'Lord', 'Master', 'Rabbi', 'Teacher'];
        return jesusWords.some(w => word.includes(w));
    }

    private generateBibleGatewayUrl(reference: string, translation: string): string {
        // Map translation abbreviations to Bible Gateway translation codes
        const translationMap: Record<string, string> = {
            'KJV': 'KJV',
            'ASV': 'ASV',
            'WEB': 'WEB',
            'YLT': 'YLT',
            'BBE': 'BBE',
            'BSB': 'BSB',
            'CPDV': 'CPDV',
            'SpaRV': 'RVR1909',
            'Vulgate': 'VULGATE',
            'Byz': 'BYZ',
            'WLC': 'WLC'
        };
        
        const bibleGatewayTranslation = translationMap[translation] || translation;
        const encodedReference = encodeURIComponent(reference);
        return `https://www.biblegateway.com/passage/?search=${encodedReference}&version=${bibleGatewayTranslation}`;
    }
} 