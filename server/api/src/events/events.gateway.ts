import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LogService } from '../logs/log.service';
import { LocationService } from '../location/location.service';
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/admin.entity';
import { CharacterService } from '../characters/character.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/api/ws',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  public usage: { [event: string]: number } = {};
  private apiKeys = new Set<string>();

  private activeAdminSendingLogs?: Admin;
  private lastLogAt = 0;

  public connectedSockets = 0;
  constructor(
    private logService: LogService,
    private locationService: LocationService,
    private adminService: AdminService,
    private characterService: CharacterService,
  ) {
    setInterval(() => {
      console.log(
        `${new Date().toISOString()} - ${this.connectedSockets} sockets connected - ${
          this.apiKeys.size
        } unique API keys`,
      );
      console.log(JSON.stringify(this.usage, null, 2));
    }, 60_000 * 10);
  }

  afterInit() {}

  handleDisconnect(socket: Socket) {
    this.connectedSockets--;
    const apiKey: string | undefined = socket.handshake.auth?.app;
    if (apiKey) {
      this.server.to(apiKey).emit('logReaderStop', socket.id);
      this.apiKeys.delete(apiKey);
    }
  }

  // Handles when a user connects via the app, joins public and their private channel
  async handleConnection(socket: Socket) {
    socket.join('public');
    this.connectedSockets++;

    // If they sent an API key and it's for the app (not the log reader), join the room and send their last location
    const apiKey: string | undefined = socket.handshake.auth?.app;
    if (apiKey) {
      socket.join(apiKey);
      const location = this.locationService.getOrCreateLocation(apiKey);
      this.server.to(apiKey).emit('location', location);
      this.apiKeys.add(apiKey);
    }
  }

  // Handles incoming logs from the auction log reader
  // Adds the logs/auctions to DB, then sends them out to the public room
  @SubscribeMessage('tells')
  async handleReceivedTellEvents(@MessageBody() rawTell: any, @ConnectedSocket() socket: any) {
    const apiKey = socket.handshake?.auth?.key;
    if (!apiKey) {
      return;
    }

    // If this person can't receive tells, we're done
    const adminSendingLogs = this.adminService.admins.find((admin) => admin.apiKey === apiKey && admin.isAdmin);
    if (!adminSendingLogs) {
      return;
    }

    // Try to verify the character
    const log = this.logService.parseLog(rawTell);
    const code = (log.text.includes("'") ? log.text.split("'")[1] : log.text).trim().toUpperCase(); // this is dumb, but log text has " '" at the start usually.
    const verification = await this.characterService.verifyCharacter(code, log.player);

    // If it was verified, let them know
    if (verification) {
      this.server.to(verification.apiKey).emit('verified', verification.name);
    }
  }

  // Handles incoming logs from the auction log reader
  // Adds the logs/auctions to DB, then sends them out to the public room
  @SubscribeMessage('logs')
  async handleLogEvents(@MessageBody() rawLog: any, @ConnectedSocket() socket: any) {
    const apiKey = socket.handshake?.auth?.key;
    if (!apiKey) {
      return;
    }

    // If this person can't even send logs, we're done
    const adminSendingLogs = this.adminService.admins.find((admin) => admin.apiKey === apiKey && admin.sendPublicLogs);
    if (!adminSendingLogs) {
      return;
    }

    // Haven't received logs from an admin yet, so let this admin take over sending logs
    if (!this.activeAdminSendingLogs) {
      this.activeAdminSendingLogs = adminSendingLogs;
    }

    // Active admin hasn't sent any logs for one minute,
    // Or this admin is a full admin the active admin isn't
    // So let this admin take over sending logs
    const activeAdminHasntSentLogsRecently = Date.now() - this.lastLogAt > 60_000;
    const fullAdminWantsToSendLogsOverBasicAdmin = !this.activeAdminSendingLogs.isAdmin && adminSendingLogs.isAdmin;
    if (activeAdminHasntSentLogsRecently || fullAdminWantsToSendLogsOverBasicAdmin) {
      this.activeAdminSendingLogs = adminSendingLogs;
    }

    // If this admin is the active admin, let them send the logs
    if (this.activeAdminSendingLogs.apiKey === adminSendingLogs.apiKey) {
      this.lastLogAt = Date.now();
      try {
        const logs = await this.logService.onLogs([rawLog]);
        if (logs.length) {
          this.server.to('public').emit('logs', logs);
        }
      } catch (ex) {
        console.log('Caught error trying to process logs', ex);
      }
    }
  }

  // Handles incoming location logs from the log reader
  // Adds the logs/auctions to DB, then sends them out to the public room
  @SubscribeMessage('location')
  async handleLocationEvents(
    @MessageBody() message: { logs: string[]; character: string },
    @ConnectedSocket() socket: any,
  ) {
    const apiKey = socket.handshake?.auth?.app;
    if (!apiKey) {
      return;
    }

    if (!Array.isArray(message.logs)) {
      message.logs = [message.logs];
    }
    const location = this.locationService.onLocation(message.logs, message.character, apiKey);
    this.server.to(apiKey).emit('location', location);
  }

  @SubscribeMessage('logReaderStart')
  async handleLogReaderStart(@ConnectedSocket() socket: Socket) {
    const apiKey: string | undefined = socket.handshake.auth?.app;
    if (apiKey) {
      this.server.to(apiKey).emit('logReaderStart', socket.id);
    }
  }

  // real dumb usage stats, but might be helpful so I know what's being used
  @SubscribeMessage('usage')
  async handleUsage(@MessageBody() event: string) {
    this.usage[event] = (this.usage[event] || 0) + 1;
  }
}
