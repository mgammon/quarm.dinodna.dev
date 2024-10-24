/// <reference lib="webworker" />

let readLogsInterval: any;
let directoryHandle: FileSystemDirectoryHandle;
let logFilesLastByteRead = new Map<string, number>();

addEventListener('message', async ({ data }) => {
  if (data.event === 'setDirectory') {
    onSetDirectory(data.data);
  } else if (data.event === 'stopReading') {
    clearInterval(readLogsInterval);
  }
});

const onSetDirectory = (directory: FileSystemDirectoryHandle) => {
  directoryHandle = directory;
  clearInterval(readLogsInterval);
  readLogsInterval = setInterval(() => readLogs(), 500);
};

const readLogs = async () => {
  if (!directoryHandle) {
    return;
  }

  for await (const [name, logFileHandle] of (
    directoryHandle as any
  ).entries()) {
    if (name.startsWith('eqlog_')) {
      const file = (await logFileHandle.getFile()) as File;
      const lastReadByte = logFilesLastByteRead.get(file.name) || file.size;
      logFilesLastByteRead.set(file.name, file.size);
      if (file.size !== lastReadByte) {
        const text = await file.slice(lastReadByte).text();
        const character = name
          .replace('eqlog_', '')
          .replace('_pq.proj.txt', '');
        postMessage({ event: 'logs', text, character });
        // console.log(character, text);
      }
    }
  }
};
