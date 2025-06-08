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
import { CharacterService } from '../characters/character.service';
import { UserService } from '../user/user.service';

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
  private sentLogCounts = new Map<string, number>();

  public connectedSockets = 0;
  constructor(
    private logService: LogService,
    private locationService: LocationService,
    private userService: UserService,
    private characterService: CharacterService,
  ) {
    setInterval(() => {
      console.log(
        `${new Date().toISOString()} - ${this.connectedSockets} sockets connected - ${
          this.apiKeys.size
        } unique API keys`,
      );
      console.log(JSON.stringify(this.usage, null, 2));
      console.log(
        JSON.stringify(
          Array.from(this.sentLogCounts.entries()).map(
            ([user, sentLogCount]) => `$User ${user} - ${sentLogCount} sent logs`,
          ),
          null,
          2,
        ),
      );
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

  // Handles incoming /tells to admins
  @SubscribeMessage('tells')
  async handleReceivedTellEvents(@MessageBody() rawTell: any, @ConnectedSocket() socket: any) {
    const apiKey = socket.handshake?.auth?.key;
    if (!apiKey) {
      return;
    }

    // If this person isn't an admin, we're done
    const isAdmin = await this.userService.isAdmin(apiKey);
    if (!isAdmin) {
      return;
    }

    // Try to verify the character
    const log = this.logService.parseLog(rawTell);
    const code = (log.text.includes("'") ? log.text.split("'")[1] : log.text).trim().toUpperCase(); // this is dumb, but log text has " '" at the start.
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

    // Check if they can send us logs
    const canSendPublicLogs = await this.userService.canSendPublicLogs(apiKey);
    if (!canSendPublicLogs) {
      return;
    }

    // Send the logs to be parsed and saved, then broadcast them to everyone on the public channel
    try {
      const logs = await this.logService.onLogs([rawLog]);
      if (logs.length) {
        this.server.to('public').emit('logs', logs);
      }
      this.sentLogCounts.set(apiKey, (this.sentLogCounts.get(apiKey) || 0) + 1);
    } catch (ex) {
      console.log('Caught error trying to process logs', ex);
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

  // Handles incoming location logs from the log reader
  // Adds the logs/auctions to DB, then sends them out to the public room
  @SubscribeMessage('online')
  async handleOnlinePing(@MessageBody() characterName: string, @ConnectedSocket() socket: any) {
    const apiKey = socket.handshake?.auth?.app;
    if (!apiKey) {
      return;
    }

    const user = await this.userService.getUserFromApiKey(apiKey);
    const changedOnlineStatus = await this.characterService.setLastOnlineAt(user.id, characterName);

    if (changedOnlineStatus) {
      // idk, maybe we broadcast this at some point, like if someone is selling something and they wanna know when they go back online
    }
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
