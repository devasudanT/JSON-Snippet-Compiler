/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- Shadcn/UI-like Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Types ---
type SnippetDataMap = {
  meta: {
    title: string;
    language: 'English' | 'Tamil';
    date: string;
    youtubeUrl: string;
    pdfUrl: string;
    imageUrl: string;
  };
  verse: { reference: string; text: string };
  paragraph: { content: string };
  prayer: { title: string; text: string };
  lesson: { content: string };
};

type SnippetType = keyof SnippetDataMap;

type Snippet<T extends SnippetType = SnippetType> = {
  id: number;
  type: T;
  data: SnippetDataMap[T];
};

const App = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [jsonOutput, setJsonOutput] = useState('[]');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  useEffect(() => {
    const output = snippets.map(snippet => {
        switch (snippet.type) {
            case 'meta': return { type: 'meta', ...snippet.data };
            case 'verse': return { type: 'verse', reference: snippet.data.reference, text: snippet.data.text };
            case 'paragraph': return { type: 'paragraph', content: snippet.data.content };
            case 'prayer': return { type: 'prayer', title: snippet.data.title, text: snippet.data.text };
            case 'lesson': return { type: 'lesson', content: snippet.data.content };
            default: return null;
        }
    }).filter(Boolean);
    setJsonOutput(JSON.stringify(output, null, 2));
  }, [snippets]);

  const handleAddSnippet = (type: SnippetType) => {
    const newSnippet: Snippet = {
        id: Date.now(),
        type,
        data: ({
            meta: { title: '', language: 'English', date: '', youtubeUrl: '', pdfUrl: '', imageUrl: '' },
            verse: { reference: '', text: '' },
            paragraph: { content: '' },
            prayer: { title: 'Prayer', text: '' },
            lesson: { content: '' },
        } as SnippetDataMap)[type]
    };
    setSnippets(prev => type === 'meta' ? [newSnippet, ...prev] : [...prev, newSnippet]);
  };
  
  const handleUpdateSnippet = useCallback((id: number, data: any) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, data } : s));
  }, []);

  const handleDeleteSnippet = (id: number) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const handleDownload = () => {
    const metaSnippet = snippets.find(s => s.type === 'meta');
    let filename = 'content.json';

    if (metaSnippet && metaSnippet.type === 'meta' && metaSnippet.data.date) {
        try {
            // Date is in YYYY-MM-DD format from the input
            const [year, month, day] = metaSnippet.data.date.split('-');
            const formattedDate = `${day}-${month}-${year}`;
            
            // Language is either 'English' or 'Tamil'
            const langCode = metaSnippet.data.language === 'Tamil' ? 'TA' : 'EN';
            
            filename = `${formattedDate}-${langCode}.json`;
        } catch (error) {
            console.error("Error formatting filename, using default 'content.json'.", error);
            // If date is malformed or something goes wrong, filename remains 'content.json'
        }
    }

    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      dragItemRef.current = index;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
      document.body.classList.add('dragging-active');
  };

  const handleDragEnter = (index: number) => {
    if (dragItemRef.current === null) return;
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }
  
  const handleDrop = (index: number) => {
    if (dragItemRef.current === null || dragItemRef.current === index) return;
    setSnippets(prev => {
        const newSnippets = [...prev];
        const [reorderedItem] = newSnippets.splice(dragItemRef.current!, 1);
        newSnippets.splice(index, 0, reorderedItem);
        return newSnippets;
    });
  };

  const handleDragEnd = () => {
      dragItemRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
      document.body.classList.remove('dragging-active');
  };

  const metaExists = snippets.some(snippet => snippet.type === 'meta');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8 pb-4 border-b">
          <h1 className="text-4xl font-bold tracking-tight">JSON Snippet Compiler</h1>
          <p className="text-muted-foreground mt-2">Create structured JSON content with an easy-to-use snippet editor.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-6" onDragOver={handleDragOver}>
            {snippets.map((snippet, index) => {
                const props = {
                    key: snippet.id,
                    snippet,
                    onUpdate: handleUpdateSnippet,
                    onDelete: handleDeleteSnippet,
                };
                
                const SnippetComponent = {
                      meta: MetaSnippet,
                      verse: VerseSnippet,
                      paragraph: ParagraphSnippet,
                      prayer: PrayerSnippet,
                      lesson: LessonSnippet
                }[snippet.type];

                return (
                  <div
                    className="snippet-container"
                    onDragEnter={() => handleDragEnter(index)}
                    onDrop={() => handleDrop(index)}
                  >
                    {dragOverIndex === index && draggedIndex !== index && <div className="drop-indicator -top-3" />}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn("transition-all", draggedIndex === index && 'dragging-item')}
                    >
                      {SnippetComponent && <SnippetComponent {...props} />}
                    </div>
                  </div>
                )
            })}
             <SnippetSelector onAddSnippet={handleAddSnippet} metaExists={metaExists} />
          </div>

          <div className="sticky top-8 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Live JSON Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonHighlighter jsonString={jsonOutput} />
              </CardContent>
              <CardFooter>
                 <Button onClick={handleDownload} className="w-full">Download JSON</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Snippet Components ---
type SnippetProps<T extends SnippetType> = {
    snippet: Snippet<T>;
    onUpdate: (id: number, data: SnippetDataMap[T]) => void;
    onDelete: (id: number) => void;
};

const SnippetCard = ({ title, children, onDelete, snippetId }: React.PropsWithChildren<{title: string; snippetId: number; onDelete: (id: number) => void;}>) => (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3 border-b">
        <div className="flex items-center gap-2">
           <GripVerticalIcon className="h-5 w-5 text-muted-foreground" />
           <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(snippetId)} aria-label="Delete snippet">
            <TrashIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
);

const MetaSnippet = ({ snippet, onUpdate, onDelete }: SnippetProps<'meta'>) => (
    <SnippetCard title="Meta Data" snippetId={snippet.id} onDelete={onDelete}>
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`title-${snippet.id}`}>Title</Label>
                <Input id={`title-${snippet.id}`} placeholder="Enter title text" value={snippet.data.title} onChange={e => onUpdate(snippet.id, { ...snippet.data, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor={`lang-${snippet.id}`}>Language</Label>
                    <Select id={`lang-${snippet.id}`} value={snippet.data.language} onChange={e => onUpdate(snippet.id, { ...snippet.data, language: e.target.value as 'English' | 'Tamil' })}>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor={`date-${snippet.id}`}>Date</Label>
                    <Input id={`date-${snippet.id}`} type="date" value={snippet.data.date} onChange={e => onUpdate(snippet.id, { ...snippet.data, date: e.target.value })} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`youtube-${snippet.id}`}>YouTube URL</Label>
                <Input id={`youtube-${snippet.id}`} placeholder="https://youtube.com/..." value={snippet.data.youtubeUrl} onChange={e => onUpdate(snippet.id, { ...snippet.data, youtubeUrl: e.target.value })} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`pdf-${snippet.id}`}>PDF URL</Label>
                <Input id={`pdf-${snippet.id}`} placeholder="https://example.com/..." value={snippet.data.pdfUrl} onChange={e => onUpdate(snippet.id, { ...snippet.data, pdfUrl: e.target.value })} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`image-${snippet.id}`}>Image URL</Label>
                <Input id={`image-${snippet.id}`} placeholder="https://example.com/..." value={snippet.data.imageUrl} onChange={e => onUpdate(snippet.id, { ...snippet.data, imageUrl: e.target.value })} />
            </div>
        </div>
    </SnippetCard>
);

const VerseSnippet = ({ snippet, onUpdate, onDelete }: SnippetProps<'verse'>) => (
    <SnippetCard title="Verse" snippetId={snippet.id} onDelete={onDelete}>
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`ref-${snippet.id}`}>Reference</Label>
                <Input id={`ref-${snippet.id}`} placeholder="e.g., John 3:16" value={snippet.data.reference} onChange={e => onUpdate(snippet.id, { ...snippet.data, reference: e.target.value })} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`text-${snippet.id}`}>Text</Label>
                <Textarea id={`text-${snippet.id}`} placeholder="Verse text..." value={snippet.data.text} onChange={e => onUpdate(snippet.id, { ...snippet.data, text: e.target.value })} />
            </div>
        </div>
    </SnippetCard>
);

const htmlToMarkdown = (html: string): string => {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

    doc.querySelectorAll('script, style').forEach(el => el.remove());

    function walk(node: Node): string {
        if (node.nodeType === 3) return node.textContent || ''; // Text node
        if (node.nodeType !== 1) return ''; // Not an element node

        const element = node as Element;
        const children = Array.from(element.childNodes).map(walk).join('');

        switch (element.tagName) {
            case 'STRONG':
            case 'B':
                return `**${children}**`;
            case 'EM':
            case 'I':
                return `*${children}*`;
            case 'P':
                return `\n${children}\n`;
            case 'LI':
                return `- ${children.trim()}\n`;
            case 'UL':
            case 'OL':
                return `${children.trim()}\n`;
            case 'BR':
                return '\n';
            default:
                return children;
        }
    }

    let markdown = walk(doc.body);
    
    // Final cleanup
    markdown = markdown.replace(/\n\s*\n/g, '\n\n').trim();

    return markdown;
};

const ParagraphSnippet = ({ snippet, onUpdate, onDelete }: SnippetProps<'paragraph'>) => {
    const [content, setContent] = useState(snippet.data.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (content !== snippet.data.content) {
                onUpdate(snippet.id, { content });
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [content, snippet.id, onUpdate, snippet.data.content]);

    const applyFormatting = (style: 'bold' | 'italic' | 'list') => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart: start, selectionEnd: end } = textarea;
        const selectedText = textarea.value.substring(start, end);
        let newText;

        switch (style) {
            case 'bold': newText = `**${selectedText}**`; break;
            case 'italic': newText = `*${selectedText}*`; break;
            case 'list': newText = selectedText.split('\n').map(line => line.trim() ? `- ${line}` : line).join('\n'); break;
        }
        setContent(textarea.value.substring(0, start) + newText + textarea.value.substring(end));
        textarea.focus();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const clipboardData = e.clipboardData;
        if (!clipboardData.types.includes('text/html')) {
            return; // Let the default paste happen for plain text
        }
        
        e.preventDefault();
        
        const html = clipboardData.getData('text/html');
        const markdown = htmlToMarkdown(html);

        if (markdown) {
            const textarea = e.currentTarget;
            const { selectionStart, selectionEnd } = textarea;

            const currentContent = textarea.value;
            const newContent =
                currentContent.substring(0, selectionStart) +
                markdown +
                currentContent.substring(selectionEnd);
            
            setContent(newContent);
            
            // Wait for state to update and then set cursor position
            setTimeout(() => {
                if (textareaRef.current) {
                    const newCursorPos = selectionStart + markdown.length;
                    textareaRef.current.selectionStart = newCursorPos;
                    textareaRef.current.selectionEnd = newCursorPos;
                }
            }, 0);
        }
    };

    return (
        <SnippetCard title="Paragraph" snippetId={snippet.id} onDelete={onDelete}>
            <div className="grid gap-2">
                <div className="border rounded-md p-1 flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => applyFormatting('bold')} aria-label="Bold" className="font-bold">B</Button>
                    <Button variant="outline" size="sm" onClick={() => applyFormatting('italic')} aria-label="Italic" className="italic">I</Button>
                    <Button variant="outline" size="sm" onClick={() => applyFormatting('list')} aria-label="List">&bull;</Button>
                </div>
                <Textarea 
                  ref={textareaRef} 
                  placeholder="Paste your text here for manual formatting..." 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  onPaste={handlePaste}
                  rows={8} 
                />
            </div>
        </SnippetCard>
    );
};

const PrayerSnippet = ({ snippet, onUpdate, onDelete }: SnippetProps<'prayer'>) => (
    <SnippetCard title="Prayer" snippetId={snippet.id} onDelete={onDelete}>
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor={`prayer-title-${snippet.id}`}>Title</Label>
                <Select id={`prayer-title-${snippet.id}`} value={snippet.data.title} onChange={e => onUpdate(snippet.id, { ...snippet.data, title: e.target.value })}>
                    <option value="Prayer">Prayer</option>
                    <option value="ஜெபம்">ஜெபம்</option>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor={`prayer-text-${snippet.id}`}>Text</Label>
                <Textarea id={`prayer-text-${snippet.id}`} placeholder="Prayer text..." value={snippet.data.text} onChange={e => onUpdate(snippet.id, { ...snippet.data, text: e.target.value })} />
            </div>
        </div>
    </SnippetCard>
);

const LessonSnippet = ({ snippet, onUpdate, onDelete }: SnippetProps<'lesson'>) => (
    <SnippetCard title="Lesson" snippetId={snippet.id} onDelete={onDelete}>
        <div className="grid gap-2">
            <Label htmlFor={`lesson-content-${snippet.id}`}>Content</Label>
            <Textarea id={`lesson-content-${snippet.id}`} placeholder="Lesson content..." value={snippet.data.content} onChange={e => onUpdate(snippet.id, { ...snippet.data, content: e.target.value })} rows={5} />
        </div>
    </SnippetCard>
);

const SnippetSelector = ({ onAddSnippet, metaExists }: { onAddSnippet: (type: SnippetType) => void; metaExists: boolean; }) => (
    <Card>
      <CardHeader>
        <CardTitle>Add New Snippet</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 justify-center">
        <Button onClick={() => onAddSnippet('meta')} variant="outline" disabled={metaExists}>Meta Data</Button>
        <Button onClick={() => onAddSnippet('verse')} variant="outline">Verse</Button>
        <Button onClick={() => onAddSnippet('paragraph')} variant="outline">Paragraph</Button>
        <Button onClick={() => onAddSnippet('lesson')} variant="outline">Lesson</Button>
        <Button onClick={() => onAddSnippet('prayer')} variant="outline">Prayer</Button>
      </CardContent>
    </Card>
);

// --- Reusable UI Components (shadcn/ui inspired) ---

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

const JsonHighlighter = ({ jsonString }: { jsonString: string }) => {
    const highlight = (json: string) => {
        if (!json) return '';
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                cls = /:$/.test(match) ? 'json-key' : 'json-string';
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    };

    return (
        <pre className="rounded-md p-4 max-h-[60vh] overflow-auto code-preview text-sm">
            <code dangerouslySetInnerHTML={{ __html: highlight(jsonString) }} />
        </pre>
    );
};

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
  />
));
Input.displayName = 'Input';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
    <select
      {...props}
      ref={ref}
      className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)}
    />
));
Select.displayName = 'Select';


const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => (
    <textarea
        {...props}
        ref={ref}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
));
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />
));
Label.displayName = "Label";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    };
    return (
        <button
            ref={ref}
            {...props}
            className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)}
        />
    );
});
Button.displayName = 'Button';

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const GripVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9"cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);


const root = createRoot(document.getElementById('root')!);
root.render(<App />);