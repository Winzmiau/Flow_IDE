export type SentenceNode = {
  id: string;
  text: string;
  start: number;
  end: number;
};

export type ParagraphNode = {
  id: string;
  text: string;
  start: number;
  end: number;
  sentences: SentenceNode[];
};

export type DocumentTree = {
  id: "root";
  type: "document";
  paragraphs: ParagraphNode[];
  sentenceCount: number;
};

export function buildStructureTree(text: string): DocumentTree {
  const paragraphsRaw = text.split(/\n\s*\n/);
  const paragraphs: ParagraphNode[] = [];
  let cursor = 0;
  let sentenceCount = 0;

  for (let pIndex = 0; pIndex < paragraphsRaw.length; pIndex += 1) {
    const paragraphText = paragraphsRaw[pIndex] ?? "";
    const paragraphStart = text.indexOf(paragraphText, cursor);
    const paragraphEnd = paragraphStart + paragraphText.length;
    cursor = paragraphEnd;

    const sentences = splitSentences(paragraphText).map((segment, sIndex) => ({
      id: `p${pIndex}-s${sIndex}`,
      text: segment.text,
      start: paragraphStart + segment.start,
      end: paragraphStart + segment.end,
    }));

    sentenceCount += sentences.length;

    paragraphs.push({
      id: `p${pIndex}`,
      text: paragraphText,
      start: paragraphStart,
      end: paragraphEnd,
      sentences,
    });
  }

  return {
    id: "root",
    type: "document",
    paragraphs,
    sentenceCount,
  };
}

export function splitSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = [];
  const regex = /[^.!?\n]+[.!?]?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const segment = match[0].trim();
    if (segment.length === 0) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    out.push({ text: segment, start, end });
  }
  return out;
}
