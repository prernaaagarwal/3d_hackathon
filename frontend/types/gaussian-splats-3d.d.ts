declare module "@mkkellogg/gaussian-splats-3d" {
  import type { Camera, WebGLRenderer, Scene } from "three";

  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }

  export enum RenderMode {
    Always = 0,
    OnChange = 1,
    Never = 2,
  }

  export enum LogLevel {
    None = 0,
    Info = 1,
    Debug = 2,
  }

  export interface ViewerOptions {
    cameraUp?: number[];
    initialCameraPosition?: number[];
    initialCameraLookAt?: number[];
    rootElement?: HTMLElement;
    selfDrivenMode?: boolean;
    renderer?: WebGLRenderer;
    camera?: Camera;
    useBuiltInControls?: boolean;
    gpuAcceleratedSort?: boolean;
    sharedMemoryForWorkers?: boolean;
    sceneRevealMode?: SceneRevealMode;
    sphericalHarmonicsDegree?: number;
    antialiased?: boolean;
    renderMode?: RenderMode;
    logLevel?: LogLevel;
    threeScene?: Scene;
    dynamicScene?: boolean;
    integerBasedSort?: boolean;
    [key: string]: unknown;
  }

  export interface SplatSceneOptions {
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    position?: number[];
    rotation?: number[];
    scale?: number[];
    format?: string;
    [key: string]: unknown;
  }

  export class Viewer {
    camera: Camera;
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
    addSplatScenes(scenes: Array<{ path: string } & SplatSceneOptions>): Promise<void>;
    start(): void;
    stop(): void;
    update(): void;
    render(): void;
    dispose(): void;
  }

  export class DropInViewer {
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
    addSplatScenes(scenes: Array<{ path: string } & SplatSceneOptions>): Promise<void>;
  }
}

