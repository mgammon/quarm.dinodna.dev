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
import { config } from '../config';
import { LogService } from '../logs/log.service';
import { LocationService } from '../location/location.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/api/ws',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  public connectedSockets = 0;
  constructor(
    private logService: LogService,
    private locationService: LocationService,
  ) {
    setInterval(
      () =>
        console.log(
          `${new Date().toISOString()} - ${
            this.connectedSockets
          } sockets connected`,
        ),
      60_000 * 30,
    );
  }

  afterInit() {}

  handleDisconnect(socket: Socket) {
    this.connectedSockets--;
    const apiKey: string | undefined = socket.handshake.auth?.app;
    if (apiKey) {
      this.server.to(apiKey).emit('logReaderStop', socket.id);
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
    }
  }

  // Handles incoming logs from the auction log reader
  // Adds the logs/auctions to DB, then sends them out to the public room
  @SubscribeMessage('logs')
  async handleLogEvents(
    @MessageBody() rawLog: any,
    @ConnectedSocket() socket: any,
  ) {
    const apiKey = socket.handshake?.auth?.key;
    if (!apiKey) {
      return;
    }

    if (apiKey === config.apiKey) {
      try {
        const logs = await this.logService.onLogs([rawLog]);
        this.server.to('public').emit('logs', logs);
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
    const location = this.locationService.onLocation(
      message.logs,
      message.character,
      apiKey,
    );
    this.server.to(apiKey).emit('location', location);
  }

  @SubscribeMessage('logReaderStart')
  async handleSetApiKey(@ConnectedSocket() socket: Socket) {
    const apiKey: string | undefined = socket.handshake.auth?.app;
    if (apiKey) {
      this.server.to(apiKey).emit('logReaderStart', socket.id);
    }
  }
}
