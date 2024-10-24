// import { Injectable } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { fromEvent } from 'rxjs';

// export enum Event {
//   LogCreated = 'log.created',
// }

// @Injectable()
// export class EventService {
//   constructor(private eventEmitter: EventEmitter2) {}

//   subscribe(event: Event) {
//     return fromEvent(this.eventEmitter, event);
//   }

//   emit(event: Event, data: any) {
//     this.eventEmitter.emit(event, { data });
//   }
// }
