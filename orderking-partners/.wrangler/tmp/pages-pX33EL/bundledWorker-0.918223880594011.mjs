var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js/index.js
import { i as toEventHandler, n as HTTPError, o as FastResponse, r as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { Buffer as Buffer2 } from "node:buffer";

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/fs/promises.mjs
var access = /* @__PURE__ */ notImplemented("fs.access");
var copyFile = /* @__PURE__ */ notImplemented("fs.copyFile");
var cp = /* @__PURE__ */ notImplemented("fs.cp");
var open = /* @__PURE__ */ notImplemented("fs.open");
var opendir = /* @__PURE__ */ notImplemented("fs.opendir");
var rename = /* @__PURE__ */ notImplemented("fs.rename");
var truncate = /* @__PURE__ */ notImplemented("fs.truncate");
var rm = /* @__PURE__ */ notImplemented("fs.rm");
var rmdir = /* @__PURE__ */ notImplemented("fs.rmdir");
var mkdir = /* @__PURE__ */ notImplemented("fs.mkdir");
var readdir = /* @__PURE__ */ notImplemented("fs.readdir");
var readlink = /* @__PURE__ */ notImplemented("fs.readlink");
var symlink = /* @__PURE__ */ notImplemented("fs.symlink");
var lstat = /* @__PURE__ */ notImplemented("fs.lstat");
var stat = /* @__PURE__ */ notImplemented("fs.stat");
var link = /* @__PURE__ */ notImplemented("fs.link");
var unlink = /* @__PURE__ */ notImplemented("fs.unlink");
var chmod = /* @__PURE__ */ notImplemented("fs.chmod");
var lchmod = /* @__PURE__ */ notImplemented("fs.lchmod");
var lchown = /* @__PURE__ */ notImplemented("fs.lchown");
var chown = /* @__PURE__ */ notImplemented("fs.chown");
var utimes = /* @__PURE__ */ notImplemented("fs.utimes");
var lutimes = /* @__PURE__ */ notImplemented("fs.lutimes");
var realpath = /* @__PURE__ */ notImplemented("fs.realpath");
var mkdtemp = /* @__PURE__ */ notImplemented("fs.mkdtemp");
var writeFile = /* @__PURE__ */ notImplemented("fs.writeFile");
var appendFile = /* @__PURE__ */ notImplemented("fs.appendFile");
var readFile = /* @__PURE__ */ notImplemented("fs.readFile");
var statfs = /* @__PURE__ */ notImplemented("fs.statfs");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/fs/fs.mjs
function callbackify(fn) {
  const fnc = /* @__PURE__ */ __name(function(...args) {
    const cb = args.pop();
    fn().catch((error3) => cb(error3)).then((val) => cb(void 0, val));
  }, "fnc");
  fnc.__promisify__ = fn;
  fnc.native = fnc;
  return fnc;
}
__name(callbackify, "callbackify");
var access2 = callbackify(access);
var appendFile2 = callbackify(appendFile);
var chown2 = callbackify(chown);
var chmod2 = callbackify(chmod);
var copyFile2 = callbackify(copyFile);
var cp2 = callbackify(cp);
var lchown2 = callbackify(lchown);
var lchmod2 = callbackify(lchmod);
var link2 = callbackify(link);
var lstat2 = callbackify(lstat);
var lutimes2 = callbackify(lutimes);
var mkdir2 = callbackify(mkdir);
var mkdtemp2 = callbackify(mkdtemp);
var realpath2 = callbackify(realpath);
var open2 = callbackify(open);
var opendir2 = callbackify(opendir);
var readdir2 = callbackify(readdir);
var readFile2 = callbackify(readFile);
var readlink2 = callbackify(readlink);
var rename2 = callbackify(rename);
var rm2 = callbackify(rm);
var rmdir2 = callbackify(rmdir);
var stat2 = callbackify(stat);
var symlink2 = callbackify(symlink);
var truncate2 = callbackify(truncate);
var unlink2 = callbackify(unlink);
var utimes2 = callbackify(utimes);
var writeFile2 = callbackify(writeFile);
var statfs2 = callbackify(statfs);
var existsSync = /* @__PURE__ */ __name(() => false, "existsSync");
var readFileSync = /* @__PURE__ */ notImplemented("fs.readFileSync");

// _worker.js/index.js
import { join } from "node:path";
globalThis.__nitro_main__ = import.meta.url;
var headers = /* @__PURE__ */ __name(((m) => /* @__PURE__ */ __name(function headersRouteRule(event) {
  for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
}, "headersRouteRule")), "headers");
var install_page_default = '<!DOCTYPE html>\r\n<html lang="en" class="device-desktop">\r\n  <head>\r\n    <meta charset="utf-8" />\r\n    <meta\r\n      name="viewport"\r\n      content="width=device-width, initial-scale=1, viewport-fit=cover"\r\n    />\r\n    <meta name="color-scheme" content="dark" />\r\n    <meta name="theme-color" content="#000000" />\r\n    <meta name="apple-mobile-web-app-status-bar-style" content="black" />\r\n    <meta name="apple-mobile-web-app-title" content="{{APP_NAME}}" />\r\n    <title>Add {{APP_NAME}} to your Home Screen</title>\r\n    <link rel="manifest" href="/__grok/manifest.webmanifest" />\r\n    <link rel="apple-touch-icon" href="/__grok/icon-180.png" />\r\n    <link rel="stylesheet" href="/__grok/install/styles.css" />\r\n    <script>\r\n      (function () {\r\n        var ua = navigator.userAgent || "";\r\n        var touch = navigator.maxTouchPoints || 0;\r\n        var isiPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touch > 1);\r\n        var isiPhone = /iPhone|iPod/.test(ua);\r\n        var isIOS = isiPhone || isiPad;\r\n        var isAndroid = /Android/i.test(ua);\r\n        var isAndroidPhone = isAndroid && /Mobile/i.test(ua);\r\n        var isAndroidTablet = isAndroid && !/Mobile/i.test(ua);\r\n        var minSide = Math.min(screen.width || 0, screen.height || 0);\r\n        var maxSide = Math.max(screen.width || 0, screen.height || 0);\r\n\r\n        var type = "desktop";\r\n        if (isiPhone) type = "phone";\r\n        else if (isiPad || isAndroidTablet) type = "tablet";\r\n        else if (isAndroidPhone) type = "phone";\r\n        else if (touch > 0 && minSide > 0 && minSide <= 500) type = "phone";\r\n        else if (touch > 0 && minSide > 500 && maxSide <= 1400) type = "tablet";\r\n\r\n        var iosMajor = null;\r\n        var osToken = null;\r\n        var safariToken = null;\r\n        var iphoneOs = ua.match(/iPhone OS (\\d+)[._]/);\r\n        var ipadOs = ua.match(/CPU OS (\\d+)[._](\\d+) like Mac OS X/);\r\n        var safariVer = ua.match(/Version\\/(\\d+)[._]/);\r\n        if (iphoneOs) osToken = parseInt(iphoneOs[1], 10);\r\n        else if (ipadOs) osToken = parseInt(ipadOs[1], 10);\r\n        if (isIOS && safariVer) safariToken = parseInt(safariVer[1], 10);\r\n        if (osToken != null || safariToken != null) {\r\n          iosMajor = Math.max(osToken || 0, safariToken || 0);\r\n        }\r\n\r\n        var root = document.documentElement;\r\n        var classes = ["device-" + type];\r\n        if (iosMajor != null) {\r\n          root.dataset.ios = String(iosMajor);\r\n          classes.push(iosMajor >= 27 ? "ios-27-plus" : "ios-below-27");\r\n        }\r\n        root.className = classes.join(" ");\r\n      })();\r\n    <\/script>\r\n  </head>\r\n  <body>\r\n    <div class="page">\r\n      <header class="powered" aria-label="Powered by Grok">\r\n        <span class="powered-by">Powered by</span>\r\n        <span class="powered-brand">\r\n          <img\r\n            class="grok-logo"\r\n            src="/__grok/install/assets/homescreen/logo-grok.svg"\r\n            width="14"\r\n            height="14"\r\n            alt=""\r\n          />\r\n          <span class="powered-grok">Grok</span>\r\n        </span>\r\n      </header>\r\n\r\n      <main class="content">\r\n        <div class="ob" aria-hidden="true">\r\n          <img\r\n            class="ob-img ob-phone"\r\n            src="/__grok/install/assets/homescreen/ob-phone.png"\r\n            width="338"\r\n            height="294"\r\n            alt=""\r\n          />\r\n          <img\r\n            class="ob-img ob-ipad"\r\n            src="/__grok/install/assets/homescreen/ob-ipad.png"\r\n            width="634"\r\n            height="294"\r\n            alt=""\r\n          />\r\n        </div>\r\n\r\n        <section class="copy">\r\n          <h1>Add {{APP_NAME}} to your&nbsp;Home&nbsp;Screen</h1>\r\n\r\n          <div class="steps">\r\n            <p class="step step-tap step-ios27">\r\n              <span class="muted">Tap</span>\r\n              <span class="glass glass--icon" aria-hidden="true">\r\n                <img src="/__grok/install/assets/homescreen/glass-puzzle.svg" width="24" height="24" alt="" />\r\n              </span>\r\n              <span class="muted loc loc-phone">in the bottom bar, then</span>\r\n              <span class="muted loc loc-ipad">in the tool bar, then</span>\r\n              <span class="glass glass--icon" aria-hidden="true">\r\n                <img src="/__grok/install/assets/homescreen/glass-share.svg" width="24" height="24" alt="" />\r\n              </span>\r\n            </p>\r\n\r\n            <p class="step step-tap step-ios-legacy">\r\n              <span class="muted">Tap</span>\r\n              <span class="glass glass--icon" aria-hidden="true">\r\n                <img src="/__grok/install/assets/homescreen/glass-share.svg" width="24" height="24" alt="" />\r\n              </span>\r\n              <span class="muted loc loc-phone">in the bottom bar</span>\r\n              <span class="muted loc loc-ipad">in the tool bar</span>\r\n            </p>\r\n\r\n            <p class="step step-select">\r\n              <span class="muted">Select</span>\r\n              <span class="add-label">\r\n                <img\r\n                  class="plus-icon"\r\n                  src="/__grok/install/assets/homescreen/plus.svg"\r\n                  width="16"\r\n                  height="16"\r\n                  alt=""\r\n                />\r\n                <span class="add-text">Add to Home Screen</span>\r\n              </span>\r\n            </p>\r\n          </div>\r\n        </section>\r\n      </main>\r\n\r\n      <main class="content content-desktop">\r\n        <section class="copy">\r\n          <h1>Open this link on your iPhone&nbsp;or&nbsp;iPad</h1>\r\n          <p class="desktop-note">\r\n            This page shows how to add {{APP_NAME}} to an iOS Home Screen.\r\n          </p>\r\n          <a class="desktop-open" href="{{APP_URL}}">Open {{APP_NAME}}</a>\r\n        </section>\r\n      </main>\r\n    </div>\r\n  </body>\r\n</html>\r\n';
var grokOgIdentity = { "site": {
  "title": "Order King Partner",
  "card": "custom",
  "color": "B33A1B",
  "image": "/og.jpg"
} };
var DEFAULT_APP_NAME = "Grok App";
var OG_SITE_REL_PATH = "src/lib/og/site.json";
var SHARE_META_KEYS = /* @__PURE__ */ new Set([
  "og:title",
  "og:description",
  "og:image",
  "og:image:width",
  "og:image:height",
  "og:type",
  "og:url",
  "og:site_name",
  "twitter:card",
  "twitter:title",
  "twitter:image",
  "twitter:description",
  "x:game:image",
  "x:game:image:width",
  "x:game:image:height"
]);
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
__name(escapeHtml, "escapeHtml");
function unescapeHtml(value) {
  return String(value).replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
}
__name(unescapeHtml, "unescapeHtml");
function placeholderCardColor(site = {}) {
  const raw = String(site.color ?? "").trim();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex : "";
}
__name(placeholderCardColor, "placeholderCardColor");
function appNameFromHost(hostHeader) {
  const host = String(hostHeader ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
  if (!host.endsWith(".grok.me")) return DEFAULT_APP_NAME;
  const slug = host.split(".")[0] ?? "";
  if (!slug || slug === "www" || !/^[a-z0-9-]{1,63}$/.test(slug)) return DEFAULT_APP_NAME;
  return slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") || "Grok App";
}
__name(appNameFromHost, "appNameFromHost");
function isVercelSystemHost(host) {
  return host === "vercel.app" || host.endsWith(".vercel.app") || host === "vercel.com" || host.endsWith(".vercel.com");
}
__name(isVercelSystemHost, "isVercelSystemHost");
function publicAppHost(hostHeader) {
  const host = String(hostHeader ?? "").split(",")[0].trim().split(":")[0].toLowerCase();
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) return "";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return "";
  if (isVercelSystemHost(host)) return "";
  return host;
}
__name(publicAppHost, "publicAppHost");
function resolvePublicHost(hostHeader) {
  return publicAppHost(process_default.env?.VITE_PUBLIC_HOSTNAME) || publicAppHost(hostHeader);
}
__name(resolvePublicHost, "resolvePublicHost");
function isInstallQuery(url) {
  const query = String(url ?? "").split("?", 2)[1] ?? "";
  const params = new URLSearchParams(query);
  const install = params.get("install");
  const platform2 = (params.get("platform") ?? "").toLowerCase();
  return (install === "1" || install === "true") && platform2 === "ios";
}
__name(isInstallQuery, "isInstallQuery");
function isDocumentPath(pathname) {
  const path = String(pathname ?? "");
  return !path.startsWith("/__grok/") && !path.startsWith("/api/") && !path.startsWith("/@") && !path.startsWith("/node_modules") && !/\.[a-z0-9]+$/i.test(path);
}
__name(isDocumentPath, "isDocumentPath");
function acceptsHtml(accept) {
  const value = String(accept ?? "");
  return value === "" || value.includes("text/html") || value.includes("*/*");
}
__name(acceptsHtml, "acceptsHtml");
function stripInstallParams(url) {
  const [path = "/", query = ""] = String(url ?? "/").split("?", 2);
  const params = new URLSearchParams(query);
  params.delete("install");
  params.delete("platform");
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}
__name(stripInstallParams, "stripInstallParams");
function renderInstallPageHtml(template, { host, url } = {}) {
  return String(template).replaceAll("{{APP_NAME}}", escapeHtml(appNameFromHost(host))).replaceAll("{{APP_URL}}", escapeHtml(stripInstallParams(url)));
}
__name(renderInstallPageHtml, "renderInstallPageHtml");
function renderWebManifest(hostHeader) {
  const name = appNameFromHost(hostHeader);
  return JSON.stringify({
    name,
    short_name: name,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [{
      src: "/__grok/icon-180.png",
      sizes: "180x180",
      type: "image/png"
    }]
  }, null, 2);
}
__name(renderWebManifest, "renderWebManifest");
function grokPwaHeadTags(appName = DEFAULT_APP_NAME) {
  return [
    ["manifest", '<link rel="manifest" href="/__grok/manifest.webmanifest">'],
    ["apple-touch-icon", '<link rel="apple-touch-icon" href="/__grok/icon-180.png">'],
    ["apple-mobile-web-app-title", `<meta name="apple-mobile-web-app-title" content="${escapeHtml(appName)}">`],
    ["apple-mobile-web-app-status-bar-style", '<meta name="apple-mobile-web-app-status-bar-style" content="black">'],
    ["theme-color", '<meta name="theme-color" content="#000000">']
  ];
}
__name(grokPwaHeadTags, "grokPwaHeadTags");
var GROK_EXTENSIONS_SCRIPT_SRC = "https://grok.com/grok-app-builder/extensions.js";
function readGrokProjectId() {
  const fromProcess = typeof process_default !== "undefined" ? process_default.env?.VITE_PROJECT_ID : "";
  return String(fromProcess ?? "").trim();
}
__name(readGrokProjectId, "readGrokProjectId");
function readXCreator() {
  const fromProcess = typeof process_default !== "undefined" ? process_default.env?.X_CREATOR : "";
  return String(fromProcess ?? "").trim();
}
__name(readXCreator, "readXCreator");
function readXCreatorId() {
  const fromProcess = typeof process_default !== "undefined" ? process_default.env?.X_CREATOR_ID : "";
  return String(fromProcess ?? "").trim();
}
__name(readXCreatorId, "readXCreatorId");
function grokXCreatorHeadTags(creator = readXCreator(), creatorId = readXCreatorId()) {
  const name = String(creator ?? "").trim();
  const id = String(creatorId ?? "").trim();
  if (!name || !id) return [];
  return [`<meta property="x:creator" content="${escapeHtml(name)}">`, `<meta property="x:creator:id" content="${escapeHtml(id)}">`];
}
__name(grokXCreatorHeadTags, "grokXCreatorHeadTags");
function grokExtensionsHeadTags(projectId = readGrokProjectId()) {
  const id = escapeHtml(projectId);
  const tags = [];
  if (projectId) tags.push(`<meta name="grok-project-id" content="${id}">`);
  tags.push(`<script src="${GROK_EXTENSIONS_SCRIPT_SRC}"${projectId ? ` data-project-id="${id}"` : ""} defer><\/script>`);
  return tags;
}
__name(grokExtensionsHeadTags, "grokExtensionsHeadTags");
function readOgSite(cwd2 = process_default.cwd()) {
  try {
    const raw = readFileSync(join(cwd2, OG_SITE_REL_PATH), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
__name(readOgSite, "readOgSite");
function ogCardPublicPath(cwd2 = process_default.cwd()) {
  if (existsSync(join(cwd2, "public/og.jpg"))) return "/og.jpg";
  if (existsSync(join(cwd2, "public/og.png"))) return "/og.png";
  return "";
}
__name(ogCardPublicPath, "ogCardPublicPath");
function detectCustomOgCard(cwd2 = process_default.cwd(), site = {}) {
  if (ogCardPublicPath(cwd2)) return true;
  return siteHasCustomCard(site) || Boolean(String(site.image ?? "").trim());
}
__name(detectCustomOgCard, "detectCustomOgCard");
function snapshotOgIdentity(cwd2 = process_default.cwd()) {
  const site = { ...readOgSite(cwd2) };
  const disk = ogCardPublicPath(cwd2);
  if (disk) {
    site.card = "custom";
    site.image = disk;
  } else {
    if (siteHasCustomCard(site)) delete site.card;
    if (site.image) delete site.image;
  }
  if (existsSync(join(cwd2, "public/x-banner.jpg"))) site.banner = site.banner || "/x-banner.jpg";
  return { site };
}
__name(snapshotOgIdentity, "snapshotOgIdentity");
function ogServiceUrl() {
  return (String(process_default.env?.VITE_OG_SERVICE_URL ?? "").trim() || "https://og.grok.me").replace(/\/+$/, "");
}
__name(ogServiceUrl, "ogServiceUrl");
function titleFromDocument(html) {
  const match = String(html ?? "").match(/<title\b[^>]*>([^<]*)<\/title>/i);
  return match ? unescapeHtml(match[1]).trim() : "";
}
__name(titleFromDocument, "titleFromDocument");
function resolveOgTitle(site = {}, appName = DEFAULT_APP_NAME, host = "", documentTitle = "") {
  const fromSite = String(site.title ?? "").trim();
  if (fromSite) return fromSite;
  const fromDoc = String(documentTitle ?? "").trim();
  if (fromDoc) return fromDoc;
  const fromHost = appNameFromHost(host);
  if (fromHost && fromHost !== "Grok App") return fromHost;
  return String(appName ?? "").trim() || "Grok App";
}
__name(resolveOgTitle, "resolveOgTitle");
function siteHasCustomCard(site = {}) {
  return String(site.card ?? "").toLowerCase() === "custom";
}
__name(siteHasCustomCard, "siteHasCustomCard");
function resolveOgCardAsset(site = {}, cwd2 = process_default.cwd()) {
  return ogCardPublicPath(cwd2) || (detectCustomOgCard(cwd2, site) ? String(site.image ?? "").trim() || "/og.jpg" : "");
}
__name(resolveOgCardAsset, "resolveOgCardAsset");
function applyCustomCardFromFs(site, cwd2) {
  const disk = ogCardPublicPath(cwd2);
  if (!disk) return site;
  return {
    ...site,
    card: "custom",
    image: disk
  };
}
__name(applyCustomCardFromFs, "applyCustomCardFromFs");
function grokOgHeadTags({ host = "", appName = DEFAULT_APP_NAME, site = {}, documentTitle = "", cwd: cwd2 = process_default.cwd() } = {}) {
  const title2 = resolveOgTitle(site, appName, host, documentTitle);
  const publicHost = resolvePublicHost(host);
  const tags = [`<meta name="twitter:card" content="summary_large_image">`, `<meta property="og:title" content="${escapeHtml(title2)}">`];
  const description = String(site.description ?? "").trim();
  if (description) tags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  if (String(site.type ?? "").toLowerCase() === "x:game") tags.push(`<meta property="og:type" content="x:game">`);
  if (publicHost) {
    const asset = resolveOgCardAsset(site, cwd2);
    const custom = Boolean(asset);
    let image = custom ? `https://${publicHost}${asset.startsWith("/") ? asset : `/${asset}`}` : `${ogServiceUrl()}/v1/card.png?host=${encodeURIComponent(publicHost)}&title=${encodeURIComponent(title2)}`;
    const color = !custom ? placeholderCardColor(site) : "";
    if (color) image += `&color=${encodeURIComponent(color)}`;
    tags.push(`<meta property="og:image" content="${escapeHtml(image)}">`);
    tags.push(`<meta property="og:image:width" content="1200">`);
    tags.push(`<meta property="og:image:height" content="630">`);
    const banner = String(site.banner ?? "").trim();
    if (banner) {
      const bannerUrl = `https://${publicHost}${banner.startsWith("/") ? banner : `/${banner}`}`;
      tags.push(`<meta property="x:game:image" content="${escapeHtml(bannerUrl)}">`);
      tags.push(`<meta property="x:game:image:width" content="1200">`);
      tags.push(`<meta property="x:game:image:height" content="264">`);
    }
  }
  return tags;
}
__name(grokOgHeadTags, "grokOgHeadTags");
function stripShareMetaTags(html) {
  return String(html).replace(/<meta\b[^>]*>/gi, (tag) => {
    const attrs = [...tag.matchAll(/\b(?:property|name)\s*=\s*["']([^"']+)["']/gi)];
    for (const match of attrs) if (SHARE_META_KEYS.has(String(match[1]).toLowerCase())) return "";
    return tag;
  });
}
__name(stripShareMetaTags, "stripShareMetaTags");
function insertAfterHeadOpen(html, snippet) {
  if (/<head\b[^>]*>/i.test(html)) return html.replace(/<head\b[^>]*>/i, (open3) => `${open3}${snippet}`);
  if (/<html\b[^>]*>/i.test(html)) return html.replace(/<html\b[^>]*>/i, (open3) => `${open3}<head>${snippet}</head>`);
  return `<!doctype html><html><head>${snippet}</head>${html}`;
}
__name(insertAfterHeadOpen, "insertAfterHeadOpen");
function insertBeforeHeadClose(html, snippet) {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${snippet}</head>`);
  return insertAfterHeadOpen(html, snippet);
}
__name(insertBeforeHeadClose, "insertBeforeHeadClose");
function normalizeHeadContext(ctx = {}) {
  const cwd2 = ctx.cwd ?? process_default.cwd();
  const site = applyCustomCardFromFs(ctx.site !== void 0 ? ctx.site : snapshotOgIdentity(cwd2).site, cwd2);
  return {
    appName: resolveOgTitle(site, ctx.appName ?? "Grok App", ctx.host ?? ""),
    projectId: ctx.projectId ?? readGrokProjectId(),
    creator: ctx.creator ?? readXCreator(),
    creatorId: ctx.creatorId ?? readXCreatorId(),
    host: ctx.host ?? "",
    cwd: cwd2,
    site
  };
}
__name(normalizeHeadContext, "normalizeHeadContext");
function injectGrokPwaHead(html, ctx = {}) {
  if (typeof html !== "string") return html;
  const { site, projectId, creator, creatorId, host, cwd: cwd2 } = normalizeHeadContext(ctx);
  const documentTitle = titleFromDocument(html);
  const appName = resolveOgTitle(site, ctx.appName ?? "Grok App", host, documentTitle);
  let next = stripShareMetaTags(html);
  const missing = grokPwaHeadTags(appName).filter(([key]) => {
    if (key === "manifest") return !next.includes('href="/__grok/manifest.webmanifest"');
    if (key === "apple-touch-icon") return !next.includes('href="/__grok/icon-180.png"');
    return !next.includes(`name="${key}"`);
  }).map(([, tag]) => tag);
  next = insertAfterHeadOpen(next, grokOgHeadTags({
    host,
    appName,
    site,
    documentTitle,
    cwd: cwd2
  }).join(""));
  if (!next.includes("/grok-app-builder/extensions.js")) missing.push(...grokExtensionsHeadTags(projectId));
  else if (projectId && !next.includes('name="grok-project-id"')) missing.push(`<meta name="grok-project-id" content="${escapeHtml(projectId)}">`);
  if (projectId && !next.includes('property="grok:app_id"') && !next.includes("property='grok:app_id'")) missing.push(`<meta property="grok:app_id" content="${escapeHtml(projectId)}">`);
  const creatorTags = grokXCreatorHeadTags(creator, creatorId);
  if (creatorTags.length > 0) {
    if (!(next.includes('property="x:creator" content=') || next.includes("property='x:creator' content="))) missing.push(creatorTags[0]);
    if (!next.includes('property="x:creator:id"')) missing.push(creatorTags[1]);
  }
  if (missing.length === 0) return next;
  return insertBeforeHeadClose(next, missing.join(""));
}
__name(injectGrokPwaHead, "injectGrokPwaHead");
function findHeadClose(buf) {
  return buf.toString("latin1").search(/<\/head>/i);
}
__name(findHeadClose, "findHeadClose");
function createHeadInjector(ctx = {}) {
  const normalized = normalizeHeadContext(ctx);
  let pending = [];
  let done = false;
  const apply = /* @__PURE__ */ __name((html) => injectGrokPwaHead(html, {
    appName: normalized.appName,
    projectId: normalized.projectId,
    creator: normalized.creator,
    creatorId: normalized.creatorId,
    host: normalized.host,
    cwd: normalized.cwd,
    site: normalized.site
  }), "apply");
  return {
    /** @param {Uint8Array | string} chunk @returns {Buffer[]} chunks ready to emit */
    push(chunk) {
      const buf = Buffer2.isBuffer(chunk) ? chunk : Buffer2.from(chunk);
      if (done) return [buf];
      pending.push(buf);
      const joined = Buffer2.concat(pending);
      const at = findHeadClose(joined);
      if (at === -1) return [];
      done = true;
      pending = [];
      const closeLen = joined.toString("latin1", at).match(/^<\/head>/i)[0].length;
      const head = apply(joined.subarray(0, at + closeLen).toString("utf8"));
      return [Buffer2.concat([Buffer2.from(head, "utf8"), joined.subarray(at + closeLen)])];
    },
    /** @returns {Buffer[]} whatever is still buffered (no `</head>` seen) */
    flush() {
      if (done || pending.length === 0) return [];
      const rest = Buffer2.concat(pending);
      pending = [];
      done = true;
      return [Buffer2.from(apply(rest.toString("utf8")), "utf8")];
    }
  };
}
__name(createHeadInjector, "createHeadInjector");
function requestHost(event) {
  return event.req.headers.get("x-forwarded-host") ?? event.req.headers.get("host") ?? event.url.host;
}
__name(requestHost, "requestHost");
function injectHeadStreaming(response, host) {
  const injector = createHeadInjector({
    host,
    site: grokOgIdentity.site
  });
  const transformed = response.body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      for (const out of injector.push(chunk)) controller.enqueue(out);
    },
    flush(controller) {
      for (const out of injector.flush()) controller.enqueue(out);
    }
  }));
  const headers2 = new Headers(response.headers);
  headers2.delete("content-length");
  return new Response(transformed, {
    status: response.status,
    statusText: response.statusText,
    headers: headers2
  });
}
__name(injectHeadStreaming, "injectHeadStreaming");
async function grokPwaMiddleware(event, next) {
  if ((event.req.method ?? "GET").toUpperCase() !== "GET") return next();
  const path = event.url.pathname;
  const urlWithQuery = path + event.url.search;
  if (path === "/__grok/manifest.webmanifest" || path === "/__grok/manifest.json") return new Response(renderWebManifest(requestHost(event)), { headers: {
    "content-type": "application/manifest+json; charset=utf-8",
    "cache-control": "no-cache"
  } });
  if (isInstallQuery(urlWithQuery) && isDocumentPath(path) && acceptsHtml(event.req.headers.get("accept"))) {
    const html = renderInstallPageHtml(install_page_default, {
      host: requestHost(event),
      url: urlWithQuery
    });
    return new Response(html, { headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache"
    } });
  }
  if (!isDocumentPath(path)) return next();
  const result = await next();
  if (result instanceof Response && result.body && String(result.headers.get("content-type") ?? "").includes("text/html") && !result.headers.get("content-encoding")) return injectHeadStreaming(result, requestHost(event));
  return result;
}
__name(grokPwaMiddleware, "grokPwaMiddleware");
var findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{
    name: "headers",
    route: "/assets/**",
    handler: headers,
    options: { "cache-control": "public, max-age=31536000, immutable" }
  }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    if (s.length > 1) {
      if (s[1] === "assets") r.unshift({
        data: $0,
        params: { "_": s.slice(2).join("/") }
      });
    }
    return r;
  };
})();
var _lazy_p5giu1 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
  const data = {
    route: "/**",
    handler: _lazy_p5giu1
  };
  return ((_m, p) => {
    return {
      data,
      params: { "_": p.slice(1) }
    };
  });
})();
var globalMiddleware = [toEventHandler(grokPwaMiddleware)].filter(Boolean);
var errorHandler = /* @__PURE__ */ __name((error3, event) => {
  const res = defaultHandler(error3, event);
  return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
}, "errorHandler");
function defaultHandler(error3, event) {
  const unhandled = error3.unhandled ?? !HTTPError.isError(error3);
  const { status = 500, statusText = "" } = unhandled ? {} : error3;
  if (status === 404) {
    const url = event.url || new URL(event.req.url);
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
      status: 302,
      headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
    };
  }
  const headers2 = new Headers(unhandled ? {} : error3.headers);
  headers2.set("content-type", "application/json; charset=utf-8");
  return {
    status,
    statusText,
    headers: headers2,
    body: {
      error: true,
      ...unhandled ? {
        status,
        unhandled: true
      } : typeof error3.toJSON === "function" ? error3.toJSON() : {
        status,
        statusText,
        message: error3.message
      }
    }
  };
}
__name(defaultHandler, "defaultHandler");
var errorHandlers = [errorHandler];
async function error_handler_default(error3, event) {
  for (const handler of errorHandlers) try {
    const response = await handler(error3, event, { defaultHandler });
    if (response) return response;
  } catch (error4) {
    console.error(error4);
  }
}
__name(error_handler_default, "error_handler_default");
function createNitroApp() {
  const captureError = /* @__PURE__ */ __name((error3, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) errors.push({
        error: error3,
        context: errorCtx
      });
    }
  }, "captureError");
  const h3App = createH3App({ onError(error3, event) {
    return error_handler_default(error3, event);
  } });
  let appHandler = /* @__PURE__ */ __name((req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  }, "appHandler");
  return {
    fetch: appHandler,
    h3: h3App,
    hooks: void 0,
    captureError
  };
}
__name(createNitroApp, "createNitroApp");
function createH3App(config2) {
  const h3App = new H3Core(config2);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  h3App["~getMiddleware"] = (event, route) => {
    const pathname = event.url.pathname;
    const method = event.req.method;
    const middleware = [];
    const routeRules = getRouteRules(method, pathname);
    event.context.routeRules = routeRules?.routeRules;
    if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
    middleware.push(...h3App["~middleware"]);
    if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
    return middleware;
  };
  return h3App;
}
__name(createH3App, "createH3App");
var APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) return instance;
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
__name(useNitroApp, "useNitroApp");
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) return { routeRuleMiddleware: [] };
  const routeRules = {};
  for (const layer of m) for (const rule of layer.data) {
    const currentRule = routeRules[rule.name];
    if (currentRule) {
      if (rule.options === false) {
        delete routeRules[rule.name];
        continue;
      }
      if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
        ...currentRule.options,
        ...rule.options
      };
      else currentRule.options = rule.options;
      currentRule.route = rule.route;
      currentRule.params = {
        ...currentRule.params,
        ...layer.params
      };
    } else if (rule.options !== false) routeRules[rule.name] = {
      ...rule,
      params: layer.params
    };
  }
  const middleware = [];
  const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
  for (const rule of orderedRules) {
    if (rule.options === false || !rule.handler) continue;
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
__name(getRouteRules, "getRouteRules");
var public_assets_data_default = {
  "/manifest.json": {
    "type": "application/json",
    "etag": '"52a-MnqSJT+EOLxDzAQTqkSq+XaViDU"',
    "mtime": "2026-09-22T16:46:01.215Z",
    "size": 1322,
    "path": "../manifest.json"
  },
  "/sw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a48-HsJ+NeIxN4S9oJbdjWgdC2VfRl8"',
    "mtime": "2026-09-24T22:17:46.201Z",
    "size": 2632,
    "path": "../sw.js"
  },
  "/og.jpg": {
    "type": "image/jpeg",
    "etag": '"1bd6c-uoq3H4+ySw5DQWDcphGZRP8Z3U8"',
    "mtime": "2026-09-17T23:18:58.408Z",
    "size": 114028,
    "path": "../og.jpg"
  },
  "/brand/app-icon.svg": {
    "type": "image/svg+xml",
    "etag": '"20f-ytIBJ2csgfkhhSf1k5ab4KwHT/U"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 527,
    "path": "../brand/app-icon.svg"
  },
  "/brand/logo-dark.svg": {
    "type": "image/svg+xml",
    "etag": '"20f-UENRXhBKtwzHwQwgLgpAACUxW70"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 527,
    "path": "../brand/logo-dark.svg"
  },
  "/brand/logo-light.svg": {
    "type": "image/svg+xml",
    "etag": '"20f-ytIBJ2csgfkhhSf1k5ab4KwHT/U"',
    "mtime": "2026-09-17T23:18:58.408Z",
    "size": 527,
    "path": "../brand/logo-light.svg"
  },
  "/brand/logo.svg": {
    "type": "image/svg+xml",
    "etag": '"20f-ytIBJ2csgfkhhSf1k5ab4KwHT/U"',
    "mtime": "2026-09-17T23:18:58.408Z",
    "size": 527,
    "path": "../brand/logo.svg"
  },
  "/assets/api-finance-KxF0F_ww.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"395-D8HiqgQem2Rr6Ks5ScURBDQ8WA4"',
    "mtime": "2026-09-28T17:35:07.063Z",
    "size": 917,
    "path": "../assets/api-finance-KxF0F_ww.js"
  },
  "/assets/api-orders-DIKOOZxU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"317-R8Ma1GgpYfm3RU0Dkno+x2M5zjM"',
    "mtime": "2026-09-28T17:35:07.068Z",
    "size": 791,
    "path": "../assets/api-orders-DIKOOZxU.js"
  },
  "/assets/assistant-8KqYtj2F.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1bd0-821qYjXSJHLxRDcaaoU33xmcKxo"',
    "mtime": "2026-09-28T17:35:07.077Z",
    "size": 7120,
    "path": "../assets/assistant-8KqYtj2F.js"
  },
  "/assets/analytics-DYAcsH8X.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5999e-/QqqCOJ2fkSNJqGV2f8zuLlyZxs"',
    "mtime": "2026-09-28T17:35:07.055Z",
    "size": 367006,
    "path": "../assets/analytics-DYAcsH8X.js"
  },
  "/assets/card-DXHGArac.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f5-uVuPBdJaOWRR2cOsvr6mKqr/Q9o"',
    "mtime": "2026-09-28T17:35:07.085Z",
    "size": 245,
    "path": "../assets/card-DXHGArac.js"
  },
  "/assets/button-C1sWuqiY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"eaba-DtpFbvgMw73IS0ISiqV1UgI4xaw"',
    "mtime": "2026-09-28T17:35:07.085Z",
    "size": 60090,
    "path": "../assets/button-C1sWuqiY.js"
  },
  "/assets/client-LaQg0niS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8112-kkBtcpojp4F2sMHViMViJrKP6lg"',
    "mtime": "2026-09-28T17:35:07.098Z",
    "size": 33042,
    "path": "../assets/client-LaQg0niS.js"
  },
  "/assets/dashboard-C6Ps4Fyz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1a03-SxNlbkfu9rPGMylB/lcxqWX0vic"',
    "mtime": "2026-09-28T17:35:07.112Z",
    "size": 6659,
    "path": "../assets/dashboard-C6Ps4Fyz.js"
  },
  "/assets/hours-bXr1vLbB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cfa-Ltl5EX2LOcVHJ3uaO4ug1TNlZqE"',
    "mtime": "2026-09-28T17:35:07.115Z",
    "size": 3322,
    "path": "../assets/hours-bXr1vLbB.js"
  },
  "/assets/input-CaNo5W-e.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26e-c96WNwJENA1aq/fur5UbN5KKJDw"',
    "mtime": "2026-09-28T17:35:07.123Z",
    "size": 622,
    "path": "../assets/input-CaNo5W-e.js"
  },
  "/assets/login-C9rJnhtB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"dac-S72uqfJ5ELx+QKKjG01EO0M+Mn4"',
    "mtime": "2026-09-28T17:35:07.136Z",
    "size": 3500,
    "path": "../assets/login-C9rJnhtB.js"
  },
  "/assets/kitchen-CM1StxYl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1376-NEv7JUK2UAEfuAdqe27McPSNnOI"',
    "mtime": "2026-09-28T17:35:07.125Z",
    "size": 4982,
    "path": "../assets/kitchen-CM1StxYl.js"
  },
  "/assets/menu-CqkF4hPW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d88-e70qNYeqq/6O6elOkg6zoJ4WuEY"',
    "mtime": "2026-09-28T17:35:07.138Z",
    "size": 11656,
    "path": "../assets/menu-CqkF4hPW.js"
  },
  "/assets/money-text-dap1GqtK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"30d-sDk26vW+bB+XhYycBqMhhrlKq0M"',
    "mtime": "2026-09-28T17:35:07.151Z",
    "size": 781,
    "path": "../assets/money-text-dap1GqtK.js"
  },
  "/assets/more-C80wmg8d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2ef-eAEdgKCivrKqRfyXwpHCuis+Kbw"',
    "mtime": "2026-09-28T17:35:07.151Z",
    "size": 751,
    "path": "../assets/more-C80wmg8d.js"
  },
  "/assets/notifications-6Use__t_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"562-ynV+OgHJ2bpsB4iBMX2f8nYGjwE"',
    "mtime": "2026-09-28T17:35:07.171Z",
    "size": 1378,
    "path": "../assets/notifications-6Use__t_.js"
  },
  "/logo.jpg": {
    "type": "image/jpeg",
    "etag": '"81932-xWYjJCTgTtSywClFoX71xCDNkNw"',
    "mtime": "2026-09-25T07:05:43.711Z",
    "size": 530738,
    "path": "../logo.jpg"
  },
  "/assets/index-DjPljLbM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a62c2-s57RqeibDudpkRVfu9e3/G92TQU"',
    "mtime": "2026-09-28T17:35:07.049Z",
    "size": 680642,
    "path": "../assets/index-DjPljLbM.js"
  },
  "/assets/onboarding-FF7us3kW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"172c-RWJscA/fCPpktMJUiMGV9KXtIzo"',
    "mtime": "2026-09-28T17:35:07.184Z",
    "size": 5932,
    "path": "../assets/onboarding-FF7us3kW.js"
  },
  "/assets/order-card-_hnoaGbm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"218a-UaOr40r+mazc4c6B6RbleGGRN4g"',
    "mtime": "2026-09-28T17:35:07.187Z",
    "size": 8586,
    "path": "../assets/order-card-_hnoaGbm.js"
  },
  "/assets/orders-BKGAC2Vr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b18-N+qZ5UWJTVqnnXK1mNr7mb5l6zQ"',
    "mtime": "2026-09-28T17:35:07.190Z",
    "size": 2840,
    "path": "../assets/orders-BKGAC2Vr.js"
  },
  "/assets/react-4F1uotGf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"213b-gRiZByEXuafzlIre6geTQ4aRWZs"',
    "mtime": "2026-09-28T17:35:07.195Z",
    "size": 8507,
    "path": "../assets/react-4F1uotGf.js"
  },
  "/assets/promotions-DEj9Lz2S.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1d81-0TL5uMCH5B+s7HuijjCa3B+lzT8"',
    "mtime": "2026-09-28T17:35:07.192Z",
    "size": 7553,
    "path": "../assets/promotions-DEj9Lz2S.js"
  },
  "/assets/reviews-DETk9mQU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6da-yik9Cv05ACGYk4vjxi7Kc8q5cic"',
    "mtime": "2026-09-28T17:35:07.196Z",
    "size": 1754,
    "path": "../assets/reviews-DETk9mQU.js"
  },
  "/assets/routes-C39henCu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5ae-qoyvICynxFYwwJAw/3S/qT4F3eI"',
    "mtime": "2026-09-28T17:35:07.198Z",
    "size": 1454,
    "path": "../assets/routes-C39henCu.js"
  },
  "/assets/settings-COYHX0Yr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ad78-y4mwVhCP8nuzupKQlQImQbNDHpk"',
    "mtime": "2026-09-28T17:35:07.200Z",
    "size": 44408,
    "path": "../assets/settings-COYHX0Yr.js"
  },
  "/__grok/icon-180.png": {
    "type": "image/png",
    "etag": '"834-Xk8vfS0DTFn7ggtkfEduWTcNWGE"',
    "mtime": "2026-09-17T23:18:58.392Z",
    "size": 2100,
    "path": "../__grok/icon-180.png"
  },
  "/assets/vendor-shell-YAtbDpUH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6d9d-uzNkOamWaDwSCO/dOsOGESiG1p8"',
    "mtime": "2026-09-28T17:35:07.210Z",
    "size": 28061,
    "path": "../assets/vendor-shell-YAtbDpUH.js"
  },
  "/assets/settlements-By7pCBco.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2827-f96JAV30k9/+l0IZ11Ks5RHCmUE"',
    "mtime": "2026-09-28T17:35:07.205Z",
    "size": 10279,
    "path": "../assets/settlements-By7pCBco.js"
  },
  "/__grok/install/assets/homescreen/logo-grok.svg": {
    "type": "image/svg+xml",
    "etag": '"429-iq65LFl6Jo6G/bwSh0TXYZSoTSU"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 1065,
    "path": "../__grok/install/assets/homescreen/logo-grok.svg"
  },
  "/__grok/install/styles.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"1bb4-mtVb9Rljgp3bLk+LN+fuI/lvuVQ"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 7092,
    "path": "../__grok/install/styles.css"
  },
  "/__grok/install/assets/homescreen/ob-ipad.png": {
    "type": "image/png",
    "etag": '"18dd3-wlRwrpmBImStuiu+4poVz7ANin4"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 101843,
    "path": "../__grok/install/assets/homescreen/ob-ipad.png"
  },
  "/__grok/install/assets/homescreen/plus.svg": {
    "type": "image/svg+xml",
    "etag": '"967-3Kr16P4li3FlBDp9Lx36zbKm9+I"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 2407,
    "path": "../__grok/install/assets/homescreen/plus.svg"
  },
  "/__grok/install/assets/homescreen/ob-phone.png": {
    "type": "image/png",
    "etag": '"194bc-oZradWHIHO68q2glHU0Gk5ttpWA"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 103612,
    "path": "../__grok/install/assets/homescreen/ob-phone.png"
  },
  "/__grok/install/assets/homescreen/glass-share.svg": {
    "type": "image/svg+xml",
    "etag": '"95e-A1zXBk2lAArfDoU/mVT/tcZee7w"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 2398,
    "path": "../__grok/install/assets/homescreen/glass-share.svg"
  },
  "/assets/styles-CFD0Dbqu.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"f21b-9GMrE5LXbGe4F7Pgnn5+duzVvso"',
    "mtime": "2026-09-28T17:35:07.234Z",
    "size": 61979,
    "path": "../assets/styles-CFD0Dbqu.css"
  },
  "/__grok/install/assets/homescreen/glass-puzzle.svg": {
    "type": "image/svg+xml",
    "etag": '"720-fvf2cebt92Zi64jB1pqEQ9PCLEA"',
    "mtime": "2026-09-17T23:18:58.400Z",
    "size": 1824,
    "path": "../__grok/install/assets/homescreen/glass-puzzle.svg"
  }
};
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (public_assets_data_default[id]) return true;
  for (const base in publicAssetBases) if (id.startsWith(base)) return true;
  return false;
}
__name(isPublicAssetURL, "isPublicAssetURL");
function augmentReq(cfReq, ctx) {
  const req = cfReq;
  req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
  req.runtime ??= { name: "cloudflare" };
  req.runtime.cloudflare = {
    ...req.runtime.cloudflare,
    ...ctx
  };
  req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
__name(augmentReq, "augmentReq");
var nitroApp = useNitroApp();
var cloudflare_pages_default = {
  async fetch(cfReq, env2, context2) {
    augmentReq(cfReq, {
      env: env2,
      context: context2
    });
    const url = new URL(cfReq.url);
    if (env2.ASSETS && isPublicAssetURL(url.pathname)) return env2.ASSETS.fetch(cfReq);
    return nitroApp.fetch(cfReq);
  },
  scheduled(event, env2, context2) {
  }
};
export {
  cloudflare_pages_default as default
};
//# sourceMappingURL=bundledWorker-0.918223880594011.mjs.map
