import { logReader } from "./log-reader";

process.on("uncaughtException", UncaughtExceptionHandler);

function UncaughtExceptionHandler(err: any) {
  console.log("Uncaught Exception");
  console.log("err: ", err);
  console.log("Stack trace: ", err.stack);
  setInterval(function () {}, 1000);
}

logReader.watchLogs();