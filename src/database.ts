import { Notice, Plugin } from 'obsidian';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessingRule {
    regex: string;
    formatting: string;
    escape?: boolean;
}

export interface Translation {
    id: number;
    name: string;
    abbreviation: string;
    language: string;
    category: string;
    processingRules: ProcessingRule[];
}

export interface Verse {
    id: number;
    translation_id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

export interface DatabaseData {
    translations: Translation[];
    verses: Verse[];
    nextTranslationId: number;
    nextVerseId: number;
}

export class BibleDatabase {
    private plugin: Plugin;
    private dataPath: string;
    private data: DatabaseData;
    private isInitialized: boolean = false;
    private isUnloading: boolean = false;

    // Chronological order of Bible books
    private static readonly CHRONOLOGICAL_BOOK_ORDER = [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
        'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
        '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
        'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
        'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah',
        'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
        'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
        'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
        'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke',
        'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
        'Galatians', 'Ephesians', 'Philippians', 'Colossians',
        '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
        'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter',
        '2 Peter', '1 John', '2 John', '3 John', 'Jude',
        'Revelation'
    ];

    constructor(plugin: Plugin, dataPath: string = 'data') {
        this.plugin = plugin;
        this.dataPath = dataPath;
        console.log(`[BibleLink] Using plugin data path: ${this.dataPath}`);
        this.data = {
            translations: [],
            verses: [],
            nextTranslationId: 1,
            nextVerseId: 1
        };
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        try {
            await this.loadData();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize Bible database:', error);
            // Even if initialization fails, mark as initialized to prevent infinite loops
            this.isInitialized = true;
            throw error;
        }
    }

    private async loadData(): Promise<void> {
        try {
            const filePath = path.join(this.plugin.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', this.dataPath, 'bible_data.json');
            console.log(`[BibleLink] [loadData] Checking for data file at: ${filePath}`);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                console.log(`[BibleLink] [loadData] File found. First 200 chars:`, content.slice(0, 200));
                this.data = JSON.parse(content);
                console.log(`[BibleLink] [loadData] Loaded: ${this.data.translations.length} translations, ${this.data.verses.length} verses`);
            } else {
                console.log('[BibleLink] [loadData] No existing Bible data file found, starting fresh');
            }
        } catch (error) {
            // If file doesn't exist or is corrupted, start with empty data
            console.log('[BibleLink] [loadData] Starting with fresh Bible database due to error:', error);
        }
    }

    private async saveData(): Promise<void> {
        try {
            // Ensure directory exists
            await this.ensureDirectoryExists();
            
            const filePath = path.join(this.plugin.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', this.dataPath, 'bible_data.json');
            const content = JSON.stringify(this.data, null, 2);
            console.log(`[BibleLink] [saveData] Saving to: ${filePath}`);
            console.log(`[BibleLink] [saveData] Data (first 200 chars):`, content.slice(0, 200));
            
            // Write to file using Node.js fs
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[BibleLink] [saveData] Bible data saved successfully: ${this.data.translations.length} translations, ${this.data.verses.length} verses`);
        } catch (error) {
            console.error('[BibleLink] [saveData] Failed to save Bible data:', error);
            if (!this.isUnloading) {
                new Notice('Failed to save Bible data');
            }
            if (!this.isUnloading) {
                throw error;
            }
        }
    }

    private async ensureDirectoryExists(): Promise<void> {
        try {
            const dirPath = path.join(this.plugin.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', this.dataPath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`[BibleLink] Created directory: ${dirPath}`);
            }
        } catch (error: any) {
            console.log('[BibleLink] Directory creation error (may already exist):', error);
        }
    }

    public getTranslations(): Translation[] {
        return [...this.data.translations].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
    }

    public getBooks(): string[] {
        const books = new Set<string>();
        for (const verse of this.data.verses) {
            books.add(verse.book);
        }
        
        // Sort books in chronological order
        const bookArray = Array.from(books);
        return bookArray.sort((a, b) => {
            const aIndex = BibleDatabase.CHRONOLOGICAL_BOOK_ORDER.indexOf(a);
            const bIndex = BibleDatabase.CHRONOLOGICAL_BOOK_ORDER.indexOf(b);
            
            // If both books are in the chronological order, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            
            // If only one book is in the chronological order, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            // If neither book is in the chronological order, sort alphabetically
            return a.localeCompare(b);
        });
    }

    public getChaptersForBook(book: string, translationAbbr: string): number[] {
        const translation = this.data.translations.find(t => t.abbreviation === translationAbbr);
        if (!translation) return [];

        const chapters = new Set<number>();
        for (const verse of this.data.verses) {
            if (verse.translation_id === translation.id && verse.book === book) {
                chapters.add(verse.chapter);
            }
        }
        return Array.from(chapters).sort((a, b) => a - b);
    }

    public getVersesForChapter(book: string, chapter: number, translationAbbr: string): number[] {
        const translation = this.data.translations.find(t => t.abbreviation === translationAbbr);
        if (!translation) return [];

        const verses = new Set<number>();
        for (const verse of this.data.verses) {
            if (verse.translation_id === translation.id && 
                verse.book === book && 
                verse.chapter === chapter) {
                verses.add(verse.verse);
            }
        }
        return Array.from(verses).sort((a, b) => a - b);
    }

    public getVerse(book: string, chapter: number, verse: number, translationAbbr: string): Verse | null {
        const translation = this.data.translations.find(t => t.abbreviation === translationAbbr);
        if (!translation) return null;

        return this.data.verses.find(v => 
            v.translation_id === translation.id && 
            v.book === book && 
            v.chapter === chapter && 
            v.verse === verse
        ) || null;
    }

    public async addTranslation(name: string, abbreviation: string, language: string = 'English', category: string = 'Standard', processingRules: ProcessingRule[] = []): Promise<number> {
        // Check if translation already exists
        const existing = this.data.translations.find(t => t.abbreviation === abbreviation);
        if (existing) {
            throw new Error(`Translation with abbreviation '${abbreviation}' already exists`);
        }
        
        const id = this.data.nextTranslationId++;
        this.data.translations.push({
            id,
            name,
            abbreviation,
            language,
            category,
            processingRules
        });
        
        console.log(`Added translation: ${name} (${abbreviation}) with ID ${id}`);
        await this.saveData();
        return id;
    }

    public async updateTranslation(id: number, name: string, abbreviation: string, language: string, category: string, processingRules: ProcessingRule[]): Promise<void> {
        const translation = this.data.translations.find(t => t.id === id);
        if (!translation) {
            throw new Error('Translation not found');
        }

        // If abbreviation is changing, check if new one exists
        if (translation.abbreviation !== abbreviation && 
            this.data.translations.some(t => t.abbreviation === abbreviation)) {
            throw new Error('Translation abbreviation already exists');
        }

        // Update translation
        translation.name = name;
        translation.abbreviation = abbreviation;
        translation.language = language;
        translation.category = category;
        translation.processingRules = processingRules;

        await this.saveData();
    }

    public async addVerse(translationId: number, book: string, chapter: number, verse: number, text: string, saveImmediately: boolean = true): Promise<void> {
        this.data.verses.push({
            id: this.data.nextVerseId++,
            translation_id: translationId,
            book,
            chapter,
            verse,
            text
        });
        if (saveImmediately) {
            await this.saveData();
        }
    }

    public async addVersesBatch(verses: Array<{translationId: number, book: string, chapter: number, verse: number, text: string}>): Promise<void> {
        if (verses.length === 0) {
            console.log('[BibleLink] No verses to add');
            return;
        }
        
        const startId = this.data.nextVerseId;
        for (const verse of verses) {
            this.data.verses.push({
                id: this.data.nextVerseId++,
                translation_id: verse.translationId,
                book: verse.book,
                chapter: verse.chapter,
                verse: verse.verse,
                text: verse.text
            });
        }
        
        console.log(`[BibleLink] Added ${verses.length} verses (IDs ${startId}-${this.data.nextVerseId - 1})`);
        console.log(`[BibleLink] Total verses in memory: ${this.data.verses.length}`);
        await this.saveData();
        console.log(`[BibleLink] After save - Total verses in memory: ${this.data.verses.length}`);
    }

    public async removeTranslation(abbreviation: string): Promise<boolean> {
        const translationIndex = this.data.translations.findIndex(t => t.abbreviation === abbreviation);
        if (translationIndex === -1) {
            return false;
        }

        const translation = this.data.translations[translationIndex];
        
        // Remove all verses for this translation
        this.data.verses = this.data.verses.filter(v => v.translation_id !== translation.id);
        
        // Remove translation
        this.data.translations.splice(translationIndex, 1);
        
        await this.saveData();
        return true;
    }

    public async importFromSQLite(sqliteData: any): Promise<void> {
        // This would parse SQLite data and convert to our format
        // For now, we'll implement a basic structure
        if (sqliteData.translations && sqliteData.verses) {
            for (const translation of sqliteData.translations) {
                await this.addTranslation(translation.name, translation.abbreviation);
            }
            
            const versesToAdd: Array<{translationId: number, book: string, chapter: number, verse: number, text: string}> = [];
            
            for (const verse of sqliteData.verses) {
                const translation = this.data.translations.find(t => t.id === verse.translation_id);
                if (translation) {
                    versesToAdd.push({
                        translationId: translation.id,
                        book: verse.book,
                        chapter: verse.chapter,
                        verse: verse.verse,
                        text: verse.text
                    });
                }
            }
            
            if (versesToAdd.length > 0) {
                await this.addVersesBatch(versesToAdd);
            }
        }
    }

    public async importFromXML(xmlData: any): Promise<void> {
        // This would parse XML Bible data and convert to our format
        // Implementation would depend on the XML structure
        console.log('XML import not yet implemented');
    }

    public getDatabaseStats(): { translations: number; verses: number } {
        return {
            translations: this.data.translations.length,
            verses: this.data.verses.length
        };
    }

    public verifyTranslationExists(abbreviation: string): boolean {
        return this.data.translations.some(t => t.abbreviation === abbreviation);
    }

    public getTranslationStats(abbreviation: string): { name: string; verseCount: number; books: string[] } | null {
        const translation = this.data.translations.find(t => t.abbreviation === abbreviation);
        if (!translation) return null;
        
        const translationVerses = this.data.verses.filter(v => v.translation_id === translation.id);
        const books = [...new Set(translationVerses.map(v => v.book))].sort();
        
        return {
            name: translation.name,
            verseCount: translationVerses.length,
            books
        };
    }

    public applyProcessingRules(text: string, translationAbbr: string): string {
        const translation = this.data.translations.find(t => t.abbreviation === translationAbbr);
        if (!translation || !translation.processingRules) {
            return text;
        }

        let processedText = text;
        for (const rule of translation.processingRules) {
            try {
                const regex = new RegExp(rule.regex, 'g');
                if (rule.escape) {
                    processedText = processedText.replace(regex, (...args) => {
                        // args: [match, group1, group2, ..., offset, string]
                        let result = rule.formatting;
                        for (let i = 1; i < args.length - 2; i++) {
                            const group = args[i];
                            const escaped = this.escapeHtml(group);
                            result = result.replace(new RegExp(`\\$${i}`, 'g'), escaped);
                        }
                        // $& for the whole match
                        result = result.replace(/\$&/g, this.escapeHtml(args[0]));
                        return result;
                    });
                } else {
                    processedText = processedText.replace(regex, rule.formatting);
                }
            } catch (error) {
                console.warn(`Invalid regex in processing rule for ${translationAbbr}: ${rule.regex}`, error);
            }
        }
        return processedText;
    }

    private escapeHtml(str: string): string {
        return str.replace(/[&<>\[\]]/g, (c) => {
            switch (c) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '[': return '&#91;';
                case ']': return '&#93;';
                default: return c;
            }
        });
    }

    public getDataFilePath(): string {
        return path.join(this.plugin.app.vault.adapter.basePath, '.obsidian', 'plugins', 'obsidian-biblelink', this.dataPath, 'bible_data.json');
    }

    public dataFileExists(): boolean {
        return fs.existsSync(this.getDataFilePath());
    }

    public async close(): Promise<void> {
        this.isUnloading = true;
        try {
            await this.saveData();
        } catch (error) {
            console.error('Error during database close:', error);
            // Don't re-throw during close to prevent plugin unload failures
        }
    }
} 