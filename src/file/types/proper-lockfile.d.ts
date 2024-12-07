declare module 'proper-lockfile' {
    interface Options {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
    }

    interface LockOptions {
        retries?: number | Options;
        onCompromised?: (err: Error) => void;
        lockfilePath?: string | ((filePath: string) => string);
        stale?: number;
        update?: number;
        shared?: boolean;
    }

    export function lock(
        file: string, 
        options?: LockOptions
    ): Promise<() => Promise<void>>;

    export function unlock(
        file: string, 
        options?: LockOptions
    ): Promise<void>;
}