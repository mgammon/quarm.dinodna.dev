import fs from "fs";

export interface LogConfig {
  file: string;
  lastReadAt: number;
  bytesRead: number;
}

interface ConfigData {
  apis: { url: string; key: string; path?: string }[];
  eqDirectory: string;
  logs: LogConfig[];
  eqMulePassword: string;
}

class Config implements ConfigData {
  public apis: { url: string; key: string; path?: string }[];
  public eqMulePassword: string;
  public eqDirectory: string;
  public logs: LogConfig[];

  constructor() {
    try {
      const config = JSON.parse(
        fs.readFileSync("./config.json", "utf-8").trim() as string
      );
      this.apis = config.apis || [
        { url: "https://quarm.dinodna.dev", key: this.generateApiKey() },
      ];
      this.eqDirectory = config.eqDirectory || "./";
      this.eqMulePassword = config.eqMulePassword || "everquest-mule-password-here";
      this.logs = config.logs || [];
      this.logs.forEach((log) => (log.bytesRead = 0));
    } catch (ex) {
      if (ex.message.includes("no such file or directory")) {
        this.eqDirectory = "./";
        this.eqMulePassword = "everquest-mule-password-here";
        this.logs = [];
        this.apis = [
          { url: "https://quarm.dinodna.dev", key: this.generateApiKey() },
        ];
        this.save();
      } else {
        console.log("Error reading config file:", ex.message);
      }
    }
  }

  save() {
    const { eqDirectory, logs, apis, eqMulePassword } = this;
    fs.writeFileSync(
      "./config.json",
      JSON.stringify({ eqDirectory, logs, apis, eqMulePassword })
    );
  }

  private generateApiKey() {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 16) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
}

export const config = new Config();
