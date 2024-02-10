import { Plugin } from 'obsidian';
import * as fs from 'fs';

export default class AddDurationPlugin extends Plugin {
  async onload() {
    console.log('clean logseq timetracking  loaded.');

    this.addCommand({
      id: 'clean logseq timetracking',
      name: 'clean logseq timetracking ',
      callback: this.addDurationToCurrentFile,
    });
  }

  addDurationToCurrentFile = async () => {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf || !activeLeaf.view) return;

    const file = activeLeaf.view.file;
    if (!file) return;

    const filePath = this.app.vault.adapter.getFullPath(file.path);

    console.log(filePath)
    addDurationToFiles(filePath);
  };
}

function addDurationToFiles(filePath: string) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const updatedLines = addDuration(lines);
  fs.writeFileSync(filePath, updatedLines.join('\n'));
  console.log(`Updated file: ${filePath}`);
}

function addDuration(lines: string[]): string[] {
  const updatedLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes('- DONE') && i + 1 < lines.length && !lines[i + 1].trim().startsWith('-')) {
      const taskDescription = line.match(/- DONE (.+)/)[1];
      let taskLogs = '';
      let j = i + 1;
      while (j < lines.length && !lines[j].trim().startsWith('-')) {
        taskLogs += lines[j] + '\n';
        j++;
      }
      const durationPattern = /CLOCK: .+? =>  (\d{2}:\d{2}:\d{2})/g;
      const durations: string[] = [];
      let match;
      while ((match = durationPattern.exec(taskLogs))) {
        durations.push(match[1]);
      }
      const totalDuration = durations.reduce((acc, duration) => acc + timeToSeconds(duration), 0);
      const formattedDuration = formatDuration(totalDuration);
      const updatedLine = line.replace(`- DONE ${taskDescription}`, `- ${taskDescription}${formattedDuration}`);
      updatedLines.push(updatedLine);
      i = j - 1; // Skip the lines until the last line of the task logs
    } else {
      updatedLines.push(line);
    }
    i++;
  }
  return updatedLines;
}

function timeToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `  ${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `  ${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return ` ${hours}h`;
  }
}