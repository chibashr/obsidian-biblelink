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

        // Expose plugin instance globally for DataviewJS access
        (window as any).BibleLinkPlugin = this;
        
        // Also expose a convenient API object
        (window as any).BibleLinkAPI = {
            getAllVerses: () => this.getAllVersesWithMetadata(),
            queryVerses: (book?: string, chapter?: number, translation?: string) => this.queryVerses(book, chapter, translation),
            getTranslations: () => this.db.getTranslations(),
            getBooks: () => this.db.getBooks(),
            getChaptersForBook: (book: string, translation: string) => this.db.getChaptersForBook(book, translation),
            getVersesForChapter: (book: string, chapter: number, translation: string) => this.db.getVersesForChapter(book, chapter, translation),
            getVerse: (book: string, chapter: number, verse: number, translation: string) => this.db.getVerse(book, chapter, verse, translation),
            // Expose the plugin instance for direct access
            plugin: this
        };

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
        
        // Clean up global API
        if ((window as any).BibleLinkAPI) {
            delete (window as any).BibleLinkAPI;
        }
        if ((window as any).BibleLinkPlugin) {
            delete (window as any).BibleLinkPlugin;
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
            console.log('[BibleLink] Dataview plugin not found, skipping Dataview integration');
            return;
        }

        try {
            // Dataview doesn't support custom sources in DQL, so we'll focus on DataviewJS
            // The plugin instance is exposed globally for DataviewJS access
            console.log('[BibleLink] Dataview plugin found, exposing API for DataviewJS access');
            console.log('[BibleLink] Use BibleLinkAPI or BibleLinkPlugin in DataviewJS queries');
        } catch (error) {
            console.error('[BibleLink] Failed to initialize Dataview integration:', error);
        }
    }

    private handleDataviewQuery(query: string): any[] {
        try {
            console.log('[BibleLink] Processing Dataview query:', query);
            
            // Parse the query to extract components
            const parsedQuery = this.parseDataviewQuery(query);
            console.log('[BibleLink] Parsed query:', parsedQuery);
            
            // Get all verses that match the criteria
            let results = this.getAllVersesWithMetadata();
            
            // Apply WHERE conditions
            if (parsedQuery.where) {
                results = this.applyWhereConditions(results, parsedQuery.where);
            }
            
            // Apply SORT
            if (parsedQuery.sort) {
                results = this.applySort(results, parsedQuery.sort);
            }
            
            // Apply LIMIT
            if (parsedQuery.limit) {
                results = results.slice(0, parsedQuery.limit);
            }
            
            console.log(`[BibleLink] Query returned ${results.length} results`);
            return results;

        } catch (error) {
            console.error('[BibleLink] Dataview query error:', error);
            return [];
        }
    }

    private parseDataviewQuery(query: string): {
        where?: any[];
        sort?: { field: string; direction: 'asc' | 'desc' }[];
        limit?: number;
    } {
        const result: any = {};
        
        // Parse WHERE clause
        const whereMatch = query.match(/WHERE\s+(.+?)(?:\s+SORT|\s+LIMIT|$)/i);
        if (whereMatch) {
            result.where = this.parseWhereConditions(whereMatch[1]);
        }
        
        // Parse SORT clause
        const sortMatch = query.match(/SORT\s+(.+?)(?:\s+LIMIT|$)/i);
        if (sortMatch) {
            result.sort = this.parseSortConditions(sortMatch[1]);
        }
        
        // Parse LIMIT clause
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
            result.limit = parseInt(limitMatch[1]);
        }
        
        return result;
    }

    private parseWhereConditions(conditions: string): any[] {
        const parsedConditions: any[] = [];
        
        // Split by AND/OR (simplified - assumes AND for now)
        const andParts = conditions.split(/\s+AND\s+/i);
        
        for (const part of andParts) {
            // Parse field = value
            const eqMatch = part.match(/(\w+)\s*=\s*"([^"]+)"/i);
            if (eqMatch) {
                parsedConditions.push({
                    type: 'equals',
                    field: eqMatch[1].toLowerCase(),
                    value: eqMatch[2]
                });
                continue;
            }
            
            // Parse field = number
            const numMatch = part.match(/(\w+)\s*=\s*(\d+)/i);
            if (numMatch) {
                parsedConditions.push({
                    type: 'equals',
                    field: numMatch[1].toLowerCase(),
                    value: parseInt(numMatch[2])
                });
                continue;
            }
            
            // Parse contains(field, "value")
            const containsMatch = part.match(/contains\((\w+),\s*"([^"]+)"\)/i);
            if (containsMatch) {
                parsedConditions.push({
                    type: 'contains',
                    field: containsMatch[1].toLowerCase(),
                    value: containsMatch[2]
                });
                continue;
            }
            
            // Parse field > number
            const gtMatch = part.match(/(\w+)\s*>\s*(\d+)/i);
            if (gtMatch) {
                parsedConditions.push({
                    type: 'greater_than',
                    field: gtMatch[1].toLowerCase(),
                    value: parseInt(gtMatch[2])
                });
                continue;
            }
            
            // Parse field < number
            const ltMatch = part.match(/(\w+)\s*<\s*(\d+)/i);
            if (ltMatch) {
                parsedConditions.push({
                    type: 'less_than',
                    field: ltMatch[1].toLowerCase(),
                    value: parseInt(ltMatch[2])
                });
                continue;
            }
        }
        
        return parsedConditions;
    }

    private parseSortConditions(sortClause: string): { field: string; direction: 'asc' | 'desc' }[] {
        const sorts: { field: string; direction: 'asc' | 'desc' }[] = [];
        
        // Split by comma
        const parts = sortClause.split(',').map(p => p.trim());
        
        for (const part of parts) {
            // Check for DESC/ASC
            const descMatch = part.match(/(\w+)\s+DESC/i);
            if (descMatch) {
                sorts.push({ field: descMatch[1].toLowerCase(), direction: 'desc' });
                continue;
            }
            
            const ascMatch = part.match(/(\w+)\s+ASC/i);
            if (ascMatch) {
                sorts.push({ field: ascMatch[1].toLowerCase(), direction: 'asc' });
                continue;
            }
            
            // Default to ASC
            const fieldMatch = part.match(/(\w+)/i);
            if (fieldMatch) {
                sorts.push({ field: fieldMatch[1].toLowerCase(), direction: 'asc' });
            }
        }
        
        return sorts;
    }

    public getAllVersesWithMetadata(): any[] {
        const results: any[] = [];
        
        for (const translation of this.db.getTranslations()) {
            for (const book of this.db.getBooks()) {
                const chapters = this.db.getChaptersForBook(book, translation.abbreviation);
                for (const chapter of chapters) {
                    const verses = this.db.getVersesForChapter(book, chapter, translation.abbreviation);
                    for (const verseNum of verses) {
                        const verseData = this.db.getVerse(book, chapter, verseNum, translation.abbreviation);
                        if (verseData) {
                            const text = verseData.text;
                            const wordCount = text.split(/\s+/).length;
                            const charCount = text.length;
                            
                            results.push({
                                book: verseData.book,
                                chapter: verseData.chapter,
                                verse: verseData.verse,
                                text: text,
                                translation: translation.abbreviation,
                                translation_name: translation.name,
                                reference: `${verseData.book} ${verseData.chapter}:${verseData.verse}`,
                                word_count: wordCount,
                                char_count: charCount,
                                // Add computed fields for easier querying
                                is_jesus_word: this.isJesusWord(text),
                                has_red_letter: this.hasRedLetterWords(text),
                                // Add book categories
                                testament: this.getTestament(verseData.book),
                                book_category: this.getBookCategory(verseData.book)
                            });
                        }
                    }
                }
            }
        }
        
        return results;
    }

    private applyWhereConditions(verses: any[], conditions: any[]): any[] {
        return verses.filter(verse => {
            return conditions.every(condition => {
                const fieldValue = verse[condition.field];
                
                switch (condition.type) {
                    case 'equals':
                        return fieldValue === condition.value;
                    case 'contains':
                        return typeof fieldValue === 'string' && 
                               fieldValue.toLowerCase().includes(condition.value.toLowerCase());
                    case 'greater_than':
                        return typeof fieldValue === 'number' && fieldValue > condition.value;
                    case 'less_than':
                        return typeof fieldValue === 'number' && fieldValue < condition.value;
                    default:
                        return true;
                }
            });
        });
    }

    private applySort(verses: any[], sorts: { field: string; direction: 'asc' | 'desc' }[]): any[] {
        return [...verses].sort((a, b) => {
            for (const sort of sorts) {
                const aVal = a[sort.field];
                const bVal = b[sort.field];
                
                let comparison = 0;
                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    comparison = aVal.localeCompare(bVal);
                } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).localeCompare(String(bVal));
                }
                
                if (comparison !== 0) {
                    return sort.direction === 'desc' ? -comparison : comparison;
                }
            }
            return 0;
        });
    }

    private getTestament(book: string): string {
        const oldTestamentBooks = [
            'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
            'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
            '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
            'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
            'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
            'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
            'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
            'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
            'Zechariah', 'Malachi'
        ];
        
        return oldTestamentBooks.includes(book) ? 'Old Testament' : 'New Testament';
    }

    private getBookCategory(book: string): string {
        const categories: Record<string, string> = {
            // Old Testament
            'Genesis': 'Law', 'Exodus': 'Law', 'Leviticus': 'Law', 'Numbers': 'Law', 'Deuteronomy': 'Law',
            'Joshua': 'Historical', 'Judges': 'Historical', 'Ruth': 'Historical', '1 Samuel': 'Historical', '2 Samuel': 'Historical',
            '1 Kings': 'Historical', '2 Kings': 'Historical', '1 Chronicles': 'Historical', '2 Chronicles': 'Historical',
            'Ezra': 'Historical', 'Nehemiah': 'Historical', 'Esther': 'Historical',
            'Job': 'Wisdom', 'Psalms': 'Wisdom', 'Proverbs': 'Wisdom', 'Ecclesiastes': 'Wisdom', 'Song of Solomon': 'Wisdom',
            'Isaiah': 'Prophetic', 'Jeremiah': 'Prophetic', 'Lamentations': 'Prophetic', 'Ezekiel': 'Prophetic', 'Daniel': 'Prophetic',
            'Hosea': 'Prophetic', 'Joel': 'Prophetic', 'Amos': 'Prophetic', 'Obadiah': 'Prophetic', 'Jonah': 'Prophetic',
            'Micah': 'Prophetic', 'Nahum': 'Prophetic', 'Habakkuk': 'Prophetic', 'Zephaniah': 'Prophetic', 'Haggai': 'Prophetic',
            'Zechariah': 'Prophetic', 'Malachi': 'Prophetic',
            // New Testament
            'Matthew': 'Gospel', 'Mark': 'Gospel', 'Luke': 'Gospel', 'John': 'Gospel',
            'Acts': 'Historical',
            'Romans': 'Epistle', '1 Corinthians': 'Epistle', '2 Corinthians': 'Epistle', 'Galatians': 'Epistle', 'Ephesians': 'Epistle',
            'Philippians': 'Epistle', 'Colossians': 'Epistle', '1 Thessalonians': 'Epistle', '2 Thessalonians': 'Epistle',
            '1 Timothy': 'Epistle', '2 Timothy': 'Epistle', 'Titus': 'Epistle', 'Philemon': 'Epistle',
            'Hebrews': 'Epistle', 'James': 'Epistle', '1 Peter': 'Epistle', '2 Peter': 'Epistle',
            '1 John': 'Epistle', '2 John': 'Epistle', '3 John': 'Epistle', 'Jude': 'Epistle',
            'Revelation': 'Apocalyptic'
        };
        
        return categories[book] || 'Unknown';
    }

    private hasRedLetterWords(text: string): boolean {
        // Check if text contains words that might be spoken by Jesus
        const jesusIndicators = [
            'I am', 'verily', 'truly', 'amen', 'father', 'kingdom', 'heaven',
            'parable', 'disciple', 'follow me', 'come unto me', 'my father'
        ];
        
        const lowerText = text.toLowerCase();
        return jesusIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
    }

    // Utility method to get all verses for a specific query
    public queryVerses(book?: string, chapter?: number, translation?: string): any[] {
        let results = this.getAllVersesWithMetadata();
        
        // Apply filters if provided
        if (book) {
            results = results.filter(v => v.book === book);
        }
        if (chapter) {
            results = results.filter(v => v.chapter === chapter);
        }
        if (translation) {
            results = results.filter(v => v.translation === translation);
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