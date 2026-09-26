import type { Priority, Status, VoiceCommandResult } from '../types/task';

export class VoiceIntentParser {
  // Normalize spoken numbers, e.g. "one hundred one" -> "101" or "number 101"
  private static normalizeTranscript(raw: string): string {
    let text = raw.trim().toLowerCase();
    
    // Common spoken phrase cleanups
    text = text.replace(/\btk\s*(\d+)\b/g, 'tk-$1');
    text = text.replace(/\bticket\s*#?\s*(\d+)\b/g, 'tk-$1');
    text = text.replace(/\btask\s*#?\s*(\d+)\b/g, 'tk-$1');
    text = text.replace(/\bnumber\s*(\d+)\b/g, '$1');

    return text;
  }

  // Extract ID like "TK-101" or numbers
  private static extractTaskId(text: string): string | undefined {
    const tkMatch = text.match(/\b(tk-\d+)\b/i);
    if (tkMatch) return tkMatch[1].toUpperCase();

    const numMatch = text.match(/\b(?:task|ticket)?\s*#?\s*(\d+)\b/i);
    if (numMatch) return `TK-${numMatch[1]}`;

    return undefined;
  }

  // Extract status from text
  private static extractStatus(text: string): Status | undefined {
    if (/\b(done|complete|completed|finished|closed)\b/i.test(text)) return 'done';
    if (/\b(in\s*review|under\s*review|testing|qa)\b/i.test(text)) return 'in_review';
    if (/\b(in\s*progress|active|working|wip|doing|started)\b/i.test(text)) return 'in_progress';
    if (/\b(to\s*do|todo|ready)\b/i.test(text)) return 'todo';
    if (/\b(backlog|icebox|ice\s*box)\b/i.test(text)) return 'backlog';
    return undefined;
  }

  // Extract priority from text
  private static extractPriority(text: string): Priority | undefined {
    if (/\b(urgent|critical|asap|emergency)\b/i.test(text)) return 'urgent';
    if (/\b(high|important)\b/i.test(text)) return 'high';
    if (/\b(medium|normal)\b/i.test(text)) return 'medium';
    if (/\b(low|minor)\b/i.test(text)) return 'low';
    return undefined;
  }

  // Extract tags: "tag frontend", "tagged with auth", "tags bug, backend"
  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    const tagMatch = text.match(/\b(?:tags?|tagged\s*(?:with)?)\s+([a-z0-9_\-\s,]+?)(?=\s+(?:due|with|priority|status|$))/i);
    if (tagMatch) {
      const rawTags = tagMatch[1].split(/[\s,]+/);
      for (const t of rawTags) {
        const cleaned = t.trim().toLowerCase();
        if (cleaned && !['and', 'a', 'the', 'with'].includes(cleaned)) {
          tags.push(cleaned);
        }
      }
    }
    return tags;
  }

  // Extract due date: "due today", "due tomorrow", "due monday", "due in 2 days"
  private static extractDueDate(text: string): string | undefined {
    const now = new Date();

    if (/\bdue\s+today\b/i.test(text)) {
      return now.toISOString().split('T')[0];
    }

    if (/\bdue\s+tomorrow\b/i.test(text)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    const inDaysMatch = text.match(/\bdue\s+in\s+(\d+)\s+days?\b/i);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1], 10);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      return targetDate.toISOString().split('T')[0];
    }

    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < daysOfWeek.length; i++) {
      const regex = new RegExp(`\\bdue\\s+(?:next\\s+)?${daysOfWeek[i]}\\b`, 'i');
      if (regex.test(text)) {
        const currentDay = now.getDay();
        let diff = i - currentDay;
        if (diff <= 0) diff += 7; // Next occurrence
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + diff);
        return targetDate.toISOString().split('T')[0];
      }
    }

    return undefined;
  }

  // Main parse function
  public static parse(rawTranscript: string): VoiceCommandResult {
    const text = this.normalizeTranscript(rawTranscript);

    // 1. Briefing / Standup intent
    if (/\b(brief\s*me|daily\s*standup|daily\s*briefing|what\s*(are\s*my|should\s*i\s*do)|read\s*(my\s*)?tasks|active\s*tasks)\b/i.test(text)) {
      return {
        rawTranscript,
        intent: 'briefing',
        feedbackMessage: "Starting your daily task briefing...",
      };
    }

    // 2. Clear filters / show all
    if (/\b(clear\s*filters?|show\s*all\s*tasks?|reset\s*filters?)\b/i.test(text)) {
      return {
        rawTranscript,
        intent: 'filter',
        filterQuery: '',
        feedbackMessage: "Cleared all filters.",
      };
    }

    // 3. Search / filter intent: "search frontend", "find payment", "filter by urgent"
    const searchMatch = text.match(/\b(?:search(?:\s+for)?|find|filter\s+by)\s+(.+)$/i);
    if (searchMatch && !/\b(task|ticket|move|mark|create|add|new|delete)\b/i.test(searchMatch[1])) {
      const query = searchMatch[1].trim();
      return {
        rawTranscript,
        intent: 'filter',
        filterQuery: query,
        feedbackMessage: `Filtering tasks for "${query}"`,
      };
    }

    // 4. Delete intent: "delete task 101", "remove ticket TK-102"
    if (/\b(delete|remove|destroy)\b/i.test(text)) {
      const taskId = this.extractTaskId(text);
      if (taskId) {
        return {
          rawTranscript,
          intent: 'delete',
          targetTaskId: taskId,
          feedbackMessage: `Deleted task ${taskId}`,
        };
      }
    }

    // 5. Update status intent: "move task 101 to in progress", "mark ticket 102 as done", "send task 103 to backlog"
    if (/\b(move|mark|send|put|change|set|transition)\b/i.test(text)) {
      const targetStatus = this.extractStatus(text);
      const taskId = this.extractTaskId(text);

      if (targetStatus && taskId) {
        return {
          rawTranscript,
          intent: 'update_status',
          targetTaskId: taskId,
          targetStatus,
          feedbackMessage: `Moved ${taskId} to ${targetStatus.replace('_', ' ')}`,
        };
      }

      // Check if updating priority: "set task 101 priority to urgent", "mark task 101 as high priority"
      const targetPriority = this.extractPriority(text);
      if (targetPriority && taskId) {
        return {
          rawTranscript,
          intent: 'set_priority',
          targetTaskId: taskId,
          targetPriority,
          feedbackMessage: `Set priority of ${taskId} to ${targetPriority}`,
        };
      }
    }

    // 6. Create task intent: "create task ...", "add ticket ...", "new task ..."
    const isCreateCommand = /\b(create|add|new|make)\s*(?:a\s*)?(?:task|ticket|item|todo)?\b/i.test(text) ||
                           /^task\s+/i.test(text) ||
                           /^ticket\s+/i.test(text);

    if (isCreateCommand) {
      const priority = this.extractPriority(text) || 'medium';
      const status = this.extractStatus(text) || 'todo';
      const tags = this.extractTags(text);
      const dueDate = this.extractDueDate(text);

      // Clean title from extracted tokens
      let cleanTitle = text
        .replace(/\b(create|add|new|make)\s*(?:a\s*)?(?:task|ticket|item|todo)?\b/gi, '')
        .replace(/\b(high|urgent|critical|medium|normal|low)\s*priority\b/gi, '')
        .replace(/\b(urgent|critical|asap|high|medium|low)\b/gi, '')
        .replace(/\b(?:tags?|tagged\s*(?:with)?)\s+[a-z0-9_\-\s,]+(?=\s+(?:due|with|priority|status|$))/gi, '')
        .replace(/\bdue\s+(today|tomorrow|in\s+\d+\s+days?|next\s+[a-z]+|[a-z]+)\b/gi, '')
        .replace(/\b(?:in|to)\s*(todo|backlog|in\s*progress|in\s*review|done)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Capitalize first letter of title
      if (cleanTitle.length > 0) {
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      } else {
        cleanTitle = "New Voice Task";
      }

      return {
        rawTranscript,
        intent: 'create',
        taskData: {
          title: cleanTitle,
          description: `Created via voice command: "${rawTranscript}"`,
          priority,
          status,
          tags: tags.length > 0 ? tags : ['voice'],
          dueDate,
          subtasks: [],
        },
        feedbackMessage: `Created ${priority} priority task: "${cleanTitle}"`,
      };
    }

    // Fallback: If transcript is short or user just said something like "fix payment bug urgently", treat as create
    if (text.length > 3) {
      const priority = this.extractPriority(text) || 'medium';
      const cleanTitle = text.charAt(0).toUpperCase() + text.slice(1);
      return {
        rawTranscript,
        intent: 'create',
        taskData: {
          title: cleanTitle,
          description: `Created via voice command: "${rawTranscript}"`,
          priority,
          status: 'todo',
          tags: ['voice'],
          subtasks: [],
        },
        feedbackMessage: `Created task: "${cleanTitle}"`,
      };
    }

    return {
      rawTranscript,
      intent: 'unknown',
      feedbackMessage: "Sorry, I didn't recognize that command.",
    };
  }
}
