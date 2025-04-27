import fs from "fs";
import readline from "readline";
import { LogConfig, config } from "./config";
import io, { Socket } from "socket.io-client";
import { autoLogin } from "./auto-login";

interface LogStats {
  filename: string;
  size: number;
}

const publicChannelRegex =
  /^\[.*\] [A-Z)]{1}[a-z]{2,17} (auction|out of character|shout|say|tells General:|tells Lfg:|tells Auction:|tells Port:|tells Ports:)s?/;

const blacklistedPublicRegex =
  /(As you wish, oh great one)|(Sorry, Master)|(I beg forgiveness)|(Guarding with my life)|(Following you, Master)|(Time to die)/;

const systemMessageRegex = /^\[.*\] \[SYSTEM\] /;

const broadcastRegex = /^\[.*\] [A-Z)]{1}[a-z]{2,17} BROADCASTS?/;

const lastSentMessages: string[] = [];

console.log(JSON.stringify(config, null, 2));

class LogReader {
  public lastUploadedAt: number = 0;
  private sockets: Socket[] = [];
  private logFiles: LogConfig[] = [];

  private async createSockets() {
    const { apis } = config;
    // Create a socket for each API URL
    apis.forEach((api) => {
      const socket = io(api.url, {
        auth: { key: api.key },
        autoConnect: true,
        path: api.path || "/api/ws",
      });
      this.sockets.push(socket);
      return socket;
    });
    // Give it a literal second to connect
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async watchLogs() {
    this.openQuarmMule();
    await this.createSockets();
    this.readLogs();
    setInterval(async () => {
      this.readLogs();
    }, 250);
  }

  private async readLogs() {
    // Get stats of all the log files
    const logStats = this.getLogStats();
    for (const logStat of logStats) {
      // Make sure we have a logConfig
      let logFile = this.logFiles.find((log) => log.file === logStat.filename);
      if (!logFile) {
        logFile = {
          file: logStat.filename,
          bytesRead: logStat.size,
          lastReadAt: 0,
        };
        this.logFiles.push(logFile);
      }
      // If the size is larger than how far we've read, keep reading the log
      if (logStat.size > logFile.bytesRead) {
        await this.readLog(logStat, logFile);
      }
    }

    // Try to (re)open the quarm mule if it's been 5 minutes since we uploaded a message
    if (Date.now() - this.lastUploadedAt > 5 * 60_000) {
      this.openQuarmMule();
    }

    config.save();
  }

  
  private async openQuarmMule() {
      const justOpenedLogReader = this.lastUploadedAt === 0;
      this.lastUploadedAt = Date.now(); // pretend we uploaded so we give it a chance to open the mule before running the open script again
      autoLogin(justOpenedLogReader);
  }

  // Read a logfile, starting from where we left off
  private async readLog(logStat: LogStats, logConfig: LogConfig) {
    return new Promise<void>((resolve) => {
      const fileStream = fs.createReadStream(logStat.filename, {
        start: logConfig.bytesRead,
      });
      fileStream.on("close", () => {
        logConfig.bytesRead = fileStream.bytesRead + (logConfig.bytesRead || 0);
        logConfig.lastReadAt = Date.now() - 1500;
        rl.close();
        resolve();
      });
      const rl = readline.createInterface({ input: fileStream });
      rl.on("line", (line) => {
        const isPublicMessage = this.isPublicMessage(line);
        const messageTime = this.getMessageTime(line);
        const notYetRead = messageTime > logConfig.lastReadAt;
        if (notYetRead && isPublicMessage) {
          // this.messages.push(line);
          this.uploadLine(line);
        }
      });
    });
  }

  // Get the time the message was sent
  getMessageTime(line: string) {
    const endOfDate = line.indexOf("]");
    return new Date(
      line.slice(0, endOfDate).replace("[", "").replace("]", "")
    ).getTime();
  }

  isPublicMessage(line: string) {
    return (
      (publicChannelRegex.test(line) ||
        broadcastRegex.test(line) ||
        systemMessageRegex.test(line)) &&
      !blacklistedPublicRegex.test(line)
    );
  }

  private getLogStats() {
    // Read all files in the log directory
    const allFilenames = fs.readdirSync(config.eqDirectory);

    // Filter down to log files and get the file stats
    const logFilenames = allFilenames.filter((filename) =>
      filename.startsWith("eqlog_")
    );
    return logFilenames.map((logFilename) => ({
      filename: config.eqDirectory + "/" + logFilename,
      size: fs.statSync(config.eqDirectory + "/" + logFilename).size,
    }));
  }

  async uploadLine(line: string) {
    if (lastSentMessages.includes(line)) {
      return;
    }
    lastSentMessages.push(line);
    console.log(line);

    // Emit the line to each connected socket
    this.sockets
      .filter((socket) => socket.connected)
      .forEach((socket) => socket.emit("logs", line));

    // Only keep the last 100 sent messages
    while (lastSentMessages.length > 100) {
      lastSentMessages.shift();
    }

    this.lastUploadedAt = Date.now();
  }
}

export const logReader = new LogReader();
